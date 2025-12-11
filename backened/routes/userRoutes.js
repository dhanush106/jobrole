const express = require("express");
const router = express.Router();
const { processUserData } = require("../preprocessing/userDataPreprocess");

router.post("/preprocess", async (req, res) => {
    try {
        const rawData = req.body;
        // Basic validation if needed, or rely on Mongoose models

        const result = await processUserData(rawData);

        res.status(200).json({
            message: "Data saved and processed successfully",
            data: result
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: "Failed to process data", details: error.message });
    }
});

module.exports = router;
