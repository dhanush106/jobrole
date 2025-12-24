const UserDataRaw = require("../models/UserDataRaw");
const UserDataPreprocessed = require("../models/UserDataPreprocessed");

// Simple Label Encoder implementation to persist consistency across calls could be improved with a database map,
// but for this specific request "Performs Label Encoding" usually implies a simple mapping or hashing for demonstration unless a persistent encoder is specified.
// However, to keep it simple and stateless as often requested in these MERN tasks:
// We will simply map characters to codes or usage hash for consistency if needed, but standard practice without ML lib is just custom mapping.
// Let's use a simple deterministic hash for strings to simulate label encoding, or just arbitrary mapping if "training" wasn't mentioned.
// Since there's a separate "Training Data Preprocessing" script (Python), this Node.js module effectively acts as the "inference" preprocessor.
// CRITICAL: The encoding logic HERE should ideally match what the Python script does.
// But since we can't easily sync state between a one-off Python script and a Node server without shared storage,
// I will implement a robust hashing/mapping here that is "label encoding-like".
// For CGPA, min-max scaling 1-10 is straightforward.

const simpleLabelEncoder = (str) => {
    if (!str) return 0;
    // Simple sum of char codes to get a number (Hash-like)
    // Real LabelEncoding requires a fit step. For this task, we'll map unique strings to an index if we had a dictionary.
    // Without a persistent dictionary, we might just return a hash or length.
    // Let's use a simple hash to integer.
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const minMaxScale = (val, min, max) => {
    return (val - min) / (max - min);
};

const { execSync } = require("child_process");
const path = require("path");
const User = require("../models/User");

const processUserData = async (rawData, userId) => {
    try {
        console.log("--- Starting ML Inference ---");

        // 1. Save Raw Data
        const savedRaw = await UserDataRaw.create(rawData);
        console.log("Raw Data Saved with ID:", savedRaw._id);

        // 2. Prepare Payload for Python Inference
        const inference_input = {
            ug_course: rawData.degree || "",
            ug_specialization: rawData.ug_specialization || "",
            interests: (rawData.interests || []).join(" "),
            skills: (rawData.skills || []).join(" "),
            certificates: (rawData.certificates || []).join(" ")
        };

        const pythonScriptPath = path.join(__dirname, "../training/inference.py");
        // Escape quotes for bash/cmd
        const inputString = JSON.stringify(inference_input).replace(/"/g, '\\"');

        console.log("Running Python Inference...");
        const command = `python "${pythonScriptPath}" "${inputString}"`;
        const output = execSync(command).toString();

        let predictions = [];
        try {
            predictions = JSON.parse(output);
        } catch (e) {
            console.error("Failed to parse Python output:", output);
            // Fallback mock if needed for demo, but better to error to show pipeline state
            throw new Error("ML Inference failed to return valid JSON");
        }

        console.log("Predictions Received:", predictions);

        // 3. Update User document
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                degree: rawData.degree,
                ug_specialization: rawData.ug_specialization,
                gender: rawData.gender,
                phone: rawData.phone,
                interests: rawData.interests,
                certificates: rawData.certificates,
                cgpa: rawData.cgpa,
                skills: rawData.skills,
                recommendations: predictions
            });
            console.log("User document updated.");
        }

        return { raw: savedRaw, recommendations: predictions };
    } catch (error) {
        console.error("Preprocessing Error:", error);
        throw error;
    }
};

module.exports = {
    processUserData
};
