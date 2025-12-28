const mongoose = require("mongoose");

const RetrainingDataSchema = new mongoose.Schema({
    userSkills: [String],
    actualRole: String, // The "Aspiring Role" or user's corrected role
    predictedRole: String,
    confidenceScore: Number,
    feedbackRating: Number,
    sourceFeedbackId: { type: mongoose.Schema.Types.ObjectId, ref: "Feedback" },
    isProcessed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RetrainingData", RetrainingDataSchema);
