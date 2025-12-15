require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

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
		origin: "http://localhost:3000",
		credentials: true,
	})
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/users", express.json({ limit: "1mb" }), usersRouter);
app.use("/drawings", express.json({ limit: "50mb" }), drawingsRouter);

// Test route
app.get("/", (req, res) => {
	res.send("Server is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
