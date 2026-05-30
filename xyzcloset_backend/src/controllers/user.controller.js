const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2; // THÊM DÒNG NÀY ĐỂ GỌI HÀM XÓA ẢNH
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng!" });
        
        delete user.password;
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

const updateMe = async (req, res) => {
    try {
        const { fullName } = req.body;
        let updateData = {};

        if (fullName) updateData.fullName = fullName;
        
        // NẾU CÓ ẢNH MỚI ĐƯỢC UP LÊN
        if (req.file) {
            // 1. Tìm user hiện tại để lấy link ảnh cũ
            const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });

            // 2. Thuật toán dọn rác: Xóa ảnh cũ trên Cloudinary
            if (currentUser.avatarUrl && currentUser.avatarUrl.includes('cloudinary')) {
                // Tách link để lấy thư mục và tên file (public_id)
                const urlParts = currentUser.avatarUrl.split('/');
                const filename = urlParts.pop().split('.')[0]; 
                const folder = urlParts.pop(); 
                const publicId = `${folder}/${filename}`;

                // Ra lệnh xóa ảnh cũ trên mây
                await cloudinary.uploader.destroy(publicId);
            }

            // 3. Cập nhật link ảnh mới vào DB
            updateData.avatarUrl = req.file.path;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: updateData
        });

        delete updatedUser.password;
        res.status(200).json({ message: "Cập nhật thành công!", user: updatedUser });
    } catch (error) {
        console.error("LỖI UPDATE PROFILE:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // 1. Tìm user
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        
        // 2. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });

        // 3. Hash mật khẩu mới và cập nhật
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await prisma.user.update({
            where: { id: req.userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};
module.exports = { getMe, updateMe, changePassword };