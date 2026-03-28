const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true, required: true },
    keyword: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // Links to authenticated user
    category: { type: String, default: 'other' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SearchLog', searchLogSchema);

