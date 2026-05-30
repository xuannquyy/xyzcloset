const axios = require('axios');
const cloudinary = require('cloudinary').v2;

const removeBackground = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng tải lên ảnh để tách nền!" });
        }
        
        const originalImageUrl = req.file.path; 

        try {
            // Gọi sang Python lấy ảnh đã tách nền (Dạng Base64)
            const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/remove-bg', {
                image_url: originalImageUrl
            });

            if (pythonRes.data && pythonRes.data.success) {
                const base64Data = pythonRes.data.processedImageBase64;
                
                // Upload ngược bức ảnh trong suốt (Base64) lên Cloudinary
                const uploadRes = await cloudinary.uploader.upload(base64Data, {
                    folder: 'XYZCloset_Wardrobe'
                });

                // Trả Link ảnh mây về cho Frontend hiển thị
                return res.status(200).json({
                    success: true,
                    processedImageUrl: uploadRes.secure_url 
                });
            } else {
                throw new Error("AI không thể xử lý bức ảnh này.");
            }
        } catch (pyError) {
            console.error("Lỗi gọi Server Python tách nền:", pyError.message);
            return res.status(500).json({ 
                message: "Không thể kết nối đến AI Tách Nền hoặc AI đang bận." 
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi server Node.js", error: error.message });
    }
};

module.exports = { removeBackground };