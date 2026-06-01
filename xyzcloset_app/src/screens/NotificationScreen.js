import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, FlatList, TouchableOpacity, 
    ActivityIndicator, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

// Giữ lại MOCK làm phương án dự phòng (Fallback) khi server sập hoặc không có mạng
const MOCK_NOTIFICATIONS = [
    {
        id: 'mock_1',
        title: 'Gợi ý phối đồ hôm nay 👕',
        message: 'Thời tiết hôm nay hơi se lạnh, bạn nên chọn một chiếc áo hoodie ấm áp phối cùng quần jeans và giày sneaker năng động nhé!',
        type: 'OUTFIT',
        isRead: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'mock_2',
        title: 'Dự báo thời tiết hôm nay ☀️',
        message: 'Trời nắng ráo, nhiệt độ trung bình từ 26°C - 32°C. Thích hợp cho các hoạt động di chuyển ngoài trời.',
        type: 'WEATHER',
        isRead: false,
        createdAt: new Date().toISOString()
    }
];

const NotificationScreen = ({ navigation }) => {
    const { theme, language } = useContext(SettingsContext);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 1. GỌI API ĐỒNG BỘ DỮ LIỆU TỪ BACKEND
    const fetchNotifications = async () => {
        try {
            let realNotifications = [];

            // Bước A: Gọi API gợi ý thời tiết & trang phục từ suggestion.controller.js
            try {
                // Gửi kèm tọa độ nếu có, hoặc mặc định backend tự lấy Biên Hòa
                const response = await axiosClient.get('/suggestions/today');
                const data = response.data;

                if (data) {
                    // Chuyển đổi dữ liệu Thời tiết từ backend thành định dạng thẻ thông báo
                    realNotifications.push({
                        id: 'real_weather',
                        title: language === 'vi' ? 'Dự báo thời tiết hôm nay ☀️' : 'Today Weather Forecast ☀️',
                        message: `Trời ${data.weather.condition}. Nhiệt độ hiện tại khoảng ${data.weather.temp}°C.`,
                        type: 'WEATHER',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    });

                    // Tên quần áo bốc thăm từ database
                    const topName = data.suggestion.top ? data.suggestion.top.name : (language === 'vi' ? 'Áo thun thoải mái' : 'Comfortable T-Shirt');
                    const bottomName = data.suggestion.bottom ? data.suggestion.bottom.name : (language === 'vi' ? 'Quần dài năng động' : 'Casual Pants');

                    // Chuyển đổi dữ liệu gợi ý Phối đồ từ backend thành định dạng thẻ thông báo
                    realNotifications.push({
                        id: 'real_outfit',
                        title: language === 'vi' ? 'Gợi ý phối đồ hôm nay 👕' : 'Today Outfit Suggestion 👕',
                        message: `${data.message}\n👉 Tủ đồ gợi ý: ${topName} kết hợp với ${bottomName}.`,
                        type: 'OUTFIT',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    });
                }
            } catch (suggestError) {
                console.log("Không lấy được dữ liệu gợi ý thực tế, sử dụng dữ liệu mẫu:", suggestError);
                // Nếu lỗi API gợi ý, nạp tạm dữ liệu mock thời tiết/phối đồ
                realNotifications = [...MOCK_NOTIFICATIONS];
            }

            // Bước B: Gọi API lấy các thông báo hệ thống khác (Ví dụ: thông báo nhắc nhở, sự kiện...)
            try {
                const res = await axiosClient.get('/notifications');
                if (res.data && res.data.length > 0) {
                    const sortedSystemNotifs = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    // Trộn thông báo Gợi ý (luôn lên đầu) với các thông báo hệ thống khác
                    setNotifications([...realNotifications, ...sortedSystemNotifs]);
                } else {
                    setNotifications(realNotifications);
                }
            } catch (notifError) {
                console.log("Không tải được thông báo hệ thống bổ sung, chỉ hiển thị gợi ý hàng ngày.");
                setNotifications(realNotifications);
            }

        } catch (error) {
            console.log("Lỗi tổng thể hệ thống:", error);
            setNotifications(MOCK_NOTIFICATIONS);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    // 2. GỌI API ĐÁNH DẤU ĐÃ ĐỌC
    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return; 
        try {
            // Chỉ gọi API thực tế nếu ID thuộc database (không có tiền tố mock_ hoặc real_)
            if (!id.toString().startsWith('mock_') && !id.toString().startsWith('real_')) {
                await axiosClient.put(`/notifications/${id}/read`);
            }
            
            // Cập nhật state cục bộ ngay lập tức để tắt chấm đỏ sinh động
            setNotifications(prev => 
                prev.map(item => item.id === id ? { ...item, isRead: true } : item)
            );
        } catch (error) {
            console.log("Lỗi đánh dấu đã đọc:", error);
        }
    };

    // Giao diện render từng dòng thông báo
    const renderItem = ({ item }) => {
        const titleLower = item.title ? item.title.toLowerCase() : '';
        
        const isWeather = item.type === 'WEATHER' || titleLower.includes('thời tiết') || titleLower.includes('nhiệt độ');
        const isOutfit = item.type === 'OUTFIT' || titleLower.includes('mặc gì') || titleLower.includes('phối đồ');

        let iconName = item.isRead ? "notifications-outline" : "notifications";
        let accentColor = theme.primary;

        if (isWeather) {
            iconName = item.isRead ? "partly-sunny-outline" : "partly-sunny";
            accentColor = "#FF9F43"; // Cam mặt trời
        } else if (isOutfit) {
            iconName = item.isRead ? "shirt-outline" : "shirt";
            accentColor = "#10AC84"; // Xanh mint thời trang
        }

        const cardBgColor = item.isRead 
            ? theme.background 
            : (theme.background === '#121212' ? '#2A1F2D' : '#FFF0F0');

        return (
            <TouchableOpacity 
                style={[
                    styles.notificationCard, 
                    { 
                        backgroundColor: cardBgColor, 
                        borderColor: theme.border,
                        borderLeftWidth: item.isRead ? 1 : 5, 
                        borderLeftColor: item.isRead ? theme.border : accentColor
                    }
                ]}
                onPress={() => handleMarkAsRead(item.id, item.isRead)}
            >
                {/* Khu vực hiển thị Icon */}
                <View style={[styles.iconContainer, { backgroundColor: accentColor + '15', padding: 8, borderRadius: 10 }]}>
                    <Ionicons name={iconName} size={24} color={accentColor} />
                </View>

                {/* Nội dung chữ */}
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: item.isRead ? FONTS.medium : FONTS.bold }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.message, { color: theme.gray }]}>{item.message}</Text>
                    
                    {/* Hiển thị ngày tháng */}
                    <Text style={[styles.time, { color: accentColor }]}>
                        {new Date(item.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        {" • "}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* Dấu chấm báo chưa đọc */}
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {language === 'vi' ? "Thông báo" : "Notifications"}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {/* DANH SÁCH THÔNG BÁO */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyCenterContainer}>
                            <Ionicons name="notifications-off-outline" size={70} color={theme.border} />
                            <Text style={[styles.emptyText, { color: theme.gray }]}>
                                {language === 'vi' ? "Bạn không có thông báo nào." : "You have no notifications."}
                            </Text>
                        </View>
                    )}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    backBtn: { padding: 5, marginLeft: -5 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyCenterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    listContainer: { paddingHorizontal: 20, paddingBottom: 50, flexGrow: 1 }, 
    notificationCard: { flexDirection: 'row', padding: 15, borderRadius: SIZES.radius, marginBottom: 15, borderWidth: 1, elevation: 1 },
    iconContainer: { marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    contentContainer: { flex: 1 },
    title: { fontSize: 15, marginBottom: 5, lineHeight: 22 },
    message: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, marginBottom: 8 },
    time: { fontFamily: FONTS.medium, fontSize: 12 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, alignSelf: 'center', marginLeft: 10 },
    emptyText: { fontFamily: FONTS.regular, fontSize: 15, marginTop: 15 }
});

export default NotificationScreen;