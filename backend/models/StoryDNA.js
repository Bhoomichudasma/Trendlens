const mongoose = require('mongoose');

const storyDnaSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, unique: true, index: true },

    // 5-layer narrative + supporting structured data.
    background: { type: String, default: '' },
    trigger: { type: String, default: '' },
    escalation: { type: [String], default: [] }, // Changed to array to match Groq output
    current: { type: String, default: '' },
    timelineSummary: { type: String, default: '' },

    // Optional "ELI5" versions of the above.
    eli5: {
      background: { type: String, default: '' },
      trigger: { type: String, default: '' },
      escalation: { type: [String], default: [] }, // Changed to array
      current: { type: String, default: '' },
      timelineSummary: { type: String, default: '' },
    },

    // Reddit-focused narrative.
    redditPulse: {
      summary: { type: String, default: '' },
      currentRedditBeliefs: { type: [String], default: [] },
    },

    // Cause -> effect chain used for escalation visualizer.
    escalationChain: {
      // Each edge references timeline event ids.
      edges: { type: Array, default: [] },
    },

    // Multi-source framing comparison (AI-generated).
    sourcesComparison: { type: Object, default: {} },

    // AI-suggested connected topics.
    relatedTopics: {
      type: Array,
      default: [],
      // [{ topic: string, rationale: string }]
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StoryDNA', storyDnaSchema);

