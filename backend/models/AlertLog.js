const mongoose = require('mongoose');

const AlertLogSchema = new mongoose.Schema({
  topicId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  keyword:      String,
  articleCount: { type: Number, default: 0 },
  sentiment:    { type: String, default: 'neutral' },
  alertFired:   { type: Boolean, default: false },
  alertType:    { type: String, default: 'none' },
  emailsSent:   [
    {
      email:    String,
      sentAt:   { type: Date, default: Date.now },
      status:   { type: String, enum: ['sent', 'failed'], default: 'sent' },
      error:    String, // If failed, store error message
    }
  ],
  alertDetails: {
    title:      String,
    message:    String,
    confidence: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('AlertLog', AlertLogSchema);
