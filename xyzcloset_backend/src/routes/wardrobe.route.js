const express = require('express');
// Đã thêm getPublicWardrobe vào danh sách import
const { 
    createItem, 
    getMyWardrobe, 
    getItemById, 
    updateItem, 
    deleteItem, 
    getPublicWardrobe,
    clearMyWardrobe 
} = require('../controllers/wardrobe.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const uploadCloud = require('../configs/cloudinary.config.js'); // Nhúng Cloudinary

const router = express.Router();

// Tất cả thao tác tủ đồ đều phải đăng nhập
router.use(verifyToken); 

// ========================================================
// QUY TẮC VÀNG: ROUTE CỤ THỂ PHẢI NẰM TRÊN ROUTE CÓ PARAM (/:id)
// ========================================================
router.delete('/clear', clearMyWardrobe);
// Lấy danh sách đồ mẫu (Có sẵn)
router.get('/public', getPublicWardrobe);

// ========================================================

// Lấy danh sách tủ đồ cá nhân
router.get('/', getMyWardrobe);

// Lấy Chi tiết món đồ cá nhân
router.get('/:id', getItemById);

// Thêm mới (uploadCloud.single('image') báo hiệu API này nhận 1 file ảnh có tên là 'image')
router.post('/', uploadCloud.single('image'), createItem);

// Cập nhật (có thể đổi ảnh mới hoặc không)
router.put('/:id', uploadCloud.single('image'), updateItem);

// Xóa mềm
router.delete('/:id', deleteItem);

module.exports = router;