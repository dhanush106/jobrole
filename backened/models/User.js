const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    googleId: String,

    // NEW fields used by your frontend
    degree: { type: String, default: "" },
    ug_specialization: { type: String, default: "" },
    gender: { type: String, default: "" },
    phone: { type: String, required: true },
    interests: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    cgpa: { type: Number, default: 0 },
    skills: { type: [String], default: [] },

    // ML Predictions
    recommendations: [{
        role: String,
        confidence: Number,
        missing_skills: [String]
    }],

    token: { type: String, default: "" },
    tokenExpiresAt: { type: Date, default: null }
});


module.exports = mongoose.model("User", UserSchema);

