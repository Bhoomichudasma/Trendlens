// const PDFDocument = require('pdfkit');

// const formatTrendData = (data) => {
//   const {
//     googleTrends,
//     news,
//     reddit,
//     dna,
//     timelineEvents,
//     redditPosts,
//     sentiment,
//   } = data || {};

//   // Format Google Trends data (dashboard compatibility).
//   const trendsText = googleTrends?.timeline_data
//     ? googleTrends.timeline_data.map((trend) => {
//         const extracted = trend?.values?.[0]?.extracted_value;
//         return `• Date: ${trend.date}\n  Interest Score: ${extracted ?? 'N/A'}%`;
//       }).join('\n\n')
//     : 'No trend data available.';

//   const interestByRegionText = googleTrends?.interest_by_region
//     ? googleTrends.interest_by_region.map((region) => `• ${region.region}: ${region.value}%`).join('\n')
//     : '';

//   // Format News data (dashboard compatibility).
//   const newsText = Array.isArray(news) && news.length > 0
//     ? news.map((article) => {
//         const srcName = article?.source?.name || article?.source || 'Unknown';
//         const published = article?.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Unknown date';
//         return `• ${article.title}\n  Source: ${srcName}\n  Published: ${published}`;
//       }).join('\n\n')
//     : '';

//   // Format Reddit data (dashboard compatibility).
//   const redditText = Array.isArray(reddit) && reddit.length > 0
//     ? reddit.map((post) => {
//         const subreddit = post?.subreddit ? `r/${post.subreddit}` : post?.source ? `r/${post.source}` : 'Unknown';
//         return `• ${post.title}\n  Subreddit: ${subreddit}\n  Score: ${post.score?.toLocaleString?.() || 0} | Comments: ${post.num_comments?.toLocaleString?.() || 0}`;
//       }).join('\n\n')
//     : '';

//   const storyDNA = dna || data?.storyDNA || null;
//   const storyDNAText = storyDNA
//     ? `Background:\n${storyDNA.background || ''}\n\nTrigger:\n${storyDNA.trigger || ''}\n\nEscalation:\n${storyDNA.escalation || ''}\n\nCurrent:\n${storyDNA.current || ''}\n\nTimeline recap:\n${storyDNA.timelineSummary || ''}`
//     : '';

//   const timelineText = Array.isArray(timelineEvents) && timelineEvents.length > 0
//     ? timelineEvents
//         .slice(0, 12)
//         .map((ev) => {
//           const dateStr = ev?.date ? new Date(ev.date).toLocaleDateString() : ev?.rawDate || 'Date unknown';
//           return `• ${dateStr} — ${ev.title}\n  AI explanation: ${ev.aiExplanation || ''}\n  Why it matters: ${ev.whyItMatters || ''}`;
//         })
//         .join('\n\n')
//     : '';

//   const sentimentText = sentiment?.annotations?.[0]
//     ? `Sentiment note: ${sentiment.annotations[0].label}`
//     : '';

//   const redditPostsText = Array.isArray(redditPosts) && redditPosts.length > 0
//     ? redditPosts
//         .slice(0, 12)
//         .map((post) => {
//           const subreddit = post?.subreddit ? `r/${post.subreddit}` : post?.source ? `r/${post.source}` : 'Unknown';
//           return `• ${post.title}\n  Subreddit: ${subreddit}\n  Score: ${post.score?.toLocaleString?.() || 0} | Comments: ${post.num_comments?.toLocaleString?.() || 0}`;
//         })
//         .join('\n\n')
//     : '';

//   return {
//     trendsText,
//     newsText,
//     redditText,
//     interestByRegionText,
//     storyDNAText,
//     timelineText,
//     sentimentText,
//     redditPostsText,
//   };
// };

// const exportTrendToPDF = (data) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument();
      
//       // Collect PDF data as buffer
//       const chunks = [];
//       doc.on('data', chunk => chunks.push(chunk));
//       doc.on('end', () => resolve(Buffer.concat(chunks)));

//       // Add content to PDF
//       doc.fontSize(24).text('TrendLens Analysis Report', { align: 'center' });
//       doc.moveDown();
//       doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
//       doc.moveDown(2);

//       const {
//         trendsText,
//         newsText,
//         redditText,
//         interestByRegionText,
//         storyDNAText,
//         timelineText,
//         sentimentText,
//         redditPostsText,
//       } = formatTrendData(data);

