const express = require('express');
const { getMe, updateMe, changePassword } = require('../controllers/user.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');
const uploadCloud = require('../configs/cloudinary.config.js');

const router = express.Router();

router.use(verifyToken);

router.get('/me', getMe);
// Dùng uploadCloud.single('avatar') để nhận ảnh đại diện
router.put('/me', uploadCloud.single('avatar'), updateMe);
router.put('/change-password', changePassword)

module.exports = router;