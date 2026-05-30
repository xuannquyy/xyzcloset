const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Thêm đồ mới vào tủ (HỖ TRỢ TÍNH NĂNG CLONE TỪ SHOPEE)
const createItem = async (req, res) => {
    try {
        const userId = req.userId; // Lấy từ token (auth.middleware)
        
        // 🟢 Nhận tất cả thông số VIP và thêm trường existingImageUrl
        const { 
            name, categoryId, tagIds, 
            size, color, material, careInstructions, notes,
            existingImageUrl 
        } = req.body;
        
        // 🟢 LOGIC ẢNH THÔNG MINH:
        // Ưu tiên file upload mới, nếu không có thì dùng link có sẵn (phục vụ tính năng Clone đồ Shopee)
        let finalImageUrl = '';
        if (req.file) {
            finalImageUrl = req.file.path; // Ảnh vừa chụp/chọn được đẩy lên mây
        } else if (existingImageUrl) {
            finalImageUrl = existingImageUrl; // Lấy thẳng link ảnh có sẵn (Shopee)
        } else {
            return res.status(400).json({ message: "Vui lòng cung cấp hình ảnh cho món đồ!" });
        }

        // Xử lý mảng Tag
        let parsedTagIds = [];
        if (tagIds) {
            try { parsedTagIds = JSON.parse(tagIds); } 
            catch { parsedTagIds = Array.isArray(tagIds) ? tagIds : [tagIds]; }
        }

        const newItem = await prisma.wardrobeItem.create({
            data: {
                name,
                imageUrl: finalImageUrl, // Dùng link ảnh đã phân loại
                userId,
                categoryId,
                tagIds: parsedTagIds,
                // LƯU CÁC THÔNG SỐ VIP
                size,
                color,
                material,
                careInstructions,
                notes
            }
        });

        res.status(201).json({ message: "Thêm vào tủ đồ thành công!", item: newItem });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 2. Lấy toàn bộ tủ đồ của User
const getMyWardrobe = async (req, res) => {
    try {
        const items = await prisma.wardrobeItem.findMany({
            where: { 
                userId: req.userId,
                isDeleted: false
            },
            include: {
                category: true,
                tags: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 3. Lấy chi tiết 1 món đồ
const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.wardrobeItem.findFirst({
            where: { id: id, userId: req.userId, isDeleted: false },
            include: { category: true, tags: true }
        });

        if (!item) return res.status(404).json({ message: "Không tìm thấy món đồ này!" });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 4. Sửa thông tin món đồ
const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, categoryId, tagIds, 
            size, color, material, careInstructions, notes 
        } = req.body;
        
        let updateData = { 
            name, categoryId, 
            size, color, material, careInstructions, notes 
        };

        // Nếu có gửi ảnh mới lên thì cập nhật
        if (req.file) {
            updateData.imageUrl = req.file.path;
        }

        // Cập nhật tags
        if (tagIds) {
            try { updateData.tagIds = JSON.parse(tagIds); } 
            catch { updateData.tagIds = Array.isArray(tagIds) ? tagIds : [tagIds]; }
        }

        const updatedItem = await prisma.wardrobeItem.update({
            where: { id: id },
            data: updateData
        });

        res.status(200).json({ message: "Cập nhật thành công!", item: updatedItem });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 5. Xóa mềm (Đưa isDeleted = true)
const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.wardrobeItem.update({
            where: { id: id },
            data: { isDeleted: true }
        });
        res.status(200).json({ message: "Đã xóa món đồ khỏi tủ!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 6. Lấy danh sách quần áo mẫu (Có sẵn)
const getPublicWardrobe = async (req, res) => {
    try {
        const items = await prisma.publicItem.findMany({
            include: { category: true }
        });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// 7. Dọn sạch tủ đồ
const clearMyWardrobe = async (req, res) => {
    try {
        await prisma.wardrobeItem.updateMany({
            where: { userId: req.userId },
            data: { isDeleted: true }
        });
        
        await prisma.outfit.deleteMany({
            where: { userId: req.userId }
        });

        res.status(200).json({ message: "Đã dọn sạch tủ đồ của bạn!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { 
    createItem, getMyWardrobe, getItemById, 
    updateItem, deleteItem, getPublicWardrobe, clearMyWardrobe
};