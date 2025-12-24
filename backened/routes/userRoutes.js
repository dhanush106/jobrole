const express = require("express");
const router = express.Router();
const { processUserData } = require("../preprocessing/userDataPreprocess");
const { authMiddleware } = require("./auth");

router.post("/preprocess", authMiddleware, async (req, res) => {
    try {
        const rawData = req.body;
        const userId = req.userId; // From authMiddleware

        const result = await processUserData(rawData, userId);

        res.status(200).json({
            message: "Data saved and recommendations generated",
            data: result
        });
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).json({ error: "Failed to process data", details: error.message });
    }
});

module.exports = router;