//       // Google Trends Section
//       doc.fontSize(18).text('🔍 Google Trends Analysis', { underline: true });
//       doc.moveDown();
//       doc.fontSize(12).text('Current trending search terms and their relative interest scores:');
//       doc.moveDown();
//       doc.fontSize(12).text(trendsText || 'No trend data available.');
//       doc.moveDown();
//       if (interestByRegionText) {
//         doc.fontSize(12).text('Interest by Region:');
//         doc.moveDown();
//         doc.fontSize(12).text(interestByRegionText);
//         doc.moveDown(2);
//       }

//       // News Section
//       doc.fontSize(18).text('📰 News Coverage', { underline: true });
//       doc.moveDown();
//       doc.fontSize(12).text('Recent news articles related to the topic:');
//       doc.moveDown();
//       doc.fontSize(12).text(newsText || 'No news articles available.');
//       doc.moveDown(2);

//       // Reddit Section
//       doc.fontSize(18).text('💬 Reddit Discussions', { underline: true });
//       doc.moveDown();
//       doc.fontSize(12).text('Popular discussions from Reddit:');
//       doc.moveDown();
//       doc.fontSize(12).text(redditText || 'No Reddit discussions available.');

//       // Story DNA Section (AI).
//       if (storyDNAText) {
//         doc.moveDown(2);
//         doc.fontSize(18).text('🧠 Story DNA (AI Intelligence)', { underline: true });
//         doc.moveDown();
//         doc.fontSize(12).text(storyDNAText);
//       }

//       if (timelineText) {
//         doc.moveDown(2);
//         doc.fontSize(18).text('🗓️ Timeline Events', { underline: true });
//         doc.moveDown();
//         doc.fontSize(12).text(timelineText);
//       }

//       if (sentimentText) {
//         doc.moveDown(2);
//         doc.fontSize(18).text('📈 Sentiment Shift', { underline: true });
//         doc.moveDown();
//         doc.fontSize(12).text(sentimentText);
//       }

//       if (redditPostsText) {
//         doc.moveDown(2);
//         doc.fontSize(18).text('💬 Reddit Pulse Posts (Latest)', { underline: true });
//         doc.moveDown();
//         doc.fontSize(12).text(redditPostsText);
//       }

//       doc.end();
//     } catch (err) {
//       reject(err);
//     }
//   });
// };

// module.exports = {
//   exportTrendToPDF,
// };




const PDFDocument = require('pdfkit');

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const COLORS = {
  pageBg:       '#0B1220',
  cardBg:       '#0F172A',
  cardBorder:   '#1E293B',
  cyan:         '#38BDF8',
  white:        '#F8FAFC',
  muted:        '#94A3B8',
  dimmer:       '#475569',
  orange:       '#FB923C',
  red:          '#EF4444',
  green:        '#22C55E',
  blue:         '#3B82F6',
  purple:       '#A855F7',
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN  = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── HELPERS ──────────────────────────────────────────────────────
function safe(val, fallback = '') {
  if (!val) return fallback;
  return String(val)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[^\x00-\xFF]/g, '')
    .trim() || fallback;
}

function toneLabel(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  if (s >= 0.3) return 'Very Positive';
  if (s >= 0.05) return 'Slightly Positive';
  if (s <= -0.3) return 'Very Negative';
  if (s <= -0.05) return 'Slightly Negative';
  return 'Neutral';
}

function drawPageBackground(doc) {
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.pageBg);
}

function addNewPage(doc) {
  doc.addPage();
  drawPageBackground(doc);
}

function drawCard(doc, x, y, w, h, { leftAccent = null } = {}) {
  doc.roundedRect(x, y, w, h, 8)
     .fillColor(COLORS.cardBg)
     .fill();

  doc.roundedRect(x, y, w, h, 8)
     .strokeColor(COLORS.cardBorder)
     .lineWidth(0.5)
     .stroke();

  if (leftAccent) {
    doc.rect(x, y + 8, 3, h - 16)
       .fillColor(leftAccent)
       .fill();
  }
}

function drawSimpleHeader(doc, title) {
  doc.font('Helvetica-Bold')
     .fontSize(16)
     .fillColor(COLORS.white)
     .text(title, MARGIN, MARGIN - 10);

  doc.moveTo(MARGIN, MARGIN + 12)
     .lineTo(PAGE_W - MARGIN, MARGIN + 12)
     .strokeColor(COLORS.cardBorder)
     .lineWidth(0.5)
     .stroke();
}

