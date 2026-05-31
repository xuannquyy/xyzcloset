const express = require('express');
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
const uploadCloud = require('../configs/cloudinary.config.js'); 

const router = express.Router();

// 🟢 HÀM MIDDLEWARE TỰ TẠO: Bẫy lỗi Cloudinary an toàn
const safeUpload = (fieldName) => {
    return (req, res, next) => {
        const upload = uploadCloud.single(fieldName);
        upload(req, res, function (err) {
            if (err) {
                console.error(`\n❌ LỖI UPLOAD TỦ ĐỒ:`, err.message);
                return res.status(500).json({ 
                    message: "Không thể tải ảnh lên mây. Vui lòng kiểm tra lại mạng!", 
                    error: err.message 
                });
            }
            next();
        });
    };
};

// Bắt buộc đăng nhập
router.use(verifyToken); 

router.delete('/clear', clearMyWardrobe);
router.get('/public', getPublicWardrobe);
router.get('/', getMyWardrobe);
router.get('/:id', getItemById);

// 🟢 THAY THẾ UPLOAD TRỰC TIẾP BẰNG SAFE UPLOAD
router.post('/', safeUpload('image'), createItem);
router.put('/:id', safeUpload('image'), updateItem);
router.delete('/:id', deleteItem);

module.exports = router;