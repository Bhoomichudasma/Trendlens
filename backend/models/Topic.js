const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    searchCount: { type: Number, default: 0 },
    lastRefreshedAt: { type: Date, default: null },
    alertsEnabled: { type: Boolean, default: false },
    alertSubscribers: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Topic', topicSchema);