function checkPageBreak(doc, y, needed = 80) {
  if (y + needed > PAGE_H - MARGIN) {
    addNewPage(doc);
    return MARGIN + 20;
  }
  return y;
}

// ─── STORY DNA ────────────────────────────────────────────────────
function drawStoryDNAPage(doc, storyDNA) {
  if (!storyDNA) return;

  let y = MARGIN + 30;

  const sections = [
    { key: 'background', label: 'Background', color: COLORS.blue },
    { key: 'trigger', label: 'Trigger', color: COLORS.orange },
    { key: 'escalation', label: 'Escalation', color: COLORS.red },
    { key: 'current', label: 'Current', color: COLORS.green },
  ];

  sections.forEach(sec => {
    const text = safe(storyDNA[sec.key], 'No data available');
    const h = doc.heightOfString(text, { width: CONTENT_W - 32 });

    y = checkPageBreak(doc, y, h + 60);

    drawCard(doc, MARGIN, y, CONTENT_W, h + 50, { leftAccent: sec.color });

    doc.font('Helvetica-Bold')
       .fontSize(11)
       .fillColor(sec.color)
       .text(sec.label.toUpperCase(), MARGIN + 16, y + 12);

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(COLORS.white)
       .text(text, MARGIN + 16, y + 30, { width: CONTENT_W - 32 });

    y += h + 60;
  });
}

// ─── TIMELINE ─────────────────────────────────────────────────────
function drawTimelinePage(doc, timeline) {
  if (!timeline || timeline.length === 0) return;

  addNewPage(doc);
  drawSimpleHeader(doc, 'Timeline');

  let y = MARGIN + 30;

  timeline.slice(0, 10).forEach(ev => {
    const title = safe(ev.title, 'Event');
    const desc = safe(ev.whatHappened || ev.description, '');
    const date = ev.date
      ? new Date(ev.date).toLocaleDateString()
      : 'Unknown';

    const h = doc.heightOfString(desc, { width: CONTENT_W - 32 });

    y = checkPageBreak(doc, y, h + 60);

    drawCard(doc, MARGIN, y, CONTENT_W, h + 50);

    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(COLORS.cyan)
       .text(date, MARGIN + 16, y + 12);

    doc.font('Helvetica-Bold')
       .fontSize(11)
       .fillColor(COLORS.white)
       .text(title, MARGIN + 16, y + 26);

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor(COLORS.muted)
       .text(desc, MARGIN + 16, y + 42, { width: CONTENT_W - 32 });

    y += h + 60;
  });
}

// ─── NEWS ─────────────────────────────────────────────────────────
function drawNewsPage(doc, news) {
  if (!news || news.length === 0) return;

  addNewPage(doc);
  drawSimpleHeader(doc, 'News');

  let y = MARGIN + 30;

    news.slice(0, 10).forEach((n, i) => {
     const title = safe(n.title);
     const src = safe(n.source?.name || n.source);
     const h = doc.heightOfString(title, { width: CONTENT_W - 32, lineGap: 2 });

     y = checkPageBreak(doc, y, h + 55);

     drawCard(doc, MARGIN, y, CONTENT_W, h + 45);

     doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(COLORS.white)
       .text(`${i + 1}. ${title}`, MARGIN + 16, y + 14, { width: CONTENT_W - 32 });

     doc.font('Helvetica')
       .fontSize(8)
       .fillColor(COLORS.muted)
       .text(src, MARGIN + 16, y + 14 + h + 6, { width: CONTENT_W - 32 });

     y += h + 55;
    });
}

