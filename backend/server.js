require("dotenv").config();

const requiredEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "PORT"];
requiredEnv.forEach((key) => {
	if (!process.env[key]) throw new Error(`Missing ${key} environment variable`);
});

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const usersRouter = require("./routes/users");
const drawingsRouter = require("./routes/drawings");

const app = express();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true,
	})
);

app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 15, // Limit each IP to 15 login requests per window
	message: "Too many login attempts, please try again later",
});

app.use("/users/login", authLimiter);
app.use("/users/signup", authLimiter);

app.use("/users", express.json({ limit: "1mb" }), usersRouter);
app.use("/drawings", express.json({ limit: "50mb" }), drawingsRouter);
// Test route
app.get("/", (req, res) => {
	res.send("Server is running!");
});

app.use((err, req, res, next) => {
	console.error(err.stack); // Log internally
	res.status(500).json({
		error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
	});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
