import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/theme';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [language, setLanguage] = useState('vi');

    useEffect(() => {
        const loadSettings = async () => {
            const savedTheme = await AsyncStorage.getItem('isDarkMode');
            const savedLang = await AsyncStorage.getItem('language');
            if (savedTheme !== null) setIsDarkMode(JSON.parse(savedTheme));
            if (savedLang !== null) setLanguage(savedLang);
        };
        loadSettings();
    }, []);

    const toggleTheme = async (value) => {
        setIsDarkMode(value);
        await AsyncStorage.setItem('isDarkMode', JSON.stringify(value));
    };

    const toggleLanguage = async (lang) => {
        setLanguage(lang);
        await AsyncStorage.setItem('language', lang);
    };

    const theme = isDarkMode ? darkColors : lightColors;

    // TỪ ĐIỂN SONG NGỮ (Cho 2 màn hình đầu tiên)
    const translations = {
        vi: {
            profile_title: "Hồ sơ của bạn",
            email_empty: "Email chưa cập nhật",
            account_settings: "Cài đặt tài khoản",
            privacy_settings: "Cài đặt & Quyền riêng tư",
            logout: "Đăng xuất",
            confirm: "Xác nhận",
            confirm_logout: "Bạn có chắc chắn muốn đăng xuất không?",
            cancel: "Hủy",
            version: "Phiên bản 1.0.0 - XYZ CLOSET",
            
            settings_title: "Cài đặt",
            display_lang: "Hiển thị & Ngôn ngữ",
            dark_mode: "Chế độ tối (Dark Mode)",
            lang_label: "Ngôn ngữ",
            wardrobe_security: "Tủ đồ & Bảo mật",
            daily_reminder: "Nhắc nhở phối đồ hằng ngày",
            app_lock: "Khóa ứng dụng",
            app_lock_desc: "Yêu cầu FaceID/Vân tay",
            support_info: "Hỗ trợ & Thông tin",
            faq: "Câu hỏi thường gặp (FAQ)",
            feedback: "Gửi phản hồi cho chúng tôi",
            share: "Chia sẻ ứng dụng",
            policy: "Điều khoản & Chính sách",
            delete_data: "Xóa toàn bộ dữ liệu tủ đồ",
            greeting: "Chào bạn,",
            weather_loading: "Đang tải...",
            today_outfit: "Hôm nay mặc gì?",
            change_outfit: "Đổi bộ khác",
            top: "Áo",
            bottom: "Quần/Váy",
            recently_added: "Mới thêm vào tủ",
            see_all: "Xem tất cả",
            add_new: "Thêm",
            empty_recent: "Bạn chưa có món đồ nào.",
            body_shape_analysis: "Phân tích dáng người",
            body_shape_desc: "Khám phá phong cách chuẩn AI",
            my_wardrobe: "Tủ đồ của bạn",
            available_tab: "Có sẵn",
            personal_tab: "Quần áo của bạn",
            search_placeholder: "Tìm kiếm quần áo...",
            all: "Tất cả",
            empty_search: "Không tìm thấy món đồ nào phù hợp.",
            empty_personal: "Tủ đồ đang trống, thêm món đồ đầu tiên ngay nhé!",
            empty_public: "Chưa có dữ liệu mẫu.",
            add_item_title: "Thêm đồ mới",
            tap_to_add: "Chạm để chọn hoặc chụp ảnh",
            item_name: "Tên món đồ",
            item_name_placeholder: "Ví dụ: Áo thun trắng Basic",
            category: "Danh mục",
            tags: "Thẻ phân loại",
            save_to_wardrobe: "Lưu vào tủ đồ",
            camera_title: "Thêm ảnh món đồ",
            camera_desc: "Bạn muốn lấy ảnh từ đâu?",
            take_photo: "Chụp ảnh mới",
            choose_gallery: "Chọn từ thư viện",
            full_name: "Họ và tên",
            enter_name: "Nhập tên của bạn",
            email_readonly: "Email (Không thể thay đổi)",
            tap_to_change_avatar: "Chạm để thay đổi ảnh đại diện",
            save_changes: "Lưu thay đổi",
            fitting_room: "Phòng thử đồ",
            canvas_hint: "Chạm vào món đồ bên dưới và kéo thả tự do trên khung hình này",
            save_outfit: "Lưu Set Đồ Này",
            your_wardrobe: "Tủ đồ của bạn",
            my_collection: "Bộ Sưu Tập Của Tôi",
            created_date: "Tạo ngày: ",
            empty_collection: "Chưa có set đồ nào được lưu. Hãy vào Phòng thử đồ và sáng tạo ngay nhé!",
            tab_home: "Trang chủ",
            tab_wardrobe: "Tủ đồ",
            tab_outfit: "Phối đồ",
            tab_profile: "Hồ sơ",
            change_password: "Đổi mật khẩu",
            current_password: "Mật khẩu hiện tại",
            new_password: "Mật khẩu mới",
            confirm_new_password: "Xác nhận mật khẩu mới",
            weather_hot: "Trời khá oi bức. Gợi ý bạn mặc đồ thoáng mát nhé!",
            weather_cold: "Trời hơi se lạnh. Nhớ giữ ấm nhé!",
            weather_default: "Chúc bạn một ngày thời trang năng động!",
            no_location: "Bạn chưa bật vị trí, hệ thống sẽ dùng thời tiết mặc định tại Biên Hòa.",
            featured_brands: "Thương hiệu nổi bật",
            not_enough_clothes: "Tủ đồ của bạn chưa đủ Áo và Quần để tạo bộ trang phục.",
            add_items_now: "+ Thêm đồ ngay",
            camera_permission_required: "Bạn cần cấp quyền Camera để AI có thể phân tích dáng người!",
            warning_title: "Cảnh báo",
            notice_title: "Thông báo",
            buy_now: "Mua ngay",
            total_outfits: "Tổng số set đồ",
            harmony: "Sự hài hòa",
            tab_insights: "Thống kê",
            fav_colors: "Tông màu chủ đạo",
            ai_suggestion_title: "AI Gợi ý riêng",
            ai_suggestion_desc: "Dựa trên phong cách của bạn, đây là những gợi ý tối ưu nhất.",
            view_suggestions: "Xem chi tiết",
        },
        en: {
            profile_title: "Your Profile",
            email_empty: "Email not updated",
            account_settings: "Account Settings",
            privacy_settings: "Settings & Privacy",
            logout: "Log Out",
            confirm: "Confirm",
            confirm_logout: "Are you sure you want to log out?",
            cancel: "Cancel",
            version: "Version 1.0.0 - XYZ CLOSET",
            
            settings_title: "Settings",
            display_lang: "Display & Language",
            dark_mode: "Dark Mode",
            lang_label: "Language",
            wardrobe_security: "Wardrobe & Security",
            daily_reminder: "Daily Outfit Reminder",
            app_lock: "App Lock",
            app_lock_desc: "Require FaceID/TouchID",
            support_info: "Support & Info",
            faq: "Frequently Asked Questions",
            feedback: "Send Feedback",
            share: "Share App",
            policy: "Terms & Policies",
            delete_data: "Delete All Wardrobe Data",

            greeting: "Hello,",
            weather_loading: "Loading...",
            today_outfit: "What to wear today?",
            change_outfit: "Change outfit",
            top: "Top",
            bottom: "Bottom",
            recently_added: "Recently Added",
            see_all: "See All",
            add_new: "Add",
            empty_recent: "No items yet.",
            body_shape_analysis: "Body Shape Analysis",
            body_shape_desc: "Discover AI-styled fashion",
            my_wardrobe: "Your Wardrobe",
            available_tab: "Available",
            personal_tab: "Personal Items",
            search_placeholder: "Search items...",
            all: "All",
            empty_search: "No matching items found.",
            empty_personal: "Your wardrobe is empty, add your first item!",
            empty_public: "No sample data available.",
            add_item_title: "Add New Item",
            tap_to_add: "Tap to select or take a photo",
            item_name: "Item Name",
            item_name_placeholder: "e.g., Basic White T-Shirt",
            category: "Category",
            tags: "Tags",
            save_to_wardrobe: "Save to Wardrobe",
            camera_title: "Add Item Image",
            camera_desc: "Where do you want to get the image?",
            take_photo: "Take Photo",
            choose_gallery: "Choose from Gallery",
            full_name: "Full Name",
            enter_name: "Enter your name",
            email_readonly: "Email (Cannot be changed)",
            tap_to_change_avatar: "Tap to change avatar",
            save_changes: "Save Changes",
            fitting_room: "Fitting Room",
            canvas_hint: "Tap an item below and drag it freely on this canvas",
            save_outfit: "Save This Outfit",
            your_wardrobe: "Your Wardrobe",
            my_collection: "My Collection",
            created_date: "Created on: ",
            empty_collection: "No outfits saved yet. Go to the Fitting Room and create one now!",
            tab_home: "Home",
            tab_wardrobe: "Wardrobe",
            tab_outfit: "Outfit",
            tab_profile: "Profile",
            change_password: "Change Password",
            current_password: "Current Password",
            new_password: "New Password",
            confirm_new_password: "Confirm New Password",
            weather_hot: "It's quite hot today. We suggest wearing something breathable!",
            weather_cold: "It's a bit chilly. Remember to stay warm!",
            weather_default: "Have a fashionable day!",
            no_location: "Location access denied. Using default weather for Bien Hoa.",
            featured_brands: "Featured Brands",
            not_enough_clothes: "Not enough Tops and Bottoms to create an outfit.",
            add_items_now: "+ Add items now",
            camera_permission_required: "Camera permission is required for AI analysis!",
            warning_title: "Warning",
            notice_title: "Notice",
            tab_suggest: "Suggestions",
            buy_now: "Buy Now",
            total_outfits: "Total Outfits",
            harmony: "Harmony",
            tab_insights: "Insights",
            fav_colors: "Color Palette",
            ai_suggestion_title: "AI Suggestions",
            ai_suggestion_desc: "Based on your closet, these are the best styles for you.",
            view_suggestions: "View Details",
        }
    };

    const t = (key) => translations[language][key] || key;

    return (
        <SettingsContext.Provider value={{ isDarkMode, toggleTheme, language, toggleLanguage, theme, t }}>
            {children}
        </SettingsContext.Provider>
    );
};