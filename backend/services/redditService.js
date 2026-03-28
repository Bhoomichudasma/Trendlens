const axios = require("axios");
const cache = require("../utils/cache");
require("dotenv").config();

let tokenCache = {
  access_token: null,
  expires_at: null
};

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'to', 'for', 'and', 'or', 'with', 'from', 'at', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'this', 'that', 'as', 'about',
  'what', 'when', 'where', 'who', 'why', 'how', 'vs', 'new', 'latest', 'today'
]);

function escapeRegExp(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenizeKeyword(keyword) {
  return String(keyword || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t && t.length >= 3 && !STOPWORDS.has(t));
}

function computeRelevanceScore(keyword, post) {
  const title = String(post?.title || '').toLowerCase();
  const body = String(post?.selftext || '').toLowerCase();
  const haystack = `${title} ${body}`;
  const tokens = tokenizeKeyword(keyword);
  if (tokens.length === 0) return 0;

  const phrase = String(keyword || '').toLowerCase().trim();
  let score = 0;

  if (phrase && title.includes(phrase)) score += 12;
  if (phrase && haystack.includes(phrase)) score += 8;

  for (const token of tokens) {
    const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i');
    if (re.test(title)) score += 4;
    if (re.test(body)) score += 2;
  }

  // Light engagement boost for better surfaced, still relevant posts.
  const engagement = Number(post?.score || 0) + Number(post?.num_comments || 0);
  if (engagement >= 1000) score += 2;
  else if (engagement >= 100) score += 1;

  return score;
}

const getAccessToken = async () => {
  const now = Date.now();

  if (tokenCache.access_token && tokenCache.expires_at > now) {
    return tokenCache.access_token;
  }

  console.log("[Reddit] Getting new access token");
  console.log(`[Reddit] Client ID: ${process.env.REDDIT_CLIENT_ID ? 'YES' : 'NO'}`);
  console.log(`[Reddit] Client Secret: ${process.env.REDDIT_CLIENT_SECRET ? 'YES' : 'NO'}`);
  console.log(`[Reddit] Username: ${process.env.REDDIT_USERNAME ? 'YES' : 'NO'}`);
  console.log(`[Reddit] Password: ${process.env.REDDIT_PASSWORD ? 'YES' : 'NO'}`);
  console.log(`[Reddit] User Agent: ${process.env.REDDIT_USER_AGENT ? 'YES' : 'NO'}`);

  // Check if credentials are provided
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET || 
      !process.env.REDDIT_USERNAME || !process.env.REDDIT_PASSWORD) {
    throw new Error("Missing Reddit API credentials in environment variables");
  }

  const authString = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.post("https://www.reddit.com/api/v1/access_token", null, {
      headers: {
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      params: {
        grant_type: "password",
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD,
      },
      timeout: 5000 // 5 second timeout
    });

    console.log("[Reddit] Token response status:", response.status);

    // Check if we got a successful response
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const { access_token, expires_in } = response.data;
    
    // Check if we got a valid token
    if (!access_token) {
      throw new Error("Failed to get access token from Reddit API");
    }
    
    tokenCache.access_token = access_token;
    tokenCache.expires_at = now + expires_in * 1000;
    return access_token;
  } catch (error) {
    console.error("[Reddit] Token Error:", error.message || error);
    console.error("[Reddit] Token Error Response:", error.response?.data);
    
    // If it's a 401 error, provide more specific guidance
    if (error.response && error.response.status === 401) {
      throw new Error("Reddit API authentication failed. Please check your credentials and make sure you have created a Reddit app with script permissions.");
    }
    
    throw new Error(`Failed to get Reddit access token: ${error.message}`);
  }
};

