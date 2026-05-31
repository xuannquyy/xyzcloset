const express = require('express');
const { removeBackground, analyzeBodyShape, virtualTryOn } = require('../controllers/ai.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const uploadCloud = require('../configs/cloudinary.config.js');

const router = express.Router();

// 🟢 HÀM MIDDLEWARE TỰ TẠO: Bẫy lỗi Cloudinary an toàn
// Công dụng: Chặn đứng lỗi "Stale request" (sai giờ) hoặc lỗi mạng văng ra dạng [object Object]
const safeUpload = (fieldName) => {
    return (req, res, next) => {
        const upload = uploadCloud.single(fieldName);
        upload(req, res, function (err) {
            if (err) {
                console.error(`\n❌ LỖI UPLOAD CLOUDINARY (Trường: ${fieldName}):`, err.message);
                return res.status(500).json({ 
                    message: "Không thể đẩy ảnh lên đám mây, hãy kiểm tra ngày giờ máy tính hoặc mạng!", 
                    error: err.message 
                });
            }
            next(); // An toàn thì cho đi tiếp vào Controller
        });
    };
};

// =====================================================================
// ĐĂNG KÝ CÁC CỔNG GIAO TIẾP (ROUTES)
// =====================================================================

// 1. Tách nền: Nhận 1 file 'image', lưu lên mây rồi gọi Controller
router.post('/remove-bg', verifyToken, safeUpload('image'), removeBackground);

// 2. Phân tích dáng người: Nhận 1 file 'image' (ảnh toàn thân), lưu lên mây rồi gọi Controller
router.post('/analyze-body', verifyToken, safeUpload('image'), analyzeBodyShape);

// 3. Thử đồ ảo (VTON): Không cần upload file vật lý vì App đã gửi thẳng 2 link URL trong body JSON
router.post('/vton', verifyToken, virtualTryOn);

module.exports = router;