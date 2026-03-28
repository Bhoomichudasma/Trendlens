const express = require('express');
const router = express.Router();
const { search, getMyHistory } = require('../controllers/searchController');
const { optionalAuth, authenticateToken } = require('../middleware/authMiddleware');

// Optional auth lets us link searches to a user when logged in, but stays public for guests
router.get('/search', optionalAuth, search);
router.get('/search/history', authenticateToken, getMyHistory);

module.exports = router;

