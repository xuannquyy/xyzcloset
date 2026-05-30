import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, FlatList, 
    Dimensions, Animated, PanResponder, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

// =================================================================
// COMPONENT: MÓN ĐỒ CÓ THỂ KÉO THẢ (DRAGGABLE ITEM)
// =================================================================
const DraggableItem = ({ item, onRemove }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const scale = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({ x: pan.x._value, y: pan.y._value });
                pan.setValue({ x: 0, y: 0 });
                // Hiệu ứng phình to nhẹ khi chạm vào (Bling Bling 3D)
                Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
            }
        })
    ).current;

    return (
        <Animated.View
            style={[ pan.getLayout(), styles.draggableWrapper, { transform: [{ scale }] } ]}
            {...panResponder.panHandlers}
        >
            <View style={styles.draggableInner}>
                <Image source={{ uri: item.imageUrl }} style={styles.dragImage} contentFit="contain" />
                <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.uniqueId)}>
                    <Ionicons name="close-circle" size={24} color="#E43F5A" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

// =================================================================
// MÀN HÌNH CHÍNH
// =================================================================
const OutfitScreen = ({ navigation }) => {
    const { theme, isDarkMode, t, language } = useContext(SettingsContext);
    
    // Tham chiếu đến Canvas để chụp ảnh
    const viewShotRef = useRef();

    // STATES DỮ LIỆU
    const [personalItems, setPersonalItems] = useState([]);
    const [publicItems, setPublicItems] = useState([]);
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'public'
    const [isLoading, setIsLoading] = useState(true);

    // STATES CANVAS (PHÒNG THỬ ĐỒ)
    const [canvasItems, setCanvasItems] = useState([]);
    const [outfitName, setOutfitName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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

    // HÀM: THÊM ĐỒ VÀO CANVAS
    const handleAddItemToCanvas = (item) => {
        // Gắn thêm uniqueId để phân biệt nếu người dùng thêm 2 cái áo giống hệt nhau
        const newItem = { ...item, uniqueId: Date.now().toString() + Math.random().toString() };
        setCanvasItems([...canvasItems, newItem]);
    };

    // HÀM: XÓA ĐỒ KHỎI CANVAS
    const handleRemoveFromCanvas = (uniqueId) => {
        setCanvasItems(canvasItems.filter(item => item.uniqueId !== uniqueId));
    };

    // HÀM: CHỤP ẢNH & LƯU SET ĐỒ
    const handleSaveOutfit = async () => {
        if (canvasItems.length === 0) {
            return Alert.alert("Trống rỗng", "Hãy kéo ít nhất một món đồ vào khung trước khi lưu!");
        }
        if (!outfitName.trim()) {
            return Alert.alert("Thiếu tên", "Hãy đặt một cái tên thật kêu cho Set đồ này nhé!");
        }

        setIsSaving(true);
        try {
            // 1. Chụp lại toàn bộ khung Canvas thành file ảnh URI
            const uri = await viewShotRef.current.capture();

            // 2. Lấy danh sách ID của các món đồ trên Canvas
            const itemIds = canvasItems.map(item => item.id);

            // 3. Đóng gói dữ liệu gửi lên Backend
            const formData = new FormData();
            formData.append('name', outfitName);
            formData.append('wardrobeItemIds', JSON.stringify(itemIds));
            formData.append('image', {
                uri: uri,
                type: 'image/jpeg',
                name: `outfit_${Date.now()}.jpg`
            });

            await axiosClient.post('/outfits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert("Thành công", "Set đồ đã được lưu vào Bộ Sưu Tập!");
            setCanvasItems([]); // Xóa trắng canvas
            setOutfitName('');
            
        } catch (error) {
            console.log("Lỗi lưu Outfit:", error);
            Alert.alert("Lỗi", "Không thể lưu Set đồ lúc này.");
        } finally {
            setIsSaving(false);
        }
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

    const currentTrayData = activeTab === 'personal' ? personalItems : publicItems;

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            
            {/* 1. HEADER */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('fitting_room')}</Text>
                <TouchableOpacity onPress={handleSaveOutfit} disabled={isSaving} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                    {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>{t('save_outfit')}</Text>}
                </TouchableOpacity>
            </View>

            {/* 2. KHU VỰC KHUNG TRANH ĐỂ KÉO THẢ (CANVAS) */}
            <View style={styles.canvasSection}>
                <TextInput 
                    style={[styles.outfitNameInput, { color: theme.text, borderBottomColor: theme.border }]}
                    placeholder={language === 'vi' ? "Đặt tên cho Set đồ này (VD: Đi cafe Chúa Nhật)" : "Name this outfit..."}
                    placeholderTextColor={theme.gray}
                    value={outfitName}
                    onChangeText={setOutfitName}
                />
                
                {/* ViewShot bọc lấy vùng Canvas để chụp ảnh */}
                <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.viewShotWrapper}>
                    <LinearGradient colors={isDarkMode ? ['#1C2541', '#0B132B'] : ['#FFFFFF', '#F7E9EE']} style={styles.canvasBoard}>
                        
                        {canvasItems.length === 0 ? (
                            <View style={styles.emptyCanvas}>
                                <Ionicons name="body-outline" size={80} color={theme.border} />
                                <Text style={[styles.emptyCanvasText, { color: theme.gray }]}>
                                    {language === 'vi' ? 'Chạm vào các món đồ bên dưới để đưa vào không gian này và kéo thả tự do!' : 'Tap items below to add them to the canvas and drag freely!'}
                                </Text>
                            </View>
                        ) : (
                            // Render các món đồ đã được thêm vào
                            canvasItems.map(item => (
                                <DraggableItem key={item.uniqueId} item={item} onRemove={handleRemoveFromCanvas} />
                            ))
                        )}
                        
                    </LinearGradient>
                </ViewShot>
            </View>

            {/* 3. KHAY CHỌN QUẦN ÁO Ở DƯỚI (BOTTOM TRAY) */}
            <View style={[styles.trayContainer, { backgroundColor: isDarkMode ? '#111A33' : '#FFFFFF', shadowColor: theme.primary }]}>
                
                {/* Tabs Chuyển đổi Nguồn đồ */}
                <View style={styles.trayTabs}>
                    <TouchableOpacity 
                        style={[styles.trayTabBtn, activeTab === 'personal' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                        onPress={() => setActiveTab('personal')}
                    >
                        <Text style={[styles.trayTabText, { color: activeTab === 'personal' ? theme.primary : theme.gray }]}>
                            {language === 'vi' ? 'Tủ của bạn' : 'Your Closet'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.trayTabBtn, activeTab === 'public' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                        onPress={() => setActiveTab('public')}
                    >
                        <Text style={[styles.trayTabText, { color: activeTab === 'public' ? theme.primary : theme.gray }]}>
                            {language === 'vi' ? 'Đồ gợi ý (Shopee)' : 'Shopee Ideas'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Danh sách quần áo */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 30 }} />
                ) : (
                    <FlatList 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 30 }}
                        data={currentTrayData}
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

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 24, letterSpacing: 0.5 },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    saveText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFF' },

    // CANVAS AREA
    canvasSection: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
    outfitNameInput: { fontFamily: FONTS.bold, fontSize: 18, borderBottomWidth: 1, paddingVertical: 10, marginBottom: 15 },
    viewShotWrapper: { flex: 1, borderRadius: 30, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
    canvasBoard: { flex: 1, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', position: 'relative' },
    emptyCanvas: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyCanvasText: { fontFamily: FONTS.medium, fontSize: 15, textAlign: 'center', marginTop: 15, lineHeight: 22 },

    // DRAGGABLE ITEMS
    draggableWrapper: { position: 'absolute', top: 50, left: width / 2 - 80 }, // Điểm thả mặc định giữa màn hình
    draggableInner: { position: 'relative', width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
    dragImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FFF', borderRadius: 15, zIndex: 10, elevation: 5 },

    // BOTTOM TRAY (TỦ ĐỒ NỔI)
    trayContainer: { height: 200, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    trayTabs: { flexDirection: 'row', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingTop: 10 },
    trayTabBtn: { paddingHorizontal: 25, paddingVertical: 15 },
    trayTabText: { fontFamily: FONTS.bold, fontSize: 15 },
    
    trayItemCard: { width: 90, height: 90, borderRadius: 20, borderWidth: 1, marginRight: 15, overflow: 'hidden', position: 'relative', elevation: 3 },
    trayItemImage: { width: '100%', height: '100%' },
    addOverlay: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15 }
});

export default OutfitScreen;