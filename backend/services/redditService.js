const axios = require("axios");
require("dotenv").config();

let tokenCache = {
  access_token: null,
  expires_at: null
};

// Fetch OAuth token using "password" grant type
const getAccessToken = async () => {
  const now = Date.now();

  if (tokenCache.access_token && tokenCache.expires_at > now) {
    return tokenCache.access_token;
  }

  const authString = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");

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
  });

  const { access_token, expires_in } = response.data;
  tokenCache.access_token = access_token;
  tokenCache.expires_at = now + expires_in * 1000;
  return access_token;
};

// Main fetch function
exports.fetchRedditPosts = async (keyword) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get(`https://oauth.reddit.com/search`, {
      headers: {
        Authorization: `bearer ${token}`,
        "User-Agent": process.env.REDDIT_USER_AGENT,
      },
      params: {
        q: keyword,
        limit: 5,
        sort: "relevance",
        t: "week",
      },
    });

    return response.data.data.children.map(post => ({
      title: post.data.title,
      selftext: post.data.selftext,
      score: post.data.score,
      num_comments: post.data.num_comments,
      subreddit: post.data.subreddit,
      created_utc: post.data.created_utc,
      permalink: `https://reddit.com${post.data.permalink}`,
    }));
  } catch (error) {
    console.error("Reddit OAuth API Error:", error.message || error);
    throw new Error("Failed to fetch Reddit posts");
  }
};
