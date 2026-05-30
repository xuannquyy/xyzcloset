const express = require('express');
const { removeBackground } = require('../controllers/ai.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const uploadCloud = require('../configs/cloudinary.config.js');

const router = express.Router();

// Route này cần đăng nhập (verifyToken) và nhận file ảnh (uploadCloud)
router.post('/remove-bg', verifyToken, uploadCloud.single('image'), removeBackground);

module.exports = router;