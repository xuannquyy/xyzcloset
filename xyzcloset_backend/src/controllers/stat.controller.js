const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getWardrobeStats = async (req, res) => {
    try {
        // Lấy tất cả đồ của user
        const items = await prisma.wardrobeItem.findMany({
            where: { userId: req.userId, isDeleted: false },
            include: { category: true }
        });

        const totalItems = items.length;

        // Gom nhóm đếm số lượng theo Category (Danh mục)
        const categoryStats = {};
        items.forEach(item => {
            const catName = item.category ? item.category.name : 'Khác';
            if (categoryStats[catName]) {
                categoryStats[catName] += 1;
            } else {
                categoryStats[catName] = 1;
            }
        });

        // Chuyển đổi object thành mảng để Frontend dễ dùng vẽ biểu đồ
        // Ví dụ: [{ name: "Áo", count: 5 }, { name: "Quần", count: 3 }]
        const formattedCategoryStats = Object.keys(categoryStats).map(key => ({
            name: key,
            count: categoryStats[key]
        }));

        res.status(200).json({
            totalItems,
            categoryStats: formattedCategoryStats
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { getWardrobeStats };