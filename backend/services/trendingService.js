const SearchLog = require('../models/SearchLog');
const Topic = require('../models/Topic');

async function getTrendingTopics({ limit = 10, days = 7 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Count searches by topicId (stronger than keyword string alone).
  const rows = await SearchLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$topicId',
        searches: { $sum: 1 },
      },
    },
    { $sort: { searches: -1 } },
    { $limit: limit },
  ]);

  const topicIds = rows.map((r) => r._id).filter(Boolean);
  const topics = await Topic.find({ _id: { $in: topicIds } })
    .select('keyword slug category searchCount lastRefreshedAt')
    .lean();

  const byId = new Map(topics.map((t) => [String(t._id), t]));

  return rows.map((r) => {
    const t = byId.get(String(r._id)) || null;
    return t ? { ...t, searches: r.searches } : { topicId: r._id, searches: r.searches };
  });
}

module.exports = { getTrendingTopics };

