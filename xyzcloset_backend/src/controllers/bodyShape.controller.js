const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios'); // Dùng để Node.js gọi sang Python

const getAllGuides = async (req, res) => {
    try {
        const guides = await prisma.bodyShapeGuide.findMany();
        res.status(200).json(guides);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const analyzeBodyShape = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng tải lên ảnh chụp toàn thân thẳng đứng!" });
        }
        
        // 1. Lấy link ảnh từ Cloudinary
        const imageUrl = req.file.path; 

        // 2. Gửi link này sang Server AI Python (đang chạy ở cổng 8000)
        try {
            const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/analyze-body-shape', {
                image_url: imageUrl
            });

            if (pythonRes.data && pythonRes.data.success) {
                const aiResult = pythonRes.data.shapeResult; // VD: "Dáng Quả Lê"
                const metrics = pythonRes.data.metrics;

                // 3. Lấy lời khuyên phối đồ cho dáng người đó từ Database
                const guide = await prisma.bodyShapeGuide.findFirst({
                    where: { shapeName: aiResult }
                });

                // 4. Trả toàn bộ cục dữ liệu hoàn hảo về cho App Điện thoại
                return res.status(200).json({
                    success: true,
                    message: "AI đã phân tích xong!",
                    analyzedImageUrl: imageUrl,
                    shapeResult: aiResult,
                    metrics: metrics, // Trả luôn thông số Vai/Hông về
                    advice: guide 
                });
            }
        } catch (pyError) {
            console.error("Lỗi gọi Server Python:", pyError.message);
            return res.status(500).json({ 
                success: false, 
                message: "Không thể kết nối đến AI hoặc AI không nhận diện được khung xương." 
            });
        }

    } catch (error) {
        res.status(500).json({ message: "Lỗi server Node.js", error: error.message });
    }
};

module.exports = { getAllGuides, analyzeBodyShape };