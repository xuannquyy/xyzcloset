import io
import math
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import rembg
import mediapipe as mp
import base64

app = FastAPI(
    title="XYZ CLOSET - AI Microservice",
    description="API xử lý tách nền trang phục, phân tích dáng người thực tế và thử đồ ảo (VTON).",
    version="1.0.0"
)

import mediapipe.python.solutions.pose as mp_pose
pose_model = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)

# Định nghĩa cấu trúc dữ liệu đầu vào nhận từ Node.js Backend thông qua HTTP Post
class ImageUrlInput(BaseModel):
    image_url: str

class VtonInput(BaseModel):
    person_url: str
    garment_url: str

def download_image(url: str) -> Image.Image:
    """
    Hàm bổ trợ tải ảnh từ một URL (link tạm thời từ Cloudinary).
    Chuyển đổi dữ liệu nhị phân tải về thành đối tượng PIL Image để AI xử lý ngầm trong RAM.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content))
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Không thể tải hoặc đọc hình ảnh từ URL cung cấp: {str(e)}"
        )

# =====================================================================
# 1. API TÁCH NỀN QUẦN ÁO (Sử dụng thư viện rembg)
# =====================================================================
@app.post("/api/ai/remove-bg", summary="Tách nền quần áo tự động")
async def remove_background(data: ImageUrlInput):
    input_image = download_image(data.image_url)
    
    try:
        # Bóc phông nền
        output_image = rembg.remove(input_image)
        
        # Lưu vào bộ nhớ đệm
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        
        # CHUẨN HÓA: Mã hóa bức ảnh thành chuỗi Base64 để truyền qua mạng an toàn
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        # Trả về chuỗi JSON đàng hoàng cho Node.js dễ đọc
        return {
            "success": True,
            "processedImageBase64": f"data:image/png;base64,{img_base64}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gặp lỗi trong tiến trình bóc tách phông nền trang phục: {str(e)}"
        )

# =====================================================================
# 2. API PHÂN TÍCH DÁNG NGƯỜI (Sử dụng Google MediaPipe)
# =====================================================================
@app.post("/api/ai/analyze-body-shape", summary="Phân tích dáng người chuẩn AI")
async def analyze_body_shape(data: ImageUrlInput):
    """
    Nhận vào URL ảnh chụp toàn thân đứng thẳng. AI đo đạc tỷ lệ khoảng cách giữa 
    bờ Vai (Shoulders) và Hông (Hips) để xác định chính xác hình thể học của người dùng.
    """
    # 1. Tải ảnh về và chuẩn hóa sang không gian màu RGB chuẩn mã nguồn OpenCV/MediaPipe
    pil_img = download_image(data.image_url).convert('RGB')
    image_np = np.array(pil_img)
    
    # 2. Đưa mảng pixel ảnh vào mô hình AI MediaPipe Pose trích xuất các điểm neo xương cơ thể
    results = pose_model.process(image_np)
    
    # Nếu bức ảnh chụp thiếu bộ phận hoặc mờ, không tìm thấy khung xương thì báo lỗi ngay
    if not results.pose_landmarks:
        raise HTTPException(
            status_code=400, 
            detail="AI không nhận diện được vóc dáng cơ thể. Hãy đảm bảo ảnh chụp đứng thẳng, rõ từ đầu đến chân và không có vật cản!"
        )
    
    # 3. Lấy danh sách tọa độ các điểm then chốt (Giá trị x, y chạy tương đối từ 0.0 -> 1.0)
    landmarks = results.pose_landmarks.landmark
    
    # Trích xuất mã định danh các điểm mốc Vai và Hông theo giải phẫu học cơ thể của Google
    LEFT_SHOULDER = mp_pose.PoseLandmark.LEFT_SHOULDER
    RIGHT_SHOULDER = mp_pose.PoseLandmark.RIGHT_SHOULDER
    LEFT_HIP = mp_pose.PoseLandmark.LEFT_HIP
    RIGHT_HIP = mp_pose.PoseLandmark.RIGHT_HIP
    
    # --- BẮT ĐẦU ĐOẠN SỬA: KIỂM TRA ĐỘ ĐỨNG THẲNG TRỤC Z ---
    shoulder_z_diff = abs(landmarks[LEFT_SHOULDER].z - landmarks[RIGHT_SHOULDER].z)
    if shoulder_z_diff > 0.15:
        raise HTTPException(
            status_code=400, 
            detail="Bạn đang đứng xoay người. Vui lòng đứng thẳng, đối diện trực tiếp với camera để AI đo tỷ lệ chính xác!"
        )
    # --- KẾT THÚC ĐOẠN SỬA ---

    # Hàm tính khoảng cách Euclid chiều ngang (trục X) giữa hai cột mốc cơ thể
    def get_distance_width(point1, point2):
        return math.sqrt((landmarks[point1].x - landmarks[point2].x) ** 2)

    # Tính chiều cao của khung xương trên ảnh
    pose_height = abs(landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y - landmarks[mp_pose.PoseLandmark.NOSE].y)
    
    # Nếu pose chiếm chưa tới 30% chiều cao ảnh thì báo lỗi (ảnh quá xa)
    if pose_height < 0.3:
        raise HTTPException(status_code=400, detail="Ảnh quá xa, vui lòng chụp gần hơn để AI phân tích chính xác!")

    # 4. Tính toán kích thước bề ngang tương đối của Vai và Hông từ ảnh chụp
    shoulder_width = get_distance_width(LEFT_SHOULDER, RIGHT_SHOULDER)
    hip_width = get_distance_width(LEFT_HIP, RIGHT_HIP)
    
    if shoulder_width == 0 or hip_width == 0:
        raise HTTPException(
            status_code=400, 
            detail="Dữ liệu trích xuất chỉ số cơ thể không hợp lệ. Vui lòng thử lại với một bức ảnh khác."
        )

    # 5. THUẬT TOÁN PHÂN TÍCH HÌNH THỂ HỌC (So sánh tỷ lệ toán học chiều ngang)
    # Tính tỷ số tương quan giữa Chiều rộng Vai / Chiều rộng Hông
    ratio = shoulder_width / hip_width
    
    shape_result = "Dáng Chữ Nhật"  # Đặt làm mốc cơ bản (Default fallback)
    
    if ratio > 1.15: 
        shape_result = "Dáng Tam Giác Ngược"
    # Thu hẹp ngưỡng Quả Lê
    elif ratio < 0.90:
        shape_result = "Dáng Quả Lê"
    # Dáng Chữ nhật chiếm đa số (cơ bản)
    elif 0.95 <= ratio <= 1.10:
        shape_result = "Dáng Chữ Nhật"
    else:
        # Nếu nằm ở khoảng giữa, ưu tiên Đồng hồ cát nếu cần hoặc để mặc định
        shape_result = "Dáng Đồng Hồ Cát"

    # Trả về kết quả phân tích dạng JSON cực kỳ tường minh
    return {
        "success": True,
        "metrics": {
            "shoulder_width_ratio": round(shoulder_width, 4),
            "hip_width_ratio": round(hip_width, 4),
            "calculated_ratio": round(ratio, 4)
        },
        "shapeResult": shape_result
    }

if __name__ == "__main__":
    import uvicorn
    # Kích hoạt chạy cục bộ Server tại cổng 8000, reload=True giúp tự khởi động lại khi sửa code
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)