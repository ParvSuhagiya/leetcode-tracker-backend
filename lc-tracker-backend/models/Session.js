const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    sessionId: String,
    type:      { type: String, required: true },
    ts:        { type: String, required: true },
    payload:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    sessionId:      { type: String, required: true, unique: true },
    problemSlug:    { type: String, required: true },
    questionId:     { type: String, default: null },
    title:          { type: String, default: null },
    difficulty:     { type: String, enum: ['Easy', 'Medium', 'Hard', null], default: null },
    startedAt:      { type: String, required: true },
    activeMs:       { type: Number, default: 0 },
    tabSwitchCount: { type: Number, default: 0 },
    events:         { type: [EventSchema], default: [] },
  },
  { timestamps: true }
);

SessionSchema.index({ problemSlug: 1, startedAt: -1 });
SessionSchema.index({ difficulty: 1 });

module.exports = mongoose.model('Session', SessionSchema);
