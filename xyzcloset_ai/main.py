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
@app.post("/api/ai/analyze-body-shape", summary="Phân tích dáng người chuẩn AI (Hybrid Silhouette)")
async def analyze_body_shape(data: ImageUrlInput):
    # 1. Tải ảnh gốc
    pil_img_original = download_image(data.image_url)

    # 2. XÓA NỀN ĐỂ LẤY ĐƯỜNG BAO CƠ THỂ (SILHOUETTE)
    try:
        pil_img_nobg = rembg.remove(pil_img_original)
        img_nobg_np = np.array(pil_img_nobg) # Dạng RGBA
        # Trích xuất kênh Alpha (độ trong suốt) làm mặt nạ quét
        alpha_channel = img_nobg_np[:, :, 3] 
    except Exception as e:
        raise HTTPException(status_code=500, detail="Lỗi khi tách nền phân tích viền.")

    # 3. DÙNG MEDIAPIPE LÀM "LA BÀN" TÌM TRỤC Y CỦA VAI & HÔNG
    pil_img_rgb = pil_img_original.convert('RGB')
    image_np = np.array(pil_img_rgb)
    results = pose_model.process(image_np)
    
    if not results.pose_landmarks:
        raise HTTPException(
            status_code=400, 
            detail="AI không nhận diện được khung xương để làm hệ quy chiếu."
        )
    
    landmarks = results.pose_landmarks.landmark
    h, w = alpha_channel.shape
    
    LEFT_SHOULDER = mp_pose.PoseLandmark.LEFT_SHOULDER
    RIGHT_SHOULDER = mp_pose.PoseLandmark.RIGHT_SHOULDER
    LEFT_HIP = mp_pose.PoseLandmark.LEFT_HIP
    RIGHT_HIP = mp_pose.PoseLandmark.RIGHT_HIP
    
    # Tính tọa độ Y (chiều dọc) của Vai và Hông
    shoulder_y_rel = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2
    hip_y_rel = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2
    
    # Suy ra tọa độ Y của Eo (Nằm ở khoảng 45% quãng đường từ Vai xuống Hông)
    waist_y_rel = shoulder_y_rel + (hip_y_rel - shoulder_y_rel) * 0.45
    
    # Đổi tỷ lệ tương đối thành Pixel thực tế trên ảnh
    shoulder_y_px = int(shoulder_y_rel * h)
    hip_y_px = int(hip_y_rel * h)
    waist_y_px = int(waist_y_rel * h)

    # 4. THƯỚC DÂY PIXEL: Hàm đo chiều ngang của cơ thể
    def get_silhouette_width(y_center, window_size=15):
        max_width = 0
        # Quét một vùng nhỏ (vd: 30 pixel) lên/xuống quanh điểm Y để chống nhiễu do nếp gấp quần áo
        start_y = max(0, y_center - window_size)
        end_y = min(h, y_center + window_size)
        
        for y in range(start_y, end_y):
            row = alpha_channel[y, :]
            # Lấy tất cả tọa độ X có pixel hiển thị (không trong suốt)
            flesh_pixels = np.where(row > 50)[0]
            if len(flesh_pixels) > 0:
                width = flesh_pixels[-1] - flesh_pixels[0]
                if width > max_width:
                    max_width = width
        return max_width

    # Tiến hành đo đạc 3 vòng bằng pixel
    shoulder_width = get_silhouette_width(shoulder_y_px)
    waist_width = get_silhouette_width(waist_y_px)
    hip_width = get_silhouette_width(hip_y_px)

    if shoulder_width == 0 or hip_width == 0 or waist_width == 0:
        raise HTTPException(status_code=400, detail="Phông nền phức tạp khiến AI không thể xác định được viền cơ thể ngoài.")

    # 5. THUẬT TOÁN ĐỊNH DÁNG TRÊN KÍCH THƯỚC THỰC (PIXEL)
    s_h_ratio = shoulder_width / hip_width
    w_s_ratio = waist_width / shoulder_width
    w_h_ratio = waist_width / hip_width

    # Thiết lập ngưỡng chênh lệch 5-7% cho độ chính xác cao
    if 0.93 <= s_h_ratio <= 1.07 and w_s_ratio < 0.85 and w_h_ratio < 0.85:
        shape_result = "Dáng Đồng Hồ Cát"
    elif s_h_ratio > 1.05:
        shape_result = "Dáng Tam Giác Ngược"
    elif s_h_ratio < 0.95:
        shape_result = "Dáng Quả Lê"
    elif w_s_ratio >= 0.95 or w_h_ratio >= 0.95:
        shape_result = "Dáng Quả Táo"
    else:
        shape_result = "Dáng Chữ Nhật"

    return {
        "success": True,
        "metrics": {
            "shoulder_width": int(shoulder_width),
            "hip_width": int(hip_width),
            "calculated_ratio": round(s_h_ratio, 3)
        },
        "shapeResult": shape_result
    }

if __name__ == "__main__":
    import uvicorn
    # Kích hoạt chạy cục bộ Server tại cổng 8000, reload=True giúp tự khởi động lại khi sửa code
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)