const axios = require('axios');
const cache = require('../utils/cache');

const WIKI_API = 'https://en.wikipedia.org/w/api.php';

const MONTHS = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractDateFromSentence(sentence) {
  const str = String(sentence || '');

  // Pattern 1: Full date with comma — "January 15, 2023" or "january 15,2023"
  const fullDate = str.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})\b/i);
  if (fullDate) {
    const month = MONTHS[fullDate[1].toLowerCase()] || '01';
    const day = String(fullDate[2]).padStart(2, '0');
    const year = fullDate[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern 2: Month and Year — "January 2023" or "jan. 2023"
  const monthYear = str.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()] || '01';
    return `${monthYear[2]}-${month}-15`; // Use day 15 as mid-month estimate
  }

  // Pattern 3: Month and Day without year — "October 7" or "october 7" 
  // Try to infer year from surrounding context (very recent = 2023-2026 range)
  const monthDay = str.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\b/i);
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()] || '01';
    const day = String(monthDay[2]).padStart(2, '0');
    // Check if there's a 4-digit year anywhere in the sentence
    const yearMatch = str.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : '2023'; // Default to 2023 if no year found (for recent events)
    return `${year}-${month}-${day}`;
  }

  // Pattern 4: Just year — "2023" or "1948"
  const year = str.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  if (year) {
    // Use mid-year date as placeholder
    return `${year[1]}-06-15`;
  }

  return null;
}


async function searchWikipediaTitle(keyword) {
  const response = await axios.get(WIKI_API, {
    params: {
      action: 'query',
      list: 'search',
      srsearch: keyword,
      srlimit: 1,
      format: 'json',
      origin: '*',
    },
    headers: {
      'User-Agent': 'TrendLensAI/1.0 (https://trendlens.ai; contact@trendlens.ai)',
    },
    timeout: 10000,
  });

  const hit = response.data?.query?.search?.[0];
  return hit?.title || null;
}

async function fetchWikipediaExtractByTitle(title) {
  const response = await axios.get(WIKI_API, {
    params: {
      action: 'query',
      prop: 'extracts|info',
      exintro: false,
      explaintext: false,
      inprop: 'url',
      redirects: 1,
      titles: title,
      format: 'json',
      origin: '*',
    },
    headers: {
      'User-Agent': 'TrendLensAI/1.0 (https://trendlens.ai; contact@trendlens.ai)',
    },
    timeout: 10000,
  });

  const pages = response.data?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing) return null;

  return {
    title: page.title,
    fullurl: page.fullurl,
    extractHtml: page.extract || '',
  };
}

exports.fetchWikipediaContext = async (keyword, options = {}) => {
  const { maxSnippets = 18 } = options;
  const cacheKey = `wiki_${String(keyword).trim().toLowerCase()}_${maxSnippets}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const title = await searchWikipediaTitle(keyword);
    if (!title) return [];

    const page = await fetchWikipediaExtractByTitle(title);
    if (!page) return [];

    const plain = stripHtml(page.extractHtml);
    const sentences = splitSentences(plain).slice(0, 300);

    const snippets = [];
    for (const sentence of sentences) {
      const date = extractDateFromSentence(sentence);
      if (!date) continue;
      if (sentence.length < 40) continue;
      snippets.push({
        title: page.title,
        description: sentence,
        content: sentence,
        source: { name: 'Wikipedia' },
        publishedAt: date,
        url: page.fullurl,
        author: 'Wikipedia contributors',
      });
      if (snippets.length >= maxSnippets) break;
    }

    // If no date-bearing snippets were found, still provide a few context sentences.
    if (snippets.length === 0) {
      const fallback = splitSentences(plain)
        .filter((s) => s.length >= 60)
        .slice(0, Math.min(maxSnippets, 8))
        .map((s) => ({
          title: page.title,
          description: s,
          content: s,
          source: { name: 'Wikipedia' },
          publishedAt: null,
          url: page.fullurl,
          author: 'Wikipedia contributors',
        }));
      cache.set(cacheKey, fallback, 10 * 60 * 1000);
      return fallback;
    }

    cache.set(cacheKey, snippets, 10 * 60 * 1000);
    return snippets;
  } catch (error) {
    console.error('[Wikipedia] Error:', error.message || error);
    return [];
  }
};
