const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const Replicate = require("replicate");

// Khởi tạo Replicate bằng Token lấy từ file .env
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// =====================================================================
// 1. AI TÁCH NỀN QUẦN ÁO (Gọi sang Python: 127.0.0.1:8000)
// =====================================================================
const removeBackground = async (req, res) => {
    try {
        console.log("\n--- [AI] BẮT ĐẦU TÁCH NỀN ---");
        if (!req.file) {
            console.log("❌ Lỗi: Không nhận được file ảnh.");
            return res.status(400).json({ message: "Vui lòng tải lên ảnh để tách nền!" });
        }
        
        const originalImageUrl = req.file.path; 
        console.log("-> 1. Ảnh gốc đã lên Cloudinary:", originalImageUrl);

        try {
            console.log("-> 2. Đang gửi lệnh sang Server Python (Rembg)...");
            const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/remove-bg', {
                image_url: originalImageUrl
            });

            if (pythonRes.data && pythonRes.data.success) {
                console.log("-> 3. Python tách nền XONG! Đang lưu ảnh trong suốt lên mây...");
                const base64Data = pythonRes.data.processedImageBase64;
                
                // Chuẩn hóa chuỗi Base64 trước khi đẩy lên Cloudinary
                const formattedBase64 = base64Data.startsWith('data:image') 
                    ? base64Data 
                    : `data:image/png;base64,${base64Data}`;

                const uploadRes = await cloudinary.uploader.upload(formattedBase64, {
                    folder: 'XYZCloset_Wardrobe'
                });

                console.log("-> 4. HOÀN TẤT TÁCH NỀN! Đã trả link về App.");
                return res.status(200).json({
                    success: true,
                    processedImageUrl: uploadRes.secure_url 
                });
            } else {
                throw new Error("Python không trả về định dạng đúng.");
            }
        } catch (pyError) {
            console.error("❌ Lỗi khi gửi lệnh sang Python:", pyError.message);
            return res.status(500).json({ message: "AI Python đang bận hoặc từ chối kết nối." });
        }
    } catch (error) {
        console.error("❌ Lỗi sập Server Node.js (removeBackground):", error);
        res.status(500).json({ message: "Lỗi server Node.js", error: error.message });
    }
};

// =====================================================================
// 2. AI PHÂN TÍCH DÁNG NGƯỜI (Gọi sang Python: 127.0.0.1:8000)
// =====================================================================
const analyzeBodyShape = async (req, res) => {
    try {
        console.log("\n--- [AI] BẮT ĐẦU ĐO ĐẠC DÁNG NGƯỜI ---");
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng tải lên ảnh chụp toàn thân!" });
        }
        
        const originalImageUrl = req.file.path;
        console.log("-> 1. Ảnh toàn thân đã lên mây:", originalImageUrl);

        try {
            console.log("-> 2. Đang yêu cầu Python (MediaPipe) quét khung xương...");
            const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/analyze-body-shape', {
                image_url: originalImageUrl
            });

            if (pythonRes.data && pythonRes.data.success) {
                console.log("-> 3. HOÀN TẤT! AI xác định là:", pythonRes.data.shapeResult);
                // Trả nguyên kết quả phân tích từ Python về cho Frontend
                return res.status(200).json(pythonRes.data);
            } else {
                throw new Error("Dữ liệu Python trả về không hợp lệ.");
            }
        } catch (pyError) {
            console.error("❌ Lỗi Python (MediaPipe):", pyError.response?.data || pyError.message);
            // Bắt lỗi chi tiết từ Python trả về (VD: Không thấy người trong ảnh)
            const detailMsg = pyError.response?.data?.detail || "Không thể phân tích ảnh này.";
            return res.status(400).json({ message: detailMsg });
        }
    } catch (error) {
        console.error("❌ Lỗi Server Node.js (analyzeBodyShape):", error);
        res.status(500).json({ message: "Lỗi server Node.js", error: error.message });
    }
};

// =====================================================================
// 3. AI THỬ ĐỒ ẢO (VTON) - PHIÊN BẢN KHÔNG TỐN TIỀN
// =====================================================================
const virtualTryOn = async (req, res) => {
    try {
        console.log("\n--- [AI] BẮT ĐẦU VIRTUAL TRY-ON (FREE 100%) ---");
        
        const { personImageUrl, garmentImageUrl } = req.body;

        if (!personImageUrl || !garmentImageUrl) {
            return res.status(400).json({ message: "Cần đủ ảnh người mẫu và ảnh quần áo!" });
        }

        console.log("-> 1. Người mẫu:", personImageUrl);
        console.log("-> 2. Quần áo:", garmentImageUrl);
        console.log("-> 3. Đang gửi lệnh sang Python (Hugging Face)... vui lòng đợi 20-40s vì xài server chùa!");

        // Gọi sang server Python (127.0.0.1:8000) của chính bạn
        const pythonRes = await axios.post('http://127.0.0.1:8000/api/ai/vton', {
            person_url: personImageUrl,
            garment_url: garmentImageUrl
        });

        if (pythonRes.data && pythonRes.data.success) {
            console.log("-> 4. Python đã lấy được ảnh! Đang lưu lên Cloudinary...");
            const base64Data = pythonRes.data.processedImageBase64;
            
            const uploadRes = await cloudinary.uploader.upload(base64Data, {
                folder: 'XYZCloset_Wardrobe'
            });

            console.log("-> 5. HOÀN TẤT VTON! Đã tạo ra bức ảnh ma thuật.");
            return res.status(200).json({
                success: true,
                resultImageUrl: uploadRes.secure_url 
            });
        }
    } catch (error) {
        console.error("❌ Lỗi AI VTON Miễn phí:", error.message);
        res.status(500).json({ 
            message: "Hàng chờ miễn phí đang quá đông, bạn chịu khó chờ 1 phút rồi bấm lại nhé!", 
        });
    }
};

module.exports = { 
    removeBackground, 
    analyzeBodyShape, 
    virtualTryOn 
};