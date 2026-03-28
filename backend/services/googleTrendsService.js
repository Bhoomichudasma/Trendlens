

const axios = require("axios");
const cache = require("../utils/cache");

const getApiKey = () => process.env.SERPAPI_API_KEY;

async function fetchWithRetry(url, config, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[Google Trends] Attempt ${i + 1} for ${config.params.data_type}`);
      const response = await axios.get(url, config);
      console.log(`[Google Trends] Attempt ${i + 1} successful for ${config.params.data_type}`);
      return response;
    } catch (error) {
      console.log(`[Google Trends] Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function fetchGoogleTrends(keyword, options = {}) {
  try {
    console.log(`[Google Trends] Fetching data for: ${keyword} with options:`, options);
    const apiKey = getApiKey();
    console.log(`[Google Trends] Using API Key: ${apiKey ? 'YES' : 'NO'}`);

    const { region = null } = options;

    const cacheKey = `google_trends_${keyword}_${region || 'global'}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`[Google Trends] Returning cached data for: ${keyword} (${region || 'global'})`);
      return cachedData;
    }

    const config = { timeout: 8000 };

    // TIMESERIES: always fetch globally — regional TIMESERIES is often flat/zero for smaller markets.
    // GEO_MAP: when a region is selected, pass geo so SerpAPI drills into sub-regions (states/provinces).
    //          when no region, fetch country-level breakdown.
    const [timeSeriesResponse, geoMapResponse] = await Promise.all([
      fetchWithRetry("https://serpapi.com/search", {
        ...config,
        params: {
          engine: "google_trends",
          q: keyword,
          data_type: "TIMESERIES",
          api_key: apiKey,
          // Always global for timeline so we get real trend data
        }
      }).catch(err => {
        console.log(`[Google Trends] TIMESERIES failed:`, err.message);
        return { data: { interest_over_time: { timeline_data: [] } } };
      }),

      fetchWithRetry("https://serpapi.com/search", {
        ...config,
        params: {
          engine: "google_trends",
          q: keyword,
          data_type: "GEO_MAP_0",
          api_key: apiKey,
          // Pass geo only for GEO_MAP to drill into sub-regions when a region is selected
          ...(region ? { geo: region } : {}),
        }
      }).catch(err => {
        console.log(`[Google Trends] GEO_MAP_0 failed:`, err.message);
        return { data: { interest_by_region: [] } };
      }),
    ]);

    const interestOverTime = timeSeriesResponse.data?.interest_over_time?.timeline_data || [];
    const interestByRegion = geoMapResponse.data?.interest_by_region || [];

    console.log(`[Google Trends] Timeline: ${interestOverTime.length}, Regions: ${interestByRegion.length}`);

    const result = {
      timeline_data: interestOverTime,
      interest_by_region: interestByRegion,
      // Pass region metadata so frontend knows what geo context the map represents
      geoContext: region || 'global',
    };

    cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  } catch (error) {
    console.error("[Google Trends] SerpAPI Error:", error.message || error);
    return { timeline_data: [], interest_by_region: [], geoContext: 'global' };
  }
}

module.exports = { fetchGoogleTrends };