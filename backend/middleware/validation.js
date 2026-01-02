const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
	try {
		schema.parse(req.body);
		console.log("Validation passed");

		next();
	} catch (err) {
		if (err instanceof z.ZodError) {
			console.error("Validation error:", err);

			const issues = err.issues || err.errors;

			return res.status(400).json({
				error: "Validation failed",
				message: err.message,
				details: issues.map((e) => ({ field: e.path[0], message: e.message })),
			});
		}
		next(err);
	}
};

const signupSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(30, "Username cannot exceed 30 characters")
		.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
	email: z.string().email("Invalid email format"),
	password: z.string().min(8, "Password must be at least 8 characters").regex(/\d/, "Password must contain at least one number"),
});

const loginSchema = z.object({
	email: z.string().email("Invalid email format"),
	password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
	username: z.string().min(3).max(30).optional(),
	bio: z.string().max(160, "Bio cannot exceed 160 characters").optional(),
	avatar: z.string().url("Invalid URL").optional(),
});

// Drawing Schemas
const drawingSchema = z.object({
	title: z.string().min(1, "Title is required").max(100),
	width: z.number().int().min(1).max(4096, "Canvas too large (max 4096px)"),
	height: z.number().int().min(1).max(4096, "Canvas too large (max 4096px)"),
	thumbnail: z.string().optional(), // You might want to validate base64 structure here if strict
	layers: z.array(z.any()).max(100, "Max 100 layers allowed").optional(),
});

const updateDrawingSchema = z.object({
	title: z.string().min(1).max(100).optional(),
	thumbnail: z.string().optional(),
	layers: z.array(z.any()).max(100).optional(),
});

const sendOTPSchema = z.object({
	mobileNumber: z
		.string()
		.trim()
		.regex(/^09\d{9}$/, "Invalid mobile number"),
});

const verifyOTPSchema = z.object({
	otp: z
		.string()
		.trim()
		.min(6)
		.max(6)
		.regex(/^\d{6}$/, "OTP error"),
	plan: z.enum(["monthly", "yearly"]),
});

module.exports = {
	validate,
	signupSchema,
	loginSchema,
	updateProfileSchema,
	drawingSchema,
	updateDrawingSchema,
	sendOTPSchema,
	verifyOTPSchema,
};