// Map country codes to common region-related subreddit names
const getRegionSubreddits = (region) => {
  const regionMap = {
    'US': ['American', 'USA', 'UnitedStates'],
    'GB': ['British', 'UK', 'UnitedKingdom'],
    'CA': ['Canadian', 'Canada'],
    'AU': ['Australian', 'Australia'],
    'DE': ['German', 'Germany'],
    'FR': ['French', 'France'],
    'IN': ['Indian', 'India'],
    'JP': ['Japanese', 'Japan'],
    'BR': ['Brazilian', 'Brazil'],
    'MX': ['Mexican', 'Mexico'],
    // Add more mappings as needed
  };
  
  return regionMap[region.toUpperCase()] || [];
};

exports.fetchRedditPosts = async (keyword, options = {}) => {
  try {
    console.log(`[Reddit] Fetching posts for: ${keyword} with options:`, options);
    
    // Default options
    const {
      limit = 10,
      sort = 'relevance',
      time = 'week',
      region = null
    } = options;
    
    // Create cache key
    const cacheKey = `reddit_${keyword}_${limit}_${sort}_${time}_${region || 'global'}`;
    
    // Try to get from cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`[Reddit] Returning cached data for: ${keyword}`);
      return cachedData;
    }

    const token = await getAccessToken();

    // Build search query
    let searchQuery = keyword;
    
    // If region is specified, try to include region-related terms
    if (region) {
      const regionTerms = getRegionSubreddits(region);
      if (regionTerms.length > 0) {
        // Add region terms to the search query
        searchQuery = `${keyword} (${regionTerms.map(term => `subreddit:${term.toLowerCase()} OR title:${term}`).join(' OR ')})`;
      }
    }

    const response = await axios.get(`https://oauth.reddit.com/search`, {
      headers: {
        Authorization: `bearer ${token}`,
        "User-Agent": process.env.REDDIT_USER_AGENT,
      },
      params: {
        q: searchQuery,
        limit: Math.min(Math.max(Number(limit) * 5, 25), 100),
        sort: sort,
        t: time,
        type: 'link',
      },
      timeout: 5000 // 5 second timeout
    });

    console.log(`[Reddit] Search response received with status: ${response.status}`);

    // Check if we got a successful response
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if we got blocked
    if (response.data && response.data.error === 403) {
      throw new Error("Access forbidden - check Reddit credentials and app permissions");
    }

    // Handle blocked by network security
    if (response.data && typeof response.data === 'string' && response.data.includes('blocked by network security')) {
      throw new Error("Blocked by network security - Reddit is blocking requests from this IP");
    }

    // Check if we got valid data
    if (!response.data || !response.data.data || !response.data.data.children) {
      console.log("[Reddit] Invalid response structure:", typeof response.data);
      return [];
    }

    const mapped = response.data.data.children.map(post => ({
      title: post.data.title,
      selftext: post.data.selftext,
      score: post.data.score,
      num_comments: post.data.num_comments,
      subreddit: post.data.subreddit,
      created_utc: post.data.created_utc,
      permalink: `https://reddit.com${post.data.permalink}`,
    }));

    const scored = mapped
      .map((post) => ({ post, relevanceScore: computeRelevanceScore(keyword, post) }))
      .filter((entry) => entry.relevanceScore >= 8)
      .sort((a, b) => b.relevanceScore - a.relevanceScore || (b.post.score || 0) - (a.post.score || 0));

    // Deduplicate by title (handles cross-posts across different subreddits).
    const deduped = [];
    const seenTitles = new Set();
    for (const entry of scored) {
      const titleKey = String(entry.post.title || '').toLowerCase().trim();
      if (!titleKey || seenTitles.has(titleKey)) continue;
      seenTitles.add(titleKey);
      deduped.push(entry.post);
      if (deduped.length >= Number(limit)) break;
    }

    const result = deduped;
    
    // Cache the result for 2 minutes
    cache.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
  } catch (error) {
    console.error("[Reddit] OAuth API Error:", error.message || error);
    console.error("[Reddit] Error Response:", error.response?.data);
    
    // Return empty array instead of throwing error
    return [];
  }
};