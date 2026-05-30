const axios = require('axios');
const cloudinary = require('cloudinary').v2;

const removeBackground = async (req, res) => {
    try {
        console.log("1. Bắt đầu xử lý ảnh...");
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng tải lên ảnh để tách nền!" });
        }
        
        const originalImageUrl = req.file.path; 
        console.log("2. Ảnh đã lên Cloudinary gốc:", originalImageUrl);

        try {
            console.log("3. Đang gửi sang AI Python...");
            const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/remove-bg', {
                image_url: originalImageUrl
            });

            if (pythonRes.data && pythonRes.data.success) {
                console.log("4. AI tách xong, đang lưu ảnh trong suốt...");
                const base64Data = pythonRes.data.processedImageBase64;
                
                // 🟢 FIX LỖI KINH ĐIỂN: Cloudinary yêu cầu tiền tố URI chuẩn
                const formattedBase64 = base64Data.startsWith('data:image') 
                    ? base64Data 
                    : `data:image/png;base64,${base64Data}`;

                const uploadRes = await cloudinary.uploader.upload(formattedBase64, {
                    folder: 'XYZCloset_Wardrobe'
                });

                console.log("5. Tách nền HOÀN TẤT!");
                return res.status(200).json({
                    success: true,
                    processedImageUrl: uploadRes.secure_url 
                });
            } else {
                throw new Error("AI không thể xử lý bức ảnh này.");
            }
        } catch (pyError) {
            console.error("Lỗi gọi Server Python tách nền:", pyError.message);
            return res.status(500).json({ message: "Không thể kết nối đến AI Tách Nền." });
        }
    } catch (error) {
        console.error("Lỗi Server Node.js:", error.message);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { removeBackground };