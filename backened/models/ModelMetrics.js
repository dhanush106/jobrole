const mongoose = require("mongoose");

const ModelMetricsSchema = new mongoose.Schema({
    modelVersion: { type: String, default: "1.0.0" },
    accuracy: { type: Number, default: 0 },
    precision: { type: Number, default: 0 },
    recall: { type: Number, default: 0 },
    f1Score: { type: Number, default: 0 },
    confidenceDistribution: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 }
    },
    trainedOnDataCount: { type: Number, default: 0 },
    trainedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ModelMetrics", ModelMetricsSchema);
