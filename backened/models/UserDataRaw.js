const mongoose = require("mongoose");

const UserDataRawSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, required: true },
    cgpa: { type: Number, required: true },
    interests: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserDataRaw", UserDataRawSchema);
