const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Lấy token từ header của request gửi lên
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Tách chữ "Bearer " ra khỏi token

    if (!token) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập hoặc không có quyền truy cập!" });
    }

    try {
        // Giải mã token bằng chìa khóa bí mật
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Gắn ID của User vào request để các API sau sử dụng
        next(); // Cho phép đi tiếp vào API
    } catch (error) {
        return res.status(403).json({ message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ!" });
    }
};

module.exports = { verifyToken };