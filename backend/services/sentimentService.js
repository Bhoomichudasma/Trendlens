const Sentiment = require('sentiment');
const SentimentLog = require('../models/SentimentLog');

function dayStart(dateLike) {
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function normalizeSentiment(rawScore) {
  // Empirical clamp: Sentiment scores can be large; squash into roughly [-1, 1].
  // If your topic language differs, tune this.
  return clamp(rawScore / 10, -1, 1);
}

function computeNearestTimelineEvent({ timelineEvents, targetDate }) {
  if (!timelineEvents || timelineEvents.length === 0 || !targetDate) return null;
  const t = new Date(targetDate).getTime();
  let best = null;
  let bestAbs = Infinity;
  for (const ev of timelineEvents) {
    const ed = ev.date ? new Date(ev.date) : null;
    if (!ed) continue;
    const abs = Math.abs(ed.getTime() - t);
    if (abs < bestAbs) {
      bestAbs = abs;
      best = ev;
    }
  }
  return best;
}

async function buildSentimentSeries({ topicId, articles, timelineEvents }) {
  const sentiment = new Sentiment();

  // Score and bucket by day + source.
  const buckets = new Map(); // key: `${dayISO}|${source}`

  for (const a of articles || []) {
    const text = [a.title, a.content].filter(Boolean).join(' ').slice(0, 5000);
    if (!text.trim()) continue;
    const scoreResult = sentiment.analyze(text);
    const score = normalizeSentiment(scoreResult.score);

    const date = a.publishedAt ? dayStart(a.publishedAt) : dayStart(Date.now());
    const dateISO = date.toISOString();
    const source = a.source || 'unknown';

    const key = `${dateISO}|${source}`;
    const prev = buckets.get(key);
    if (!prev) {
      buckets.set(key, { date, source, sumScore: score, count: 1 });
    } else {
      prev.sumScore += score;
      prev.count += 1;
      buckets.set(key, prev);
    }
  }

  // Convert buckets to per-source series input.
  const logsToWrite = [];
  const overallDaily = new Map(); // dayISO -> {sumScore, count}

  for (const [, bucket] of buckets.entries()) {
    const avg = bucket.count > 0 ? bucket.sumScore / bucket.count : 0;
    logsToWrite.push({
      topicId,
      source: bucket.source,
      date: bucket.date,
      score: avg,
      sampleSize: bucket.count,
      shiftEventId: null, // fill later
    });

    const dayISO = bucket.date.toISOString();
    const overall = overallDaily.get(dayISO) || { sumScore: 0, count: 0 };
    overall.sumScore += avg * bucket.count;
    overall.count += bucket.count;
    overallDaily.set(dayISO, overall);
  }

  // Determine a "shift" moment by looking at the biggest daily delta overall.
  const sortedDays = [...overallDaily.entries()]
    .map(([dayISO, v]) => ({
      dayISO,
      date: new Date(dayISO),
      overallAvg: v.count > 0 ? v.sumScore / v.count : 0,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let shiftEventId = null;
  let shiftDate = null;

  if (sortedDays.length >= 3) {
    let bestDelta = 0;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = sortedDays[i - 1].overallAvg;
      const curr = sortedDays[i].overallAvg;
      const delta = curr - prev;
      const abs = Math.abs(delta);
      if (abs > bestDelta && abs >= 0.15) {
        bestDelta = abs;
        shiftDate = sortedDays[i].date;
      }
    }

    if (shiftDate) {
      const nearest = computeNearestTimelineEvent({ timelineEvents, targetDate: shiftDate });
      shiftEventId = nearest ? nearest.eventId : null;
    }
  }

  const shiftDayISO = shiftDate ? dayStart(shiftDate).toISOString() : null;

  // Upsert sentiment logs.
  // Also attach shiftEventId when the day matches.
  const writePromises = logsToWrite.map(async (l) => {
    const isShiftDay = shiftDayISO && dayStart(l.date).toISOString() === shiftDayISO;
    const shift = isShiftDay ? shiftEventId : null;

    await SentimentLog.updateOne(
      { topicId: l.topicId, source: l.source, date: l.date },
      { $set: { score: l.score, sampleSize: l.sampleSize, shiftEventId: shift } },
      { upsert: true }
    );
  });

  await Promise.all(writePromises);

  // Prepare API response payload.
  const sources = new Map(); // source -> points[]
  for (const l of logsToWrite) {
    if (!sources.has(l.source)) sources.set(l.source, []);
    sources.get(l.source).push({ date: l.date.toISOString().slice(0, 10), score: l.score });
  }
  for (const [, points] of sources.entries()) {
    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  const annotations = [];
  if (shiftEventId) {
    const ev = (timelineEvents || []).find((e) => e.eventId === shiftEventId);
    annotations.push({
      date: shiftDate ? dayStart(shiftDate).toISOString().slice(0, 10) : null,
      label: ev ? `Sentiment shifted after ${ev.title}` : 'Sentiment shifted',
      eventId: shiftEventId,
    });
  }

  return {
    shiftEventId,
    annotations,
    seriesBySource: [...sources.entries()].map(([source, points]) => ({ source, points })),
  };
}

module.exports = { buildSentimentSeries };

