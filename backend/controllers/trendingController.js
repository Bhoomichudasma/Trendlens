const { getTrendingTopics } = require('../services/trendingService');

exports.getTrending = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const days = req.query.days ? Number(req.query.days) : undefined;

    const trendingTopics = await getTrendingTopics({ limit, days });
    res.json({ trendingTopics });
  } catch (err) {
    next(err);
  }
};

