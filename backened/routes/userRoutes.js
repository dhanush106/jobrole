const express = require("express");
const router = express.Router();
const { processUserData } = require("../preprocessing/userDataPreprocess");
const { authMiddleware } = require("./auth");
const Feedback = require("../models/Feedback");
const RetrainingData = require("../models/RetrainingData");
const User = require("../models/User");

router.post("/preprocess", authMiddleware, async (req, res) => {
    try {
        const rawData = req.body;
        const userId = req.userId; // From authMiddleware

        const result = await processUserData(rawData, userId);

        // Update User with latest prediction snapshot (Phase 1.1)
        await User.findByIdAndUpdate(userId, {
            latestPrediction: result.recommendations?.[0]?.role || "Unknown",
            latestConfidenceScore: result.recommendations?.[0]?.confidence || 0
        });

        res.status(200).json({
            message: "Data saved and recommendations generated",
            data: result
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: "Failed to process data", details: error.message });
    }
});

// Submit Feedback
router.post("/feedback", authMiddleware, async (req, res) => {
    try {
        const { rating, helpful, confidenceAccuracy, comment, aspiringRole } = req.body;
        const userId = req.userId;

        // Check feedback limit: At most 3 feedbacks a week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentFeedbackCount = await Feedback.countDocuments({
            userId,
            createdAt: { $gte: oneWeekAgo }
        });

        if (recentFeedbackCount >= 3) {
            return res.status(403).json({ message: "You can submit at most three feedbacks a week." });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isLowQuality = rating <= 2 || helpful === "No";

        // Save feedback
        const feedback = await Feedback.create({
            userId,
            rating,
            helpful,
            confidenceAccuracy,
            comment,
            lowQuality: isLowQuality,
            userSkills: user.skills,
            predictedRole: user.recommendations?.[0]?.role || "Unknown",
            confidenceScore: user.recommendations?.[0]?.confidence || 0,
            aspiringRole: aspiringRole || user.aspiringRole
        });

        // Update user stats (Phase 1.1 / 2.2)
        user.feedbackCount = (user.feedbackCount || 0) + 1;
        if (aspiringRole) user.aspiringRole = aspiringRole;
        await user.save();

        // Logic for Retraining: If low quality or correction
        const predictedRole = user.recommendations?.[0]?.role || "Unknown";
        const targetRole = aspiringRole || user.aspiringRole || "Unknown";
        const isCorrection = targetRole.toLowerCase() !== predictedRole.toLowerCase();

        if (isLowQuality || isCorrection) {
            await RetrainingData.create({
                userSkills: user.skills,
                actualRole: targetRole,
                predictedRole: predictedRole,
                confidenceScore: user.recommendations?.[0]?.confidence || 0,
                feedbackRating: rating,
                sourceFeedbackId: feedback._id
            });
            console.log(`🚩 Retraining data flagged. ${isCorrection ? "(Correction detected)" : "(Low rating detected)"}`);
        }

        res.status(201).json({ message: "Feedback submitted successfully", feedback });
    } catch (error) {
        console.error("Feedback Error:", error);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
});

module.exports = router;
