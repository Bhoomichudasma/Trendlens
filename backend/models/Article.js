const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    origin: { type: String, enum: ['news', 'reddit', 'other'], default: 'news', index: true },
    // Stable hash to dedupe articles/posts.
    articleHash: { type: String, required: true, index: true },

    title: { type: String, default: '' },
    content: { type: String, default: '' },
    source: { type: String, default: '' }, // e.g., "Reuters" or "r/worldnews"
    publishedAt: { type: Date, default: null },
    url: { type: String, default: '' },
    author: { type: String, default: '' },
    keywords: { type: [String], default: [] },

    // Original user topic keyword used during fetching.
    topic: { type: String, default: '' },

    // Optional engagement metrics (mostly for reddit).
    score: { type: Number, default: null },
    num_comments: { type: Number, default: null },
  },
  { timestamps: true }
);

// Ensure we don't store duplicates per topic.
articleSchema.index({ topicId: 1, articleHash: 1 }, { unique: true });

module.exports = mongoose.model('Article', articleSchema);

