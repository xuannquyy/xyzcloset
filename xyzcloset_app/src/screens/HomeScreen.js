import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, ScrollView, 
    ActivityIndicator, RefreshControl, Linking, Modal, TextInput,
    Platform, Animated
} from 'react-native';
import { Image } from 'expo-image'; 
import * as Location from 'expo-location'; 
import * as ImagePicker from 'expo-image-picker'; 
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext'; 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const { width } = require('react-native').Dimensions.get('window');

const BRANDS = [
    { id: 1, name: 'Gucci', url: 'https://www.gucci.com', logo: 'https://i.pinimg.com/736x/05/5f/d7/055fd7f825c91803f3859695cdab160e.jpg' },
    { id: 2, name: 'An Phuoc', url: 'https://anphuoc.com.vn', logo: 'https://inkythuatso.com/uploads/thumbnails/800/2021/12/logo-an-phuoc-inkythuatso-01-16-11-08-13.jpg' },
    { id: 3, name: 'DirtyCoins', url: 'https://dirtycoins.vn', logo: 'https://bizweb.dktcdn.net/100/369/010/themes/914385/assets/logo.png?1708412674256' },
    { id: 4, name: 'Balenciaga', url: 'https://www.balenciaga.com', logo: 'https://i.pinimg.com/1200x/1f/f0/29/1ff0299bc23b671f4fa4d9b53ca0842b.jpg' },
    { id: 5, name: 'Dior', url: 'https://www.dior.com', logo: 'https://i.pinimg.com/736x/ad/23/59/ad23591aa7a2f2839d1ff1d1b2238aa0.jpg' },
    { id: 6, name: 'Davies', url: 'https://davies.vn', logo: 'https://mms.img.susercontent.com/df4733e0b9c24ef82a82c30a01a313ec' },
    { id: 7, name: 'Nowsaigon', url: 'https://nowsaigon.com/', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3zPynaZYAR27lrTpgVfFrk73ToBdT3rkBxg&s' },
    { id: 8, name: 'LSOUL', url: 'https://lsoul.com', logo: 'https://yt3.ggpht.com/WFvFacPPN2FYrtuaezfP4WRVgf0jzbPVHrjAv_icuDmIqS2IMz-NLc7h2AzBjZWX-KvslYP2=s88-c-k-c0x00ffffff-no-rj' },
];

const HomeScreen = ({ navigation }) => {
    const { userInfo } = useContext(AuthContext);
    const { theme, isDarkMode, t } = useContext(SettingsContext); 

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(false);
    
    const [data, setData] = useState({
        weather: { temp: '--', condition: '...' },
        suggestion: { top: null, bottom: null }
    });
    const [recentItems, setRecentItems] = useState([]);

    const [isMenuModalVisible, setMenuModalVisible] = useState(false);
    const [isManualModalVisible, setManualModalVisible] = useState(false);
    const [measurements, setMeasurements] = useState({ bust: '', waist: '', hips: '', height: '', weight: '' });

    const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error' });
    const showAlert = (title, message, type = 'error') => setCustomAlert({ visible: true, title, message, type });

    // --- QUẢN LÝ TRẠNG THÁI ANIMATION THÔNG BÁO TIN NHẮN ---
    const bannerAnim = useRef(new Animated.Value(-200)).current; // Vị trí ẩn phía trên đỉnh
    const [showBanner, setShowBanner] = useState(false);
    const [bannerData, setBannerData] = useState(null);

    const triggerNotificationBanner = (suggestionData) => {
        // Nếu không có gợi ý đồ từ API, không hiện banner để tránh lỗi UI
        if (!suggestionData || !suggestionData.suggestion?.top) return;
        
        setBannerData(suggestionData);
        setShowBanner(true);
        
        // 1. Trượt xuống vị trí hiển thị (Cân đối theo tai thỏ iOS / Android)
        Animated.timing(bannerAnim, {
            toValue: Platform.OS === 'ios' ? 55 : 25,
            duration: 450,
            useNativeDriver: true,
        }).start();

        // 2. Thiết lập tự động ẩn sau 5 giây (ộng thêm thời gian trượt là 5.5s)
        setTimeout(() => {
            dismissBanner();
        }, 5500);
    };

    const dismissBanner = () => {
        Animated.timing(bannerAnim, {
            toValue: -200, // Trượt ngược lên trên để ẩn
            duration: 350,
            useNativeDriver: true,
        }).start(() => setShowBanner(false));
    };

    // 🟢 ĐÃ FIX LỖI MEMORY LEAK: Bỏ unreadNotifications khỏi dependency array để không bị reset interval liên tục gây lag
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await axiosClient.get('/notifications');
                const hasUnread = res.data.some(noti => !noti.isRead);
                setUnreadNotifications(hasUnread); 
            } catch (error) {}
        };
        checkNotifications(); 
        const interval = setInterval(checkNotifications, 15000); 
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            let lat = 10.9457; let lon = 106.8243;
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    let location = await Location.getCurrentPositionAsync({});
                    lat = location.coords.latitude; lon = location.coords.longitude;
                }
            } catch (locError) {}

            const [suggestionRes, wardrobeRes] = await Promise.all([
                axiosClient.get(`/suggestions/today?lat=${lat}&lon=${lon}`),
                axiosClient.get('/wardrobe')
            ]);
            
            setData(suggestionRes.data);
            const allItems = wardrobeRes.data || [];
            setRecentItems(allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

            // Bắn thông báo đẩy dạng tin nhắn ra màn hình sau khi tải dữ liệu xong 1 giây
            if (suggestionRes.data) {
                setTimeout(() => {
                    triggerNotificationBanner(suggestionRes.data);
                }, 1000);
            }
        } catch (error) {
        } finally {
            setIsLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handlePickImage = async (useCamera) => {
        setMenuModalVisible(false);
        let result;
        const options = { allowsEditing: true, aspect: [3, 4], quality: 0.8 };

        if (useCamera) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') return showAlert("Lỗi", "Cần quyền Camera để phân tích.", "error");
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return showAlert("Lỗi", "Cần quyền Thư viện ảnh.", "error");
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled) {
            navigation.navigate('BodyShape', { imageUri: result.assets[0].uri });
        }
    };

    const calculateBodyShape = () => {
        const b = parseFloat(measurements.bust);
        const w = parseFloat(measurements.waist);
        const h = parseFloat(measurements.hips);

        if (!b || !w || !h) {
            return showAlert("Thiếu thông tin", "Vui lòng nhập đủ 3 vòng.", "warning");
        }

        let shape = "Dáng Chữ Nhật";
        if ((b - h) > (b * 0.05)) shape = "Dáng Tam Giác Ngược";
        else if ((h - b) > (h * 0.05)) shape = "Dáng Quả Lê";
        else if (Math.abs(b - h) <= (b * 0.05) && w < (b * 0.75)) shape = "Dáng Đồng Hồ Cát";
        else if (w >= b || w >= h) shape = "Dáng Quả Táo";

        setManualModalVisible(false);
        setMeasurements({ bust: '', waist: '', hips: '', height: '', weight: '' });
        navigation.navigate('BodyShape', { imageUri: 'manual', manualShape: shape });
    };

    const highlightBg = theme.primary;
    const highlightText = theme.background; 

    // Xác định màu sắc chủ đạo của loại thông báo (Nóng -> Cam, Mát -> Xanh)
    const isHotWeather = bannerData?.weather?.temp ? parseFloat(bannerData.weather.temp) >= 25 : true;
    const bannerAccentColor = isHotWeather ? '#FF9F43' : '#10AC84';

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            
            {/* 🔔 BANNER THÔNG BÁO ĐẨY TIN NHẮN (SLIDE DOWN BANNER) */}
            {showBanner && bannerData && (
                <Animated.View style={[
                    styles.bannerContainer, 
                    { 
                        transform: [{ translateY: bannerAnim }],
                        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                        borderColor: isDarkMode ? '#333333' : '#F0F0F0',
                        borderLeftColor: bannerAccentColor
                    }
                ]}>
                    <View style={styles.bannerHeader}>
                        <View style={[styles.bannerIconBadge, { backgroundColor: bannerAccentColor + '20' }]}>
                            <Ionicons name={isHotWeather ? "sunny" : "shirt"} size={16} color={bannerAccentColor} />
                        </View>
                        <Text style={[styles.bannerAppTitle, { color: theme.text, opacity: 0.5 }]}>GỢI Ý HÔM NAY</Text>
                        <TouchableOpacity onPress={dismissBanner} style={{ padding: 2 }}>
                            <Ionicons name="close" size={18} color={theme.text} style={{ opacity: 0.6 }} />
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={[styles.bannerTitle, { color: theme.text }]}>
                        {isHotWeather ? 'Hôm nay mặc gì cho mát? 👕' : 'Gợi ý phối đồ giữ ấm 🧥'}
                    </Text>
                    <Text style={[styles.bannerMessage, { color: theme.text, opacity: 0.8 }]} numberOfLines={2}>
                        {bannerData.message}
                    </Text>

                    {/* Hiển thị nhanh 2 mẫu quần áo được gợi ý từ tủ đồ */}
                    <View style={styles.bannerPreviewRow}>
                        {bannerData.suggestion?.top?.imageUrl && (
                            <Image source={{ uri: bannerData.suggestion.top.imageUrl }} style={styles.bannerThumb} cachePolicy="memory-disk" />
                        )}
                        {bannerData.suggestion?.bottom?.imageUrl && (
                            <Image source={{ uri: bannerData.suggestion.bottom.imageUrl }} style={styles.bannerThumb} cachePolicy="memory-disk" />
                        )}
                    </View>
                </Animated.View>
            )}

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greetingText, { color: theme.text, opacity: 0.6 }]}>{t('greeting')}</Text>
                        <Text style={[styles.userName, { color: theme.text }]}>{userInfo?.fullName || 'VIP Member'}</Text>
                    </View>
                    <TouchableOpacity style={[styles.notiBtn, { borderColor: theme.card, borderWidth: 1 }]} onPress={() => navigation.navigate('Notification')}>
                        <Ionicons name="notifications-outline" size={24} color={theme.text} />
                        {unreadNotifications && <View style={[styles.notiDot, { backgroundColor: theme.accent }]} />}
                    </TouchableOpacity>
                </View>

                {/* THỜI TIẾT */}
                <View style={[styles.weatherWidget, { backgroundColor: theme.card }]}>
                    <View style={styles.weatherInfo}>
                        <MaterialCommunityIcons name="weather-partly-cloudy" size={36} color={theme.text} />
                        <View style={{ marginLeft: 15 }}>
                            <Text style={[styles.weatherTemp, { color: theme.text }]}>{data.weather.temp}°C</Text>
                            <Text style={[styles.weatherCond, { color: theme.text, opacity: 0.7 }]}>{data.weather.condition}</Text>
                        </View>
                    </View>
                    <Text style={[styles.dateText, { color: theme.text, opacity: 0.4 }]}>{new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                </View>

                {/* STYLIST AI */}
                <TouchableOpacity activeOpacity={0.8} style={[styles.aiBanner, { backgroundColor: highlightBg }]} onPress={() => setMenuModalVisible(true)}>
                    <View style={styles.aiTextWrap}>
                        <View style={[styles.aiBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={[styles.aiBadgeText, { color: highlightText }]}>AI FEATURE</Text>
                        </View>
                        <Text style={[styles.aiTitle, { color: highlightText }]}>Stylist Cá Nhân</Text>
                        <Text style={[styles.aiDesc, { color: highlightText, opacity: 0.8 }]}>Phân tích dáng người & Tỷ lệ vàng</Text>
                    </View>
                    <View style={[styles.aiIconBox, { backgroundColor: highlightText }]}>
                        <Ionicons name="scan-outline" size={24} color={highlightBg} />
                    </View>
                </TouchableOpacity>

                {/* OUTFIT OF THE DAY */}
                <View style={styles.sectionTitleRow}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('today_outfit')}</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                        <Ionicons name="refresh" size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.outfitContainer}>
                    {isLoading ? <ActivityIndicator color={theme.primary} size="large" style={{ marginVertical: 40 }} /> : (
                        data.suggestion.top && data.suggestion.bottom ? (
                            <View style={styles.outfitGrid}>
                                <View style={[styles.outfitCard, { backgroundColor: theme.card }]}>
                                    <Image source={{ uri: data.suggestion.top.imageUrl }} style={styles.outfitImage} contentFit="cover" cachePolicy="memory-disk" />
                                    <View style={[styles.outfitTag, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.tagText, { color: theme.text }]}>{t('top')}</Text>
                                    </View>
                                </View>
                                <View style={{ width: 12 }} /> 
                                <View style={[styles.outfitCard, { backgroundColor: theme.card }]}>
                                    <Image source={{ uri: data.suggestion.bottom.imageUrl }} style={styles.outfitImage} contentFit="cover" cachePolicy="memory-disk" />
                                    <View style={[styles.outfitTag, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.tagText, { color: theme.text }]}>{t('bottom')}</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                                <Ionicons name="shirt-outline" size={40} color={theme.text} style={{ opacity: 0.3, marginBottom: 10 }} />
                                <Text style={[styles.emptyText, { color: theme.text, opacity: 0.6 }]}>Tủ đồ chưa đủ trang phục.</Text>
                            </View>
                        )
                    )}
                </View>

                {/* TOP BRANDS */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Thương Hiệu</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandScroll}>
                    {BRANDS.map((brand) => (
                        <TouchableOpacity key={brand.id} style={[styles.brandItem, { borderColor: theme.card, borderWidth: 1 }]} onPress={() => Linking.openURL(brand.url)}>
                            <Image source={{ uri: brand.logo }} style={styles.brandLogo} contentFit="contain" cachePolicy="memory-disk" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* RECENTLY ADDED */}
                <View style={[styles.sectionTitleRow, { marginTop: 10 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recently_added')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Wardrobe')}>
                        <Text style={[styles.viewAllText, { color: theme.primary }]}>{t('see_all')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.recentContainer}>
                    {isLoading ? <ActivityIndicator color={theme.primary} /> : recentItems.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                            <TouchableOpacity style={[styles.addBtn, { borderColor: theme.text }]} onPress={() => navigation.navigate('AddItem')}>
                                <Ionicons name="add" size={28} color={theme.text} />
                            </TouchableOpacity>
                            {recentItems.map((item, index) => (
                                <View key={item.id || index} style={[styles.recentItem, { backgroundColor: theme.card }]}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.recentImg} contentFit="cover" cachePolicy="memory-disk" />
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={[styles.emptyText, { color: theme.text, opacity: 0.5, marginTop: 10 }]}>Tủ đồ trống.</Text>
                    )}
                </View>
                
                <View style={{ height: 60 }} />
            </ScrollView>

            {/* --- MODAL CHỌN PHƯƠNG THỨC --- */}
            <Modal visible={isMenuModalVisible} transparent={true} animationType="slide">
                <TouchableOpacity 
                    style={styles.modalBg} 
                    activeOpacity={1} 
                    onPress={() => setMenuModalVisible(false)}
                >
                    <TouchableOpacity 
                        activeOpacity={1} 
                        style={[styles.modalBox, { backgroundColor: theme.background, maxHeight: '80%' }]}
                    >
                        <View style={[styles.dragBar, { backgroundColor: theme.text, opacity: 0.2 }]} />
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>Phương thức phân tích</Text>
                            <TouchableOpacity onPress={() => setMenuModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={theme.text} style={{ opacity: 0.3 }} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.card }]} onPress={() => handlePickImage(true)}>
                                <Ionicons name="camera" size={24} color={theme.text} />
                                <Text style={[styles.actionText, { color: theme.text }]}>Chụp ảnh trực tiếp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.card }]} onPress={() => handlePickImage(false)}>
                                <Ionicons name="image" size={24} color={theme.text} />
                                <Text style={[styles.actionText, { color: theme.text }]}>Tải ảnh từ thư viện</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.card, marginBottom: 20 }]} onPress={() => { setMenuModalVisible(false); setTimeout(() => setManualModalVisible(true), 300); }}>
                                <Ionicons name="create" size={24} color={theme.text} />
                                <Text style={[styles.actionText, { color: theme.text }]}>Nhập số đo thủ công</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Nhập số đo */}
            <Modal visible={isManualModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBgCenter}>
                    <View style={[styles.inputBox, { backgroundColor: theme.background, borderColor: theme.card, borderWidth: 1 }]}>
                        <View style={styles.inputHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>Thông số cơ thể</Text>
                            <TouchableOpacity onPress={() => setManualModalVisible(false)}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.card, flex: 1, marginRight: 8 }]} keyboardType="numeric" placeholder="Cao (cm)" placeholderTextColor={theme.gray} value={measurements.height} onChangeText={t => setMeasurements({...measurements, height: t})} />
                            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.card, flex: 1, marginLeft: 8 }]} keyboardType="numeric" placeholder="Nặng (kg)" placeholderTextColor={theme.gray} value={measurements.weight} onChangeText={t => setMeasurements({...measurements, weight: t})} />
                        </View>

                        <Text style={[styles.label, { color: theme.text }]}>Số đo 3 vòng (Ngực - Eo - Mông)</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, styles.flex1, { color: theme.text, backgroundColor: theme.card }]} keyboardType="numeric" placeholder="Ngực" placeholderTextColor={theme.gray} value={measurements.bust} onChangeText={t => setMeasurements({...measurements, bust: t})} />
                            <TextInput style={[styles.input, styles.flex1, { color: theme.text, backgroundColor: theme.card, marginHorizontal: 8 }]} keyboardType="numeric" placeholder="Eo" placeholderTextColor={theme.gray} value={measurements.waist} onChangeText={t => setMeasurements({...measurements, waist: t})} />
                            <TextInput style={[styles.input, styles.flex1, { color: theme.text, backgroundColor: theme.card }]} keyboardType="numeric" placeholder="Mông" placeholderTextColor={theme.gray} value={measurements.hips} onChangeText={t => setMeasurements({...measurements, hips: t})} />
                        </View>

                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={calculateBodyShape}>
                            <Text style={[styles.submitText, { color: theme.background }]}>Phân tích ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert */}
            <Modal visible={customAlert.visible} transparent={true} animationType="fade">
                <View style={styles.modalBgCenter}>
                    <View style={[styles.alertCard, { backgroundColor: theme.background, borderColor: theme.card, borderWidth: 1 }]}>
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertDesc, { color: theme.text }]}>{customAlert.message}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.text }]} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
                            <Text style={[styles.alertBtnText, { color: theme.background }]}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { paddingHorizontal: 24, paddingTop: 10 },
    
    // 🔔 Styles hệ thống Thông báo đẩy lơ lửng (Banner)
    bannerContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        borderRadius: 20,
        padding: 16,
        zIndex: 9999, // Luôn đứng trên tất cả các lớp UI khác
        elevation: 10,
        borderWidth: 1,
        borderLeftWidth: 6, // Tạo thanh viền màu nổi bật ở góc trái
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    bannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    bannerIconBadge: { padding: 4, borderRadius: 8, marginRight: 8 },
    bannerAppTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1 },
    bannerTitle: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 4, letterSpacing: -0.2 },
    bannerMessage: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 18 },
    bannerPreviewRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
    bannerThumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.03)', resizeMode: 'contain' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
    greetingText: { fontFamily: FONTS.medium, fontSize: 14, marginBottom: 2 },
    userName: { fontFamily: FONTS.bold, fontSize: 26, letterSpacing: -0.5 },
    notiBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    notiDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4 },
    
    // Weather
    weatherWidget: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 24 },
    weatherInfo: { flexDirection: 'row', alignItems: 'center' },
    weatherTemp: { fontFamily: FONTS.bold, fontSize: 24, letterSpacing: -0.5 },
    weatherCond: { fontFamily: FONTS.medium, fontSize: 13, marginTop: 2 },
    dateText: { fontFamily: FONTS.medium, fontSize: 13 },

    // AI Banner
    aiBanner: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 24, marginBottom: 32 },
    aiTextWrap: { flex: 1, paddingRight: 15 },
    aiBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
    aiBadgeText: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 1 },
    aiTitle: { fontFamily: FONTS.bold, fontSize: 22, marginBottom: 6, letterSpacing: -0.5 },
    aiDesc: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20 },
    aiIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

    // Sections
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 20 },
    refreshBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
    viewAllText: { fontFamily: FONTS.medium, fontSize: 14 },

    // Outfit Grid
    outfitContainer: { marginBottom: 32 },
    outfitGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    outfitCard: { flex: 1, height: width * 0.6, borderRadius: 24, overflow: 'hidden' },
    outfitImage: { width: '100%', height: '100%' },
    outfitTag: { position: 'absolute', bottom: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    tagText: { fontFamily: FONTS.bold, fontSize: 11, textTransform: 'uppercase' },
    
    emptyState: { padding: 30, borderRadius: 24, alignItems: 'center', justifyContent: 'center', height: 150 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 14, textAlign: 'center' },

    // Brands
    brandScroll: { paddingRight: 24, marginBottom: 32 },
    brandItem: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginRight: 16, backgroundColor: '#FFF' },
    brandLogo: { width: '60%', height: '60%' },

    // Recent
    recentScroll: { paddingRight: 24 },
    addBtn: { width: 70, height: 70, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    recentItem: { width: 70, height: 70, borderRadius: 20, marginRight: 12, overflow: 'hidden' },
    recentImg: { width: '100%', height: '100%' },

    // Modals
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    dragBar: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 22, marginBottom: 24 },
    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 12 },
    actionText: { fontFamily: FONTS.bold, fontSize: 16, marginLeft: 16 },

    inputBox: { width: '90%', borderRadius: 32, padding: 24 },
    inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    row: { flexDirection: 'row', marginBottom: 16 },
    flex1: { flex: 1 },
    label: { fontFamily: FONTS.bold, fontSize: 14, marginBottom: 12, marginTop: 8 },
    input: { borderRadius: 16, padding: 16, fontFamily: FONTS.medium, fontSize: 15 },
    submitBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    submitText: { fontFamily: FONTS.bold, fontSize: 16 },

    alertCard: { width: '80%', borderRadius: 32, padding: 24, alignItems: 'center' },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 20, marginBottom: 12, textAlign: 'center' },
    alertDesc: { fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center', marginBottom: 24, opacity: 0.8, lineHeight: 22 },
    alertBtn: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16 },
});

export default HomeScreen;