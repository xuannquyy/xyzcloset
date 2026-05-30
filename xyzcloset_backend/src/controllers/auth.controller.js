const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Thêm thư viện cấp thẻ (Token)
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Chức năng Đăng ký (Register)
const register = async (req, res) => {
    try {
        // Lấy dữ liệu từ App gửi lên
        const { fullName, email, password } = req.body;

        // 1. Kiểm tra xem người dùng đã điền đủ thông tin chưa
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
        }

        // 2. Kiểm tra xem email này đã có ai đăng ký chưa
        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });
        if (existingUser) {
            return res.status(400).json({ message: "Email này đã được sử dụng!" });
        }

        // 3. Mã hóa mật khẩu (Băm 10 vòng cho an toàn)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Lưu User mới vào Database MongoDB
        const newUser = await prisma.user.create({
            data: {
                fullName: fullName,
                email: email,
                password: hashedPassword // Lưu mật khẩu đã mã hóa, KHÔNG lưu mật khẩu gốc
            }
        });

        // 5. Báo thành công (Xóa pass khỏi cục data trả về cho an toàn)
        delete newUser.password;
        res.status(201).json({ 
            message: "Đăng ký tài khoản thành công!", 
            user: newUser 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// Chức năng Đăng nhập (Login)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Kiểm tra xem người dùng có nhập đủ không
        if (!email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu!" });
        }

        // 2. Tìm người dùng trong Database bằng email
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({ message: "Tài khoản không tồn tại!" });
        }

        // 3. So sánh mật khẩu người dùng nhập với mật khẩu đã băm trong Database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Mật khẩu không chính xác!" });
        }

        // 4. Tạo Thẻ VIP (Token) có thời hạn 7 ngày
        // Lấy chữ ký bí mật từ file .env (JWT_SECRET)
        const token = jwt.sign(
            { userId: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // 5. Trả về kết quả (Xóa pass đi trước khi trả về để bảo mật)
        delete user.password;
        res.status(200).json({
            message: "Đăng nhập thành công!",
            user: user,
            token: token // Đây chính là chìa khóa để App dùng về sau
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

// =======================================================
// 1. CHỨC NĂNG QUÊN MẬT KHẨU (Gửi mã OTP)
// =======================================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email!" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản với email này!" });
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Cài đặt thời gian hết hạn là 15 phút kể từ bây giờ
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

        // Lưu mã OTP và hạn sử dụng vào Database
        await prisma.user.update({
            where: { email },
            data: { resetOtp: otp, resetOtpExpiry: otpExpiry }
        });

        // Cấu hình trạm gửi email (Nodemailer)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Nội dung Email cực kỳ chuyên nghiệp
        const mailOptions = {
            from: `"XYZ CLOSET" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thiết lập lại mật khẩu - XYZ CLOSET',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #560F20;">
                    <h2>Xin chào ${user.fullName},</h2>
                    <p>Bạn vừa yêu cầu khôi phục mật khẩu tại ứng dụng <b>XYZ CLOSET</b>.</p>
                    <p>Dưới đây là mã xác nhận (OTP) của bạn. Mã này sẽ hết hạn sau 15 phút:</p>
                    <h1 style="background-color: #791127; color: #FFFFFF; padding: 10px 20px; display: inline-block; letter-spacing: 5px; border-radius: 8px;">
                        ${otp}
                    </h1>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                    <p>Trân trọng,<br>Đội ngũ XYZ CLOSET</p>
                </div>
            `
        };

        // Bắt đầu gửi email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Mã xác nhận đã được gửi đến email của bạn!" });

    } catch (error) {
        console.error("Lỗi gửi mail:", error);
        res.status(500).json({ message: "Không thể gửi email lúc này. Vui lòng thử lại sau.", error: error.message });
    }
};

// =======================================================
// 2. CHỨC NĂNG ĐẶT LẠI MẬT KHẨU (Xác nhận OTP)
// =======================================================
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Vui lòng cung cấp đủ thông tin!" });
        }

        // Tìm User xem có đúng mã OTP không
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng!" });
        }

        // Kiểm tra tính hợp lệ của mã OTP
        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: "Mã xác nhận không chính xác!" });
        }

        if (new Date() > user.resetOtpExpiry) {
            return res.status(400).json({ message: "Mã xác nhận đã hết hạn, vui lòng gửi lại yêu cầu!" });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật pass mới và XÓA mã OTP đi để bảo mật
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                resetOtp: null,
                resetOtpExpiry: null
            }
        });

        res.status(200).json({ message: "Tuyệt vời! Đặt lại mật khẩu thành công. Hãy đăng nhập lại." });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};