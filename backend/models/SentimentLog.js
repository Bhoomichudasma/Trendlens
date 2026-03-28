const mongoose = require('mongoose');

const sentimentLogSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    // Example: "news:Reuters", "reddit:r/worldnews"
    source: { type: String, required: true, index: true },

    // Bucket start time.
    date: { type: Date, required: true, index: true },

    // Normalized sentiment score in range roughly [-1, 1].
    score: { type: Number, default: 0 },

    sampleSize: { type: Number, default: 0 },

    // Optional annotation when a sentiment shift is detected.
    shiftEventId: { type: String, default: null },
  },
  { timestamps: true }
);

sentimentLogSchema.index({ topicId: 1, source: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SentimentLog', sentimentLogSchema);

