const StoryDNA = require('../models/StoryDNA');
const TimelineEvent = require('../models/TimelineEvent');
const { STORY_DNA_SYSTEM_PROMPT, STORY_DNA_USER_PROMPT } = require('../utils/promptTemplates');
const { generateStructuredJson } = require('./aiService');

const MAX_NEWS_ARTICLES = 12;
const MAX_REDDIT_POSTS = 10;
const MAX_TIMELINE_EVENTS = 8;

function truncateText(text, maxChars) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars) + '…';
}

function toEvidenceNews(articles) {
  const mapped = (articles || []).map((a, idx) => ({
      id: `e_news_${idx + 1}`,
      title: a.title,
      descriptionOrContent: truncateText(a.content || a.description || '', 300),
      source: a.source,
      publishedAt: a.publishedAt,
      url: a.url,
    }));

  if (mapped.length <= MAX_NEWS_ARTICLES) return mapped;

  const dated = mapped
    .filter((e) => normalizeDateToISO(e.publishedAt))
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  const undated = mapped.filter((e) => !normalizeDateToISO(e.publishedAt));
  const selected = [];

  if (dated.length > 0) {
    const target = Math.min(MAX_NEWS_ARTICLES, dated.length);
    for (let i = 0; i < target; i++) {
      const idx = target === 1 ? 0 : Math.round((i * (dated.length - 1)) / (target - 1));
      selected.push(dated[idx]);
    }
  }

  for (const item of undated) {
    if (selected.length >= MAX_NEWS_ARTICLES) break;
    selected.push(item);
  }

  const seen = new Set();
  return selected.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, MAX_NEWS_ARTICLES);
}

function toEvidenceReddit(posts) {
  return (posts || [])
    .slice(0, MAX_REDDIT_POSTS)
    .map((p, idx) => ({
      id: `e_reddit_${idx + 1}`,
      title: p.title,
      selftext: truncateText(p.content || p.selftext || '', 400),
      subreddit: p.source,
      createdAt: p.publishedAt || p.created_utc,
      permalink: p.url,
      score: p.score,
      numComments: p.num_comments,
    }));
}

// Convert YYYYMMDD string to Unix timestamp in seconds
function dateStringToUnixTimestamp(dateStr) {
  if (!dateStr) return null;
  // SerpAPI returns dates as YYYYMMDD strings
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  
  if (!year || !month || !day) return null;
  
  const date = new Date(year, month - 1, day);
  return Math.floor(date.getTime() / 1000);
}

function toEvidenceGoogleTrends(googleTrends) {
  const timeline = googleTrends?.timeline_data || [];
  const trimmed = timeline.slice(0, 60).map((t) => ({
    date: dateStringToUnixTimestamp(t.date) || t.time || null,
    interest: t.value ?? null,
    hasData: Array.isArray(t.hasData) ? t.hasData[0] : true,
  }));

  const interestByRegion = googleTrends?.interest_by_region || [];
  const mappedRegions = interestByRegion.slice(0, 10).map((r) => ({
    name: r.geo_name || r.name || 'Unknown',
    value: r.value ?? null,
  }));

  return {
    timeline_data: trimmed,
    interest_by_region: mappedRegions,
  };
}

