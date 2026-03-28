const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const AlertLog = require('../models/AlertLog');

// Subscribe to alerts
router.post('/subscribe', async (req, res) => {
  try {
    const { topicId, email } = req.body;
    if (!topicId || !email) return res.status(400).json({ error: 'topicId and email required' });

    await Topic.findByIdAndUpdate(topicId, {
      alertsEnabled: true,
      $addToSet: { alertSubscribers: email },
    });
    res.json({ success: true, message: `Subscribed ${email} to alerts` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unsubscribe
router.post('/unsubscribe', async (req, res) => {
  try {
    const { topicId, email } = req.body;
    if (!topicId || !email) return res.status(400).json({ error: 'topicId and email required' });

    const topic = await Topic.findByIdAndUpdate(topicId, {
      $pull: { alertSubscribers: email },
    }, { new: true });

    if (!topic?.alertSubscribers?.length) {
      await Topic.findByIdAndUpdate(topicId, { alertsEnabled: false });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check subscription status
router.get('/status/:topicId', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId).select('alertSubscribers alertsEnabled');
    res.json({ alertsEnabled: topic?.alertsEnabled || false, subscriberCount: topic?.alertSubscribers?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alert history for a topic
router.get('/history/:topicId', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const logs = await AlertLog.find({ topicId: req.params.topicId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      topic: req.params.topicId,
      totalAlerts: logs.length,
      alerts: logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts sent to a specific email
router.get('/sent-to/:email', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const logs = await AlertLog.find({ 'emailsSent.email': req.params.email })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('keyword alertType alertFired alertDetails EmailsSent createdAt')
      .lean();
    
    res.json({
      email: req.params.email,
      totalAlertsReceived: logs.length,
      alerts: logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
