const mongoose = require("mongoose");

const trendSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true },
    results: mongoose.Schema.Types.Mixed,
    searchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trend", trendSchema);
