import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, TouchableWithoutFeedback, FlatList, 
    Dimensions, Animated, PanResponder, ActivityIndicator, TextInput, Modal, 
    Image as RNImage, ScrollView
} from 'react-native';
import { Image } from 'expo-image'; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

// =================================================================
// COMPONENT: MÓN ĐỒ CÓ THỂ KÉO THẢ
// =================================================================
const DraggableItem = ({ item, onRemove, onUpdate, isSelected, onSelect }) => {
    const pan = useRef(new Animated.ValueXY({ x: item.initialX || 0, y: item.initialY || 0 })).current;
    const animScale = useRef(new Animated.Value(1)).current;
    const lastTap = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
            onPanResponderGrant: () => {
                pan.setOffset({ x: pan.x._value, y: pan.y._value });
                pan.setValue({ x: 0, y: 0 });
                Animated.spring(animScale, { toValue: 1.08, useNativeDriver: false }).start();
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                Animated.spring(animScale, { toValue: 1, useNativeDriver: false }).start();
                onUpdate(item.uniqueId, { initialX: pan.x._value, initialY: pan.y._value });
            }
        })
    ).current;

    const handleImageTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) onUpdate(item.uniqueId, { isFlipped: !item.isFlipped });
        else onSelect(item.uniqueId);
        lastTap.current = now;
    };

    return (
        <Animated.View
            style={[ styles.draggableWrapper, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: animScale }], zIndex: item.zIndex } ]}
            {...panResponder.panHandlers}
        >
            <View style={[styles.draggableInner, isSelected && styles.selectedBorder]}>
                <TouchableWithoutFeedback onPress={handleImageTap}>
                    <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: item.scale }, { scaleX: item.isFlipped ? -1 : 1 }] }}>
                        <RNImage source={{ uri: item.imageUrl }} style={styles.dragImage} resizeMode="contain" />
                    </Animated.View>
                </TouchableWithoutFeedback>
                
                {isSelected && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.uniqueId)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                        <Ionicons name="close-circle" size={28} color="#E43F5A" />
                    </TouchableOpacity>
                )}

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
// COMPONENT: MODAL CHỌN TAG (ĐỘC LẬP ĐỂ KHÔNG BỊ GIẬT LAG)
// =================================================================
const TagSelectionModal = ({ visible, onClose, groupedTags, selectedTags, onSaveTags, theme }) => {
    const [localTags, setLocalTags] = useState([]);

    useEffect(() => {
        if (visible) setLocalTags([...selectedTags]);
    }, [visible, selectedTags]);

    const toggleTag = (tagId) => {
        setLocalTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
    };

    const handleSave = () => {
        onSaveTags(localTags); 
        onClose(); 
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableWithoutFeedback>
                    <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={[styles.sheetTitle, { color: theme.text }]}>Gắn thẻ Outfit</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {Object.keys(groupedTags).map(type => (
                                <View key={type} style={{ marginTop: 15 }}>
                                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: theme.accent, marginBottom: 12, textTransform: 'uppercase' }}>{type}</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                        {groupedTags[type].map(tag => {
                                            const isSelected = localTags.includes(tag.id);
                                            return (
                                                <TouchableOpacity key={tag.id} onPress={() => toggleTag(tag.id)}
                                                    style={[styles.tagSelectVIP, { backgroundColor: isSelected ? theme.primary : theme.card, borderColor: isSelected ? theme.primary : theme.border }]}
                                                >
                                                    <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: isSelected ? '#FFF' : theme.text }}>#{tag.name}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, width: '100%', paddingVertical: 15, marginTop: 10 }]} onPress={handleSave}>
                            <Text style={[styles.saveText, { textAlign: 'center' }]}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
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
    
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [allTags, setAllTags] = useState([]);
    const [selectedOutfitTags, setSelectedOutfitTags] = useState([]);
    const [isTagModalVisible, setTagModalVisible] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [canvasItems, setCanvasItems] = useState([]);
    const [outfitName, setOutfitName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);

    const [bgTheme, setBgTheme] = useState('transparent');
    const bgOptions = [
        { id: 'transparent', name: 'Nền trống', colors: isDarkMode ? ['#1C2541', '#0B132B'] : ['#FFFFFF', '#F7E9EE'] },
        { id: 'summer', name: 'Ấm áp', colors: ['#4E65FF', '#92EFFD'] }, 
        { id: 'winter', name: 'Lạnh lẽo', colors: ['#E0EAFC', '#CFDEF3'] }, 
        { id: 'rainy', name: 'Trầm tính', colors: ['#606c88', '#3f4c6b'] } 
    ];
    const currentBgColors = bgOptions.find(b => b.id === bgTheme).colors;

    const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error' });
    const showCustomAlert = (title, message, type = 'error') => setCustomAlert({ visible: true, title, message, type });

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [personalRes, publicRes, catRes, tagRes] = await Promise.all([
                        axiosClient.get('/wardrobe'),
                        axiosClient.get('/wardrobe/public'),
                        axiosClient.get('/categories'),
                        axiosClient.get('/tags') 
                    ]);
                    setPersonalItems(personalRes.data);
                    setPublicItems(publicRes.data);
                    setCategories([{ id: 'All', name: language === 'vi' ? 'Tất cả' : 'All' }, ...catRes.data]);
                    setAllTags(tagRes.data);
                } catch (error) {
                    console.log("Lỗi tải data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }, [language])
    );

    const groupedTags = allTags.reduce((acc, tag) => {
        acc[tag.type] = acc[tag.type] || [];
        acc[tag.type].push(tag);
        return acc;
    }, {});

    const handleAddItemToCanvas = (item) => {
        const newItem = { 
            ...item, uniqueId: Date.now().toString() + Math.random().toString(),
            initialX: (Math.random() - 0.5) * 80, initialY: (Math.random() - 0.5) * 80,
            zIndex: canvasItems.length + 1, scale: 1, isFlipped: false
        };
        setCanvasItems([...canvasItems, newItem]);
        setSelectedItemId(newItem.uniqueId); 
    };

    const handleRemoveFromCanvas = (uniqueId) => {
        setCanvasItems(canvasItems.filter(item => item.uniqueId !== uniqueId));
        if (selectedItemId === uniqueId) setSelectedItemId(null);
    };

    const handleUpdateItem = (uniqueId, updates) => {
        setCanvasItems(prevItems => prevItems.map(item => item.uniqueId === uniqueId ? { ...item, ...updates } : item));
    };

    const handleClearCanvas = () => {
        setCanvasItems([]);
        setSelectedItemId(null);
        setOutfitName('');
        setSelectedOutfitTags([]);
    };

    const handleSaveOutfit = async () => {
        if (canvasItems.length === 0) return showCustomAlert("Khung hình trống", "Hãy chọn ít nhất một món đồ để bắt đầu phối nhé!", "warning");
        if (!outfitName.trim()) return showCustomAlert("Thiếu tên Set đồ", "Hãy đặt tên cho Outfit này!", "warning");

        setSelectedItemId(null); 
        setIsSaving(true);
        
        setTimeout(async () => {
            try {
                const uri = await viewShotRef.current.capture();
                const itemIds = canvasItems.map(item => item.id);

                const formData = new FormData();
                formData.append('name', outfitName);
                formData.append('wardrobeItemIds', JSON.stringify(itemIds));
                formData.append('image', { uri: uri, type: 'image/jpeg', name: `outfit_${Date.now()}.jpg` });
                formData.append('tagIds', JSON.stringify(selectedOutfitTags)); 

                await axiosClient.post('/outfits', formData, { headers: { 'Content-Type': 'multipart/form-data' }});

                showCustomAlert("Thành công", "Set đồ chuẩn Stylist đã được lưu vào bộ sưu tập!", "success");
                handleClearCanvas();
            } catch (error) {
                console.log("Lỗi chụp & lưu Outfit:", error.response?.data || error.message);
                showCustomAlert("Lỗi máy chủ", "Không thể lưu Set đồ lúc này.", "error");
            } finally {
                setIsSaving(false);
            }
        }, 500);
    };

    const getAlertIconColor = () => customAlert.type === 'success' ? '#27AE60' : customAlert.type === 'warning' ? '#F39C12' : '#E43F5A';

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
                        placeholder={language === 'vi' ? "Đặt tên Set đồ..." : "Name this outfit..."}
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

                <View style={styles.toolsRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        {bgOptions.map(bg => (
                            <TouchableOpacity key={bg.id} onPress={() => setBgTheme(bg.id)}
                                style={[styles.bgPill, bgTheme === bg.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                            >
                                <Text style={[styles.bgPillText, bgTheme === bg.id ? { color: '#FFF' } : { color: theme.gray }]}>{bg.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    
                    <TouchableOpacity onPress={() => setTagModalVisible(true)} style={[styles.tagButton, { backgroundColor: selectedOutfitTags.length > 0 ? theme.primary : theme.card, borderColor: theme.border }]}>
                        <Ionicons name="pricetags-outline" size={18} color={selectedOutfitTags.length > 0 ? '#FFF' : theme.text} />
                        <Text style={[styles.tagButtonText, { color: selectedOutfitTags.length > 0 ? '#FFF' : theme.text }]}>
                            {selectedOutfitTags.length > 0 ? `${selectedOutfitTags.length} Thẻ` : 'Gắn thẻ'}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity activeOpacity={1} onPress={() => setSelectedItemId(null)} style={{ flex: 1 }}>
                    <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.viewShotWrapper} collapsable={false}>
                        <LinearGradient colors={currentBgColors} style={styles.canvasBoard} collapsable={false}>
                            {canvasItems.length === 0 ? (
                                <View style={styles.emptyCanvas}>
                                    <Ionicons name="color-wand-outline" size={70} color={theme.border} />
                                    <Text style={[styles.emptyCanvasText, { color: theme.gray }]}>
                                        {language === 'vi' ? 'Chọn đồ từ khay bên dưới.\n\n👆 Chạm 1 lần: Đổi size, xếp lớp.\n✌️ Chạm 2 lần: Lật trái/phải.' : 'Add items below.\nTap: Resize & Layer.\nDouble Tap: Flip.'}
                                    </Text>
                                </View>
                            ) : (
                                canvasItems.map(item => (
                                    <DraggableItem key={item.uniqueId} item={item} onRemove={handleRemoveFromCanvas} onUpdate={handleUpdateItem} isSelected={selectedItemId === item.uniqueId} onSelect={setSelectedItemId} />
                                ))
                            )}
                        </LinearGradient>
                    </ViewShot>
                </TouchableOpacity>
            </View>

            <View style={[styles.trayContainer, { backgroundColor: isDarkMode ? '#111A33' : '#FFFFFF', shadowColor: theme.primary }]}>
                <View style={styles.trayTabs}>
                    <TouchableOpacity style={[styles.trayTabBtn, activeTab === 'personal' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]} onPress={() => setActiveTab('personal')}>
                        <Text style={[styles.trayTabText, { color: activeTab === 'personal' ? theme.primary : theme.gray }]}>Tủ của bạn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.trayTabBtn, activeTab === 'public' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]} onPress={() => setActiveTab('public')}>
                        <Text style={[styles.trayTabText, { color: activeTab === 'public' ? theme.primary : theme.gray }]}>Gợi ý</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.categoryFilterWrapper}>
                    <FlatList horizontal showsHorizontalScrollIndicator={false} data={categories} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => {
                        const isSelected = selectedCategory === item.id;
                        return (
                            <TouchableOpacity style={[styles.catChip, { backgroundColor: isSelected ? theme.primary : theme.card, borderColor: isSelected ? theme.primary : theme.border }]} onPress={() => setSelectedCategory(item.id)}>
                                <Text style={[styles.catChipText, { color: isSelected ? '#FFF' : theme.text }]}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    }}/>
                </View>

                {isLoading ? <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 10 }} /> : (
                    <FlatList horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15 }}
                        data={(activeTab === 'personal' ? personalItems : publicItems).filter(item => selectedCategory === 'All' || item.categoryId === selectedCategory)}
                        keyExtractor={(item) => item.id.toString()} 
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.trayItemCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => handleAddItemToCanvas(item)} activeOpacity={0.7}>
                                <Image source={{ uri: item.imageUrl }} style={styles.trayItemImage} contentFit="contain" />
                                <View style={styles.addOverlay}><Ionicons name="add-circle" size={24} color={theme.primary} /></View>
                            </TouchableOpacity>
                        )}
                        initialNumToRender={6} maxToRenderPerBatch={6} windowSize={3} 
                        ListEmptyComponent={() => <Text style={{ fontFamily: FONTS.regular, color: theme.gray, alignSelf: 'center', marginTop: 10 }}>Không có đồ.</Text>}
                    />
                )}
            </View>

            <TagSelectionModal 
                visible={isTagModalVisible} 
                onClose={() => setTagModalVisible(false)} 
                groupedTags={groupedTags} 
                selectedTags={selectedOutfitTags} 
                onSaveTags={setSelectedOutfitTags} 
                theme={theme} 
            />

            <Modal visible={customAlert.visible} transparent={true} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.card }]}>
                        <View style={[styles.alertIconWrapper, { backgroundColor: getAlertIconColor(), borderColor: theme.card }]}><Ionicons name={customAlert.type === 'success' ? "checkmark-circle" : customAlert.type === 'warning' ? "warning" : "close-circle"} size={40} color="#FFF" /></View>
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: theme.gray }]}>{customAlert.message}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.primary }]} onPress={() => setCustomAlert({ ...customAlert, visible: false })}><Text style={[styles.alertBtnText, { color: '#FFF' }]}>Đã hiểu</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 24, letterSpacing: 0.5 },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
    saveText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFF' },

    canvasSection: { flex: 1, paddingHorizontal: 20, paddingBottom: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    outfitNameInput: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, borderBottomWidth: 1, paddingVertical: 10, marginRight: 10 },
    clearBtn: { padding: 8, backgroundColor: 'rgba(228, 63, 90, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: '#E43F5A' },

    toolsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    bgPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#CCC', marginRight: 8 },
    bgPillText: { fontFamily: FONTS.medium, fontSize: 12 },
    tagButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, marginLeft: 10 },
    tagButtonText: { fontFamily: FONTS.bold, fontSize: 12, marginLeft: 4 },

    viewShotWrapper: { flex: 1, borderRadius: 30, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 },
    canvasBoard: { flex: 1, borderRadius: 30, position: 'relative' },
    emptyCanvas: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    emptyCanvasText: { fontFamily: FONTS.medium, fontSize: 14, textAlign: 'center', marginTop: 25, lineHeight: 24 },

    draggableWrapper: { position: 'absolute', top: 50, left: '25%', width: 160, height: 160 }, 
    draggableInner: { position: 'relative', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
    selectedBorder: { borderWidth: 2, borderColor: '#1E90FF', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.15)' },
    dragImage: { width: '100%', height: '100%' }, 
    removeBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 20, zIndex: 100, elevation: 10 },
    miniToolbar: { position: 'absolute', bottom: -50, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, elevation: 15, gap: 10 },
    toolbarBtn: { paddingHorizontal: 5 },

    trayContainer: { height: 210, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    trayTabs: { flexDirection: 'row', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingTop: 5 },
    trayTabBtn: { paddingHorizontal: 25, paddingVertical: 10 },
    trayTabText: { fontFamily: FONTS.bold, fontSize: 15 },
    categoryFilterWrapper: { paddingVertical: 8, paddingHorizontal: 15 },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10 },
    catChipText: { fontFamily: FONTS.medium, fontSize: 13 },
    trayItemCard: { width: 90, height: 90, borderRadius: 20, borderWidth: 1, marginRight: 15, overflow: 'hidden', position: 'relative', elevation: 3 },
    trayItemImage: { width: '100%', height: '100%' },
    addOverlay: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    bottomSheet: { height: height * 0.65, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 25, paddingTop: 15, elevation: 40, paddingBottom: 20 },
    sheetHandle: { width: 50, height: 5, backgroundColor: '#CCC', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontFamily: FONTS.bold, fontSize: 20, textAlign: 'center', marginBottom: 10 },
    tagSelectVIP: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },

    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '80%', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 20 },
    alertIconWrapper: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginTop: -60, borderWidth: 4, elevation: 10 },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 22, marginTop: 15, marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontFamily: FONTS.medium, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    alertBtn: { width: '100%', paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16 }
});

export default OutfitScreen;