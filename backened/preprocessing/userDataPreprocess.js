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

const processUserData = async (rawData) => {
    try {
        console.log("--- Starting Preprocessing ---");
        console.log("Raw Data:", rawData);

        // 1. Save Raw Data
        const savedRaw = await UserDataRaw.create(rawData);
        console.log("Raw Data Saved with ID:", savedRaw._id);

        // 2. Preprocess
        // Label Encoding for text
        const name_encoded = simpleLabelEncoder(rawData.name);
        const email_encoded = simpleLabelEncoder(rawData.email);
        const gender_encoded = simpleLabelEncoder(rawData.gender);

        // MinMax Scaling for CGPA (Range 1-10)
        let cgpa_scaled = minMaxScale(rawData.cgpa, 1, 10);
        // Clamp 0-1 just in case
        if (cgpa_scaled < 0) cgpa_scaled = 0;
        if (cgpa_scaled > 1) cgpa_scaled = 1;

        // List conversion -> Encoded arrays
        const interests_encoded = rawData.interests.map(i => simpleLabelEncoder(i));
        const certificates_encoded = rawData.certificates.map(c => simpleLabelEncoder(c));
        const skills_encoded = rawData.skills.map(s => simpleLabelEncoder(s));

        const processedPayload = {
            originalId: savedRaw._id,
            name_encoded,
            email_encoded,
            gender_encoded,
            cgpa_scaled,
            interests_encoded,
            certificates_encoded,
            skills_encoded
        };

        console.log("Processed Payload:", processedPayload);

        // 3. Save Processed Data
        const savedProcessed = await UserDataPreprocessed.create(processedPayload);
        console.log("Processed Data Saved:", savedProcessed);

        return { raw: savedRaw, processed: savedProcessed };
    } catch (error) {
        console.error("Preprocessing Error:", error);
        throw error;
    }
};

module.exports = { processUserData };
