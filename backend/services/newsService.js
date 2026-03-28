const axios = require('axios');
const cache = require("../utils/cache");
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY;

function toISODate(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function dedupeNewsItems(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const key = String(item.url || item.title || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// Map country codes to NewsAPI country codes
const mapRegionToCountry = (region) => {
  const countryMap = {
    'US': 'us',
    'GB': 'gb',
    'CA': 'ca',
    'AU': 'au',
    'DE': 'de',
    'FR': 'fr',
    'IN': 'in',
    'JP': 'jp',
    'BR': 'br',
    'MX': 'mx',
    // Add more mappings as needed
  };
  
  // If region is a 2-letter country code, convert to lowercase
  if (region && region.length === 2) {
    // Check if it's in our mapping
    if (countryMap[region.toUpperCase()]) {
      return countryMap[region.toUpperCase()];
    }
    // Otherwise, assume it's already a valid country code and convert to lowercase
    return region.toLowerCase();
  }
  
  return null;
};

exports.fetchNewsArticles = async (keyword, options = {}) => {
  try {
    console.log(`[News] Fetching articles for: ${keyword} with options:`, options);
    console.log(`[News] Using API Key: ${NEWS_API_KEY ? 'YES' : 'NO'}`);

    // Check if API key is provided
    if (!NEWS_API_KEY) {
      throw new Error("Missing News API key in environment variables");
    }

    // Default options
    const {
      limit = 10,
      sortBy = 'publishedAt',
      time = 'week',
      region = null
    } = options;

    // Map time parameter to NewsAPI date format
    let fromDate = null;
    const now = new Date();
    switch(time) {
      case 'day':
        fromDate = new Date(now.setDate(now.getDate() - 1)).toISOString();
        break;
      case 'week':
        fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'month':
        fromDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case 'year':
        fromDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      default:
        fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
    }
    
    // Create cache key
    const cacheKey = `news_${keyword}_${limit}_${sortBy}_${time}_${region || 'global'}`;
    
    // Try to get from cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`[News] Returning cached data for: ${keyword}`);
      return cachedData;
    }

    // Build params
    const params = {
      q: keyword,
      apiKey: NEWS_API_KEY,
      language: 'en',
      sortBy: sortBy,
      pageSize: limit,
      from: fromDate
    };

    // Do NOT send country param to /everything (unsupported). Region remains for cache key and fallbacks.

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: params,
      timeout: 10000 // 10 second timeout
    });

    console.log(`[News] Response received with ${response.data.articles?.length || 0} articles`);

    // Check if we got an error response
    if (response.data.status !== 'ok') {
      throw new Error(`News API error: ${response.data.message}`);
    }

    const newsArticles = response.data.articles || [];

    let result = newsArticles.map(article => ({
      title: article.title,
      description: article.description,
      // NewsAPI sometimes provides `content`; when absent we fall back to description.
      content: article.content || article.description || '',
      source: { name: article.source.name },
      publishedAt: article.publishedAt,
      url: article.url,
      author: article.author || ''
    }));

    // Fallbacks if NewsAPI returns empty.
    if (result.length === 0) {
      const fallback = await (async () => {
        if (GNEWS_API_KEY) {
          try {
            const country = region ? mapRegionToCountry(region) : undefined;
            const gnewsResp = await axios.get('https://gnews.io/api/v4/search', {
              params: {
                q: keyword,
                token: GNEWS_API_KEY,
                lang: 'en',
                country: country || undefined,
                max: limit,
                from: fromDate ? fromDate.slice(0, 10) : undefined,
              },
              timeout: 10000,
            });

            const articles = gnewsResp.data?.articles || [];
            return articles.map((a) => ({
              title: a.title,
              description: a.description || '',
              content: a.content || a.description || '',
              source: { name: a.source?.name || 'GNews' },
              publishedAt: a.publishedAt || null,
              url: a.url || '',
              author: a.author || '',
            }));
          } catch (e) {
            console.error('[News fallback: GNews] Error:', e.message || e);
          }
        }

        if (MEDIASTACK_API_KEY) {
          try {
            const country = region ? mapRegionToCountry(region) : undefined;
            const msResp = await axios.get('http://api.mediastack.com/v1/news', {
              params: {
                access_key: MEDIASTACK_API_KEY,
                keywords: keyword,
                countries: country || undefined,
                languages: 'en',
                limit,
                sort: sortBy === 'publishedAt' ? 'published_desc' : undefined,
                // Mediastack doesn't always support from-date by default; we best-effort with date.
                date: fromDate ? fromDate.slice(0, 10) : undefined,
              },
              timeout: 10000,
            });

            const articles = msResp.data?.data || [];
            return articles.map((a) => ({
              title: a.title,
              description: a.description || '',
              content: a.description || '',
              source: { name: a.source || 'Mediastack' },
              publishedAt: a.published_at || a.publishedAt || null,
              url: a.url || '',
              author: a.author || '',
            }));
          } catch (e) {
            console.error('[News fallback: Mediastack] Error:', e.message || e);
          }
        }

        return [];
      })();

      result = fallback || [];
    }
    
    // Cache the result for 2 minutes
    cache.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
  } catch (error) {
    console.error('[News] API Error:', error.message || error);
    console.error('[News] Error Response:', error.response?.data);
    // Return empty array instead of throwing error
    return [];
  }
};

async function fetchGNewsPost2020(keyword, options = {}) {
  try {
    if (!GNEWS_API_KEY) return [];

    const {
      limit = 20,
      region = null,
      from = '2020-01-01',
      to = null,
    } = options;

    const country = region ? mapRegionToCountry(region) : undefined;
    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: keyword,
        token: GNEWS_API_KEY,
        lang: 'en',
        country: country || undefined,
        from,
        to: to || undefined,
        sortby: 'publishedAt',
        max: Math.min(Number(limit) || 20, 100),
      },
      timeout: 10000,
    });

    const articles = response.data?.articles || [];
    return articles.map((a) => ({
      title: a.title,
      description: a.description || '',
      content: a.content || a.description || '',
      source: { name: a.source?.name || 'GNews' },
      publishedAt: a.publishedAt || null,
      url: a.url || '',
      author: a.author || '',
    }));
  } catch (error) {
    console.error('[GNews post-2020] Error:', error.message || error);
    return [];
  }
}

exports.fetchLayeredNewsEvidence = async (keyword, options = {}) => {
  const {
    region = null,
    recentLimit = 20,
    post2020Limit = 30,
    recentWindow = 'month',
  } = options;

  const cacheKey = `news_layered_${keyword}_${region || 'global'}_${recentLimit}_${post2020Limit}_${recentWindow}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const [recentNews, post2020News] = await Promise.all([
    exports.fetchNewsArticles(keyword, {
      limit: Number(recentLimit),
      sortBy: 'publishedAt',
      time: recentWindow,
      region,
    }),
    fetchGNewsPost2020(keyword, {
      limit: Number(post2020Limit),
      region,
      from: '2020-01-01',
      to: toISODate(new Date()),
    }),
  ]);

  const merged = dedupeNewsItems([...(recentNews || []), ...(post2020News || [])])
    .sort((a, b) => {
      const ad = new Date(a.publishedAt || 0).getTime();
      const bd = new Date(b.publishedAt || 0).getTime();
      return bd - ad;
    });

  cache.set(cacheKey, merged, 2 * 60 * 1000);
  return merged;
};