const express = require('express');
const { getAllGuides, analyzeBodyShape } = require('../controllers/bodyShape.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const uploadCloud = require('../configs/cloudinary.config.js');

const router = express.Router();

// Xem kiến thức dáng người thì không cần đăng nhập cũng được
router.get('/', getAllGuides);

// Phân tích dáng người thì phải đăng nhập và truyền file ảnh
router.post('/analyze', verifyToken, uploadCloud.single('image'), analyzeBodyShape);

module.exports = router;