// services/newsService.js
const axios = require('axios');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;

exports.fetchNewsArticles = async (keyword) => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: keyword,
        apiKey: NEWS_API_KEY,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 5,
      },
    });

    // Format only needed fields
    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      source: { name: article.source.name },
      publishedAt: article.publishedAt,
      url: article.url
    }));
  } catch (error) {
    console.error('News API Error:', error.message || error);
    throw new Error('Failed to fetch news articles');
  }
};
