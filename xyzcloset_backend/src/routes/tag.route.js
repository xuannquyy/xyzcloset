const express = require('express');
const { createTag, getAllTags } = require('../controllers/tag.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.get('/', verifyToken, getAllTags);
router.post('/', verifyToken, createTag);

module.exports = router;