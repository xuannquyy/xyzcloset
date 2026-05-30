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

const NotificationScreen = ({ navigation }) => {
    const { theme, language } = useContext(SettingsContext);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 1. GỌI API LẤY DANH SÁCH THÔNG BÁO TỪ BACKEND
    const fetchNotifications = async () => {
        try {
            const res = await axiosClient.get('/notifications');
            // Sắp xếp thông báo mới nhất lên đầu
            const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(sortedData);
        } catch (error) {
            console.log("Lỗi tải thông báo:", error);
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

    // 2. GỌI API ĐÁNH DẤU LÀ ĐÃ ĐỌC (Tắt chấm đỏ)
    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return; // Nếu đọc rồi thì không gọi API nữa
        try {
            await axiosClient.put(`/notifications/${id}/read`);
            
            // Cập nhật state nội bộ ngay lập tức để UI mượt mà, không cần tải lại trang
            setNotifications(prev => 
                prev.map(item => item.id === id ? { ...item, isRead: true } : item)
            );
        } catch (error) {
            console.log("Lỗi đánh dấu đã đọc:", error);
        }
    };

    // Giao diện cho từng dòng thông báo
    const renderItem = ({ item }) => {
        // Nếu chưa đọc thì nền màu hồng/tím nhạt, đọc rồi thì nền tiệp màu app
        const cardBgColor = item.isRead 
            ? theme.background 
            : (theme.background === '#121212' ? '#2A1F2D' : '#FFF0F0');

        return (
            <TouchableOpacity 
                style={[styles.notificationCard, { backgroundColor: cardBgColor, borderColor: theme.border }]}
                onPress={() => handleMarkAsRead(item.id, item.isRead)}
            >
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name={item.isRead ? "notifications-outline" : "notifications"} 
                        size={24} 
                        color={theme.primary} 
                    />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: item.isRead ? FONTS.medium : FONTS.bold }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.message, { color: theme.gray }]}>{item.message}</Text>
                    
                    {/* Hiển thị ngày tháng */}
                    <Text style={[styles.time, { color: theme.primary }]}>
                        {new Date(item.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                </View>

                {/* Dấu chấm đỏ báo chưa đọc */}
                {!item.isRead && <View style={styles.unreadDot} />}
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
                        <View style={styles.centerContainer}>
                            <Ionicons name="notifications-off-outline" size={60} color={theme.border} />
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
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
    listContainer: { paddingHorizontal: 20, paddingBottom: 50 },
    notificationCard: { flexDirection: 'row', padding: 15, borderRadius: SIZES.radius, marginBottom: 15, borderWidth: 1, elevation: 1 },
    iconContainer: { marginRight: 15, justifyContent: 'center' },
    contentContainer: { flex: 1 },
    title: { fontSize: 15, marginBottom: 5 },
    message: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, marginBottom: 8 },
    time: { fontFamily: FONTS.medium, fontSize: 12 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4B4B', alignSelf: 'center', marginLeft: 10 },
    emptyText: { fontFamily: FONTS.regular, fontSize: 15, marginTop: 15 }
});

export default NotificationScreen;