// ─── GOOGLE TRENDS ───────────────────────────────────────────────
function drawTrendsPage(doc, trends) {
  const points = trends?.timeline_data || [];
  if (!points.length) return;

  addNewPage(doc);
  drawSimpleHeader(doc, 'Google Trends');

  const latest = points[points.length - 1];
  const peak = points.reduce((best, p) => (p.value > best.value ? p : best), { value: -Infinity });
  const recent = points.slice(-8);

  let y = MARGIN + 24;

  // Summary card
  drawCard(doc, MARGIN, y, CONTENT_W, 80, { leftAccent: COLORS.cyan });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.white)
    .text('Latest Interest', MARGIN + 16, y + 14);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.cyan)
    .text(safe(latest?.value ?? 'N/A'), MARGIN + 16, y + 32);
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
    .text(`Peak: ${safe(peak?.value ?? 'N/A')} on ${safe(peak?.formattedTime || peak?.date || 'N/A')}`, MARGIN + 140, y + 32);

  y += 100;

  // Sparkline chart
  if (points.length >= 2) {
    const chartH = 120;
    const chartW = CONTENT_W;
    y = checkPageBreak(doc, y, chartH + 30);

    drawCard(doc, MARGIN, y, chartW, chartH, { leftAccent: COLORS.cyan });

    const vals = points.map((p) => Number(p.value) || 0);
    const maxVal = Math.max(...vals, 1);
    const minVal = Math.min(...vals, 0);
    const range = Math.max(maxVal - minVal, 1);

    const padX = 20;
    const padY = 16;
    const innerW = chartW - padX * 2;
    const innerH = chartH - padY * 2;

    const toX = (i) => MARGIN + padX + (i / (points.length - 1)) * innerW;
    const toY = (v) => y + chartH - padY - ((v - minVal) / range) * innerH;

    doc.save();
    doc.moveTo(toX(0), toY(vals[0]));
    points.forEach((p, i) => {
      doc.lineTo(toX(i), toY(vals[i]));
    });
    doc.strokeColor(COLORS.cyan).lineWidth(1.5).stroke();
    doc.restore();

    // axes labels
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
      .text(safe(points[0].formattedTime || points[0].label || points[0].date || 'Start'), MARGIN + padX, y + chartH - padY + 4, { width: 120 });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
      .text(safe(points[points.length - 1].formattedTime || points[points.length - 1].label || points[points.length - 1].date || 'End'), MARGIN + chartW - padX - 120, y + chartH - padY + 4, { width: 120, align: 'right' });

    y += chartH + 20;
  }

  // Recent points list
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
    .text('Recent Points', MARGIN, y);
  y += 18;

  recent.forEach((p, idx) => {
    const label = safe(p.formattedTime || p.label || p.date || `Point ${idx + 1}`);
    const val = safe(p.value ?? 'N/A');
    const lineH = 18;
    y = checkPageBreak(doc, y, lineH + 16);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
      .text(`${label}`, MARGIN + 8, y);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.cyan)
      .text(val, PAGE_W - MARGIN - 40, y, { width: 40, align: 'right' });
    y += lineH;
  });
}

// ─── REDDIT ─────────────────────────────────────────────────────
function drawRedditPage(doc, { redditPulse = {}, redditPosts = [] } = {}) {
  const pulse = redditPulse && Object.keys(redditPulse).length ? redditPulse : null;
  const postsArr = redditPosts || [];
  if (!pulse && postsArr.length === 0) return;

  addNewPage(doc);
  drawSimpleHeader(doc, 'Reddit');

  let y = MARGIN + 24;

  if (pulse?.summary) {
    const text = safe(pulse.summary, 'No pulse summary');
    const beliefs = pulse.currentRedditBeliefs || [];
    const h = doc.heightOfString(text, { width: CONTENT_W - 32, lineGap: 2 });

    drawCard(doc, MARGIN, y, CONTENT_W, h + 50, { leftAccent: COLORS.purple });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.white)
      .text('Pulse Summary', MARGIN + 16, y + 12);
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
      .text(text, MARGIN + 16, y + 30, { width: CONTENT_W - 32 });

    y += h + 60;

    if (beliefs.length) {
      const beliefsText = beliefs.map((b) => `• ${safe(b)}`).join('\n');
      const h2 = doc.heightOfString(beliefsText, { width: CONTENT_W - 32, lineGap: 1 });
      y = checkPageBreak(doc, y, h2 + 44);
      drawCard(doc, MARGIN, y, CONTENT_W, h2 + 44, { leftAccent: COLORS.cyan });
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
        .text('Common Beliefs', MARGIN + 16, y + 12);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
        .text(beliefsText, MARGIN + 16, y + 30, { width: CONTENT_W - 32, lineGap: 1 });
      y += h2 + 54;
    }
  }

  const posts = (redditPosts || []).slice(0, 6);
  if (posts.length) {
    y = checkPageBreak(doc, y, 40);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white)
      .text('Top Reddit Posts', MARGIN, y);
    y += 18;

    posts.forEach((p, idx) => {
      const title = safe(p.title, 'Reddit post');
      const meta = `r/${safe(p.subreddit || p.source || 'unknown')} • ${p.score ?? 0} pts • ${p.num_comments ?? 0} comments`;
      const hTitle = doc.heightOfString(title, { width: CONTENT_W - 32, lineGap: 1 });
      const hMeta = doc.heightOfString(meta, { width: CONTENT_W - 32, lineGap: 1 });
      const needed = hTitle + hMeta + 52;
      y = checkPageBreak(doc, y, needed + 8);
      drawCard(doc, MARGIN, y, CONTENT_W, needed, { leftAccent: COLORS.red });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white)
        .text(`${idx + 1}. ${title}`, MARGIN + 16, y + 12, { width: CONTENT_W - 32, lineGap: 1 });
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
        .text(meta, MARGIN + 16, y + 12 + hTitle + 8, { width: CONTENT_W - 32, lineGap: 1 });
      y += needed + 8;
    });
  }
}

