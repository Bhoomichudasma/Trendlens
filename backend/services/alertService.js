const axios = require('axios');
const nodemailer = require('nodemailer');
const Topic = require('../models/Topic');
const AlertLog = require('../models/AlertLog');
const { fetchNewsArticles } = require('./newsService');
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL_FROM,
    pass: process.env.ALERT_EMAIL_PASSWORD,
  },
});

async function detectTrend(topic, prevData, currArticles) {
  const prevCount = prevData?.articleCount || 0;
  const currCount = currArticles.length;
  const prevSentiment = prevData?.sentiment || 'neutral';

  // ─── PRELIMINARY CHECKS ───────────────────────────────────────
  // Only proceed if there's a meaningful change
  
  // 1. Check if no articles at all
  if (currCount === 0) {
    console.log(`[Alert] Skip: No articles for "${topic.keyword}"`);
    return null;
  }

  // 2. Check for significant spike (>50% increase)
  const spikePercentage = prevCount > 0 ? ((currCount - prevCount) / prevCount) * 100 : 0;
  const hasSpikeThreshold = currCount > prevCount * 1.5; // 50% more articles
  
  // 3. Calculate sentiment strength
  const negWords = ['war', 'attack', 'killed', 'crisis', 'collapse', 'explosion', 'dead', 'threat', 'disaster', 'emergency'];
  const posWords = ['peace', 'deal', 'agreement', 'ceasefire', 'recovery', 'win', 'success', 'achieved', 'breakthrough', 'progress'];
  let negScore = 0, posScore = 0;

  currArticles.forEach(a => {
    const t = (a.title || '').toLowerCase();
    negWords.forEach(w => { if (t.includes(w)) negScore++; });
    posWords.forEach(w => { if (t.includes(w)) posScore++; });
  });

  const currSentiment = negScore > posScore + 2
    ? 'negative' : posScore > negScore + 2
    ? 'positive' : 'neutral';

  const sentimentShifted = prevSentiment !== 'neutral' && currSentiment !== prevSentiment;
  
  // 4. Check if there's ANY reason to alert
  // Only proceed if: spike > 50% OR sentiment significantly changed OR strong negative sentiment
  if (!hasSpikeThreshold && !sentimentShifted && negScore + posScore < 3) {
    console.log(`[Alert] Skip: No significant changes for "${topic.keyword}" (${currCount} articles, ${currSentiment})`);
    return null;
  }

  // ─── ONLY IF PRELIMINARY CHECKS PASS: CALL GROQ ─────────────────
  const summaries = currArticles
    .slice(0, 6)
    .map(a => `- ${a.title}: ${(a.description || '').slice(0, 100)}`)
    .join('\n');

  const prompt = `You are an intelligent trend detection system. Analyze if a SIGNIFICANT, MEANINGFUL trend has occurred.
Be VERY STRICT - only flag if there's REAL importance. Don't alert on trivial changes.

INPUT:
- Topic: ${topic.keyword}
- Previous articles: ${prevCount}
- Current articles: ${currCount} (${spikePercentage > 0 ? '+' : ''}${spikePercentage.toFixed(0)}%)
- Previous sentiment: ${prevSentiment}
- Current sentiment: ${currSentiment}
- Negative score: ${negScore}, Positive score: ${posScore}
- Latest headlines:
${summaries}

DECIDE: Is this a REAL, SIGNIFICANT development?

Detection rules (STRICT):
✅ FIRE ALERT if:
  - Coverage spike >70% (significant media attention)
  - Major shift from calm → crisis (neutral → negative)
  - Multiple crisis keywords (war, attack, killed, explosion)
  - Breaking news (new high-impact event)

❌ DON'T alert if:
  - Small spike (<30%)
  - Normal sentiment variance
  - Regular daily articles
  - Minor updates to ongoing stories

Return STRICT JSON (no other text):
{"alert":true,"type":"spike|sentiment_shift|major_event|none","title":"<10 words","message":"<25 words","confidence":"low|medium|high"}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.15, max_tokens: 200 },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    const content = response.data?.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      console.log(`[Alert] Groq returned invalid JSON for "${topic.keyword}"`);
      return null;
    }
    
    const result = JSON.parse(match[0]);
    
    // ─── CONFIDENCE FILTER ───────────────────────────────────────
    // Only fire alerts with medium or high confidence
    if (result.alert && result.confidence === 'low') {
      console.log(`[Alert] Suppressing low-confidence alert for "${topic.keyword}"`);
      return { ...result, alert: false }; // Convert to no-alert
    }
    
    return result;
  } catch (err) {
    console.error('[Alert] Groq detection failed:', err.message);
    return null;
  }
}

function buildEmailHTML(topic, alert, articles) {
  const typeColors = {
    spike:           { bg: '#1A1F35', accent: '#2979FF', badge: '#2979FF', label: 'COVERAGE SPIKE' },
    sentiment_shift: { bg: '#1F1510', accent: '#FF8C00', badge: '#FF8C00', label: 'SENTIMENT SHIFT' },
    major_event:     { bg: '#1A0F0F', accent: '#FF4444', badge: '#FF4444', label: 'MAJOR DEVELOPMENT' },
    none:            { bg: '#0D1420', accent: '#00E5FF', badge: '#00E5FF', label: 'UPDATE' },
  };
  const style = typeColors[alert.type] || typeColors.none;
  const topArticles = articles.slice(0, 3);
  const date = new Date().toUTCString();
  const topicSlug = topic.slug || encodeURIComponent(topic.keyword);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#080C14;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080C14;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#0D1420;border-bottom:1px solid #1A2535;padding:20px 28px;border-radius:12px 12px 0 0;">
  <table width="100%"><tr>
    <td><span style="color:#00E5FF;font-size:18px;font-weight:700;">TRENDLENS</span><span style="color:#4A5568;font-size:12px;margin-left:8px;">AI Intelligence</span></td>
    <td align="right"><span style="background:${style.badge};color:#080C14;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;">${style.label}</span></td>
  </tr></table>
</td></tr>
<tr><td style="background:${style.bg};border-left:3px solid ${style.accent};padding:28px;">
  <p style="margin:0 0 6px;color:#8B9BB4;font-size:11px;letter-spacing:2px;text-transform:uppercase;">TOPIC ALERT</p>
  <h1 style="margin:0 0 8px;color:#F0F4FF;font-size:22px;font-weight:700;">${topic.keyword.toUpperCase()}</h1>
  <h2 style="margin:0 0 16px;color:${style.accent};font-size:16px;">${alert.title || 'New development detected'}</h2>
  <div style="background:#080C14;border:1px solid #1A2535;border-radius:8px;padding:16px;margin-bottom:24px;">
    <p style="margin:0;color:#F0F4FF;font-size:14px;line-height:1.6;">${alert.message || 'A significant change has been detected.'}</p>
  </div>
  <p style="margin:0 0 24px;"><span style="color:#4A5568;font-size:11px;">Confidence: </span>
    <span style="color:${alert.confidence === 'high' ? '#00C853' : alert.confidence === 'medium' ? '#FF8C00' : '#8B9BB4'};font-size:11px;font-weight:700;text-transform:uppercase;">${alert.confidence || 'medium'}</span>
  </p>
  <div style="height:1px;background:#1A2535;margin-bottom:24px;"></div>
  <p style="margin:0 0 12px;color:#8B9BB4;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">LATEST ARTICLES</p>
  ${topArticles.map(a => `
  <div style="background:#0D1420;border:1px solid #1A2535;border-radius:6px;padding:12px 16px;margin-bottom:10px;">
    <p style="margin:0 0 4px;color:#F0F4FF;font-size:13px;font-weight:600;">${a.title || 'Untitled'}</p>
    <p style="margin:0;color:#4A5568;font-size:11px;">${a.source?.name || a.source || 'Unknown'}${a.publishedAt ? ' · ' + new Date(a.publishedAt).toLocaleDateString('en-GB') : ''}</p>
  </div>`).join('')}
  <div style="text-align:center;margin-top:28px;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/topic/${topicSlug}"
       style="background:#00E5FF;color:#080C14;font-size:13px;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;display:inline-block;">
      View Full Intelligence Report →
    </a>
  </div>
</td></tr>
<tr><td style="background:#0D1420;border-top:1px solid #1A2535;padding:16px 28px;border-radius:0 0 12px 12px;text-align:center;">
  <p style="margin:0 0 6px;color:#4A5568;font-size:11px;">Generated: ${date}</p>
  <p style="margin:0;color:#4A5568;font-size:10px;">You are receiving this because you subscribed to alerts on TrendLens AI.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

async function sendAlertEmail(topic, alert, articles, recipientEmail) {
  const typeLabels = {
    spike: '📈 Coverage Spike',
    sentiment_shift: '🔄 Sentiment Shift',
    major_event: '🚨 Major Development',
    none: '📰 Update',
  };
  await transporter.sendMail({
    from: `"TrendLens AI" <${process.env.ALERT_EMAIL_FROM}>`,
    to: recipientEmail,
    subject: `${typeLabels[alert.type] || '📰 Update'}: ${topic.keyword} — ${alert.title || 'New alert'}`,
    html: buildEmailHTML(topic, alert, articles),
    text: `TrendLens Alert\n\nTopic: ${topic.keyword}\n${alert.title}\n\n${alert.message}`,
  });
  console.log(`[Alert] Email sent to ${recipientEmail} for: ${topic.keyword}`);
}

async function runAlertCheck() {
  console.log('[Alert] Starting alert check...');
  const topics = await Topic.find({ alertsEnabled: true }).lean();
  if (!topics.length) { console.log('[Alert] No topics with alerts enabled'); return; }

  for (const topic of topics) {
    try {
      const prevLog = await AlertLog.findOne({ topicId: topic._id }).sort({ createdAt: -1 }).lean();
      const articles = await fetchNewsArticles(topic.keyword, { limit: 15, sortBy: 'publishedAt', time: 'week' });

      if (!articles.length) { console.log(`[Alert] No articles for: ${topic.keyword}`); continue; }

      const alertResult = await detectTrend(topic, {
        articleCount: prevLog?.articleCount || 0,
        sentiment: prevLog?.sentiment || 'neutral',
      }, articles);

      // Prepare alert log data
      const emailsSent = [];
      
      if (alertResult?.alert) {
        // Send emails and track delivery
        for (const email of (topic.alertSubscribers || [])) {
          try {
            await sendAlertEmail(topic, alertResult, articles, email);
            emailsSent.push({
              email,
              sentAt: new Date(),
              status: 'sent'
            });
            console.log(`[Alert] ✅ Email sent to ${email}`);
          } catch (emailErr) {
            emailsSent.push({
              email,
              sentAt: new Date(),
              status: 'failed',
              error: emailErr.message
            });
            console.error(`[Alert] ❌ Failed to send to ${email}:`, emailErr.message);
          }
        }
      }

      // Create comprehensive alert log
      await AlertLog.create({
        topicId: topic._id,
        keyword: topic.keyword,
        articleCount: articles.length,
        sentiment: alertResult?.type === 'sentiment_shift' ? 'shifted' : (prevLog?.sentiment || 'neutral'),
        alertFired: alertResult?.alert || false,
        alertType: alertResult?.type || 'none',
        alertDetails: alertResult?.alert ? {
          title: alertResult.title,
          message: alertResult.message,
          confidence: alertResult.confidence
        } : null,
        emailsSent: emailsSent // Track who received it
      });

      if (!alertResult?.alert) { console.log(`[Alert] No alert for: ${topic.keyword}`); continue; }

      console.log(`[Alert] Fired "${alertResult.type}" for: ${topic.keyword} → ${emailsSent.length} emails`);
    } catch (err) {
      console.error(`[Alert] Error for ${topic.keyword}:`, err.message);
    }
  }
  console.log('[Alert] Alert check complete.');
}

module.exports = { runAlertCheck, detectTrend, sendAlertEmail };
