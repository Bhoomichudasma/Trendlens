const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');

router.get('/topics', topicController.listTopics);
router.get('/topics/:id/dna', topicController.getDNA);
router.get('/topics/:id/timeline', topicController.getTimeline);
router.get('/topics/:id/escalation', topicController.getEscalation);
router.get('/topics/:id/sentiment', topicController.getSentiment);
router.get('/topics/:id/sources', topicController.getSources);
router.get('/topics/:id/related', topicController.getRelated);
router.get('/topics/:id/reddit', topicController.getRedditPosts);
router.post('/topics', topicController.createTopic);

module.exports = router;

