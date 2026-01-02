const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");
const xss = require("xss");
const crypto = require("crypto");

const { validate, signupSchema, loginSchema, updateProfileSchema, sendOTPSchema, verifyOTPSchema } = require("../middleware/validation");

const otpLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 Hour
	max: 3, // Max 3 attempts
	message: {
		error: "Too many verification codes sent. Please wait 1 hour before trying again.",
	},
	standardHeaders: true,
	legacyHeaders: false,

	//Limit User
	keyGenerator: (req) => {
		return req.user ? req.user.id : req.ip;
	},
	skipFailedRequests: false, // Count failed requests too
});

// Signup - no auth required
router.post("/signup", validate(signupSchema), async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const cleanUsername = xss(username);

		// Check username if exists
		// const { data: existingUser, error: usernameError } = await supabase.from("profiles").select("id").eq("username", cleanUsername);
		// if (usernameError) throw usernameError;
		// if (existingUser.length > 0) {
		// 	return res.status(400).json({ error: "Username already exists" });
		// }

		// signup
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email,
			password,
		});
		if (authError) throw authError;
		if (!authData.user) throw new Error("Signup failed");

		// Create profile and insert data to supabase
		const userId = authData.user.id;
		const { error: profileError } = await supabase.from("profiles").insert({
			id: userId,
			username: cleanUsername,
			avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
			bio: "Hello! I love creating digital art.",
		});

		if (profileError) throw profileError;

		res.status(201).json({
			message: "User created successfully",
			userId,
			access_token: authData.session?.access_token,
			refresh_token: authData.session?.refresh_token,
		});
	} catch (err) {
		if (err.code === "23505") return res.status(400).json({ error: "Username already exists", details: err.detail });
		res.status(500).json({ error: err.message });
	}
});

router.post("/login", validate(loginSchema), async (req, res) => {
	try {
		const { email, password } = req.body;
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) return res.status(400).json({ error: error.message });

		res.json({
			message: "Login successful",
			user: data.user,
			access_token: data.session.access_token,
			refresh_token: data.session.refresh_token,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post("/logout", authMiddleware, async (req, res) => {
	try {
		const { error } = await req.supabase.auth.signOut();
		if (error) throw error;
		res.json({ message: "Logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// fetch profile
router.get("/:id", authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;

		if (req.user.id !== id) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const { data: profile, error } = await req.supabase.from("profiles").select("*").eq("id", id).single();

		if (error) throw error;

		if (profile.premium_expiry) {
			const expiry = new Date(profile.premium_expiry);
			const now = new Date();
			if (expiry < now) {
				console.log(`User ${id} expired on ${expiry}. Resetting to null.`);
				await req.supabase.from("profiles").update({ premium_expiry: null }).eq("id", id);
				profile.premium_expiry = null;
			}
		}

		res.json(profile);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// update profile
router.put("/:id", validate(updateProfileSchema), authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;

		if (req.user.id !== id) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const { data: profile, error: fetchError } = await req.supabase.from("profiles").select("*").eq("id", id).single();
		if (fetchError) throw fetchError;

		const updates = req.body;

		// Check if username is already taken
		if (updates.username) {
			const { data: existingUser } = await supabase.from("profiles").select("id").eq("username", updates.username).single();

			if (existingUser && existingUser.id !== id) {
				return res.status(400).json({ error: "Username is already taken" });
			}
		}
		// clean data
		if (updates.username) updates.username = cleanUsername(updates.username);
		if (updates.avatar) updates.avatar = cleanAvatar(updates.avatar);
		if (updates.bio) updates.bio = cleanBio(updates.bio);

		const { error } = await req.supabase.from("profiles").update(updates).eq("id", id);

		if (error) throw error;
		res.json({ message: "Profile updated successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Premium
// generate otp
router.post("/:id/sendotp", validate(sendOTPSchema), authMiddleware, otpLimiter, async (req, res) => {
	try {
		const { id } = req.params;
		const mobileNumber = req.body.mobileNumber;

		if (req.user.id !== id) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const otp = crypto.randomInt(100000, 999999).toString();
		const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
		const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
		const { error: updateError } = await req.supabase.from("otp").upsert({
			user_id: id,
			otp_hash: otpHash,
			expires_at: expiresAt,
			attempts: 0,
		});
		if (updateError) throw updateError;

		// send otp to user (demo only, not implemented)
		console.log("Sending OTP to:", mobileNumber);
		console.log("OTP:", otp);

		res.status(200).json({ message: "OTP sent successfully", otp });
	} catch (err) {
		console.error("Send OTP error:", err);
		if (err instanceof z.ZodError) {
			return res.status(400).json({
				error: "Validation failed",
				details: err.errors.map((e) => ({
					field: e.path.join("."),
					message: e.message,
				})),
			});
		}

		if (err instanceof Error) return res.status(500).json({ error: err.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

// verify otp
router.post("/:id/verifyotp", validate(verifyOTPSchema), authMiddleware, otpLimiter, async (req, res) => {
	try {
		const { id } = req.params;
		const { otp, plan } = req.body;

		if (req.user.id !== id) return res.status(403).json({ error: "Forbidden" });

		const { data: otpVerifyData, error: otpVerifyDataError } = await req.supabase.from("otp").select("*").eq("user_id", id).single();
		if (otpVerifyDataError || !otpVerifyData) return res.status(400).json({ error: "OTP not found" });

		const now = new Date();
		if (now > otpVerifyData.expires_at) return res.status(400).json({ error: "OTP has expired" });
		if (otpVerifyData.attempts >= 5) return res.status(400).json({ error: "Too many attempts" });

		const hashedOTPInput = crypto.createHash("sha256").update(otp).digest("hex");

		if (hashedOTPInput !== otpVerifyData.otp_hash) {
			await req.supabase
				.from("otp")
				.update({ attempts: otpVerifyData.attempts + 1 })
				.eq("user_id", id);
			return res.status(400).json({ error: "Invalid OTP" });
		}

		// successfully verified
		await req.supabase.from("otp").delete().eq("user_id", id);

		// update user to premium
		const premium_expiry = new Date(plan === "monthly" ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000 * 12);
		const { error: updateError } = await req.supabase.from("profiles").update({ premium_expiry }).eq("id", id);
		if (updateError) throw updateError;

		res.status(200).json({ message: "OTP verified successfully", premium_expiry: premium_expiry });
	} catch (err) {
		console.error("Verify OTP error:", err.message);
		if (err instanceof Error) res.status(400).json({ error: err.message });
		else if (err instanceof z.ZodError) res.status(400).json({ error: err.message });
		res.status(500).json({ err });
	}
});

module.exports = router;
