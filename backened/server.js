require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");  // <-- Make sure this is here
// const studentRoutes =require( "./routes/studentRoutes.js");
// Routes & utils
const { router: authRoutes } = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const clearExpiredTokens = require("./tokenCleaner");

const app = express();

// -------------------
// MIDDLEWARE
// -------------------
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());

// -------------------
// ROUTES
// -------------------
app.use("/auth", authRoutes);
app.use("/api/user", userRoutes);


// -------------------
// TOKEN CLEANER
// -------------------
setInterval(clearExpiredTokens, 60 * 1000);

// -------------------
// MONGODB CONNECTION
// -------------------
console.log("MONGO_URI =", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI) // <-- remove options
    .then(() => {
        console.log("✅ MongoDB Connected");
        app.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch(err => console.error("❌ MongoDB connection error:", err));
