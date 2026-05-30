const express = require('express');
const { createOutfit, getMyOutfits, getOutfitById, deleteOutfit } = require('../controllers/outfit.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const uploadCloud = require('../configs/cloudinary.config.js'); 

const router = express.Router();

// Yêu cầu đăng nhập cho mọi thao tác
router.use(verifyToken); 

router.get('/', getMyOutfits);
router.get('/:id', getOutfitById);

// Nhận file ảnh tải lên với tên trường là 'image'
router.post('/', uploadCloud.single('image'), createOutfit);

router.delete('/:id', deleteOutfit);

module.exports = router;