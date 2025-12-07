require("dotenv").config();

const express = require("express");
const cors = require("cors");

const usersRouter = require("./routes/users");
const drawingsRouter = require("./routes/drawings");

const app = express();

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/users", usersRouter);
app.use("/drawings", drawingsRouter);

// Test route
app.get("/", (req, res) => {
	res.send("Server is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
