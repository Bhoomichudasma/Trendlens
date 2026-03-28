const { searchAndBuild } = require('../services/aggregationService');
const SearchLog = require('../models/SearchLog');

exports.search = async (req, res, next) => {
  try {
    const keyword = req.query.q;
    if (!keyword || !String(keyword).trim()) {
      return res.status(400).json({ error: 'Missing query param `q`.' });
    }

    const {
      category,
      redditLimit,
      newsLimit,
      redditSort,
      newsSort,
      redditTime,
      newsTime,
      region,
      refresh,
      log,
    } = req.query;

    const logSearch = !(log === 'false' || log === '0');

    const payload = await searchAndBuild({
      keyword: String(keyword),
      forceRefresh: refresh === 'true' || refresh === '1',
      logSearch,
      userId: req.userId || null,
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
    });

    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};

// Get authenticated user's search history
exports.getMyHistory = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const history = await SearchLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ history });
  } catch (err) {
    return next(err);
  }
};

