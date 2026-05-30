const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTodaySuggestion = async (req, res) => {
    try {
        // Mặc định lấy thời tiết ở Biên Hòa, Đồng Nai nếu App không gửi tọa độ lên
        const { lat = 10.9457, lon = 106.8243 } = req.query; 
        
        let temp = 30; // Nhiệt độ giả định
        let weatherDesc = "Trời nắng đẹp";

        // Gọi API Thời tiết (Dùng fetch có sẵn của Node.js)
        try {
            const apiKey = process.env.WEATHER_API_KEY;
            if (apiKey) {
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`);
                const data = await response.json();
                temp = Math.round(data.main.temp);
                weatherDesc = data.weather[0].description;
            }
        } catch (e) {
            console.log("Không gọi được API thời tiết, dùng dữ liệu giả lập.");
        }

        const isHot = temp >= 25; // Trên 25 độ là nóng

        // Lấy toàn bộ Áo và Quần trong tủ đồ của người dùng này
        const tops = await prisma.wardrobeItem.findMany({
            where: { 
                userId: req.userId, 
                isDeleted: false,
                category: { name: { contains: 'Áo', mode: 'insensitive' } } // Lấy những món thuộc danh mục có chữ "Áo"
            }
        });

        const bottoms = await prisma.wardrobeItem.findMany({
            where: { 
                userId: req.userId, 
                isDeleted: false,
                category: { name: { contains: 'Quần', mode: 'insensitive' } } // Lấy những món thuộc danh mục có chữ "Quần"
            }
        });

        // Hàm bốc thăm ngẫu nhiên
        const randomTop = tops.length > 0 ? tops[Math.floor(Math.random() * tops.length)] : null;
        const randomBottom = bottoms.length > 0 ? bottoms[Math.floor(Math.random() * bottoms.length)] : null;

        res.status(200).json({
            weather: { temp, condition: weatherDesc },
            message: isHot ? `Hôm nay trời ${weatherDesc} (${temp}°C), khá oi bức. Gợi ý bạn mặc đồ thoáng mát nhé!` 
                           : `Hôm nay trời ${weatherDesc} (${temp}°C), hơi se lạnh. Nhớ giữ ấm nhé!`,
            suggestion: { top: randomTop, bottom: randomBottom }
        });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { getTodaySuggestion };