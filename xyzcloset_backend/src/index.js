const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.route.js');
const categoryRoutes = require('./routes/category.route.js'); 
const tagRoutes = require('./routes/tag.route.js');     
const wardrobeRoutes = require('./routes/wardrobe.route.js');   
const outfitRoutes = require('./routes/outfit.route.js');   
const userRoutes = require('./routes/user.route.js');
const statRoutes = require('./routes/stat.route.js');
const notificationRoutes = require('./routes/notification.route.js');
const suggestionRoutes = require('./routes/suggestion.route.js');
const bodyShapeRoutes = require('./routes/bodyShape.route.js');
const aiRoutes = require('./routes/ai.route.js');

// IMPORT CRON JOB
const initCronJobs = require('./services/notification.job.js');

const app = express();
app.use(cors());
app.use(express.json()); 

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes); 
app.use('/api/tags', tagRoutes);     
app.use('/api/wardrobe', wardrobeRoutes);    
app.use('/api/outfits', outfitRoutes);   
app.use('/api/user', userRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/body-shapes', bodyShapeRoutes);
app.use('/api/ai', aiRoutes);

// THÊM ĐOẠN NÀY ĐỂ BẮT LỖI MIDDLEWARE (VÍ DỤ MULTER/CLOUDINARY)
app.use((err, req, res, next) => {
    console.error("🔥 Middleware Error Catch:", err);
    res.status(500).json({ 
        message: "Lỗi hệ thống hoặc Upload ảnh thất bại. Vui lòng thử lại!", 
        error: err.message || err.toString()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server XYZ CLOSET đang chạy tại http://localhost:${PORT}`);
    initCronJobs();
});