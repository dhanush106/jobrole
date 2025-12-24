const mongoose = require("mongoose");

const UserDataPreprocessedSchema = new mongoose.Schema({
    originalId: { type: mongoose.Schema.Types.ObjectId, ref: "UserDataRaw" },
    name_encoded: { type: Number },
    email_encoded: { type: Number }, // Usually email isn't encoded for ML features, but specific requirement asked for Label Encoding of text fields
    gender_encoded: { type: Number },
    cgpa_scaled: { type: Number }, // MinMax scaled 0-1
    interests_encoded: { type: [Number] },
    certificates_encoded: { type: [Number] },
    skills_encoded: { type: [Number] },
    processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserDataPreprocessed", UserDataPreprocessedSchema);
