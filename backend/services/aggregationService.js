

const Topic = require('../models/Topic');
const Article = require('../models/Article');
const StoryDNA = require('../models/StoryDNA');
const TimelineEvent = require('../models/TimelineEvent');
const { hashForArticle } = require('../utils/deduplicator');
const { fetchGoogleTrends } = require('./googleTrendsService');
const { fetchRedditPosts } = require('./redditService');
const { fetchLayeredNewsEvidence } = require('./newsService');
const { fetchWikipediaContext } = require('./wikipediaService');
const { buildStoryDNA } = require('./dnaService');
const { buildSentimentSeries } = require('./sentimentService');
const SearchLog = require('../models/SearchLog');

const STORYDNA_TTL_MS = 30 * 60 * 1000;

function dateStringToUnixTimestamp(dateStr) {
  if (!dateStr) return null;
  const digits = String(dateStr).replace(/[^0-9]/g, '');
  if (digits.length >= 8) {
    const year = parseInt(digits.substring(0, 4), 10);
    const month = parseInt(digits.substring(4, 6), 10);
    const day = parseInt(digits.substring(6, 8), 10);
    if (year && month && day) {
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(date.getTime())) return Math.floor(date.getTime() / 1000);
    }
  }
  const parsed = Date.parse(String(dateStr));
  if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  return null;
}

