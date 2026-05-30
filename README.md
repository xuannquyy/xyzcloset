🛠 Hướng dẫn Setup Project cho thành viên nhóm
Sau khi các bạn git clone project về máy, hãy thực hiện theo các bước sau:

1. Cấu hình Backend (xyzcloset_backend)
Các bạn không cần tạo thư mục mới, chỉ cần cài đặt môi trường có sẵn:
Bước 1: Mở Terminal, di chuyển vào thư mục: cd xyzcloset_backend
Bước 2: Cài đặt toàn bộ thư viện đã chọn: npm install --legacy-peer-deps

Bước 3: Tạo file .env (vì file này thường bị Git chặn). Các bạn copy dòng kết nối SQL Server của mình vào đó:
PORT=5000
JWT_SECRET="Chuoi_Bao_Mat_XYZCloset_Cua_Quy_2026"
DATABASE_URL="mongodb+srv://vxq_db_user:Abc123@cluster0.7drasto.mongodb.net/XYZClosetDB?retryWrites=true&w=majority"
CLOUDINARY_CLOUD_NAME="ddvgrpzey"
CLOUDINARY_API_KEY="196981845467679"
CLOUDINARY_API_SECRET="fQEk4HplzFcFjsvZ8eAlj4FmSeM"
WEATHER_API_KEY="7d667d05032062a5023ba9ff01b52469"
EMAIL_USER="vienxuanquy82024@gmail.com"
EMAIL_PASS="fukfzijulunfqpze"

Bước 4: Đồng bộ Prisma
npx prisma generate

Bước 5: Chạy Server: npm run dev (hoặc npx nodemon index.js).

2. Cấu hình Mobile App (xyzcloset_app)
Bước 1: Di chuyển vào thư mục: cd xyzcloset_app.
Bước 2: Cài đặt thư viện: npm install.
Bước 3: LƯU Ý CỰC QUAN TRỌNG VỀ AXIOS:
Để tránh lỗi Cannot call a class as a function, các bạn cần đảm bảo bản axios là 0.27.2. Nếu máy bạn nào báo lỗi đó, hãy chạy lệnh:
npm install axios@0.27.2 --save-exact

Bước 4: Cài đặt các lõi hệ thống khác:
npx expo install react-native-safe-area-context react-native-screens react-native-svg
Bước 5: Cấu hình kết nối mạng (IP Address):
Mở file src/api/axiosClient.js.
Tìm dòng const IP_ADDRESS = '...'.
Mở cmd gõ ipconfig, tìm số IPv4 của máy mình và thay vào đó.
Lưu ý: Điện thoại và máy tính phải bắt chung một Wi-Fi.
- Chạy ứng dụng
npx expo start -c

3. Python AI
# tải phần mềm và cài đặt ban đầu
https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe
cd xyzcloset_ai
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
# Chạy ứng dụng
# Kích hoạt môi trường ảo venv (Dành cho Windows Powershell / CMD)
.\venv\Scripts\activate
# Chạy lại file server
python main.py 


----------------------------------------------------------
mấy cái chạy lúc đầu
1. Backend JavaScript --->> Vào cd xyzcloset_backend
# Tạo thư mục mới cho Backend JS
mkdir xyzcloset_backend
cd xyzcloset_backend
# Khởi tạo project Node.js (Nó sẽ đẻ ra file package.json)
npm init -y
# Cài các thư viện chạy chính
npm install express cors dotenv jsonwebtoken bcrypt
npm install prisma@5 @prisma/client@5 nodemon --save-dev
npm install cloudinary multer multer-storage-cloudinary --legacy-peer-deps
npm install nodemailer --legacy-peer-deps
npm install axios --legacy-peer-deps
# Khởi tạo Prisma kết nối với MongoDB:
npx prisma init
# (Để hệ thống nhận diện cấu trúc mới).
npx prisma generate
# (Để đẩy thẳng cấu trúc này lên đám mây MongoDB).
npx prisma db push

# Chạy
npm run dev (hoặc npx nodemon src/index.js)
# Seed data
npx prisma db seed 



2. Mobile ---->cd xyzcloset_app
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install react-native-vector-icons
npm install axios@0.27.2 --save-exact
npx expo install expo-font @expo-google-fonts/be-vietnam-pro
npx expo install @react-native-async-storage/async-storage
npx expo install expo-image-picker
npx expo install react-native-view-shot
npx expo install expo-location
npx expo install expo-image
npx expo install expo-linear-gradient




vào axiosClient.js đổi const IP_ADDRESS = '192.168.1.2';  thành ip máy tính mình
npx expo start

test api python
http://127.0.0.1:8000/docs
