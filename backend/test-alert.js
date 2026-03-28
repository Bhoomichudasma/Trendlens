const mongoose = require('mongoose');
const Topic = require('./models/Topic');
const { runAlertCheck } = require('./services/alertService');
require('dotenv').config();

(async () => {
  try {
    console.log('\n========== ALERT SYSTEM DEBUG ==========\n');
    
    // Step 1: Connect to DB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    // Step 2: Check subscribed topics
    console.log('🔍 Checking subscribed topics...');
    const topics = await Topic.find({ alertsEnabled: true });
    console.log(`Found ${topics.length} topic(s) with alerts enabled\n`);
    
    if (topics.length === 0) {
      console.log('❌ NO TOPICS SUBSCRIBED!');
      console.log('\nYou need to:');
      console.log('  1. Go to http://localhost:5173');
      console.log('  2. Search any topic (e.g., "Trump")');
      console.log('  3. Click "Get Alerts" → Enter your email');
      console.log('  4. Click "Subscribe"');
      console.log('  5. Then run this test again\n');
      process.exit(0);
    }

    topics.forEach(t => {
      console.log(`📌 Topic: "${t.keyword}"`);
      console.log(`   ✅ Alerts enabled: ${t.alertsEnabled}`);
      console.log(`   📧 Subscribers: ${t.alertSubscribers.join(', ')}\n`);
    });

    // Step 3: Run alert check
    console.log('🚀 Running alert check now...\n');
    await runAlertCheck();
    console.log('\n✅ Alert check complete!');
    console.log('Check your email inbox in 30 seconds...\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
