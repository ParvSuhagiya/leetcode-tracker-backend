const express = require('express');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

const router = express.Router();
const statsRouter = express.Router();

const ACCEPTED_FILTER = {
  events: {
    $elemMatch: {
      type: 'submit_verdict',
      'payload.statusMsg': 'Accepted',
    },
  },
};

router.post('/', auth, async (req, res, next) => {
  try {
    const incoming = req.body;

    const existing = await Session.findOne({ sessionId: incoming.sessionId });

    let mergedEvents = incoming.events || [];
    if (existing) {
      const existingKeys = new Set(existing.events.map(e => `${e.ts}|${e.type}`));
      const newEvents = mergedEvents.filter(e => !existingKeys.has(`${e.ts}|${e.type}`));
      mergedEvents = [...existing.events, ...newEvents];
    }

    const session = await Session.findOneAndUpdate(
      { sessionId: incoming.sessionId },
      { ...incoming, events: mergedEvents },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: { sessionId: session.sessionId } });
  } catch (err) {
    next(err);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.slug) filter.problemSlug = req.query.slug;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      Session.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit),
      Session.countDocuments(filter),
    ]);

    res.json({ success: true, data: { sessions, total, page, limit } });
  } catch (err) {
    next(err);
  }
});

router.get('/:sessionId', auth, async (req, res, next) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

statsRouter.get('/summary', auth, async (req, res, next) => {
  try {
    const [
      totalSessions,
      totalAccepted,
      difficultyGroups,
      avgResult,
      mostRecentSolve,
      topProblems,
    ] = await Promise.all([
      Session.countDocuments(),
      Session.countDocuments(ACCEPTED_FILTER),
      Session.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      Session.aggregate([
        { $group: { _id: null, avg: { $avg: '$activeMs' } } },
      ]),
      Session.findOne(ACCEPTED_FILTER)
        .sort({ startedAt: -1 })
        .select('title difficulty startedAt')
        .lean(),
      Session.aggregate([
        { $group: { _id: '$problemSlug', attempts: { $sum: 1 } } },
        { $sort: { attempts: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, slug: '$_id', attempts: 1 } },
      ]),
    ]);

    const byDifficulty = {};
    for (const group of difficultyGroups) {
      if (group._id) byDifficulty[group._id] = group.count;
    }

    res.json({
      success: true,
      data: {
        totalSessions,
        totalAccepted,
        byDifficulty,
        avgActiveMs: Math.round(avgResult[0]?.avg || 0),
        mostRecentSolve: mostRecentSolve || null,
        topProblems,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.statsRouter = statsRouter;
