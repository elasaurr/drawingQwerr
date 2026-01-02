const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { authMiddleware } = require("../middleware/authMiddleware");
const xss = require("xss");

const { validate, signupSchema, loginSchema, updateProfileSchema } = require("../middleware/validation");

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

router.get("/:id", authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;

		if (req.user.id !== id) {
			return res.status(403).json({ error: "Forbidden" });
		}

		const { data: profile, error } = await req.supabase.from("profiles").select("*").eq("id", id).single();

		if (error) throw error;
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
router.put("/:id/premium", authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;
		const { plan } = req.body;

		// Verify user can only update their own premium
		if (req.user.id !== id) {
			return res.status(403).json({ error: "Forbidden" });
		}

		if (!plan || !["monthly", "yearly"].includes(plan)) {
			return res.status(400).json({ error: "Invalid plan" });
		}

		const { data: user, error: fetchError } = await req.supabase.from("profiles").select("premium_expiry").eq("id", id).single();

		if (fetchError) throw fetchError;

		const now = user.premium_expiry ? new Date(user.premium_expiry) : new Date();
		const expiry = new Date(now.getTime());

		if (plan === "monthly") expiry.setMonth(expiry.getMonth() + 1);
		else if (plan === "yearly") expiry.setFullYear(expiry.getFullYear() + 1);

		const { data: updatedData, error: updateError } = await req.supabase
			.from("profiles")
			.update({ premium_expiry: expiry.toISOString() })
			.eq("id", id)
			.select();

		if (updateError) throw updateError;

		res.status(200).json({
			message: `Premium extended successfully (${plan})`,
			premium_expiry: expiry.toISOString(),
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
