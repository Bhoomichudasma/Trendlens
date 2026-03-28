const { fetchGoogleTrends } = require("../services/googleTrendsService");
const { fetchRedditPosts } = require("../services/redditService");
const { fetchNewsArticles } = require("../services/newsService");
const { exportTrendToPDF } = require("../utils/pdfExport");

exports.getTrendData = async (req, res, next) => {
  try {
    const keyword = req.params.keyword;
    // Extract query parameters for filtering
    const {
      redditLimit = 10,
      newsLimit = 10,
      redditSort = 'relevance',
      newsSort = 'publishedAt',
      redditTime = 'week',
      newsTime = 'week',
      region = null
    } = req.query;

    console.log(`[TREND CONTROLLER] Fetching data for: ${keyword} with filters`, req.query);

    // Fetch Google Trends data without fallback - pass region as-is
    let googleTrends = { timeline_data: [], interest_by_region: [] };
    try {
      googleTrends = await fetchGoogleTrends(keyword, { region });
    } catch (err) {
      console.error("[Google Trends Error]", err.message);
      // Return empty data instead of throwing error
      googleTrends = { timeline_data: [], interest_by_region: [] };
    }

    // Fetch Reddit and News data with guards for zero limits to avoid unnecessary API calls/errors
    const redditPromise = Number(redditLimit) > 0
      ? fetchRedditPosts(keyword, { 
          limit: Number(redditLimit), 
          sort: redditSort, 
          time: redditTime,
          region: region
        }).catch(err => {
          console.error("[Reddit Error]", err.message);
          return [];
        })
      : Promise.resolve([]);

    const newsPromise = Number(newsLimit) > 0
      ? fetchNewsArticles(keyword, { 
          limit: Number(newsLimit), 
          sortBy: newsSort, 
          time: newsTime,
          region: region
        }).catch(err => {
          console.error("[News Error]", err.message);
          return [];
        })
      : Promise.resolve([]);

    const [reddit, news] = await Promise.all([redditPromise, newsPromise]);

    res.json({
      keyword,
      googleTrends: {
        timeline_data: googleTrends.timeline_data || [],
        interest_by_region: googleTrends.interest_by_region || [],
        region_filter_applied: region ? true : false,
        region_has_data: region && (googleTrends.timeline_data.length > 0 || googleTrends.interest_by_region.length > 0) ? true : false
      },
      reddit,
      news
    });
  } catch (error) {
    console.error("[TrendData Error]", error.message);
    // Even if there's an overall error, try to return partial data
    res.status(500).json({ 
      error: "Something went wrong on the server",
      keyword: req.params.keyword,
      googleTrends: { 
        timeline_data: [], 
        interest_by_region: [],
        region_filter_applied: false,
        region_has_data: false
      },
      reddit: [],
      news: []
    });
  }
};

// Export PDF function
exports.exportPDF = async (req, res, next) => {
  try {
    const { keyword, data } = req.body;
    
    if (!keyword || !data) {
      return res.status(400).json({ error: 'Keyword and data are required' });
    }

    // Export to PDF buffer
    const pdfBuffer = await exportTrendToPDF(data);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=trendlens-${keyword}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[PDF Export Error]', error.message);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};