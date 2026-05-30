import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, TouchableOpacity, 
    TextInput, ActivityIndicator, Dimensions, Modal
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

const COLOR_SWATCHES = [
    { name: 'Đen', hex: '#1C1C1C' }, { name: 'Trắng', hex: '#FFFFFF' },
    { name: 'Navy', hex: '#1C2541' }, { name: 'Nâu/Be', hex: '#D2B48C' },
    { name: 'Đỏ Đô', hex: '#791127' }, { name: 'Xám', hex: '#A0A0A0' },
    { name: 'Pastel', hex: '#FADADD' }, { name: 'Khác', hex: 'OTHER' }
];

const CLOTHES_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Freesize'];
const SHOES_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43'];

const AddItemScreen = ({ route, navigation }) => {
    const { theme, isDarkMode, t, language } = useContext(SettingsContext);
    
    const itemToEdit = route.params?.itemToEdit;
    const isEditing = !!itemToEdit; 

    const [imageUri, setImageUri] = useState(null);
    const [processedImageUri, setProcessedImageUri] = useState(null);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [name, setName] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isCatModalVisible, setIsCatModalVisible] = useState(false);
    
    const [size, setSize] = useState('');
    const [tags, setTags] = useState([]);
    const [selectedTagIds, setSelectedTagIds] = useState([]);

    const [showDetails, setShowDetails] = useState(false);
    const [selectedColorHex, setSelectedColorHex] = useState(null);
    const [customColor, setCustomColor] = useState('');
    const [material, setMaterial] = useState('');
    const [careInstructions, setCareInstructions] = useState('');
    const [notes, setNotes] = useState('');

    const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error' });

    const showCustomAlert = (title, message, type = 'error') => {
        setCustomAlert({ visible: true, title, message, type });
    };

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const [catRes, tagRes] = await Promise.all([
                    axiosClient.get('/categories'),
                    axiosClient.get('/tags')
                ]);
                setCategories(catRes.data);
                setTags(tagRes.data);

                if (isEditing) {
                    setName(itemToEdit.name || '');
                    setImageUri(itemToEdit.imageUrl);
                    setSize(itemToEdit.size || '');
                    setMaterial(itemToEdit.material || '');
                    setCareInstructions(itemToEdit.careInstructions || '');
                    setNotes(itemToEdit.notes || '');

                    const matchedCat = catRes.data.find(c => c.id === itemToEdit.categoryId);
                    if (matchedCat) setSelectedCategory(matchedCat);

                    if (itemToEdit.tags && itemToEdit.tags.length > 0) {
                        setSelectedTagIds(itemToEdit.tags.map(t => t.id));
                    }

                    if (itemToEdit.color) {
                        const matchedColor = COLOR_SWATCHES.find(c => c.name === itemToEdit.color);
                        if (matchedColor) setSelectedColorHex(matchedColor.hex);
                        else {
                            setSelectedColorHex('OTHER');
                            setCustomColor(itemToEdit.color);
                        }
                    }
                    
                    if (itemToEdit.color || itemToEdit.material || itemToEdit.notes || itemToEdit.careInstructions) {
                        setShowDetails(true);
                    }
                }
            } catch (error) {
                console.log("Lỗi tải form:", error);
            }
        };
        fetchFormData();
    }, []);

    const groupedTags = tags.reduce((acc, tag) => {
        acc[tag.type] = acc[tag.type] || [];
        acc[tag.type].push(tag);
        return acc;
    }, {});

    const pickImage = async (useCamera = false) => {
        let result;
        // Đã giảm quality xuống 0.4 để file nhẹ hơn, gửi đi nhanh hơn
        const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.4 };
        if (useCamera) {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) return showCustomAlert("Cấp quyền", "Bạn cần cấp quyền Camera để chụp ảnh.", "error");
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) return showCustomAlert("Cấp quyền", "Bạn cần cấp quyền Thư viện để chọn ảnh.", "error");
            result = await ImagePicker.launchImageLibraryAsync(options);
        }
        if (!result.canceled && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setProcessedImageUri(null); 
        }
    };

    const handleRemoveBackground = async () => { 
        if (!imageUri || imageUri.startsWith('http')) {
            return showCustomAlert("Sai định dạng", "Bạn cần chọn một bức ảnh mới từ thiết bị để AI xử lý tách nền.", "warning");
        }
        setIsProcessingAI(true);
        try {
            const formData = new FormData();
            
            const filename = imageUri.split('/').pop() || 'raw_item.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/jpeg`;

            formData.append('image', { 
                uri: imageUri, 
                type: type, 
                name: filename 
            });
            
            // Đã thêm Header và Timeout 15 giây
            const res = await axiosClient.post('/ai/remove-bg', formData, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json' 
                },
                timeout: 15000 
            });
            
            if (res.data && res.data.processedImageUrl) {
                const bypassCacheUrl = `${res.data.processedImageUrl}?v=${Date.now()}`;
                setProcessedImageUri(bypassCacheUrl);
                showCustomAlert("Thành công", "Chuyên gia AI đã tách nền xong cho món đồ của bạn!", "success");
            }
        } catch (error) {
            console.log("Lỗi AI 500 hoặc Timeout:", error);
            // Xử lý lỗi khi server quá tải / mạng chậm
            if (error.code === 'ECONNABORTED') {
                showCustomAlert("Hết thời gian", "Server xử lý quá lâu (hơn 15s), vui lòng thử lại ảnh khác.", "error");
            } else {
                showCustomAlert("Hệ thống gián đoạn", "AI hiện đang quá tải hoặc gặp lỗi. Vui lòng thử lại sau ít phút.", "error");
            }
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleSaveItem = async () => {
        if (!name.trim() || !selectedCategory || (!processedImageUri && !imageUri)) {
            return showCustomAlert("Thiếu thông tin", "Vui lòng điền tên, chọn danh mục và hình ảnh.", "warning");
        }
        
        if (!processedImageUri && !imageUri.startsWith('http') && !isEditing) {
             showCustomAlert(
                 "Lưu ý phông nền", 
                 "Bức ảnh này chưa được tách nền. Nó có thể hiển thị không đẹp trong Phòng Thử Đồ. Bạn có chắc chắn muốn tiếp tục lưu?", 
                 "warning"
             );
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('categoryId', selectedCategory.id);
            
            if (selectedTagIds.length > 0) formData.append('tagIds', JSON.stringify(selectedTagIds)); 
            else formData.append('tagIds', JSON.stringify([])); 
            
            const hideSize = selectedCategory.name.match(/Túi|Balo|Phụ kiện|Kính|Mũ|Trang sức/i);
            if (size && !hideSize) formData.append('size', size);
            else formData.append('size', ''); 
            
            const finalColor = selectedColorHex === 'OTHER' ? customColor : (COLOR_SWATCHES.find(c => c.hex === selectedColorHex)?.name || '');
            formData.append('color', finalColor || '');
            formData.append('material', material || '');
            formData.append('careInstructions', careInstructions || '');
            formData.append('notes', notes || '');

            const finalImage = processedImageUri || imageUri;
            if (finalImage && !finalImage.startsWith('http')) {
                formData.append('image', { uri: finalImage, type: 'image/jpeg', name: 'final.jpg' });
            }

            if (isEditing) {
                await axiosClient.put(`/wardrobe/${itemToEdit.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                navigation.navigate('MainApp', { screen: 'Wardrobe' }); 
            } else {
                await axiosClient.post('/wardrobe', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                navigation.goBack();
            }
        } catch (error) {
            showCustomAlert("Lỗi lưu trữ", "Không thể lưu món đồ vào lúc này. Vui lòng kiểm tra lại kết nối.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const getAlertIconColor = () => {
        if (customAlert.type === 'success') return '#27AE60';
        if (customAlert.type === 'warning') return '#F39C12';
        return '#E43F5A'; 
    };

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="close" size={30} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {isEditing ? (language === 'vi' ? 'Sửa thông tin' : 'Edit Item') : t('add_item_title')}
                </Text>
                <TouchableOpacity onPress={handleSaveItem} disabled={isSaving} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                    {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>{isEditing ? 'Cập nhật' : t('save_to_wardrobe')}</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                
                <View style={styles.imageSection}>
                    <View style={[styles.glowOrb, { backgroundColor: theme.accent }]} />
                    <View style={[
                        styles.imageWrapper, 
                        { backgroundColor: processedImageUri ? '#F5F5F7' : theme.card } 
                    ]}>
                        
                        {processedImageUri && <View style={styles.studioLighting} />}

                        {imageUri || processedImageUri ? (
                            <>
                                <Image 
                                    source={{ uri: processedImageUri || imageUri }} 
                                    style={styles.previewImage} 
                                    contentFit="contain" 
                                    transition={600}
                                    cachePolicy="none" // Đã thêm để xoá lỗi bóng ma
                                />
                                {!processedImageUri && imageUri && !imageUri.startsWith('http') && (
                                    <TouchableOpacity onPress={handleRemoveBackground} disabled={isProcessingAI} style={styles.aiBtnWrapper}>
                                        <LinearGradient colors={[theme.primary, theme.accent]} style={styles.aiBtn3D} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            {isProcessingAI ? <ActivityIndicator size="small" color="#FFF" /> : (
                                                <><MaterialCommunityIcons name="magic-staff" size={24} color="#FFF" /><Text style={styles.aiBtnText}>Tách Nền Bằng AI</Text></>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.repickBtn} onPress={() => pickImage(false)}>
                                    <Ionicons name="images" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Ionicons name="shirt-outline" size={70} color={theme.primary} style={{ opacity: 0.5 }} />
                                <Text style={[styles.placeholderText, { color: theme.text }]}>{t('tap_to_add')}</Text>
                                <View style={styles.uploadBtnRow}>
                                    <TouchableOpacity style={[styles.uploadBtn3D, { backgroundColor: theme.primary }]} onPress={() => pickImage(true)}>
                                        <Ionicons name="camera" size={20} color="#FFF" /><Text style={styles.uploadBtnText}>Chụp ảnh</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.uploadBtn3D, { backgroundColor: theme.accent }]} onPress={() => pickImage(false)}>
                                        <Ionicons name="images" size={20} color="#FFF" /><Text style={styles.uploadBtnText}>Thư viện</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
                    
                    <Text style={[styles.label, { color: theme.text }]}>{t('item_name')}</Text>
                    <View style={[styles.inputBox, { backgroundColor: theme.background }]}>
                        <Ionicons name="pricetag-outline" size={22} color={theme.primary} style={{ marginRight: 10 }} />
                        <TextInput style={[styles.input, { color: theme.text }]} placeholder={t('item_name_placeholder')} placeholderTextColor={theme.gray} value={name} onChangeText={setName} />
                    </View>

                    <Text style={[styles.label, { color: theme.text, marginTop: 25 }]}>{t('category')}</Text>
                    <TouchableOpacity style={[styles.inputBox, { backgroundColor: theme.background }]} activeOpacity={0.7} onPress={() => setIsCatModalVisible(true)}>
                        <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 16, color: selectedCategory ? theme.text : theme.gray }}>
                            {selectedCategory ? selectedCategory.name : (language === 'vi' ? 'Chạm để chọn danh mục...' : 'Tap to select category...')}
                        </Text>
                        <Ionicons name="chevron-down-circle" size={26} color={theme.primary} />
                    </TouchableOpacity>

                    {selectedCategory && !selectedCategory.name.match(/Túi|Balo|Phụ kiện|Kính|Mũ|Trang sức/i) && (
                        <View style={styles.sizeSection}>
                            <Text style={[styles.label, { color: theme.text }]}>Kích cỡ (Size)</Text>
                            <View style={styles.sizeGrid}>
                                {(selectedCategory.name.includes("Giày") || selectedCategory.name.includes("Dép") ? SHOES_SIZES : CLOTHES_SIZES).map(s => {
                                    const isSelected = size === s;
                                    return (
                                        <TouchableOpacity key={s} onPress={() => setSize(s)}
                                            style={[
                                                styles.sizeChipVIP, 
                                                { backgroundColor: isSelected ? theme.primary : theme.background },
                                                !isSelected && { borderColor: theme.border, borderWidth: 1 }
                                            ]}
                                        >
                                            <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: isSelected ? '#FFF' : theme.text }}>{s}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {Object.keys(groupedTags).length > 0 && (
                        <View style={{ marginTop: 30 }}>
                            <Text style={[styles.label, { color: theme.text, marginBottom: 5 }]}>{t('tags')}</Text>
                            {Object.keys(groupedTags).map(type => (
                                <View key={type} style={{ marginTop: 15 }}>
                                    <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: theme.accent, marginBottom: 12, letterSpacing: 0.8 }}>{type.toUpperCase()}</Text>
                                    <View style={styles.tagsGrid}>
                                        {groupedTags[type].map(tag => {
                                            const isSelected = selectedTagIds.includes(tag.id);
                                            return (
                                                <TouchableOpacity key={tag.id} activeOpacity={0.7} onPress={() => setSelectedTagIds(p => p.includes(tag.id) ? p.filter(id => id !== tag.id) : [...p, tag.id])}
                                                    style={[styles.tagVIP, { backgroundColor: isSelected ? theme.primary : theme.background, borderColor: isSelected ? theme.primary : theme.border }]}
                                                >
                                                    <Text style={[styles.tagText, { color: isSelected ? '#FFF' : theme.text }]}>#{tag.name}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.accordionHeaderBtn} activeOpacity={0.9} onPress={() => setShowDetails(!showDetails)}>
                        <LinearGradient colors={showDetails ? [theme.accent, theme.primary] : [theme.primary, theme.primary]} style={styles.accordionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <View style={styles.accordionContent}>
                                <Ionicons name="sparkles" size={22} color="#FFF" style={{ marginRight: 10 }} />
                                <Text style={styles.accordionTitle}>
                                    {language === 'vi' ? 'Thông tin chi tiết' : 'Extra Details'}
                                </Text>
                            </View>
                            <Ionicons name={showDetails ? "chevron-up-circle" : "chevron-down-circle"} size={26} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {showDetails && (
                        <View style={[styles.extraDetailsCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            
                            <Text style={[styles.label, { color: theme.text }]}>Màu sắc thực tế</Text>
                            <View style={styles.swatchGrid}>
                                {COLOR_SWATCHES.map(swatch => {
                                    const isSelected = selectedColorHex === swatch.hex;
                                    return (
                                        <TouchableOpacity key={swatch.name} activeOpacity={0.7} onPress={() => setSelectedColorHex(swatch.hex)}
                                            style={[styles.swatchOuter, isSelected && { borderColor: theme.primary, borderWidth: 3 }]}
                                        >
                                            {swatch.hex !== 'OTHER' ? (
                                                <View style={[styles.swatchInner, { backgroundColor: swatch.hex, borderWidth: swatch.hex === '#FFFFFF' ? 1 : 0, borderColor: '#DDD' }]} />
                                            ) : (
                                                <View style={[styles.swatchInner, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Ionicons name="color-palette" size={20} color={theme.text} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {selectedColorHex === 'OTHER' && (
                                <TextInput style={[styles.inputBox, { backgroundColor: theme.card, marginTop: 15, color: theme.text }]}
                                    placeholder="Nhập màu sắc..." placeholderTextColor={theme.gray} value={customColor} onChangeText={setCustomColor} />
                            )}

                            <Text style={[styles.label, { color: theme.text, marginTop: 25 }]}>Chất liệu</Text>
                            <TextInput style={[styles.inputBox, { backgroundColor: theme.card, color: theme.text }]}
                                placeholder="VD: Cotton, Denim, Linen..." placeholderTextColor={theme.gray} value={material} onChangeText={setMaterial} />

                            <Text style={[styles.label, { color: theme.text, marginTop: 25 }]}>Bảo quản & Giặt ủi</Text>
                            <TextInput style={[styles.inputBox, { backgroundColor: theme.card, color: theme.text }]}
                                placeholder="VD: Giặt tay, không tẩy..." placeholderTextColor={theme.gray} value={careInstructions} onChangeText={setCareInstructions} />

                            <Text style={[styles.label, { color: theme.text, marginTop: 25 }]}>Ghi chú thêm</Text>
                            <TextInput style={[styles.inputBox, { backgroundColor: theme.card, color: theme.text, height: 100, textAlignVertical: 'top', paddingTop: 18 }]}
                                placeholder="Tình trạng, điểm nổi bật..." placeholderTextColor={theme.gray} multiline value={notes} onChangeText={setNotes} />
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={customAlert.visible} transparent={true} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.card }]}>
                        <View style={[styles.alertIconWrapper, { backgroundColor: getAlertIconColor(), borderColor: theme.card }]}>
                            <Ionicons 
                                name={customAlert.type === 'success' ? "checkmark-circle" : customAlert.type === 'warning' ? "warning" : "close-circle"} 
                                size={40} color="#FFF" 
                            />
                        </View>
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: theme.gray }]}>{customAlert.message}</Text>
                        <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.primary }]} onPress={() => setCustomAlert({ ...customAlert, visible: false })}>
                            <Text style={[styles.alertBtnText, { color: '#FFF' }]}>Đã hiểu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={isCatModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsCatModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsCatModalVisible(false)}>
                    <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={[styles.sheetTitle, { color: theme.text }]}>Danh Mục Quần Áo</Text>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            {categories.map(cat => (
                                <TouchableOpacity key={cat.id} activeOpacity={0.6}
                                    style={[styles.sheetItem, { borderBottomColor: theme.border }]}
                                    onPress={() => { setSelectedCategory(cat); setIsCatModalVisible(false); }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Image source={{ uri: cat.iconUrl }} style={styles.sheetIcon} contentFit="cover" />
                                        <Text style={[styles.sheetItemText, { color: selectedCategory?.id === cat.id ? theme.primary : theme.text, fontFamily: selectedCategory?.id === cat.id ? FONTS.bold : FONTS.medium }]}>
                                            {cat.name}
                                        </Text>
                                    </View>
                                    {selectedCategory?.id === cat.id && <Ionicons name="checkmark-circle" size={28} color={theme.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, zIndex: 10 },
    iconBtn: { padding: 5, marginLeft: -5 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 0.5 },
    saveBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    saveText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFF' },
    
    imageSection: { width: '100%', height: width * 1.15, alignItems: 'center', paddingTop: 20, marginBottom: 20 },
    glowOrb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: '15%', opacity: 0.25 }, 
    imageWrapper: { width: '85%', height: '90%', borderRadius: 40, overflow: 'hidden', borderWidth: 1, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.15, shadowRadius: 25 },
    
    studioLighting: {
        position: 'absolute',
        width: '70%',
        height: '70%',
        backgroundColor: '#FFFFFF',
        borderRadius: 200,
        top: '15%',
        alignSelf: 'center',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
        elevation: 20,
        zIndex: 0,
    },
    previewImage: { width: '100%', height: '100%', zIndex: 1 },
    
    aiBtnWrapper: { position: 'absolute', bottom: 35, alignSelf: 'center', zIndex: 2 },
    aiBtn3D: { flexDirection: 'row', paddingHorizontal: 35, paddingVertical: 18, borderRadius: 30, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10 },
    aiBtnText: { fontFamily: FONTS.bold, color: '#FFF', fontSize: 16, marginLeft: 10, letterSpacing: 0.5 },
    
    repickBtn: { position: 'absolute', top: 20, right: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', zIndex: 2 },

    placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    placeholderText: { fontFamily: FONTS.medium, fontSize: 17, marginVertical: 30 },
    uploadBtnRow: { flexDirection: 'row', gap: 15 },
    uploadBtn3D: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 25, alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6 },
    uploadBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFF', marginLeft: 10 },
    
    formContainer: { marginHorizontal: 20, padding: 25, borderRadius: 40, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 20 },
    label: { fontFamily: FONTS.bold, fontSize: 16, marginBottom: 12, letterSpacing: 0.5 },
    inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 20, height: 60, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
    input: { flex: 1, fontFamily: FONTS.medium, fontSize: 16 },
    
    sizeSection: { marginTop: 25 },
    sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    sizeChipVIP: { minWidth: 48, paddingHorizontal: 15, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    
    tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tagVIP: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 25, borderWidth: 1, elevation: 2 },
    tagText: { fontFamily: FONTS.bold, fontSize: 13 },
    
    accordionHeaderBtn: { marginTop: 45, borderRadius: 25, elevation: 10, shadowColor: '#791127', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
    accordionGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderRadius: 25 },
    accordionContent: { flexDirection: 'row', alignItems: 'center' },
    accordionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFF' },
    
    extraDetailsCard: { marginTop: 20, padding: 25, borderRadius: 30, borderWidth: 1, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 5 },
    
    swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
    swatchOuter: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
    swatchInner: { width: 44, height: 44, borderRadius: 22 },

    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '80%', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    alertIconWrapper: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginTop: -60, borderWidth: 4, elevation: 10 },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 22, marginTop: 15, marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontFamily: FONTS.medium, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    alertBtn: { width: '100%', paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    bottomSheet: { height: height * 0.65, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 25, paddingTop: 20, elevation: 40 },
    sheetHandle: { width: 60, height: 6, backgroundColor: '#CCC', borderRadius: 3, alignSelf: 'center', marginBottom: 25 },
    sheetTitle: { fontFamily: FONTS.bold, fontSize: 24, textAlign: 'center', marginBottom: 20 },
    sheetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 22, borderBottomWidth: 1 },
    sheetIcon: { width: 35, height: 35, marginRight: 15 },
    sheetItemText: { fontSize: 18 }
});

export default AddItemScreen;