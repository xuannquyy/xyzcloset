const express = require('express');
const { getWardrobeStats } = require('../controllers/stat.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.get('/wardrobe', verifyToken, getWardrobeStats);

module.exports = router;