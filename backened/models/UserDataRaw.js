const mongoose = require("mongoose");

const UserDataRawSchema = new mongoose.Schema({
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    gender: { type: String, default: "" },
    cgpa: { type: Number, default: 0 },
    interests: { type: [String], default: [] },
    certificates: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserDataRaw", UserDataRawSchema);