function normalizeDateToISO(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function buildEvidenceLookup(newsEvidence, redditEvidence) {
  const map = new Map();
  for (const item of [...(newsEvidence || []), ...(redditEvidence || [])]) {
    map.set(item.id, item);
  }
  return map;
}

function ensureBecausePrefix(text) {
  const str = String(text || '').trim();
  if (!str) return 'This happened because evidence indicates it followed prior developments.';
  if (/^this happened because/i.test(str)) return str;
  return `This happened because ${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}

function sanitizeTimelineEvents(rawTimeline, evidenceById) {
  if (!Array.isArray(rawTimeline)) return [];
  const out = [];

  for (let i = 0; i < rawTimeline.length; i++) {
    const ev = rawTimeline[i] || {};
    const sourceIds = Array.isArray(ev.sourceIds)
      ? ev.sourceIds.filter((id) => evidenceById.has(id))
      : [];

    if (sourceIds.length === 0) continue;

    const dateISO = normalizeDateToISO(ev.date);
    const title = String(ev.title || '').trim();
    const whatHappened = String(ev.whatHappened || '').trim();
    if (!title || !whatHappened) continue;

    out.push({
      eventId: String(ev.eventId || `t${out.length + 1}`),
      date: dateISO ? new Date(dateISO) : null,
      rawDate: dateISO || '',
      title,
      whatHappened,
      whyItMatters: String(ev.whyItMatters || '').trim(),
      aiExplanation: ensureBecausePrefix(ev.aiExplanation),
      sourceIds,
      order: out.length,
    });

    if (out.length >= MAX_TIMELINE_EVENTS) break;
  }

  return out;
}

function buildExtractiveTimelineFallback(evidenceById) {
  const evidenceItems = [...evidenceById.values()]
    .map((e) => {
      const date = normalizeDateToISO(e.publishedAt || e.createdAt || null);
      return {
        ...e,
        _date: date,
      };
    })
    .filter((e) => e._date)
    .sort((a, b) => new Date(a._date).getTime() - new Date(b._date).getTime());

  if (evidenceItems.length === 0) return [];

  const unique = [];
  const seen = new Set();
  for (const item of evidenceItems) {
    const key = `${item._date}|${String(item.title || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const count = Math.min(MAX_TIMELINE_EVENTS, unique.length);
  const selected = [];
  if (count === 1) {
    selected.push(unique[0]);
  } else {
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i * (unique.length - 1)) / (count - 1));
      selected.push(unique[idx]);
    }
  }

  return selected.map((item, idx) => ({
    eventId: `t${idx + 1}`,
    date: new Date(item._date),
    rawDate: item._date,
    title: String(item.title || 'Reported development').slice(0, 180),
    whatHappened: String(item.descriptionOrContent || item.selftext || item.title || '').slice(0, 320),
    whyItMatters: `This event is part of the observed progression in ${item.source || 'reported sources'}.`,
    aiExplanation: 'This happened because reporting indicates the situation continued to evolve over time.',
    sourceIds: [item.id],
    order: idx,
  }));
}

function isWeakTrigger(text) {
  const t = String(text || '').toLowerCase();
  return !t || /unclear|unknown|not clear|insufficient evidence/.test(t);
}

function deriveTriggerFromTimeline(timeline, evidenceById) {
  const first = (timeline || []).find((ev) => Array.isArray(ev.sourceIds) && ev.sourceIds.length > 0);
  if (!first) return 'Insufficient evidence in provided sources.';
  const source = evidenceById.get(first.sourceIds[0]);
  const dateText = first.rawDate || normalizeDateToISO(source?.publishedAt || source?.createdAt);
  const title = first.title || source?.title || 'documented event';
  if (!dateText) return `${title}.`;
  return `${dateText}: ${title}.`;
}

function normalizeAIParsedStoryDNA(aiJson) {
  const background = aiJson?.background?.text || '';
  const trigger = aiJson?.trigger?.text || '';
  const escalation = aiJson?.escalation?.text || '';
  const current = aiJson?.current?.text || '';
  const timelineSummary = aiJson?.timelineSummary?.text || '';

  const eli5 = aiJson?.eli5 || {};

  const timeline = Array.isArray(aiJson?.timeline) ? aiJson.timeline : [];
  const timelineTrimmed = timeline.slice(0, MAX_TIMELINE_EVENTS);

  const escalationChain = aiJson?.escalationChain || { edges: [] };

  const sourcesComparison = aiJson?.sourcesComparison || { comparison: [] };
  const relatedTopics = Array.isArray(aiJson?.relatedTopics) ? aiJson.relatedTopics : [];

  const redditPulse = aiJson?.redditPulse || { summary: '', currentRedditBeliefs: [] };

  return {
    background,
    trigger,
    escalation,
    current,
    timelineSummary,
    eli5: {
      background: eli5?.background || '',
      trigger: eli5?.trigger || '',
      escalation: eli5?.escalation || '',
      current: eli5?.current || '',
      timelineSummary: eli5?.timelineSummary || '',
    },
    redditPulse: {
      summary: redditPulse?.summary || '',
      currentRedditBeliefs: Array.isArray(redditPulse?.currentRedditBeliefs)
        ? redditPulse.currentRedditBeliefs.slice(0, 5)
        : [],
    },
    escalationChain: {
      edges: Array.isArray(escalationChain?.edges) ? escalationChain.edges : [],
    },
    sourcesComparison,
    relatedTopics,
    timeline: timelineTrimmed.map((ev, idx) => ({
      eventId: ev.eventId || `t${idx + 1}`,
      date: ev.date ? new Date(ev.date) : null,
      rawDate: ev.date || '',
      title: ev.title || '',
      whatHappened: ev.whatHappened || '',
      whyItMatters: ev.whyItMatters || '',
      aiExplanation: ev.aiExplanation || '',
      sourceIds: Array.isArray(ev.sourceIds) ? ev.sourceIds : [],
      order: idx,
    })),
  };
}

