// services/googleTrendsService.js
const axios = require("axios");
require("dotenv").config();

const SERP_API_KEY = process.env.SERPAPI_API_KEY;

async function fetchGoogleTrends(keyword) {
  try {
    const [timeSeriesResponse, geoMapResponse] = await Promise.all([
      axios.get("https://serpapi.com/search", {
        params: {
          engine: "google_trends",
          q: keyword,
          data_type: "TIMESERIES",
          api_key: SERP_API_KEY,
        },
      }),
      axios.get("https://serpapi.com/search", {
        params: {
          engine: "google_trends",
          q: keyword,
          data_type: "GEO_MAP_0",
          api_key: SERP_API_KEY,
        },
      }),
    ]);

    const interestOverTime = timeSeriesResponse.data?.interest_over_time?.timeline_data || [];
    const interestByRegion = geoMapResponse.data?.interest_by_region || [];

    return {
      timeline_data: interestOverTime,
      interest_by_region: interestByRegion,
    };
  } catch (error) {
    console.error("SerpAPI Google Trends Error:", error.message || error);
    return { error: "Failed to fetch Google Trends via SerpAPI" };
  }
}

module.exports = { fetchGoogleTrends };



