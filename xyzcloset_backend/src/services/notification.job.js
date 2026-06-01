const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateMorningOutfitSuggestion = async () => {
    console.log("⏳ Bắt đầu chạy Cron Job: Khởi tạo thông báo thời tiết...");
    
    try {
        // 1. Lấy tọa độ thời tiết mặc định (Ví dụ: Trấn Biên, Đồng Nai)
        const lat = 10.9574; 
        const lon = 106.8427;
        let temp = 30;
        let weatherDesc = "Trời nắng";
        const apiKey = process.env.WEATHER_API_KEY;

        if (apiKey) {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`);
            const data = await response.json();
            temp = Math.round(data.main.temp);
            weatherDesc = data.weather[0].description;
        }

        const isHot = temp >= 25;
        const isRaining = weatherDesc.toLowerCase().includes("mưa");

        // 2. Định hình nội dung thông báo
        let title = isHot ? "Gợi ý đồ thoáng mát ☀️" : "Cần giữ ấm nhé ❄️";
        if (isRaining) title = "Nhớ mang theo ô/áo mưa 🌧️";

        const message = `Sáng nay trời ${weatherDesc} (${temp}°C). Bạn hãy ưu tiên chọn trang phục ${isHot ? 'thoáng mát, thấm hút mồ hôi' : 'giữ ấm cơ thể'} để có một ngày thật năng suất nhé!`;

        // 3. Lấy toàn bộ danh sách User ID
        const users = await prisma.user.findMany({
            select: { id: true }
        });

        if (users.length === 0) return;

        // 4. Tạo mảng dữ liệu để insert nhiều dòng cùng lúc (Bulk Insert giúp tối ưu hiệu suất)
        const notificationsData = users.map(user => ({
            userId: user.id,
            title: title,
            message: message,
            type: 'WEATHER', // Đảm bảo bạn đã thêm trường 'type' vào bảng Notification trong Prisma như đã bàn trước đó
        }));

        await prisma.notification.createMany({
            data: notificationsData
        });

        console.log(`✅ Đã tạo thành công thông báo cho ${users.length} người dùng.`);

    } catch (error) {
        console.error("❌ Lỗi khi chạy Cron Job tạo thông báo:", error.message);
    }
};

// Cấu hình chạy vào đúng 7:00 sáng mỗi ngày
// Cú pháp: Giây (tùy chọn) | Phút (0) | Giờ (7) | Ngày trong tháng (*) | Tháng (*) | Ngày trong tuần (*)
const initCronJobs = () => {
    // 1. GỌI TRỰC TIẾP HÀM NÀY ĐỂ TEST NGAY LẬP TỨC KHI VỪA SAVE CODE
    // console.log("🛠️ Chạy test thủ công ngay lập tức...");
    // generateMorningOutfitSuggestion();
    // 2. Lịch chạy tự động vào 7h sáng
    cron.schedule('0 7 * * *', generateMorningOutfitSuggestion, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" // Đảm bảo chạy theo giờ Việt Nam
    });
    console.log("🕒 Hệ thống Cron Job đã được kích hoạt.");
};

module.exports = initCronJobs;