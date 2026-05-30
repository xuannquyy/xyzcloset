const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createCategory = async (req, res) => {
    try {
        const { name, iconUrl } = req.body;
        const newCategory = await prisma.category.create({
            data: { name, iconUrl }
        });
        res.status(201).json({ message: "Tạo danh mục thành công", category: newCategory });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { createCategory, getAllCategories };