function extractTrendValue(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first === 'number') return first;
    if (first && typeof first === 'object') {
      if (typeof first.extracted_value === 'number') return first.extracted_value;
      if (typeof first.value === 'number') return first.value;
      if (typeof first.value === 'string') {
        const n = Number(first.value);
        if (Number.isFinite(n)) return n;
      }
      if (Array.isArray(first.value) && typeof first.value[0] === 'number') return first.value[0];
      const nested = extractTrendValue(first.value ?? first.extracted_value);
      if (nested) return nested;
    }
    return Number(first) || 0;
  }
  if (raw && typeof raw === 'object') {
    if (typeof raw.extracted_value === 'number') return raw.extracted_value;
    if ('value' in raw) return extractTrendValue(raw.value);
    if ('values' in raw) return extractTrendValue(raw.values);
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function extractTrendTimestamp(entry) {
  if (!entry) return null;
  if (typeof entry.time === 'number' && entry.time > 0) return entry.time;
  if (typeof entry.time === 'string') {
    const asNumber = Number(entry.time);
    if (!Number.isNaN(asNumber) && asNumber > 0) return asNumber;
  }
  if (entry.formattedAxisTime) {
    const parsed = Date.parse(entry.formattedAxisTime);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  }
  if (entry.formattedTime) {
    const firstPart = String(entry.formattedTime).split('–')[0].trim();
    const parsed = Date.parse(firstPart);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
  }
  const fromDate = dateStringToUnixTimestamp(entry.date);
  if (fromDate) return fromDate;
  return null;
}

// function transformGoogleTrendsForFrontend(googleTrends) {
//   if (!googleTrends) return { timeline_data: [], interest_by_region: [], geoContext: 'global' };

//   const timeline = googleTrends?.timeline_data || [];
//   const baseNowSec = Math.floor(Date.now() / 1000);
//   const trimmed = timeline.slice(0, 60);

//   const transformed = trimmed.map((t, idx, arr) => {
//     // Resolve value — SerpAPI wraps it in arrays of objects
//     const rawValue =
//       t.value ??
//       (Array.isArray(t.values) ? t.values : undefined) ??
//       t.interest;
//     const value = extractTrendValue(rawValue);

//     const parsedTs = extractTrendTimestamp(t);
//     const generatedTs = parsedTs || (baseNowSec - (arr.length - 1 - idx) * 24 * 60 * 60);

//     return {
//       date: generatedTs,
//       rawDate: parsedTs,
//       label: t.formattedAxisTime || t.formattedTime || null,
//       interest: value,
//       value,
//       hasData: Array.isArray(t.hasData) ? Boolean(t.hasData[0]) : t.hasData !== false,
//       formattedTime: t.formattedTime || t.formattedAxisTime || null,
//     };
//   });

//   const interestByRegion = googleTrends?.interest_by_region || [];
//   const mappedRegions = interestByRegion.slice(0, 10).map((r) => ({
//     name: r.geo_name || r.name || r.geo || 'Unknown',
//     code: r.geo || r.geo_code || r.country || r.name || r.geo_name || '',
//     value: extractTrendValue(r.value),
//   }));

//   return {
//     timeline_data: transformed,
//     interest_by_region: mappedRegions,
//     // Let frontend know whether the map shows countries or sub-regions
//     geoContext: googleTrends.geoContext || 'global',
//   };
// }

function transformGoogleTrendsForFrontend(googleTrends) {
  if (!googleTrends) return { timeline_data: [], interest_by_region: [], geoContext: 'global' };

  const timeline = googleTrends?.timeline_data || [];
  const trimmed = timeline.slice(0, 60);

  const transformed = trimmed
    .map((t) => {
      const rawValue = t.value ?? (Array.isArray(t.values) ? t.values : undefined) ?? t.interest;
      const value = extractTrendValue(rawValue);
      const parsedTs = extractTrendTimestamp(t);
      const label = t.formattedAxisTime || t.formattedTime || null;

      // Drop entries with no timestamp AND no label — they have nothing to show on x-axis
      if (!parsedTs && !label) return null;

      return {
        date: parsedTs,       // real timestamp only, no synthetic fallback
        rawDate: parsedTs,
        label,
        interest: value,
        value,
        hasData: Array.isArray(t.hasData) ? Boolean(t.hasData[0]) : t.hasData !== false,
        formattedTime: t.formattedTime || t.formattedAxisTime || null,
      };
    })
    .filter(Boolean);

  const interestByRegion = googleTrends?.interest_by_region || [];
  const mappedRegions = interestByRegion.slice(0, 10).map((r) => ({
    name: r.geo_name || r.name || r.geo || 'Unknown',
    code: r.geo || r.geo_code || r.country || r.name || r.geo_name || '',
    value: extractTrendValue(r.value),
  }));

  return {
    timeline_data: transformed,
    interest_by_region: mappedRegions,
    geoContext: googleTrends.geoContext || 'global',
  };
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickCategoryHeuristic(keyword) {
  const k = String(keyword).toLowerCase();
  if (/(election|elected|parliament|senate|president|war|conflict|gaza|ukraine|russia|israel|sanction|europe)/.test(k)) return 'politics';
  if (/(collapse|acquisition|bank|earnings|ceo|funding|merger|lawsuit|lawsuits|bankrupt|default)/.test(k)) return 'business';
  if (/(openai|ai|model|release|launch|software|chip|semiconductor|twitter|musk|sam altman|product)/.test(k)) return 'tech';
  if (/(world cup|football|cricket|nba|league|player|injury|coach|tournament|match|fifa|olympics)/.test(k)) return 'sports';
  if (/(covid|vaccine|climate|molecule|space|astronomy|nasa|study|research|particle)/.test(k)) return 'science';
  if (/(movie|series|actor|actress|streaming|music|album|celebrity|hollywood)/.test(k)) return 'entertainment';
  return 'other';
}

async function upsertFetchedArticles({ topicId, items }) {
  const ops = items.map((item) => {
    const articleHash = hashForArticle(item);
    const doc = {
      topicId,
      origin: item.origin,
      articleHash,
      title: item.title || '',
      content: item.content || item.description || item.selftext || '',
      source: item.source || '',
      publishedAt: item.publishedAt || null,
      url: item.url || item.permalink || '',
      author: item.author || '',
      keywords: item.keywords || [],
      topic: item.topic || '',
      score: item.score ?? null,
      num_comments: item.num_comments ?? null,
    };
    return {
      updateOne: {
        filter: { topicId, articleHash },
        update: { $set: doc },
        upsert: true,
      },
    };
  });
  if (ops.length === 0) return;
  await Article.bulkWrite(ops, { ordered: false });
}

async function searchAndBuild({ keyword, filters = {}, logSearch = true, forceRefresh = false, userId = null }) {
  const normalizedKeyword = String(keyword || '').trim();
  if (!normalizedKeyword) throw new Error('Keyword is required.');

  const region = filters.region || null;

  // Slug is keyword-only (not region-scoped) because StoryDNA/timeline are
  // keyword-level concepts. Only the Google Trends cache is region-scoped.
  const slug = slugify(normalizedKeyword);
  const category = filters.category || pickCategoryHeuristic(normalizedKeyword);

  let topic = await Topic.findOne({ slug });
  if (!topic) {
    topic = await Topic.create({ keyword: normalizedKeyword, slug, category });
  }

  if (logSearch) {
    // Dedupe rapid repeats: skip if same user/keyword was logged in last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingRecent = await SearchLog.findOne({
      userId: userId || null,
      keyword: normalizedKeyword,
      createdAt: { $gte: twoMinutesAgo },
    }).lean();

    if (!existingRecent) {
      await SearchLog.create({
        topicId: topic._id,
        keyword: normalizedKeyword,
        userId: userId || null,
        category,
      });
      topic.searchCount = (topic.searchCount || 0) + 1;
      await topic.save();
    }
  }

  const now = Date.now();
  const dataFetchWarnings = [];

  const [
    googleTrendsResult,
    redditPostsRaw,
    newsArticlesRaw,
    wikipediaRaw,
  ] = await Promise.all([
    fetchGoogleTrends(normalizedKeyword, { region }).catch(err => {
      console.error('[Aggregation] Google Trends fetch failed:', err.message);
      dataFetchWarnings.push('Google Trends data unavailable');
      return { timeline_data: [], interest_by_region: [], geoContext: region || 'global' };
    }),
    fetchRedditPosts(normalizedKeyword, {
      limit: Number(filters.redditLimit ?? 10),
      sort: filters.redditSort ?? 'relevance',
      time: filters.redditTime ?? 'week',
      region,
    }).catch(err => {
      console.error('[Aggregation] Reddit fetch failed:', err.message);
      dataFetchWarnings.push('Reddit data unavailable');
      return [];
    }),
    fetchLayeredNewsEvidence(normalizedKeyword, {
      region,
      recentLimit: Number(filters.newsLimit ?? 12),
      post2020Limit: Math.max(Number(filters.newsLimit ?? 12), 18),
      recentWindow: filters.newsTime ?? 'month',
    }).catch(err => {
      console.error('[Aggregation] News fetch failed:', err.message);
      dataFetchWarnings.push('News data unavailable');
      return [];
    }),
    fetchWikipediaContext(normalizedKeyword, { maxSnippets: 18, region }).catch(err => {
      console.error('[Aggregation] Wikipedia fetch failed:', err.message);
      dataFetchWarnings.push('Wikipedia context unavailable');
      return [];
    }),
  ]);

  const googleTrends = googleTrendsResult || { timeline_data: [], interest_by_region: [], geoContext: region || 'global' };

  console.log(`[Aggregation] "${normalizedKeyword}" | News: ${newsArticlesRaw?.length || 0} | Reddit: ${redditPostsRaw?.length || 0} | Wikipedia: ${wikipediaRaw?.length || 0} | Trends timeline: ${googleTrends.timeline_data?.length || 0}`);
  if (dataFetchWarnings.length > 0) console.warn(`[Aggregation] Warnings:`, dataFetchWarnings);

  const newsArticles = (newsArticlesRaw || []).map((a) => ({
    origin: 'news',
    title: a.title,
    content: a.content || a.description || '',
    description: a.description,
    source: a.source?.name || a.source || '',
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
    url: a.url,
    author: a.author || '',
    keywords: [normalizedKeyword],
    topic: normalizedKeyword,
  }));

  const wikiArticles = (wikipediaRaw || []).map((a) => ({
    origin: 'wiki',
    title: a.title,
    content: a.content || a.description || '',
    description: a.description || '',
    source: a.source?.name || a.source || 'Wikipedia',
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
    url: a.url,
    author: a.author || 'Wikipedia contributors',
    keywords: [normalizedKeyword],
    topic: normalizedKeyword,
  }));

  const redditPosts = (redditPostsRaw || []).map((p) => ({
    origin: 'reddit',
    title: p.title,
    content: p.selftext || '',
    selftext: p.selftext,
    source: p.subreddit ? `r/${p.subreddit}` : (p.source || ''),
    publishedAt: p.created_utc ? new Date(p.created_utc * 1000) : null,
    permalink: p.permalink,
    url: p.permalink,
    score: p.score ?? null,
    num_comments: p.num_comments ?? null,
    keywords: [normalizedKeyword],
    topic: normalizedKeyword,
  }));

  await upsertFetchedArticles({
    topicId: topic._id,
    items: [...newsArticles, ...wikiArticles, ...redditPosts],
  });

  const storyDNA = await StoryDNA.findOne({ topicId: topic._id });
  const timelineEvents = await TimelineEvent.find({ topicId: topic._id }).sort({ order: 1 });
  const isFresh = !forceRefresh && storyDNA && topic.lastRefreshedAt && now - new Date(topic.lastRefreshedAt).getTime() < STORYDNA_TTL_MS;

  let dnaPayload;
  let timelinePayload;
  let sentimentPayload;

  if (!isFresh) {
    const built = await buildStoryDNA({
      topicId: topic._id,
      keyword: normalizedKeyword,
      newsArticles: [...newsArticles, ...wikiArticles],
      redditPosts,
      googleTrends,
    });

    dnaPayload = built.storyDna;
    timelinePayload = built.timelineEvents;

    const sentimentSeries = await buildSentimentSeries({
      topicId: topic._id,
      articles: [...newsArticles, ...wikiArticles, ...redditPosts],
      timelineEvents: built.storyDna ? timelinePayload.map((ev) => ({ ...ev, date: ev.date })) : [],
    });
    sentimentPayload = sentimentSeries;

    topic.lastRefreshedAt = new Date();
    await topic.save();
  } else {
    dnaPayload = storyDNA;
    timelinePayload = timelineEvents.map((ev) => ({
      eventId: ev.eventId,
      date: ev.date,
      rawDate: ev.rawDate,
      title: ev.title,
      whatHappened: ev.whatHappened,
      whyItMatters: ev.whyItMatters,
      aiExplanation: ev.aiExplanation,
      sourceIds: ev.sourceIds,
      order: ev.order,
    }));

    const SentimentLog = require('../models/SentimentLog');
    const logs = await SentimentLog.find({ topicId: topic._id }).sort({ date: 1 });
    const seriesBySource = new Map();
    for (const l of logs) {
      const dateISO = l.date.toISOString().slice(0, 10);
      if (!seriesBySource.has(l.source)) seriesBySource.set(l.source, []);
      seriesBySource.get(l.source).push({ date: dateISO, score: l.score });
    }
    const annotations = [];
    const uniqueShift = [...new Set(logs.filter((l) => l.shiftEventId).map((l) => l.shiftEventId))];
    if (uniqueShift.length > 0) {
      const shiftEventId = uniqueShift[0];
      const ev = timelinePayload.find((e) => e.eventId === shiftEventId);
      const shiftLog = logs.find((l) => l.shiftEventId === shiftEventId);
      annotations.push({
        date: shiftLog ? shiftLog.date.toISOString().slice(0, 10) : null,
        label: ev ? `Sentiment shifted after ${ev.title}` : 'Sentiment shifted',
        eventId: shiftEventId,
      });
    }
    sentimentPayload = {
      shiftEventId: uniqueShift[0] || null,
      annotations,
      seriesBySource: [...seriesBySource.entries()].map(([source, points]) => ({ source, points })),
    };
  }

  return {
    topic: {
      id: topic._id,
      keyword: topic.keyword,
      slug: topic.slug,
      category: topic.category,
      searchCount: topic.searchCount,
      lastRefreshedAt: topic.lastRefreshedAt,
    },
    dna: dnaPayload,
    timelineEvents: timelinePayload,
    sentiment: sentimentPayload,
    sourcesComparison: dnaPayload?.sourcesComparison || {},
    dataWarnings: dataFetchWarnings,
    dataAvailability: {
      hasNews: (newsArticlesRaw || []).length > 0,
      hasReddit: (redditPostsRaw || []).length > 0,
      hasWikipedia: (wikipediaRaw || []).length > 0,
      hasGoogleTrends: (googleTrends?.timeline_data || []).length > 0,
    },
    relatedTopics: dnaPayload?.relatedTopics || [],
    redditPosts: redditPostsRaw || [],
    googleTrends: transformGoogleTrendsForFrontend(googleTrends),
  };
}

module.exports = { searchAndBuild };