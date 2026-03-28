const Topic = require('../models/Topic');
const StoryDNA = require('../models/StoryDNA');
const TimelineEvent = require('../models/TimelineEvent');
const SentimentLog = require('../models/SentimentLog');
const Article = require('../models/Article');
const { searchAndBuild } = require('../services/aggregationService');

function toISODateOnly(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

exports.listTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find({})
      .sort({ searchCount: -1, createdAt: -1 })
      .limit(50)
      .select('keyword slug category searchCount lastRefreshedAt createdAt');

    res.json({ topics });
  } catch (err) {
    next(err);
  }
};

exports.getDNA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dna = await StoryDNA.findOne({ topicId: id });
    res.json({ dna });
  } catch (err) {
    next(err);
  }
};

exports.getTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timeline = await TimelineEvent.find({ topicId: id }).sort({ order: 1 });
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
};

exports.getEscalation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dna = await StoryDNA.findOne({ topicId: id });
    res.json({ escalationChain: dna?.escalationChain || { edges: [] } });
  } catch (err) {
    next(err);
  }
};

exports.getSentiment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await SentimentLog.find({ topicId: id }).sort({ date: 1 });

    const seriesBySource = new Map();
    let shiftEventId = null;

    for (const l of logs) {
      if (!seriesBySource.has(l.source)) seriesBySource.set(l.source, []);
      seriesBySource.get(l.source).push({ date: toISODateOnly(l.date), score: l.score });
      if (!shiftEventId && l.shiftEventId) shiftEventId = l.shiftEventId;
    }

    const timeline = await TimelineEvent.find({ topicId: id }).sort({ order: 1 });
    const ev = shiftEventId ? timeline.find((t) => t.eventId === shiftEventId) : null;

    const shiftLog = shiftEventId ? logs.find((l) => l.shiftEventId === shiftEventId) : null;
    const annotations = shiftLog
      ? [
          {
            date: toISODateOnly(shiftLog.date),
            label: ev ? `Sentiment shifted after ${ev.title}` : 'Sentiment shifted',
            eventId: shiftEventId,
          },
        ]
      : [];

    res.json({
      shiftEventId: shiftEventId || null,
      annotations,
      seriesBySource: [...seriesBySource.entries()].map(([source, points]) => ({ source, points })),
    });
  } catch (err) {
    next(err);
  }
};

exports.getSources = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dna = await StoryDNA.findOne({ topicId: id });
    res.json({ sourcesComparison: dna?.sourcesComparison || {} });
  } catch (err) {
    next(err);
  }
};

exports.getRelated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dna = await StoryDNA.findOne({ topicId: id });
    res.json({ relatedTopics: dna?.relatedTopics || [] });
  } catch (err) {
    next(err);
  }
};

exports.getRedditPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const posts = await Article.find({ topicId: id, origin: 'reddit' })
      .sort({ publishedAt: -1 })
      .limit(20)
      .select('title content source publishedAt url score num_comments')
      .lean();

    res.json({
      redditPosts: posts.map((p) => ({
        title: p.title,
        selftext: p.content,
        subreddit: p.source?.startsWith('r/') ? p.source.slice(2) : p.source,
        created_utc: p.publishedAt ? Math.floor(new Date(p.publishedAt).getTime() / 1000) : null,
        permalink: p.url,
        score: p.score,
        num_comments: p.num_comments,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.createTopic = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      buildNow = true,
      redditLimit,
      newsLimit,
      redditSort,
      newsSort,
      redditTime,
      newsTime,
      region,
    } = req.body || {};
    if (!keyword || !String(keyword).trim()) {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const slug = String(keyword)
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const topic = await Topic.findOneAndUpdate(
      { slug },
      { $setOnInsert: { keyword: String(keyword), slug, category: category || 'other' } },
      { upsert: true, new: true }
    );

    if (buildNow) {
      await searchAndBuild({
        keyword: String(keyword),
        filters: {
          category,
          redditLimit,
          newsLimit,
          redditSort,
          newsSort,
          redditTime,
          newsTime,
          region,
        },
        logSearch: false,
        forceRefresh: true,
      });
    }

    return res.json({ topic, built: buildNow });
  } catch (err) {
    next(err);
  }
};

