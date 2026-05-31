import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, TouchableOpacity, 
    ActivityIndicator, Dimensions, Modal, StatusBar
} from 'react-native';
import { Image } from 'expo-image';
import { FONTS } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// 🟢 MAP CHUẨN XÁC TÊN VỚI DATABASE TRONG SEED.JS
const MANUAL_SHAPES = [
    { name: "Dáng Quả Lê (Pear)", icon: "fruit-pear" },
    { name: "Dáng Đồng Hồ Cát (Hourglass)", icon: "timer-sand" },
    { name: "Dáng Chữ Nhật (Rectangle)", icon: "shape-rectangle-plus" },
    { name: "Dáng Tam Giác Ngược (Inverted Triangle)", icon: "triangle-down" },
    { name: "Dáng Quả Táo (Apple)", icon: "apple" }
];

const LUXURY_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop";

const BodyShapeScreen = ({ route, navigation }) => {
    const { imageUri, manualShape } = route.params; 
    const { theme, isDarkMode } = useContext(SettingsContext);

    const [status, setStatus] = useState('analyzing'); 
    const [resultData, setResultData] = useState(null);
    const [isManualModalVisible, setManualModalVisible] = useState(false);

    useEffect(() => {
        if (manualShape) {
            handleManualSelect(manualShape, true);
        } else {
            analyzeImage();
        }
    }, [manualShape]);

    const analyzeImage = async () => {
        try {
            const formData = new FormData();
            formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'scan_bodyshape.jpg' });

            const response = await axiosClient.post('/body-shapes/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data && response.data.success) {
                setResultData(response.data);
                setStatus('success');
            } else {
                throw new Error("Lỗi server");
            }
        } catch (error) {
            setStatus('error');
        }
    };

    const handleManualSelect = async (shapeName, isInitialBypass = false) => {
        setManualModalVisible(false);
        if (!isInitialBypass) setStatus('analyzing'); 
        
        try {
            const guidesRes = await axiosClient.get('/body-shapes');
            const targetShape = shapeName.split(' (')[0]; 
            const selectedGuide = guidesRes.data.find(g => g.shapeName.includes(targetShape));
            
            setResultData({ 
                shapeResult: selectedGuide ? selectedGuide.shapeName : shapeName, 
                advice: selectedGuide || null,
                analyzedImageUrl: selectedGuide?.illustrationUrl || LUXURY_FALLBACK_IMAGE 
            });
            setStatus('success');
        } catch (error) {
            setStatus('error');
        }
    };

    if (status === 'analyzing') {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
                <View style={[styles.radarBox, { backgroundColor: theme.card }]}>
                    <MaterialCommunityIcons name="line-scan" size={50} color={theme.primary} />
                </View>
                <Text style={[styles.scanningText, { color: theme.text }]}>Đang phân tích tỷ lệ vàng...</Text>
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
            </View>
        );
    }

    if (status === 'error') {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <Ionicons name="alert-circle-outline" size={70} color="#E43F5A" style={{ marginBottom: 20 }} />
                <Text style={[styles.errorText, { color: theme.text }]}>Phân tích không thành công</Text>
                <Text style={[styles.errorSubText, { color: theme.gray }]}>Xin lỗi, ảnh của bạn có thể chưa đủ sáng hoặc AI không nhận diện được khung xương.</Text>
                <TouchableOpacity style={[styles.btnRetry, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.btnRetryText, { color: theme.background }]}>Thử lại với ảnh khác</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // XỬ LÝ DỮ LIỆU JSON TỪ DATABASE
    let parsedAdvice = { advantages: [], toWear: [], toAvoid: [] };
    let rawAdviceStr = resultData?.advice?.stylingAdvice;
    try {
        if (rawAdviceStr) {
            const parsed = JSON.parse(rawAdviceStr);
            if (parsed.advantages) parsedAdvice = parsed;
        }
    } catch (e) {
        parsedAdvice.advantages = [rawAdviceStr || "Hãy tự tin diện những trang phục bạn yêu thích!"];
    }

    // Lọc lại tên hiển thị (Bỏ tiếng Anh để Title gọn và sang hơn)
    const displayName = resultData.shapeResult.split(' (')[0];
    const highlightColor = theme.primary;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            
            {/* NÚT BACK CHUẨN XỊN (Nổi trên cùng) */}
            <SafeAreaView style={styles.headerAbsolute}>
                <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tuneBtn, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setManualModalVisible(true)}>
                    <Ionicons name="options-outline" size={20} color={theme.text} />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* 🟢 HERO SECTION: TỐI GIẢN TẬP TRUNG VÀO ẢNH PHÁC THẢO */}
                <View style={styles.heroSection}>
                    <Image 
                        source={{ uri: resultData.analyzedImageUrl }} 
                        style={styles.sketchImage} 
                        contentFit="contain" 
                        transition={300} 
                    />
                </View>

                {/* 🟢 PHẦN ĐỊNH DANH (TITLE TO RÕ RÀNG) */}
                <View style={styles.titleSection}>
                    <Text style={[styles.subTitleText, { color: theme.gray }]}>BẠN SỞ HỮU</Text>
                    <Text style={[styles.mainTitleText, { color: theme.text }]}>{displayName}</Text>
                    <Text style={[styles.descText, { color: theme.text }]}>
                        {resultData.advice?.description}
                    </Text>
                </View>

                {/* 🟢 KHỐI CHỈ SỐ AI CÔNG NGHỆ CAO (Chỉ render khi quét ảnh có metrics) */}
                {resultData?.metrics && (
                    <View style={styles.metricsWrapper}>
                        <View style={[styles.metricsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.metricsHeader}>
                                <MaterialCommunityIcons name="vector-combine" size={16} color={theme.primary} />
                                <Text style={[styles.metricsTitle, { color: theme.text }]}>THÔNG SỐ KHUNG XƯƠNG (AI POSE SCANNER)</Text>
                            </View>
                            
                            <View style={styles.metricsGrid}>
                                <View style={styles.metricCard}>
                                    {/* Sửa text "Tỷ lệ vai" thành "Bề ngang vai" */}
                                    <Text style={[styles.metricLabel, { color: theme.gray }]}>Bề ngang Vai</Text>
                                    <Text style={[styles.metricValue, { color: theme.primary }]}>
                                        {resultData.metrics.shoulder_width} px
                                    </Text>
                                </View>
                                
                                <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
                                
                                <View style={styles.metricCard}>
                                    {/* Sửa text "Tỷ lệ hông" thành "Bề ngang hông" */}
                                    <Text style={[styles.metricLabel, { color: theme.gray }]}>Bề ngang Hông</Text>
                                    <Text style={[styles.metricValue, { color: theme.primary }]}>
                                        {resultData.metrics.hip_width} px
                                    </Text>
                                </View>
                                
                                <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
                                
                                <View style={styles.metricCard}>
                                    {/* Sửa text "Hệ số tương quan" thành "Tỷ lệ Vai/Hông" */}
                                    <Text style={[styles.metricLabel, { color: theme.gray }]}>Tỷ lệ Vai/Hông</Text>
                                    <Text style={[styles.metricValue, { color: theme.accent || '#E43F5A' }]}>
                                        {resultData.metrics.calculated_ratio}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={[styles.techFooter, { borderTopColor: theme.border }]}>
                                <Ionicons name="shield-checkmark-sharp" size={12} color="#27AE60" />
                                <Text style={[styles.techFooterText, { color: theme.gray }]}>
                                    Dữ liệu Euclid trích xuất thời gian thực qua mốc MediaPipe Pose 2D
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* 🟢 NỘI DUNG CẨM NANG (CHIA KHỐI THÔNG MINH, DỄ ĐỌC) */}
                <View style={styles.contentSection}>

                    {/* KHỐI ƯU ĐIỂM (DẠNG QUOTE ẤN TƯỢNG) */}
                    {parsedAdvice.advantages.length > 0 && (
                        <View style={[styles.advantageBox, { backgroundColor: isDarkMode ? '#1C2541' : '#FDF5F7', borderLeftColor: highlightColor }]}>
                            <Ionicons name="sparkles" size={20} color={highlightColor} style={{ marginBottom: 8 }} />
                            {parsedAdvice.advantages.map((adv, idx) => (
                                <Text key={idx} style={[styles.advantageText, { color: theme.text }]}>• {adv}</Text>
                            ))}
                        </View>
                    )}

                    {/* KHỐI NÊN MẶC (DẠNG CARD LIST THANH LỊCH) */}
                    {parsedAdvice.toWear.length > 0 && (
                        <View style={styles.sectionBlock}>
                            <Text style={[styles.sectionHeading, { color: theme.text }]}>Bí quyết tôn dáng</Text>
                            <View style={styles.cardList}>
                                {parsedAdvice.toWear.map((item, idx) => (
                                    <View key={idx} style={[styles.doCard, { backgroundColor: theme.card }]}>
                                        <View style={[styles.doIconBg, { backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
                                            <Ionicons name="checkmark" size={18} color="#27AE60" />
                                        </View>
                                        <View style={styles.doTextWrap}>
                                            <Text style={[styles.doTitle, { color: theme.text }]}>{item.title}</Text>
                                            <Text style={[styles.doDesc, { color: theme.gray }]}>{item.desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* KHỐI NÊN TRÁNH (DẠNG CẢNH BÁO NHẸ NHÀNG) */}
                    {parsedAdvice.toAvoid.length > 0 && (
                        <View style={styles.sectionBlock}>
                            <Text style={[styles.sectionHeading, { color: theme.text }]}>Cần lưu ý tránh</Text>
                            {parsedAdvice.toAvoid.map((avoid, idx) => (
                                <View key={idx} style={[styles.dontRow, { borderColor: theme.border }]}>
                                    <Ionicons name="close-circle" size={20} color="#E43F5A" />
                                    <Text style={[styles.dontText, { color: theme.text }]}>{avoid}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* BUTTON NỔI DƯỚI CÙNG (GỌN GÀNG, CAO CẤP) */}
            <View style={[styles.bottomFloating, { backgroundColor: theme.background }]}>
                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
                    onPress={() => navigation.navigate('MainApp', { screen: 'Wardrobe' })}
                >
                    <Text style={[styles.saveBtnText, { color: '#FFF' }]}>Áp dụng vào Tủ đồ</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            {/* MODAL CHỌN LẠI DÁNG NGƯỜI */}
            <Modal visible={isManualModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBgCenter}>
                    <View style={[styles.modalBox, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Tùy chỉnh kết quả</Text>
                                <Text style={[styles.modalSub, { color: theme.gray }]}>Chọn dáng người phù hợp nhất với bạn</Text>
                            </View>
                            <TouchableOpacity onPress={() => setManualModalVisible(false)} style={styles.closeIconBtn}>
                                <Ionicons name="close" size={24} color={theme.gray} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                            {MANUAL_SHAPES.map((shape, index) => {
                                const splitName = shape.name.split(' (');
                                const nameVN = splitName[0];
                                const nameEN = splitName[1] ? splitName[1].replace(')', '') : '';

                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.shapeOption, { backgroundColor: theme.card, borderColor: theme.border }]} 
                                        onPress={() => handleManualSelect(shape.name)}
                                    >
                                        <View style={[styles.shapeIconWrap, { backgroundColor: theme.background }]}>
                                            <MaterialCommunityIcons name={shape.icon} size={24} color={theme.primary} />
                                        </View>
                                        <View style={styles.shapeTextWrap}>
                                            <Text style={[styles.shapeOptionTitle, { color: theme.text }]}>{nameVN}</Text>
                                            <Text style={[styles.shapeOptionSub, { color: theme.gray }]}>{nameEN}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={theme.gray} />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, zIndex: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    tuneBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    radarBox: { width: 90, height: 90, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    scanningText: { fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 0.5 },
    errorText: { fontFamily: FONTS.bold, fontSize: 20, marginBottom: 8 },
    errorSubText: { fontFamily: FONTS.regular, fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22, paddingHorizontal: 20 },
    btnRetry: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 20 },
    btnRetryText: { fontFamily: FONTS.bold, fontSize: 15 },
    heroSection: { height: height * 0.4, width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 80, paddingBottom: 20 },
    sketchImage: { width: '80%', height: '100%', opacity: 0.9 },
    titleSection: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20, alignItems: 'center' },
    subTitleText: { fontFamily: FONTS.bold, fontSize: 12, letterSpacing: 2, marginBottom: 6 },
    mainTitleText: { fontFamily: FONTS.bold, fontSize: 32, marginBottom: 16, textAlign: 'center', letterSpacing: -0.5 },
    descText: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 26, textAlign: 'center', opacity: 0.8 },
    contentSection: { paddingHorizontal: 24 },
    advantageBox: { padding: 20, borderRadius: 20, borderLeftWidth: 4, marginBottom: 32 },
    advantageText: { fontFamily: FONTS.medium, fontSize: 15, lineHeight: 24, marginBottom: 6 },
    sectionBlock: { marginBottom: 35 },
    sectionHeading: { fontFamily: FONTS.bold, fontSize: 20, marginBottom: 16, letterSpacing: -0.3 },
    cardList: { gap: 12 },
    doCard: { flexDirection: 'row', padding: 16, borderRadius: 20, alignItems: 'center' },
    doIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    doTextWrap: { flex: 1 },
    doTitle: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 4 },
    doDesc: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20 },
    dontRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, alignItems: 'center' },
    dontText: { fontFamily: FONTS.medium, fontSize: 14, lineHeight: 22, flex: 1, marginLeft: 12 },
    bottomFloating: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    saveBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 0.5 },
    modalBgCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { width: '90%', borderRadius: 32, padding: 24, maxHeight: height * 0.75 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    modalTitle: { fontFamily: FONTS.bold, fontSize: 20, marginBottom: 4 },
    modalSub: { fontFamily: FONTS.regular, fontSize: 13 },
    closeIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center' },
    shapeOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
    shapeIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    shapeTextWrap: { flex: 1, paddingHorizontal: 14 },
    shapeOptionTitle: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 2 },
    shapeOptionSub: { fontFamily: FONTS.regular, fontSize: 12, opacity: 0.7 },
    
    // 🟢 THÀNH PHẦN THEME STYLES CHO KHỐI THÔNG SỐ AI MỚI BỔ SUNG
    metricsWrapper: {
        paddingHorizontal: 24,
        marginBottom: 28,
    },
    metricsContainer: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    metricsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 6,
    },
    metricsTitle: {
        fontFamily: FONTS.bold,
        fontSize: 10,
        letterSpacing: 1.2,
        opacity: 0.9,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    metricCard: {
        flex: 1,
        alignItems: 'center',
    },
    metricLabel: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        marginBottom: 6,
    },
    metricValue: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        letterSpacing: -0.3,
    },
    metricDivider: {
        width: 1,
        height: 28,
        opacity: 0.7,
    },
    techFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 0.5,
        gap: 6,
    },
    techFooterText: {
        fontFamily: FONTS.regular,
        fontSize: 10.5,
        opacity: 0.7,
    },
});

export default BodyShapeScreen;