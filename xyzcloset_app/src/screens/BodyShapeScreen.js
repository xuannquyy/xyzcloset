import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, TouchableOpacity, 
    ActivityIndicator, Alert, Dimensions, Modal 
} from 'react-native';
import { Image } from 'expo-image';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

// DỮ LIỆU DỰ PHÒNG CHO TÍNH NĂNG "CHỌN LẠI DÁNG" (Manual Override)
const MANUAL_SHAPES = [
    { name: "Dáng Quả Lê", icon: "fruit-pear" },
    { name: "Dáng Đồng Hồ Cát", icon: "timer-sand" },
    { name: "Dáng Chữ Nhật", icon: "shape-rectangle-plus" },
    { name: "Dáng Tam Giác Ngược", icon: "triangle-down" },
    { name: "Dáng Quả Táo", icon: "apple" }
];

const BodyShapeScreen = ({ route, navigation }) => {
    const { imageUri } = route.params; 
    const { theme, language } = useContext(SettingsContext);

    const [status, setStatus] = useState('analyzing'); 
    const [resultData, setResultData] = useState(null);
    const [isManualModalVisible, setManualModalVisible] = useState(false);

    useEffect(() => {
        analyzeImage();
    }, []);

    const analyzeImage = async () => {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'scan_bodyshape.jpg'
            });

            // GỌI THẲNG LÊN NODE.JS
            const response = await axiosClient.post('/body-shapes/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data && response.data.success) {
                setResultData(response.data);
                setStatus('success');
            } else {
                throw new Error("Lỗi trả về từ server");
            }
        } catch (error) {
            console.log("Lỗi phân tích:", error);
            setStatus('error');
            const errorMsg = error.response?.data?.message || (language === 'vi' ? "Đã xảy ra sự cố. Vui lòng chụp lại ảnh." : "An error occurred. Please retake the photo.");
            Alert.alert(language === 'vi' ? "Phân tích thất bại" : "Analysis Failed", errorMsg);
        }
    };

    // Hàm gọi lại API lấy lời khuyên khi người dùng tự chọn dáng
    const handleManualSelect = async (shapeName) => {
        setManualModalVisible(false);
        // Cập nhật tạm thời UI để không bị gián đoạn
        setResultData(prev => ({ ...prev, shapeResult: shapeName, metrics: null }));
        
        try {
            // Lấy lại danh sách cẩm nang từ Backend để đắp dữ liệu mới vào
            const guidesRes = await axiosClient.get('/body-shapes');
            const selectedGuide = guidesRes.data.find(g => g.shapeName.includes(shapeName.split(' ')[1]));
            if (selectedGuide) {
                setResultData(prev => ({ ...prev, advice: selectedGuide }));
            }
        } catch (error) {
            console.log("Lỗi lấy dữ liệu dáng mới:", error);
        }
    };

    if (status === 'analyzing') {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: '#1C2541' }]}>
                <Image source={{ uri: imageUri }} style={styles.scanningImage} contentFit="cover" opacity={0.4} />
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#E5B05C" />
                    <Text style={styles.scanningText}>
                        {language === 'vi' ? "AI đang phân tích khung xương..." : "AI is analyzing body frame..."}
                    </Text>
                    <Text style={styles.scanningSubText}>
                        {language === 'vi' ? "Quá trình này mất khoảng 3-5 giây" : "This takes about 3-5 seconds"}
                    </Text>
                </View>
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="alert-circle-outline" size={60} color="#FF4B4B" />
                <Text style={[styles.errorText, { color: theme.text }]}>
                    {language === 'vi' ? "Không thể quét được khung xương" : "Could not scan body frame"}
                </Text>
                <TouchableOpacity style={[styles.btnRetry, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
                    <Text style={styles.btnRetryText}>{language === 'vi' ? "Chụp lại ảnh" : "Retake Photo"}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getIcon = (shapeName) => {
        if(shapeName?.includes("Lê")) return "fruit-pear";
        if(shapeName?.includes("Đồng Hồ Cát")) return "timer-sand";
        if(shapeName?.includes("Táo")) return "apple";
        if(shapeName?.includes("Tam Giác")) return "triangle-down";
        return "shape-rectangle-plus";
    };

    // -------------------------------------------------------------
    // XỬ LÝ DỮ LIỆU JSON TỪ CƠ SỞ DỮ LIỆU (Parse JSON an toàn)
    // -------------------------------------------------------------
    let parsedAdvice = { advantages: [], toWear: [], toAvoid: [] };
    let rawAdviceStr = resultData?.advice?.stylingAdvice;

    try {
        if (rawAdviceStr) {
            // Cố gắng dịch chuỗi JSON từ Database
            const parsed = JSON.parse(rawAdviceStr);
            if (parsed.advantages) {
                parsedAdvice = parsed;
            }
        }
    } catch (e) {
        // Nếu DB đang chứa text thường (chưa cập nhật JSON), đổ tạm vào mảng advantages
        parsedAdvice.advantages = [rawAdviceStr || (language === 'vi' ? "Hãy tự tin mặc những gì bạn thích!" : "Wear what makes you confident!")];
    }

    // Lấy màu nền Pastel hồng/cam tùy thuộc vào theme để khớp với thiết kế UI của ông
    const cardBgColor = isDarkMode(theme) ? '#2A1F2D' : '#F7D6D6';
    const cardItemColor = isDarkMode(theme) ? '#3E2A35' : '#FFF0F0';
    const accentColor = '#B85065'; // Màu nhấn chữ đỏ rượu như thiết kế

    // Hàm phụ trợ kiểm tra Dark Mode
    function isDarkMode(t) { return t.background === '#121212'; }

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                
                {/* 1. ẢNH SCAN VÀ KẾT QUẢ CHÍNH */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: resultData.analyzedImageUrl || imageUri }} style={styles.resultImage} contentFit="cover" />
                    <View style={styles.heroOverlay}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        
                        <View style={styles.resultBadge}>
                            <MaterialCommunityIcons name={getIcon(resultData.shapeResult)} size={24} color="#1C2541" />
                            <Text style={styles.resultBadgeText}>{resultData.shapeResult}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.contentSection}>
                    
                    {/* NÚT CHỌN LẠI DÁNG (MANUAL OVERRIDE) */}
                    <TouchableOpacity style={styles.overrideBtn} onPress={() => setManualModalVisible(true)}>
                        <Text style={[styles.overrideText, { color: theme.primary }]}>
                            {language === 'vi' ? "Chưa chính xác? Chọn lại dáng người" : "Not accurate? Reselect body shape"}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={theme.primary} />
                    </TouchableOpacity>

                    <Text style={[styles.descText, { color: theme.text }]}>{resultData.advice?.description}</Text>

                    {/* ========================================================= */}
                    {/* KHỐI GIAO DIỆN KIỂU MỚI (Khớp 100% với ảnh ông gửi)       */}
                    {/* ========================================================= */}
                    
                    {/* THẺ ƯU ĐIỂM */}
                    {parsedAdvice.advantages.length > 0 && (
                        <View style={[styles.uiCard, { backgroundColor: cardBgColor }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="star-outline" size={22} color={accentColor} />
                                <Text style={[styles.cardTitle, { color: accentColor }]}>
                                    {language === 'vi' ? "ƯU ĐIỂM CƠ THỂ" : "BODY ADVANTAGES"}
                                </Text>
                            </View>
                            {parsedAdvice.advantages.map((adv, idx) => (
                                <View key={idx} style={styles.listItem}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color={accentColor} />
                                    <Text style={[styles.listText, { color: theme.text }]}>{adv}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* THẺ NÊN MẶC (Lưới 2x2) */}
                    {parsedAdvice.toWear.length > 0 && (
                        <View style={[styles.uiCard, { backgroundColor: cardBgColor }]}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="hanger" size={22} color={accentColor} />
                                <Text style={[styles.cardTitle, { color: accentColor }]}>
                                    {language === 'vi' ? "TRANG PHỤC NÊN MẶC" : "WHAT TO WEAR"}
                                </Text>
                            </View>
                            <View style={styles.gridContainer}>
                                {parsedAdvice.toWear.map((item, idx) => (
                                    <View key={idx} style={[styles.gridItem, { backgroundColor: cardItemColor }]}>
                                        <Text style={[styles.gridTitle, { color: accentColor }]}>{item.title}</Text>
                                        <Text style={[styles.gridDesc, { color: theme.text }]}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* THẺ NÊN TRÁNH */}
                    {parsedAdvice.toAvoid.length > 0 && (
                        <View style={[styles.uiCard, { backgroundColor: cardBgColor }]}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="ban-outline" size={22} color={accentColor} />
                                <Text style={[styles.cardTitle, { color: accentColor }]}>
                                    {language === 'vi' ? "TRANG PHỤC NÊN TRÁNH" : "WHAT TO AVOID"}
                                </Text>
                            </View>
                            {parsedAdvice.toAvoid.map((avoid, idx) => (
                                <View key={idx} style={styles.listItem}>
                                    <Ionicons name="close-circle-outline" size={20} color={accentColor} />
                                    <Text style={[styles.listText, { color: theme.text }]}>{avoid}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* NÚT LƯU KẾT QUẢ */}
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 20 }]}
                        onPress={() => {
                            Alert.alert("Hoàn tất", "Dáng người của bạn đã được cập nhật!");
                            navigation.navigate('MainTabs', { screen: 'Profile' });
                        }}
                    >
                        <Text style={styles.saveBtnText}>{language === 'vi' ? "Lưu vào Hồ sơ" : "Save to Profile"}</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* BOTTOM SHEET CHỌN LẠI DÁNG NGƯỜI */}
            <Modal visible={isManualModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {language === 'vi' ? "Chọn dáng người của bạn" : "Select your body shape"}
                            </Text>
                            <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                                <Ionicons name="close" size={28} color={theme.gray} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {MANUAL_SHAPES.map((shape, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.shapeOption, { borderColor: theme.border }]}
                                    onPress={() => handleManualSelect(shape.name)}
                                >
                                    <MaterialCommunityIcons name={shape.icon} size={28} color={theme.primary} />
                                    <Text style={[styles.shapeOptionText, { color: theme.text }]}>{shape.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={theme.gray} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanningImage: { ...StyleSheet.absoluteFillObject },
    overlay: { alignItems: 'center', backgroundColor: 'rgba(28, 37, 65, 0.85)', padding: 30, borderRadius: SIZES.radius * 2, width: '80%' },
    scanningText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFF', marginTop: 20, marginBottom: 5, textAlign: 'center' },
    scanningSubText: { fontFamily: FONTS.regular, fontSize: 13, color: '#8A94A6' },
    errorText: { fontFamily: FONTS.medium, fontSize: 16, marginTop: 15, marginBottom: 25 },
    btnRetry: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    btnRetryText: { fontFamily: FONTS.bold, color: '#FFF', fontSize: 16 },
    
    heroSection: { height: width * 1.1, width: '100%', position: 'relative' },
    resultImage: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.15)' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(28, 37, 65, 0.6)', justifyContent: 'center', alignItems: 'center' },
    resultBadge: { alignSelf: 'center', backgroundColor: '#E5B05C', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5, marginBottom: -20 },
    resultBadgeText: { fontFamily: FONTS.bold, fontSize: 18, color: '#1C2541', marginLeft: 8 },
    
    contentSection: { padding: SIZES.padding, paddingTop: 30, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
    
    overrideBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, marginBottom: 10 },
    overrideText: { fontFamily: FONTS.medium, fontSize: 14, marginRight: 5, textDecorationLine: 'underline' },
    descText: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 25, paddingHorizontal: 10 },

    // STYLE MỚI CHO GIAO DIỆN THẺ (UI CARDS)
    uiCard: { borderRadius: SIZES.radius, padding: 20, marginBottom: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontFamily: FONTS.bold, fontSize: 16, marginLeft: 8, textTransform: 'uppercase' },
    
    listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingRight: 15 },
    listText: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, marginLeft: 10, flex: 1 },
    
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridItem: { width: '48%', borderRadius: SIZES.radius - 5, padding: 15, marginBottom: 15, elevation: 1 },
    gridTitle: { fontFamily: FONTS.bold, fontSize: 14, marginBottom: 5 },
    gridDesc: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18 },

    saveBtn: { paddingVertical: 16, borderRadius: SIZES.radius, alignItems: 'center', elevation: 3 },
    saveBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },

    // STYLE CHO MODAL CHỌN DÁNG
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: height * 0.7 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 18 },
    shapeOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    shapeOptionText: { fontFamily: FONTS.medium, fontSize: 16, marginLeft: 15 },
});

export default BodyShapeScreen;