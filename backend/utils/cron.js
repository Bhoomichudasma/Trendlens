const cron = require('node-cron');
const Topic = require('../models/Topic');
const { searchAndBuild } = require('../services/aggregationService');
const { runAlertCheck } = require('../services/alertService');

let running = false;
let alertRunning = false;

function startCron() {
  const cronEnabled = (process.env.CRON_ENABLED || 'true').toLowerCase() !== 'false';
  if (!cronEnabled) {
    console.log('[Cron] Disabled via CRON_ENABLED=false');
    return;
  }

  const startupDelayMs = Number(process.env.CRON_START_DELAY_MS || 5 * 60 * 1000); // default 5 minutes
  console.log(`[Cron] Scheduling jobs after ${Math.round(startupDelayMs / 1000)}s delay`);

  setTimeout(() => {
  // Every 30 minutes — refresh topic DNA
  cron.schedule('*/30 * * * *', async () => {
    if (running) return;
    running = true;
    try {
      const topics = await Topic.find({}).select('keyword slug').limit(50).lean();
      for (const t of topics) {
        await searchAndBuild({
          keyword: t.keyword,
          filters: { redditLimit: 10, newsLimit: 10, redditSort: 'relevance', newsSort: 'publishedAt', redditTime: 'week', newsTime: 'week', region: null },
          logSearch: false,
          forceRefresh: true,
        });
      }
    } catch (err) {
      console.error('[Cron] Refresh error:', err.message || err);
    } finally {
      running = false;
    }
  });

  // Every 30 minutes — check alerts (offset by 15 mins so they don't overlap)
  cron.schedule('15,45 * * * *', async () => {
    if (alertRunning) return;
    alertRunning = true;
    try {
      await runAlertCheck();
    } catch (err) {
      console.error('[Cron] Alert check error:', err.message || err);
    } finally {
      alertRunning = false;
    }
  });
  }, startupDelayMs);
}

module.exports = { startCron };

