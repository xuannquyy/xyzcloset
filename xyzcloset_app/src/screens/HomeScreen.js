import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, ScrollView, 
    ActivityIndicator, RefreshControl, Alert, Linking 
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

// DANH SÁCH THƯƠNG HIỆU TÍCH HỢP (Local Brand & Luxury)
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
    const { theme, t, language } = useContext(SettingsContext); 

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(false);
    
    const [data, setData] = useState({
        weather: { temp: '--', condition: '...' },
        suggestion: { top: null, bottom: null }
    });
    const [recentItems, setRecentItems] = useState([]);

    // 1. POLLING: KIỂM TRA THÔNG BÁO REALTIME MỖI 10 GIÂY
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await axiosClient.get('/notifications');
                const hasUnread = res.data.some(noti => !noti.isRead);
                setUnreadNotifications(hasUnread);
            } catch (error) {
                console.log("Lỗi check thông báo ngầm:", error);
            }
        };
        
        checkNotifications(); 
        const interval = setInterval(checkNotifications, 10000); 
        return () => clearInterval(interval);
    }, []);

    // 2. TẢI DỮ LIỆU TỔNG HỢP TRANG CHỦ
    const fetchData = async () => {
        try {
            let lat = 10.9457; // Default: Biên Hòa
            let lon = 106.8243;
            
            // Lớp giáp bảo vệ: Thử lấy GPS, nếu phần cứng tắt/lỗi thì bỏ qua dùng tọa độ mặc định
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    let location = await Location.getCurrentPositionAsync({});
                    lat = location.coords.latitude;
                    lon = location.coords.longitude;
                } else {
                    const alertMsg = language === 'vi' 
                        ? "Bạn chưa bật vị trí, hệ thống sẽ dùng thời tiết mặc định tại Biên Hòa." 
                        : "Location disabled. Using default weather for Bien Hoa.";
                    Alert.alert(language === 'vi' ? "Thông báo" : "Notice", alertMsg);
                }
            } catch (locError) {
                console.log("Cảnh báo: GPS thiết bị đang tắt, dùng tọa độ dự phòng.", locError.message);
                // Lỗi phần cứng thì cứ đi tiếp, không được văng app!
            }

            // Gọi API song song bình thường
            const [suggestionRes, wardrobeRes] = await Promise.all([
                axiosClient.get(`/suggestions/today?lat=${lat}&lon=${lon}`),
                axiosClient.get('/wardrobe')
            ]);
            
            setData(suggestionRes.data);
            const allItems = wardrobeRes.data || [];
            
            const sortedItems = allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRecentItems(sortedItems.slice(0, 5));

        } catch (error) {
            console.log("Lỗi tải dữ liệu Backend:", error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    // 3. XỬ LÝ CAMERA - AI PHÂN TÍCH DÁNG
    const handleBodyShapeCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            const errorMsg = language === 'vi' 
                ? "Bạn cần cấp quyền Camera để AI có thể phân tích dáng người!" 
                : "Camera permission is required for AI analysis!";
            Alert.alert(language === 'vi' ? "Cảnh báo" : "Warning", errorMsg); 
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.7,
        });

        if (!result.canceled) {
            navigation.navigate('BodyShape', { imageUri: result.assets[0].uri });
        }
    };

    // LOGIC NGÔN NGỮ THỜI TIẾT
    const isHot = data.weather.temp !== '--' && parseInt(data.weather.temp) >= 25;
    let weatherMessage = t('weather_default');
    if (data.weather.temp !== '--') {
        weatherMessage = isHot ? (language === 'vi' ? "Trời khá oi bức. Gợi ý bạn mặc đồ thoáng mát nhé!" : "It's quite hot today. We suggest wearing something breathable!") 
                               : (language === 'vi' ? "Trời hơi se lạnh. Nhớ giữ ấm nhé!" : "It's a bit chilly. Remember to stay warm!");
    }

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* HEADER & CHUÔNG THÔNG BÁO */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greetingText, { color: theme.gray }]}>{t('greeting')}</Text>
                        <Text style={[styles.userName, { color: theme.text }]}>{userInfo?.fullName || 'Bạn'}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} 
                        onPress={() => navigation.navigate('Notification')}
                    >
                        <Ionicons name="notifications-outline" size={26} color={theme.text} />
                        {unreadNotifications && <View style={styles.badge} />}
                    </TouchableOpacity>
                </View>

                {/* THẺ THỜI TIẾT */}
                <View style={[styles.weatherCard, { backgroundColor: theme.primary }]}>
                    <View style={styles.weatherInfo}>
                        <MaterialCommunityIcons name="weather-partly-cloudy" size={40} color="#FFFFFF" />
                        <View style={styles.tempContainer}>
                            <Text style={styles.tempText}>{data.weather.temp}°C</Text>
                            <Text style={styles.weatherCondition}>
                                {data.weather.condition === 'Đang tải...' ? (language === 'vi' ? 'Đang tải...' : 'Loading...') : data.weather.condition}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.weatherDivider} />
                    <Text style={styles.weatherMessage}>{weatherMessage}</Text>
                </View>

                {/* GỢI Ý HÔM NAY MẶC GÌ */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('today_outfit')}</Text>
                    <TouchableOpacity onPress={onRefresh}>
                        <Text style={[styles.seeMore, { color: theme.primary }]}>{t('change_outfit')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.suggestionContainer}>
                    {isLoading ? <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} /> : (
                        data.suggestion.top && data.suggestion.bottom ? (
                            <View style={styles.suggestionRow}>
                                <View style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <Image source={{ uri: data.suggestion.top.imageUrl }} style={styles.itemImage} transition={300} />
                                    <Text style={[styles.itemLabel, { color: theme.text }]}>{t('top')}</Text>
                                </View>

                                <Ionicons name="add" size={24} color={theme.gray} style={styles.plusIcon} />

                                <View style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <Image source={{ uri: data.suggestion.bottom.imageUrl }} style={styles.itemImage} transition={300} />
                                    <Text style={[styles.itemLabel, { color: theme.text }]}>{t('bottom')}</Text>
                                </View>
                            </View>
                        ) : (
                            // UI hiển thị khi tủ đồ cá nhân không đủ quần áo để phối
                            <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Ionicons name="shirt-outline" size={40} color={theme.gray} />
                                <Text style={[styles.emptyBoxText, { color: theme.gray }]}>
                                    {language === 'vi' ? "Tủ đồ của bạn chưa đủ Áo và Quần để tạo bộ trang phục." : "Not enough Tops and Bottoms to create an outfit."}
                                </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('AddItem')}>
                                    <Text style={{ fontFamily: FONTS.medium, color: theme.primary, marginTop: 10 }}>{language === 'vi' ? "+ Thêm đồ ngay" : "+ Add items now"}</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                </View>

                {/* AI BODY SHAPE - KÍCH HOẠT CAMERA (Fix đồng bộ Theme) */}
                <TouchableOpacity 
                    style={[styles.aiActionCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} 
                    onPress={handleBodyShapeCamera}
                >
                    <View style={styles.aiContent}>
                        <View style={styles.aiTextContainer}>
                            <Text style={[styles.aiTitle, { color: theme.primary }]}>{t('body_shape_analysis')}</Text>
                            <Text style={[styles.aiSubtitle, { color: theme.gray }]}>{t('body_shape_desc')}</Text>
                        </View>
                        <View style={[styles.aiIconCircle, { backgroundColor: theme.primary }]}>
                            <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* KHÁM PHÁ THƯƠNG HIỆU MUA SẮM */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>
                    {language === 'vi' ? "Thương hiệu nổi bật" : "Featured Brands"}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandContainer}>
                    {BRANDS.map((brand) => (
                        <TouchableOpacity 
                            key={brand.id} 
                            style={[styles.brandCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => Linking.openURL(brand.url)}
                        >
                            <Image source={{ uri: brand.logo }} style={styles.brandLogo} contentFit="contain" transition={200} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* MỚI THÊM VÀO TỦ */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recently_added')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Wardrobe')}>
                        <Text style={[styles.seeMore, { color: theme.primary }]}>{t('see_all')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.recentContainer}>
                    {isLoading ? <ActivityIndicator color={theme.primary} /> : recentItems.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recentItems.map((item, index) => (
                                <View key={item.id || index} style={[styles.recentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.recentImage} transition={300} cachePolicy="memory-disk" />
                                </View>
                            ))}
                            <TouchableOpacity style={[styles.recentCard, styles.addRecentCard, { backgroundColor: theme.background, borderColor: theme.primary }]} onPress={() => navigation.navigate('AddItem')}>
                                <Ionicons name="add-circle-outline" size={30} color={theme.primary} />
                                <Text style={[styles.addRecentText, { color: theme.primary }]}>{t('add_new')}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    ) : (
                        <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 20 }]}>
                            <Text style={[styles.emptyText, { color: theme.gray }]}>{t('empty_recent')}</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 25 },
    greetingText: { fontFamily: FONTS.regular, fontSize: 16 },
    userName: { fontFamily: FONTS.bold, fontSize: 24 },
    iconButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    badge: { position: 'absolute', top: 10, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4B4B', borderWidth: 2, borderColor: '#FFF' },
    weatherCard: { borderRadius: SIZES.radius * 2, padding: 20, marginBottom: 30, elevation: 6, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10 },
    weatherInfo: { flexDirection: 'row', alignItems: 'center' },
    tempContainer: { marginLeft: 15 },
    tempText: { fontFamily: FONTS.bold, fontSize: 32, color: '#FFF' },
    weatherCondition: { fontFamily: FONTS.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' },
    weatherDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
    weatherMessage: { fontFamily: FONTS.regular, fontSize: 14, color: '#FFF', lineHeight: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 18 },
    seeMore: { fontFamily: FONTS.medium, fontSize: 14 },
    suggestionContainer: { marginBottom: 30 },
    suggestionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemCard: { width: '44%', aspectRatio: 1, borderRadius: SIZES.radius, padding: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    itemImage: { width: '100%', height: '80%', borderRadius: SIZES.radius - 5, contentFit: 'contain' },
    itemLabel: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 5 },
    plusIcon: { opacity: 0.5 },
    emptyBox: { borderRadius: SIZES.radius, borderWidth: 1, padding: 30, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
    emptyBoxText: { fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', marginTop: 10 },
    aiActionCard: { borderRadius: SIZES.radius, padding: 20, elevation: 3, marginBottom: 35, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5 },
    aiContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    aiTitle: { fontFamily: FONTS.bold, fontSize: 16, marginBottom: 4 },
    aiSubtitle: { fontFamily: FONTS.regular, fontSize: 13 },
    aiIconCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    brandContainer: { marginBottom: 35, flexDirection: 'row' },
    brandCard: { width: 100, height: 60, borderRadius: SIZES.radius, marginRight: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, padding: 10 },
    brandLogo: { width: '100%', height: '100%' },
    recentContainer: { marginBottom: 35, minHeight: 80, justifyContent: 'center' },
    recentCard: { width: 80, height: 80, borderRadius: SIZES.radius, marginRight: 15, elevation: 1, borderWidth: 1, padding: 5 },
    recentImage: { width: '100%', height: '100%', borderRadius: SIZES.radius - 5, contentFit: 'cover' },
    addRecentCard: { justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5 },
    addRecentText: { fontFamily: FONTS.medium, fontSize: 10, marginTop: 2 },
    emptyText: { fontFamily: FONTS.regular, fontSize: 14, fontStyle: 'italic' }
});

export default HomeScreen;