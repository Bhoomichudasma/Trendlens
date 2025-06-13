const { fetchGoogleTrends } = require("../services/googleTrendsService");
const { fetchRedditPosts } = require("../services/redditService");
const { fetchNewsArticles } = require("../services/newsService");



exports.getTrendData = async (req, res, next) => {
  try {
    const keyword = req.params.keyword;
    console.log(`[TREND CONTROLLER] Fetching data for: ${keyword}`);

    const [googleTrends, reddit, news] = await Promise.all([
      fetchGoogleTrends(keyword).catch(err => {
        console.error("[Google Trends Error]", err.message);
        return { timeline_data: [], interest_by_region: [] }; // safe fallback
      }),
      fetchRedditPosts(keyword).catch(err => {
        console.error("[Reddit Error]", err.message);
        return [];
      }),
      fetchNewsArticles(keyword).catch(err => {
        console.error("[News Error]", err.message);
        return [];
      }),
    ]);

    res.json({
      keyword,
      googleTrends,
      reddit,
      news
    });
  } catch (error) {
    console.error("[TrendData Error]", error.message);
    res.status(500).json({ error: "Something went wrong on the server" });
  }
};
