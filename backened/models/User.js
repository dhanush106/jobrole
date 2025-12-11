const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    googleId: String,

    // NEW fields used by your frontend
    degree: { type: String, default: "" },
    cgpa: { type: String, default: "" }, // string to keep formatting, you can change to Number
    skills: { type: [String], default: [] },

    token: { type: String, default: "" },
    tokenExpiresAt: { type: Date, default: null }
});


module.exports = mongoose.model("User", UserSchema);

