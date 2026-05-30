import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, TouchableWithoutFeedback, FlatList, 
    Dimensions, Animated, PanResponder, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

// =================================================================
// COMPONENT: MÓN ĐỒ CÓ THỂ KÉO THẢ (PHIÊN BẢN SIÊU MƯỢT 60FPS)
// =================================================================
const DraggableItem = ({ item, onRemove, onUpdate, isSelected, onSelect }) => {
    const pan = useRef(new Animated.ValueXY({ x: item.initialX || 0, y: item.initialY || 0 })).current;
    const animScale = useRef(new Animated.Value(1)).current;
    
    // Biến lưu thời gian để tính Double Tap
    const lastTap = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            // KHÔNG giành quyền ưu tiên ngay từ đầu, nhường cho các nút bấm bên trong
            onStartShouldSetPanResponder: () => false,
            
            // CHỈ giành quyền khi ngón tay thực sự nhúc nhích (ngưỡng 2px cực mượt)
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
            },
            
            onPanResponderGrant: () => {
                pan.setOffset({ x: pan.x._value, y: pan.y._value });
                pan.setValue({ x: 0, y: 0 });
                // Phình to ra một tí xíu tạo cảm giác "bốc" đồ lên
                Animated.spring(animScale, { toValue: 1.08, useNativeDriver: false }).start();
            },
            
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false } // Kéo siêu mượt
            ),
            
            onPanResponderRelease: () => {
                pan.flattenOffset();
                Animated.spring(animScale, { toValue: 1, useNativeDriver: false }).start();
                // Lưu lại tọa độ cuối cùng
                onUpdate(item.uniqueId, { initialX: pan.x._value, initialY: pan.y._value });
            }
        })
    ).current;

    // Xử lý chạm (Tap) độc lập với kéo (Drag)
    const handleImageTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            // Chạm 2 lần liên tiếp -> Lật ảnh
            onUpdate(item.uniqueId, { isFlipped: !item.isFlipped });
        } else {
            // Chạm 1 lần -> Chọn ảnh để hiện thanh công cụ
            onSelect(item.uniqueId);
        }
        lastTap.current = now;
    };

    return (
        <Animated.View
            style={[ 
                styles.draggableWrapper, 
                { 
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: animScale } 
                    ],
                    zIndex: item.zIndex 
                } 
            ]}
            {...panResponder.panHandlers}
        >
            <View style={[styles.draggableInner, isSelected && styles.selectedBorder]}>
                
                {/* 1. Món đồ được bọc trong cảm biến Chạm */}
                <TouchableWithoutFeedback onPress={handleImageTap}>
                    <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: item.scale }, { scaleX: item.isFlipped ? -1 : 1 }] }}>
                        <Image source={{ uri: item.imageUrl }} style={styles.dragImage} contentFit="contain" />
                    </Animated.View>
                </TouchableWithoutFeedback>
                
                {/* 2. Nút X Xóa đồ (Hoạt động hoàn hảo) */}
                <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => onRemove(item.uniqueId)}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="close-circle" size={28} color="#E43F5A" />
                </TouchableOpacity>

                {/* 3. Mini Toolbar (Chỉnh to nhỏ, lớp trước sau) */}
                {isSelected && (
                    <View style={styles.miniToolbar}>
                        <TouchableOpacity onPress={() => onUpdate(item.uniqueId, { scale: Math.min(item.scale + 0.15, 2.5) })} style={styles.toolbarBtn}>
                            <Ionicons name="add-circle" size={26} color="#111A33" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onUpdate(item.uniqueId, { scale: Math.max(item.scale - 0.15, 0.4) })} style={styles.toolbarBtn}>
                            <Ionicons name="remove-circle" size={26} color="#111A33" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onUpdate(item.uniqueId, { zIndex: item.zIndex + 10 })} style={styles.toolbarBtn}>
                            <Ionicons name="chevron-up-circle" size={26} color="#27AE60" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onUpdate(item.uniqueId, { zIndex: Math.max(item.zIndex - 10, 1) })} style={styles.toolbarBtn}>
                            <Ionicons name="chevron-down-circle" size={26} color="#F39C12" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

