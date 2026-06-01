import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const NotificationScreen = ({ navigation }) => {
    const { theme, language } = useContext(SettingsContext);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'WEATHER', 'SYSTEM'

    const fetchNotifications = async () => {
        try {
            const res = await axiosClient.get('/notifications');
            const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(sortedData);
        } catch (error) {
            console.log("Lỗi tải thông báo:", error);
        } finally {
            setIsLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await axiosClient.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
        } catch (error) {
            console.log("Lỗi đánh dấu đã đọc:", error);
        }
    };

    const getIconForType = (type) => {
        switch(type) {
            case 'WEATHER': return <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={theme.accent} />;
            case 'OUTFIT': return <Ionicons name="shirt-outline" size={24} color={theme.accent} />;
            default: return <Ionicons name="information-circle-outline" size={24} color={theme.primary} />;
        }
    };

    const filteredData = activeTab === 'ALL' ? notifications : notifications.filter(n => n.type === activeTab);

    const renderItem = ({ item }) => {
        const cardBgColor = item.isRead ? theme.background : theme.card;
        
        return (
            <TouchableOpacity 
                style={[styles.notificationCard, { backgroundColor: cardBgColor, borderColor: theme.card }]}
                onPress={() => handleMarkAsRead(item.id, item.isRead)}
            >
                <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    {getIconForType(item.type)}
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: item.isRead ? FONTS.medium : FONTS.bold }]}>
                        {item.title}
                    </Text>
                    <Text style={[styles.message, { color: theme.text, opacity: 0.8 }]}>{item.message}</Text>
                    <Text style={[styles.time, { color: theme.primary }]}>
                        {new Date(item.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </Text>
                </View>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {language === 'vi' ? "Thông báo" : "Notifications"}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {/* TAB BAR TÙY CHỈNH */}
            <View style={styles.tabContainer}>
                {['ALL', 'WEATHER', 'SYSTEM'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.tabBtn, activeTab === tab && { backgroundColor: theme.primary }]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab ? theme.background : theme.text }]}>
                            {tab === 'ALL' ? 'Tất cả' : tab === 'WEATHER' ? 'Gợi ý' : 'Hệ thống'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    ListEmptyComponent={() => (
                        <View style={styles.centerContainer}>
                            <Ionicons name="notifications-off-outline" size={60} color={theme.card} />
                            <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5 }]}>Không có thông báo nào.</Text>
                        </View>
                    )}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 },
    backBtn: { padding: 5, marginLeft: -5 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
    tabText: { fontFamily: FONTS.bold, fontSize: 13 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
    listContainer: { paddingHorizontal: 24, paddingBottom: 50 },
    notificationCard: { flexDirection: 'row', padding: 16, borderRadius: 24, marginBottom: 12, borderWidth: 1 },
    iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    contentContainer: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 16, marginBottom: 4 },
    message: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, marginBottom: 8 },
    time: { fontFamily: FONTS.medium, fontSize: 12 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, alignSelf: 'center', marginLeft: 10 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, marginTop: 15 }
});

export default NotificationScreen;