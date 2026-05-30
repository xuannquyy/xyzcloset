const express = require('express');
const { createCategory, getAllCategories } = require('../controllers/category.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

// Lấy danh sách thì ai cũng lấy được (cần verifyToken để bảo mật tủ đồ)
router.get('/', verifyToken, getAllCategories);
// Tạo danh mục mới
router.post('/', verifyToken, createCategory);

module.exports = router;