// ─── SENTIMENT ─────────────────────────────────────────────────
function drawSentimentPage(doc, sentiment) {
  const series = sentiment?.seriesBySource || [];
  const allScores = [];
  const newsScores = [];
  const redditScores = [];

  series.forEach((s) => {
    (s.points || []).forEach((p) => {
      if (typeof p.score !== 'number') return;
      allScores.push(p.score);
      if (s.source?.startsWith('r/')) redditScores.push(p.score);
      else newsScores.push(p.score);
    });
  });

  const avg = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : null);

  const overallScore = sentiment?.overallScore ?? sentiment?.score ?? avg(allScores);
  const newsScore = sentiment?.newsScore ?? avg(newsScores);
  const redditScore = sentiment?.redditScore ?? avg(redditScores);

  const overallTone = sentiment?.overallTone || sentiment?.overallLabel || sentiment?.label || toneLabel(overallScore);
  const newsTone = sentiment?.newsTone || sentiment?.newsLabel || toneLabel(newsScore);
  const redditTone = sentiment?.redditTone || sentiment?.redditLabel || toneLabel(redditScore);

  const entries = [
    { title: 'Overall Tone', tone: overallTone, score: overallScore, color: COLORS.green },
    { title: 'News Tone', tone: newsTone, score: newsScore, color: COLORS.blue },
    { title: 'Reddit Tone', tone: redditTone, score: redditScore, color: COLORS.purple },
  ];

  const hasAnyScore = entries.some((e) => Number.isFinite(Number(e.score)));
  const hasAnyTone = entries.some((e) => e.tone);
  if (!hasAnyScore && !hasAnyTone && (!sentiment || series.length === 0)) return;

  addNewPage(doc);
  drawSimpleHeader(doc, 'Sentiment');

  let y = MARGIN + 24;
  const cardHeight = 32 + entries.length * 30;
  y = checkPageBreak(doc, y, cardHeight + 10);

  drawCard(doc, MARGIN, y, CONTENT_W, cardHeight, { leftAccent: COLORS.green });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.white)
    .text('Tone Scores', MARGIN + 16, y + 12);

  let rowY = y + 32;
  entries.forEach((e) => {
    const toneText = safe(e.tone || 'N/A');
    const scoreText = Number.isFinite(Number(e.score)) ? `Score: ${Number(e.score).toFixed(2)}` : 'Score: N/A';

    doc.font('Helvetica-Bold').fontSize(11).fillColor(e.color || COLORS.white)
      .text(`${e.title}: ${toneText}`, MARGIN + 16, rowY, { width: CONTENT_W - 32 });
    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
      .text(scoreText, MARGIN + 16, rowY + 14, { width: CONTENT_W - 32 });
    rowY += 30;
  });
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────
const exportTrendToPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });

      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const keyword = data?.keyword || 'Topic';

      // ✅ FIRST PAGE (NO COVER)
      addNewPage(doc);
      drawSimpleHeader(doc, safe(keyword));

      drawStoryDNAPage(doc, data?.dna);
      drawTimelinePage(doc, data?.timelineEvents);
      drawTrendsPage(doc, data?.googleTrends);
      drawRedditPage(doc, { redditPulse: data?.redditPulse, redditPosts: data?.redditPosts });
      drawSentimentPage(doc, data?.sentiment);
      drawNewsPage(doc, data?.news);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { exportTrendToPDF };