async function buildStoryDNA({ topicId, keyword, newsArticles, redditPosts, googleTrends }) {
  const newsEvidence = toEvidenceNews(newsArticles);
  const redditEvidence = toEvidenceReddit(redditPosts);
  const trendsEvidence = toEvidenceGoogleTrends(googleTrends);
  const evidenceById = buildEvidenceLookup(newsEvidence, redditEvidence);

  console.log(`[StoryDNA] Topic: "${keyword}" | News articles (incl. wiki): ${newsEvidence.length} | Reddit: ${redditEvidence.length} | Google Trends: ${trendsEvidence.timeline?.length || 0} points`);
  
  // Log wiki articles separately
  const wikiCount = newsEvidence.filter(e => String(e.source || '').includes('Wiki')).length;
  if (wikiCount > 0) {
    console.log(`[StoryDNA] Wikipedia snippets included: ${wikiCount}`);
    const wikiDates = newsEvidence
      .filter(e => String(e.source || '').includes('Wiki'))
      .map(e => e.publishedAt)
      .filter(Boolean);
    if (wikiDates.length > 0) {
      console.log(`[StoryDNA] Wiki date range: ${Math.min(...wikiDates.map(d => new Date(d).getFullYear()))} - ${Math.max(...wikiDates.map(d => new Date(d).getFullYear()))}`);
    }
  }

  const userPrompt = STORY_DNA_USER_PROMPT
    .replace('{{TOPIC}}', keyword)
    .replace('{{NEWS_ARTICLES_JSON}}', JSON.stringify(newsEvidence))
    .replace('{{REDDIT_POSTS_JSON}}', JSON.stringify(redditEvidence))
    .replace('{{GOOGLE_TRENDS_JSON}}', JSON.stringify(trendsEvidence));

  console.log(`[StoryDNA] Prompt sizes: System=${STORY_DNA_SYSTEM_PROMPT.length} | User=${userPrompt.length} | Total=${STORY_DNA_SYSTEM_PROMPT.length + userPrompt.length}`);

  // Log evidence sample for debugging
  if (newsEvidence.length > 0) {
    const wikiSample = newsEvidence.find(e => String(e.source || '').includes('Wiki'));
    if (wikiSample) {
      console.log(`[StoryDNA] Wiki evidence example: ID=${wikiSample.id}, Date=${wikiSample.publishedAt}, Title=${wikiSample.title}`);
    }
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  let aiJson;
  try {
    aiJson = await generateStructuredJson({
      model,
      systemPrompt: STORY_DNA_SYSTEM_PROMPT,
      userPrompt,
    });
  } catch (groqErr) {
    console.error(`[StoryDNA] Groq failed: ${groqErr.message}. Using extractive fallback.`);
    
    // Separate Wikipedia from recent news
    const recentOnlyNews = newsEvidence.filter(a => {
      // Exclude Wikipedia (assumes Wiki has title from Wikipedia API)
      if (String(a.source || '').includes('Wiki')) return false;
      // Keep articles from last 60 days
      const d = new Date(a.publishedAt);
      const now = new Date('2026-03-25');
      return (now - d) < 60 * 24 * 60 * 60 * 1000;
    });
    
    // Build extractive timeline for background/escalation
    const extractiveTimeline = buildExtractiveTimelineFallback(evidenceById);
    
    const extractiveBkgnd = extractiveTimeline.length > 3
      ? extractiveTimeline.slice(0, 5).map((e, i) => `${i+1}. [${e.rawDate}] ${e.title}`).join(' ')
      : extractiveTimeline.length > 0
        ? `Timeline events: ${extractiveTimeline.map(e => `${e.rawDate} - ${e.title}`).join('; ')}`
        : 'Evidence timeline compiled from available sources';
    
    // Trigger: most specific recent event
    const extractiveTrigger = recentOnlyNews.length > 0
      ? `[${recentOnlyNews[0]?.publishedAt?.toISOString()?.split('T')[0] || 'Recent'}] ${recentOnlyNews[0]?.title || 'Event reported'}`
      : extractiveTimeline.length > 0
        ? `[${extractiveTimeline[0]?.rawDate || 'Date'}] ${extractiveTimeline[0]?.title || 'Key event'}`
        : '[2026-03-25] Event details from evidence';
    
    // Current: most recent news
    const extractiveCurrent = recentOnlyNews.length > 0
      ? recentOnlyNews.slice(0, 3).map(a => `- ${a.title}`).join(' ')
      : extractiveTimeline.length > 0
        ? `As of March 2026: ${extractiveTimeline[extractiveTimeline.length - 1]?.title || 'Situation ongoing'}`
        : 'Current status: Available sources provide limited details';
    
    // Escalation: formatted timeline steps
    const extractiveEscalation = extractiveTimeline.length > 0
      ? extractiveTimeline.map((e, i) => `Step ${i+1} — [${e.rawDate}] ${e.title}. Impact: ${e.whyItMatters || 'Key development'}`).join('\n')
      : 'Escalation pattern from available evidence';
    
    // Timeline summary
    const timelineSummary = extractiveTimeline.length > 2
      ? extractiveTimeline.slice(-3).reverse().map(e => e.title).join('. ') + '.'
      : extractiveTimeline.map(e => e.title).join('. ') || 'Timeline from evidence';
    
    // Reddit pulse from actual Reddit evidence
    const redditSummary = redditEvidence.length > 0
      ? `${redditEvidence.length} Reddit discussions: ${redditEvidence.slice(0, 2).map(r => r.title).join('; ')}`
      : 'Limited Reddit discussion data available';
    
    aiJson = {
      background: { text: extractiveBkgnd },
      trigger: { text: extractiveTrigger },
      escalation: { text: extractiveEscalation },
      current: { text: extractiveCurrent },
      timelineSummary: { text: timelineSummary },
      timeline: extractiveTimeline.map((et, idx) => ({
        eventId: et.eventId || `t${idx+1}`,
        date: et.date,
        title: et.title,
        whatHappened: et.whatHappened,
        whyItMatters: et.whyItMatters,
        aiExplanation: et.aiExplanation,
        sourceIds: et.sourceIds,
      })),
      eli5: { 
        background: extractiveBkgnd,
        trigger: extractiveTrigger,
        escalation: 'See numbered steps above',
        current: extractiveCurrent,
        timelineSummary: timelineSummary
      },
      redditPulse: { 
        summary: redditSummary,
        currentRedditBeliefs: redditEvidence.slice(0, 5).map(r => r.title) 
      },
      escalationChain: { edges: [] },
      sourcesComparison: { comparison: [] },
      relatedTopics: [],
    };
  }

  const normalized = normalizeAIParsedStoryDNA(aiJson);
  let validatedTimeline = sanitizeTimelineEvents(normalized.timeline, evidenceById);
  if (validatedTimeline.length < 3) {
    validatedTimeline = buildExtractiveTimelineFallback(evidenceById);
  }

  const finalTrigger = isWeakTrigger(normalized.trigger)
    ? deriveTriggerFromTimeline(validatedTimeline, evidenceById)
    : normalized.trigger;

  // Upsert StoryDNA document per topic.
  const storyDna = await StoryDNA.findOneAndUpdate(
    { topicId },
    {
      background: normalized.background,
      trigger: finalTrigger,
      escalation: normalized.escalation,
      current: normalized.current,
      timelineSummary: normalized.timelineSummary,
      eli5: normalized.eli5,
      redditPulse: normalized.redditPulse,
      escalationChain: normalized.escalationChain,
      sourcesComparison: normalized.sourcesComparison,
      relatedTopics: normalized.relatedTopics,
    },
    { upsert: true, new: true }
  );

  // Replace timeline events for this topic.
  const existing = await TimelineEvent.find({ topicId });
  if (existing.length > 0) {
    await TimelineEvent.deleteMany({ topicId });
  }

  const timelineDocs = validatedTimeline.map((ev) => ({
    topicId,
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

  if (timelineDocs.length > 0) {
    await TimelineEvent.insertMany(timelineDocs);
  }

  return { storyDna, timelineEvents: validatedTimeline };
}

module.exports = { buildStoryDNA };

