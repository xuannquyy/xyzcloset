const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createTag = async (req, res) => {
    try {
        const { name, type } = req.body; // type có thể là: 'Mùa', 'Hoàn cảnh', 'Phong cách'
        const newTag = await prisma.tag.create({
            data: { name, type }
        });
        res.status(201).json({ message: "Tạo Tag thành công", tag: newTag });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const getAllTags = async (req, res) => {
    try {
        const tags = await prisma.tag.findMany();
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = { createTag, getAllTags };