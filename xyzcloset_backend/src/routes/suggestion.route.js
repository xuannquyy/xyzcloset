const express = require('express');
const { getTodaySuggestion } = require('../controllers/suggestion.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

// Lấy gợi ý dựa theo thời tiết
router.get('/today', verifyToken, getTodaySuggestion);

module.exports = router;