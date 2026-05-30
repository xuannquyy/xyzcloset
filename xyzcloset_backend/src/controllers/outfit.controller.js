const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Lưu Set đồ mới
const createOutfit = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, wardrobeItemIds } = req.body;

        // Bắt buộc phải có ảnh ghép của set đồ
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng cung cấp ảnh ghép của Set đồ!" });
        }
        const canvasImageUrl = req.file.path;

        // Xử lý mảng ID quần áo được gửi lên
        let parsedItemIds = [];
        if (wardrobeItemIds) {
            try { parsedItemIds = JSON.parse(wardrobeItemIds); } 
            catch { parsedItemIds = Array.isArray(wardrobeItemIds) ? wardrobeItemIds : [wardrobeItemIds]; }
        }

        const newOutfit = await prisma.outfit.create({
            data: {
                name,
                canvasImageUrl,
                userId,
                wardrobeItemIds: parsedItemIds
            }
        });

        res.status(201).json({ message: "Lưu Set đồ thành công!", outfit: newOutfit });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 2. Lấy danh sách các Set đồ của người dùng
const getMyOutfits = async (req, res) => {
    try {
        const outfits = await prisma.outfit.findMany({
            where: { userId: req.userId },
            include: {
                wardrobeItems: true // Tự động móc nối lấy chi tiết các món đồ có trong Set này
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(outfits);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 3. Lấy chi tiết 1 Set đồ
const getOutfitById = async (req, res) => {
    try {
        const { id } = req.params;
        const outfit = await prisma.outfit.findFirst({
            where: { id: id, userId: req.userId },
            include: { wardrobeItems: true }
        });

        if (!outfit) return res.status(404).json({ message: "Không tìm thấy Set đồ này!" });
        res.status(200).json(outfit);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 4. Xóa Set đồ (Xóa cứng)
const deleteOutfit = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.outfit.delete({
            where: { id: id }
        });
        res.status(200).json({ message: "Đã xóa Set đồ!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { createOutfit, getMyOutfits, getOutfitById, deleteOutfit };