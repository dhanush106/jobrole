const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const User = require("../models/User");
const Feedback = require("../models/Feedback");
const RetrainingData = require("../models/RetrainingData");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function arrayToCsv(data) {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]._doc || data[0]).join(",");
    const rows = data.map(row => {
        const doc = row._doc || row;
        return Object.values(doc).map(val => {
            if (Array.isArray(val)) return `"${val.join(',')}"`;
            return `"${val}"`;
        }).join(",");
    });
    return [headers, ...rows].join("\n");
}

const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET_123";
const ADMIN_SECRET_CODE = process.env.ADMIN_SECRET_CODE || "ADM2025";

// Middleware to protect admin routes
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(403).json({ message: "Access denied" });

        req.admin = admin;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Admin Login
router.post("/login", async (req, res) => {
    const { secretCode } = req.body;
    console.log("POST /api/admin/login | code:", secretCode);

    if (secretCode !== ADMIN_SECRET_CODE) {
        return res.status(401).json({ message: "Invalid Admin Secret Code" });
    }

    try {
        let admin = await Admin.findOne({ email: "admin@jobrole.com" });
        if (!admin) {
            admin = await Admin.create({
                name: "System Admin",
                email: "admin@jobrole.com",
                password: "password123"
            });
        }

        const token = jwt.sign({ id: admin._id, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
        res.json({ message: "Admin Login Successful", token, admin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard Analytics
router.get("/analytics", adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const feedbackCount = await Feedback.countDocuments();
        const feedbacks = await Feedback.find();
        const users = await User.find({}, 'name aspiringRole feedbackCount latestPrediction latestConfidenceScore');

        const helpfulCount = feedbacks.filter(f => f.helpful === "Yes").length;
        const helpfulPercentage = feedbackCount > 0 ? (helpfulCount / feedbackCount) * 100 : 0;

        const satisfactionStats = {
            totalUsers,
            feedbackCount,
            helpfulPercentage: Math.round(helpfulPercentage),
            positiveConfidenceCount: feedbacks.filter(f => (f.confidenceScore || 0) > 70).length,
            userMonitoringGrid: users // Derived from user data as per Phase 4.3
        };

        res.json(satisfactionStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User Feedback Monitoring
router.get("/feedback", adminAuth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find().populate("userId", "name").sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Model Performance Metrics (Phase 5)
router.get("/metrics", adminAuth, async (req, res) => {
    try {
        const ModelMetrics = require("../models/ModelMetrics");
        let metrics = await ModelMetrics.findOne().sort({ trainedAt: -1 });

        if (!metrics) {
            // Seed default metrics if none exist
            metrics = await ModelMetrics.create({
                accuracy: 0.85,
                precision: 0.82,
                recall: 0.80,
                f1Score: 0.81,
                trainedOnDataCount: 1200
            });
        }
        res.json(metrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trigger Retraining
router.post("/retrain", adminAuth, async (req, res) => {
    try {
        const retrainingData = await RetrainingData.find({ isProcessed: false });
        if (retrainingData.length === 0) {
            return res.status(400).json({ message: "No new data to retrain on" });
        }

        const pythonScriptPath = path.join(__dirname, "../training/retrain_model.py");
        const exportPath = path.join(__dirname, "../training/feedback_retrain_data.csv");

        // Export data to CSV
        const csvContent = arrayToCsv(retrainingData);
        fs.writeFileSync(exportPath, csvContent);

        console.log("Starting Model Retraining...");

        // Execute python script
        const output = execSync(`python "${pythonScriptPath}" "${exportPath}"`).toString();
        console.log("Retraining Output:", output);

        // Parse metrics if available (Phase 5/8 Live Updates)
        const metricsMatch = output.match(/METRICS_JSON:(.*)/);
        if (metricsMatch) {
            try {
                const metricsData = JSON.parse(metricsMatch[1]);
                const ModelMetrics = require("../models/ModelMetrics");
                await ModelMetrics.create(metricsData);
                console.log("Live Metrics Updated and Persisted.");
            } catch (pErr) {
                console.error("Failed to parse/save live metrics:", pErr.message);
            }
        }

        // Mark data as processed
        await RetrainingData.updateMany({ isProcessed: false }, { isProcessed: true });

        // Clean up temp file
        if (fs.existsSync(exportPath)) fs.unlinkSync(exportPath);

        res.json({ message: "Model retrained successfully", output });
    } catch (err) {
        console.error("Retraining Error:", err.message);
        res.status(500).json({ error: "Retraining failed: " + err.message });
    }
});

module.exports = router;
