const express = require('express');
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.use(verifyToken);

router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;