// =================================================================
// MÀN HÌNH CHÍNH
// =================================================================
const OutfitScreen = ({ navigation }) => {
    const { theme, isDarkMode, t, language } = useContext(SettingsContext);
    const viewShotRef = useRef();

    const [personalItems, setPersonalItems] = useState([]);
    const [publicItems, setPublicItems] = useState([]);
    const [activeTab, setActiveTab] = useState('personal'); 
    const [isLoading, setIsLoading] = useState(true);

    const [canvasItems, setCanvasItems] = useState([]);
    const [outfitName, setOutfitName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);

    // Bộ phông nền theo ngữ cảnh
    const [bgTheme, setBgTheme] = useState('transparent');
    const bgOptions = [
        { id: 'transparent', name: 'Nền trống', colors: isDarkMode ? ['#1C2541', '#0B132B'] : ['#FFFFFF', '#F7E9EE'] },
        { id: 'summer', name: 'Mùa Hè', colors: ['#4E65FF', '#92EFFD'] }, 
        { id: 'winter', name: 'Mùa Đông', colors: ['#E0EAFC', '#CFDEF3'] }, 
        { id: 'rainy', name: 'Mùa Mưa', colors: ['#606c88', '#3f4c6b'] } 
    ];
    const currentBgColors = bgOptions.find(b => b.id === bgTheme).colors;

    const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error' });
    const showCustomAlert = (title, message, type = 'error') => {
        setCustomAlert({ visible: true, title, message, type });
    };

    useEffect(() => {
        const fetchAllItems = async () => {
            try {
                const [personalRes, publicRes] = await Promise.all([
                    axiosClient.get('/wardrobe'),
                    axiosClient.get('/wardrobe/public')
                ]);
                setPersonalItems(personalRes.data);
                setPublicItems(publicRes.data);
            } catch (error) {
                console.log("Lỗi tải đồ:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllItems();
    }, []);

    const handleAddItemToCanvas = (item) => {
        const newItem = { 
            ...item, 
            uniqueId: Date.now().toString() + Math.random().toString(),
            initialX: (Math.random() - 0.5) * 80, 
            initialY: (Math.random() - 0.5) * 80,
            zIndex: canvasItems.length + 1,
            scale: 1,
            isFlipped: false
        };
        setCanvasItems([...canvasItems, newItem]);
        setSelectedItemId(newItem.uniqueId); 
    };

    const handleRemoveFromCanvas = (uniqueId) => {
        setCanvasItems(canvasItems.filter(item => item.uniqueId !== uniqueId));
        if (selectedItemId === uniqueId) setSelectedItemId(null);
    };

    const handleUpdateItem = (uniqueId, updates) => {
        setCanvasItems(prevItems => 
            prevItems.map(item => item.uniqueId === uniqueId ? { ...item, ...updates } : item)
        );
    };

    const handleClearCanvas = () => {
        setCanvasItems([]);
        setSelectedItemId(null);
        setOutfitName('');
    };

    const handleSaveOutfit = async () => {
        if (canvasItems.length === 0) {
            return showCustomAlert("Khung hình trống", "Hãy chọn ít nhất một món đồ để bắt đầu phối nhé!", "warning");
        }
        if (!outfitName.trim()) {
            return showCustomAlert("Thiếu tên Set đồ", "Hãy đặt tên (VD: Đồ đi làm mùa mưa) cho Outfit này!", "warning");
        }

        setSelectedItemId(null); // Tắt viền và toolbar trước khi chụp
        setIsSaving(true);
        try {
            // Chờ 300ms để hiệu ứng tắt toolbar chạy xong
            setTimeout(async () => {
                const uri = await viewShotRef.current.capture();
                const itemIds = canvasItems.map(item => item.id);

                const formData = new FormData();
                formData.append('name', outfitName);
                formData.append('wardrobeItemIds', JSON.stringify(itemIds));
                formData.append('image', { uri: uri, type: 'image/jpeg', name: `outfit_${Date.now()}.jpg` });
                formData.append('seasonTag', bgTheme);

                await axiosClient.post('/outfits', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                showCustomAlert("Thành công", "Set đồ chuẩn Stylist đã được lưu vào bộ sưu tập!", "success");
                handleClearCanvas();
                setIsSaving(false);
            }, 300);
            
        } catch (error) {
            console.log("Lỗi lưu Outfit:", error);
            showCustomAlert("Lỗi máy chủ", "Không thể lưu Set đồ lúc này.", "error");
            setIsSaving(false);
        }
    };

    const getAlertIconColor = () => {
        if (customAlert.type === 'success') return '#27AE60';
        if (customAlert.type === 'warning') return '#F39C12';
        return '#E43F5A'; 
    };

    const renderTrayItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.trayItemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleAddItemToCanvas(item)}
            activeOpacity={0.7}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.trayItemImage} contentFit="contain" />
            <View style={styles.addOverlay}>
                <Ionicons name="add-circle" size={24} color={theme.primary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('fitting_room')}</Text>
                <TouchableOpacity onPress={handleSaveOutfit} disabled={isSaving} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                    {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>{t('save_outfit')}</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.canvasSection}>
                <View style={styles.titleRow}>
                    <TextInput 
                        style={[styles.outfitNameInput, { color: theme.text, borderBottomColor: theme.border }]}
                        placeholder={language === 'vi' ? "Đặt tên Set đồ (VD: Cafe ngày Hè)" : "Name this outfit..."}
                        placeholderTextColor={theme.gray}
                        value={outfitName}
                        onChangeText={setOutfitName}
                    />
                    {canvasItems.length > 0 && (
                        <TouchableOpacity onPress={handleClearCanvas} style={styles.clearBtn}>
                            <Ionicons name="trash-bin" size={22} color="#E43F5A" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Chọn Phông nền */}
                <View style={styles.bgSelectorRow}>
                    {bgOptions.map(bg => (
                        <TouchableOpacity 
                            key={bg.id} 
                            onPress={() => setBgTheme(bg.id)}
                            style={[styles.bgPill, bgTheme === bg.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        >
                            <Text style={[styles.bgPillText, bgTheme === bg.id ? { color: '#FFF' } : { color: theme.gray }]}>{bg.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {/* Khung Canvas bọc bằng Touchable để chạm ra ngoài thì bỏ chọn đồ */}
                <TouchableOpacity activeOpacity={1} onPress={() => setSelectedItemId(null)} style={{ flex: 1 }}>
                    <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.viewShotWrapper}>
                        <LinearGradient colors={currentBgColors} style={styles.canvasBoard}>
                            
                            {canvasItems.length === 0 ? (
                                <View style={styles.emptyCanvas}>
                                    <Ionicons name="color-wand-outline" size={70} color={theme.border} />
                                    <Text style={[styles.emptyCanvasText, { color: theme.gray }]}>
                                        {language === 'vi' ? 'Chọn đồ từ khay bên dưới.\n\n👆 Chạm 1 lần: Đổi size, xếp lớp.\n✌️ Chạm 2 lần: Lật trái/phải.' : 'Add items below.\nTap: Resize & Layer.\nDouble Tap: Flip.'}
                                    </Text>
                                </View>
                            ) : (
                                canvasItems.map(item => (
                                    <DraggableItem 
                                        key={item.uniqueId} 
                                        item={item} 
                                        onRemove={handleRemoveFromCanvas} 
                                        onUpdate={handleUpdateItem}
                                        isSelected={selectedItemId === item.uniqueId}
                                        onSelect={setSelectedItemId}
                                    />
                                ))
                            )}
                            
                        </LinearGradient>
                    </ViewShot>
                </TouchableOpacity>
            </View>

            {/* KHAY ĐỒ */}
            <View style={[styles.trayContainer, { backgroundColor: isDarkMode ? '#111A33' : '#FFFFFF', shadowColor: theme.primary }]}>
                <View style={styles.trayTabs}>
                    <TouchableOpacity 
                        style={[styles.trayTabBtn, activeTab === 'personal' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                        onPress={() => setActiveTab('personal')}
                    >
                        <Text style={[styles.trayTabText, { color: activeTab === 'personal' ? theme.primary : theme.gray }]}>Tủ của bạn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.trayTabBtn, activeTab === 'public' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                        onPress={() => setActiveTab('public')}
                    >
                        <Text style={[styles.trayTabText, { color: activeTab === 'public' ? theme.primary : theme.gray }]}>Gợi ý (Shopee)</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
                ) : (
                    <FlatList 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30 }}
                        data={activeTab === 'personal' ? personalItems : publicItems}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTrayItem}
                        ListEmptyComponent={() => (
                            <Text style={{ fontFamily: FONTS.regular, color: theme.gray, alignSelf: 'center', marginTop: 20 }}>
                                Không có dữ liệu.
                            </Text>
                        )}
                    />
                )}
            </View>

            {/* CUSTOM ALERT */}
            <Modal visible={customAlert.visible} transparent={true} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.card }]}>
                        <View style={[styles.alertIconWrapper, { backgroundColor: getAlertIconColor(), borderColor: theme.card }]}>
                            <Ionicons name={customAlert.type === 'success' ? "checkmark-circle" : customAlert.type === 'warning' ? "warning" : "close-circle"} size={40} color="#FFF" />
                        </View>
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: theme.gray }]}>{customAlert.message}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.primary }]} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
                            <Text style={[styles.alertBtnText, { color: '#FFF' }]}>Đã hiểu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 24, letterSpacing: 0.5 },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    saveText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFF' },

    canvasSection: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    outfitNameInput: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, borderBottomWidth: 1, paddingVertical: 10, marginRight: 10 },
    clearBtn: { padding: 8, backgroundColor: 'rgba(228, 63, 90, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#E43F5A' },

    bgSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    bgPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#CCC' },
    bgPillText: { fontFamily: FONTS.medium, fontSize: 12 },

    viewShotWrapper: { flex: 1, borderRadius: 30, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
    canvasBoard: { flex: 1, borderRadius: 30, position: 'relative' },
    emptyCanvas: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyCanvasText: { fontFamily: FONTS.medium, fontSize: 14, textAlign: 'center', marginTop: 25, lineHeight: 24 },

    draggableWrapper: { position: 'absolute', top: 50, left: '25%', width: 160, height: 160 }, 
    draggableInner: { position: 'relative', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
    selectedBorder: { borderWidth: 2, borderColor: '#1E90FF', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.15)' },
    dragImage: { width: '100%', height: '100%' },
    
    // Nút xóa được đẩy vào trong 5px để không bị liệt
    removeBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 20, zIndex: 100, elevation: 10 },
    
    miniToolbar: { position: 'absolute', bottom: -50, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, gap: 10 },
    toolbarBtn: { paddingHorizontal: 5 },

    trayContainer: { height: 200, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    trayTabs: { flexDirection: 'row', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
    trayTabBtn: { paddingHorizontal: 25, paddingVertical: 15 },
    trayTabText: { fontFamily: FONTS.bold, fontSize: 15 },
    
    trayItemCard: { width: 90, height: 90, borderRadius: 20, borderWidth: 1, marginRight: 15, overflow: 'hidden', position: 'relative', elevation: 3 },
    trayItemImage: { width: '100%', height: '100%' },
    addOverlay: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15 },

    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '80%', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 20 },
    alertIconWrapper: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginTop: -60, borderWidth: 4, elevation: 10 },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 22, marginTop: 15, marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontFamily: FONTS.medium, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    alertBtn: { width: '100%', paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16 }
});

export default OutfitScreen;