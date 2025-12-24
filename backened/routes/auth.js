// backend/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const verifyGoogleToken = require("../utils/verifyGoogle");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET_123";



// ---------------- SIGNUP ----------------
// ---------------- SIGNUP WITH FULL VALIDATION ----------------
router.post("/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    // 1️⃣ Check empty fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3️⃣ Password validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // 4️⃣ Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 5️⃣ Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 6️⃣ Create user
    const user = await User.create({ name, email, password: hashed, phone });

    // 7️⃣ Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    user.token = token;
    user.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    res.json({
      message: "Signup successful!",
      user,
      token,
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password if it exists (might be a Google user without password)
    if (!user.password) {
      return res.status(401).json({ message: "Please login with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    user.token = token;
    user.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    res.json({
      message: "Login successful!",
      user,
      token,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Server error. Try again later." });
  }
});


// ---------------- LOGOUT ----------------
router.post("/logout", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    user.token = "";
    user.tokenExpiresAt = null;
    await user.save();

    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- GOOGLE LOGIN ----------------
router.post("/google-login", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    console.log("❌ No token received from frontend");
    return res.status(400).json({ error: "No Google token provided" });
  }

  try {
    const googleUser = await verifyGoogleToken(token);
    const { email, name, sub } = googleUser;

    console.log("✅ Google token verified successfully:", googleUser);

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId: sub });
      console.log("🆕 New user created:", user.email);
    } else {
      console.log("🔑 Existing user logged in:", user.email);
    }

    const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    user.token = jwtToken;
    user.tokenExpiresAt = Date.now() + 86400000;
    await user.save();

    res.json({ message: "Google Login Successful", token: jwtToken, user });
  } catch (err) {
    console.error("❌ Google token verification failed:", err.message);
    res.status(400).json({ error: "Invalid Google Token" });
  }
});

// ---------------- AUTH MIDDLEWARE ----------------
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ---------------- GET CURRENT USER ----------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return user object directly (frontend expects res.data to be user)
    res.json(user);
  } catch (err) {
    console.error("/me Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------- UPDATE DETAILS ----------------- */
router.put("/update-details", authMiddleware, async (req, res) => {
  try {
    const { name, email, degree, ug_specialization, gender, phone, cgpa, skills, interests, certificates } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If the email is being changed, ensure uniqueness
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    user.name = name ?? user.name;
    user.degree = degree ?? user.degree;
    user.ug_specialization = ug_specialization ?? user.ug_specialization;
    user.gender = gender ?? user.gender;
    user.phone = phone ?? user.phone;
    user.cgpa = cgpa ?? user.cgpa;
    user.skills = Array.isArray(skills) ? skills : user.skills;
    user.interests = Array.isArray(interests) ? interests : user.interests;
    user.certificates = Array.isArray(certificates) ? certificates : user.certificates;

    await user.save();
    const userSafe = user.toObject();
    delete userSafe.password;
    res.json(userSafe); // return updated user directly
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router, authMiddleware };
