const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Lưu Set đồ mới
const createOutfit = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, wardrobeItemIds, tagIds } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng cung cấp ảnh ghép của Set đồ!" });
        }
        const canvasImageUrl = req.file.path;

        let parsedItemIds = [];
        if (wardrobeItemIds) {
            try { parsedItemIds = JSON.parse(wardrobeItemIds); } 
            catch { parsedItemIds = Array.isArray(wardrobeItemIds) ? wardrobeItemIds : [wardrobeItemIds]; }
        }

        let parsedTagIds = [];
        if (tagIds) {
            try { parsedTagIds = JSON.parse(tagIds); } 
            catch { parsedTagIds = Array.isArray(tagIds) ? tagIds : [tagIds]; }
        }

        const newOutfit = await prisma.outfit.create({
            data: {
                name,
                canvasImageUrl,
                userId,
                // ✅ ĐÃ SỬA THÀNH CONNECT ĐỂ PRISMA ĐỒNG BỘ 2 CHIỀU
                wardrobeItems: {
                    connect: parsedItemIds.map(id => ({ id: id }))
                },
                tags: {
                    connect: parsedTagIds.map(id => ({ id: id }))
                }
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
                wardrobeItems: true,
                tags: true // Bổ sung dòng này để lấy thông tin thẻ
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