const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5 },
    helpful: { type: String, enum: ["Yes", "No"] },
    confidenceAccuracy: { type: String, enum: ["Low", "Medium", "High"] },
    comment: { type: String },
    lowQuality: { type: Boolean, default: false },

    // Snapshots for retraining logic
    userSkills: [String],
    predictedRole: String,
    confidenceScore: Number,
    aspiringRole: String,

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
