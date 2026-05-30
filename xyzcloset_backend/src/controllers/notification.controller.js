const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: id },
            data: { isRead: true }
        });
        res.status(200).json({ message: "Đã đánh dấu đọc." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { getMyNotifications, markAsRead };