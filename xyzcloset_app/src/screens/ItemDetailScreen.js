import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, TouchableOpacity, 
    Dimensions, Linking, Alert, FlatList, ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width, height } = Dimensions.get('window');

// BẢNG MÀU ÁNH XẠ (ĐỂ HIỂN THỊ VIÊN BI MÀU)
const getColorHex = (colorName) => {
    if (!colorName) return 'transparent';
    const swatches = {
        'Đen': '#1C1C1C', 'Trắng': '#FFFFFF', 'Navy': '#1C2541', 'Xanh Navy': '#1C2541',
        'Nâu/Be': '#D2B48C', 'Be': '#D2B48C', 'Đỏ Đô': '#791127', 'Nâu': '#8B4513',
        'Xám': '#A0A0A0', 'Pastel': '#FADADD'
    };
    return swatches[colorName] || '#E5B05C'; // Vàng kim cho các màu tự nhập
};

const ItemDetailScreen = ({ route, navigation }) => {
    const { theme, isDarkMode, language, t } = useContext(SettingsContext);
    const { item, isPublic } = route.params;

    const [suggestionGroups, setSuggestionGroups] = useState({});
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [isCloning, setIsCloning] = useState(false);

    // MỞ LINK MUA SẮM
    const handleOpenShopee = async () => {
        const url = item.affiliateUrl || "https://shopee.vn/"; 
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert("Lỗi", "Không thể mở trang mua sắm lúc này.");
    };

    // SAO CHÉP VÀO TỦ CÁ NHÂN
    const handleCloneToWardrobe = async () => {
        setIsCloning(true);
        try {
            const formData = new FormData();
            formData.append('name', item.name);
            formData.append('categoryId', item.categoryId);
            formData.append('existingImageUrl', item.imageUrl); 

            if (item.size) formData.append('size', item.size);
            if (item.color) formData.append('color', item.color);
            if (item.material) formData.append('material', item.material);
            if (item.careInstructions) formData.append('careInstructions', item.careInstructions);
            if (item.notes) formData.append('notes', item.notes);

            if (item.tags && item.tags.length > 0) {
                const tagIds = item.tags.map(t => t.id);
                formData.append('tagIds', JSON.stringify(tagIds));
            }

            await axiosClient.post('/wardrobe', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            Alert.alert("Tuyệt vời", "Món đồ này đã được cất gọn vào Tủ đồ cá nhân của bạn!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể thêm vào tủ lúc này.");
        } finally {
            setIsCloning(false);
        }
    };

    // XÓA ĐỒ CÁ NHÂN
    const handleDeletePersonalItem = () => {
        Alert.alert(
            "Xóa món đồ", "Bạn có chắc chắn muốn vứt món đồ này khỏi tủ không?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xóa", style: "destructive",
                    onPress: async () => {
                        try {
                            await axiosClient.delete(`/wardrobe/${item.id}`);
                            Alert.alert("Thành công", "Đã xóa món đồ khỏi tủ.");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa món đồ lúc này.");
                        }
                    }
                }
            ]
        );
    };

    // SỬA ĐỒ CÁ NHÂN
    const handleUpdateItem = () => {
        navigation.navigate('AddItem', { itemToEdit: item });
    };

    // 🧠 AI STYLIST THUẬT TOÁN PHỐI ĐỒ
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const endpoint = isPublic ? '/wardrobe/public' : '/wardrobe';
                const res = await axiosClient.get(endpoint);
                const allOtherItems = res.data.filter((i) => i.id !== item.id);
                
                let finalGroups = {};

                if (isPublic) {
                    finalGroups["Sản phẩm tương tự"] = allOtherItems.filter(i => i.categoryId === item.categoryId).slice(0, 6);
                } else {
                    const currentCatName = item.category?.name || "";
                    const myTags = item.tags?.map(t => t.name) || []; 

                    const calculateMatchScore = (targetItem) => {
                        let score = 0;
                        const targetTags = targetItem.tags?.map(t => t.name) || [];
                        myTags.forEach(tag => {
                            if (targetTags.includes(tag)) score += 2; 
                        });
                        return score;
                    };

                    const getBestMatches = (categoryKeywords) => {
                        let matches = allOtherItems.filter(i => 
                            categoryKeywords.some(keyword => (i.category?.name || "").includes(keyword))
                        );
                        matches.sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
                        return matches.slice(0, 6); 
                    };

                    // PHÂN NHÁNH LOGIC GỢI Ý
                    if (currentCatName.includes("Áo") && !currentCatName.includes("khoác")) {
                        finalGroups["Phù hợp mặc cùng (Quần/Váy)"] = getBestMatches(["Quần", "Váy"]);
                        finalGroups["Giày & Phụ kiện đi kèm"] = getBestMatches(["Giày", "Phụ kiện", "Túi"]);
                    } 
                    else if (currentCatName.includes("Quần") || currentCatName.includes("Váy")) {
                        finalGroups["Áo kết hợp hoàn hảo"] = getBestMatches(["Áo"]);
                        finalGroups["Giày & Phụ kiện đi kèm"] = getBestMatches(["Giày", "Phụ kiện", "Túi"]);
                    } 
                    else if (currentCatName.includes("Đầm")) {
                        finalGroups["Khoác ngoài thanh lịch"] = getBestMatches(["khoác"]);
                        finalGroups["Giày & Phụ kiện đi kèm"] = getBestMatches(["Giày", "Phụ kiện", "Túi"]);
                    } 
                    else if (currentCatName.includes("Giày") || currentCatName.includes("Túi")) {
                        finalGroups["Trang phục ton-sur-ton"] = getBestMatches(["Áo", "Quần", "Váy", "Đầm"]);
                    } 
                    else {
                        finalGroups["Gợi ý mix & match chung"] = getBestMatches(["Áo", "Quần", "Váy", "Đầm", "Giày"]);
                    }
                }

                const cleanGroups = {};
                Object.keys(finalGroups).forEach(key => {
                    if (finalGroups[key] && finalGroups[key].length > 0) cleanGroups[key] = finalGroups[key];
                });
                setSuggestionGroups(cleanGroups);
            } catch (error) {
                console.log("Lỗi tải gợi ý:", error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [item.id, isPublic]);

    const renderSuggestionCard = ({ item: suggestedItem }) => (
        <TouchableOpacity 
            style={[styles.suggestionCard, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => navigation.push('ItemDetail', { item: suggestedItem, isPublic })}
            activeOpacity={0.8}
        >
            <Image source={{ uri: suggestedItem.imageUrl }} style={styles.suggestionImage} contentFit="cover" transition={300} />
            {suggestedItem.tags && suggestedItem.tags.length > 0 && (
                <LinearGradient colors={[theme.primary, theme.accent]} style={styles.miniTag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.miniTagText}>Đồng điệu</Text>
                </LinearGradient>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* 1. ẢNH BÌA */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.mainImage} contentFit="cover" transition={300} />
                    <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.topGradient} />
                    <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* 2. KHỐI THÔNG TIN NỔI */}
                <View style={[styles.infoContainer, { backgroundColor: theme.background, shadowColor: theme.primary }]}>
                    
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.categoryText}>{item.category?.name || "Thời trang"}</Text>
                            </View>
                            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                        </View>
                        {isPublic && item.price && (
                            <Text style={[styles.priceText, { color: theme.accent }]}>
                                {item.price.toLocaleString('vi-VN')}đ
                            </Text>
                        )}
                    </View>

                    {!isPublic && (
                        <Text style={[styles.dateText, { color: theme.gray }]}>
                            <Ionicons name="time-outline" size={14} /> Thêm vào tủ: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                    )}

                    {/* 3. LƯỚI 4 Ô THÔNG SỐ (LUÔN HIỂN THỊ ĐỂ GIỮ BỐ CỤC LUXURY) */}
                    <View style={styles.specGrid}>
                        {/* Cột 1: Kích cỡ */}
                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="resize" size={22} color={item.size ? theme.primary : theme.gray} style={{ marginBottom: 5 }} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Kích cỡ</Text>
                            <Text style={[styles.specValue, { color: item.size ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.size || '---'}
                            </Text>
                        </View>
                        
                        {/* Cột 2: Màu sắc */}
                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.colorDot, { backgroundColor: getColorHex(item.color), borderColor: theme.border }]} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Màu sắc</Text>
                            <Text style={[styles.specValue, { color: item.color ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.color || '---'}
                            </Text>
                        </View>

                        {/* Cột 3: Chất liệu */}
                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="texture" size={22} color={item.material ? theme.primary : theme.gray} style={{ marginBottom: 5 }} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Chất liệu</Text>
                            <Text style={[styles.specValue, { color: item.material ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.material || '---'}
                            </Text>
                        </View>

                        {/* Cột 4: Bảo quản */}
                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <FontAwesome5 name="hand-holding-water" size={18} color={item.careInstructions ? theme.primary : theme.gray} style={{ marginBottom: 8 }} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Bảo quản</Text>
                            <Text style={[styles.specValue, { color: item.careInstructions ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.careInstructions || '---'}
                            </Text>
                        </View>
                    </View>

                    {/* GHI CHÚ */}
                    {(item.notes || item.description) && (
                        <View style={[styles.noteBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="information-circle" size={22} color={theme.accent} style={{ marginRight: 12 }} />
                            <Text style={[styles.noteText, { color: theme.text }]}>{item.notes || item.description}</Text>
                        </View>
                    )}

                    {/* THẺ TAGS */}
                    {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {item.tags.map(tag => (
                                <View key={tag.id} style={[styles.tagChip, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                                    <Text style={[styles.tagText, { color: theme.primary }]}>#{tag.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 4. THANH NÚT ĐIỀU HƯỚNG ĐỒNG BỘ MÀU */}
                    {isPublic ? (
                        <View style={styles.publicActions}>
                            <TouchableOpacity style={styles.cloneBtn} onPress={handleCloneToWardrobe} disabled={isCloning}>
                                <LinearGradient colors={[theme.primary, theme.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    {isCloning ? <ActivityIndicator color="#FFF" /> : (
                                        <><Ionicons name="download-outline" size={22} color="#FFF" /><Text style={styles.btnText}>Lưu vào Tủ</Text></>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shopeeBtn} onPress={handleOpenShopee}>
                                <LinearGradient colors={['#EE4D2D', '#FF7337']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <MaterialCommunityIcons name="shopping-outline" size={22} color="#FFF" />
                                    <Text style={styles.btnText}>Mua (Shopee)</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.personalActions}>
                            <TouchableOpacity style={styles.mixMatchBtn} onPress={() => navigation.navigate('MainApp', { screen: 'Outfit' })}>
                                <LinearGradient colors={[theme.primary, theme.accent]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <Ionicons name="color-wand-outline" size={22} color="#FFF" />
                                    <Text style={styles.btnText}>Phối đồ ngay</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleUpdateItem}>
                                <Ionicons name="pencil" size={22} color={theme.accent} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handleDeletePersonalItem}>
                                <Ionicons name="trash-outline" size={22} color="#E43F5A" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 5. GỢI Ý PHỐI ĐỒ CHIA KHAY CHUYÊN NGHIỆP */}
                    <View style={{ marginTop: 45 }}>
                        <View style={styles.aiHeader}>
                            <View style={[styles.sparkleIcon, { backgroundColor: 'rgba(199, 92, 113, 0.15)' }]}>
                                <Ionicons name="sparkles" size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                {isPublic ? "Sản phẩm liên quan" : "Stylist Gợi Ý Phối Đồ"}
                            </Text>
                        </View>
                        
                        {isLoadingSuggestions ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 20 }} />
                        ) : Object.keys(suggestionGroups).length > 0 ? (
                            Object.keys(suggestionGroups).map((groupTitle, index) => (
                                <View key={index} style={{ marginTop: 25 }}>
                                    <Text style={[styles.groupTitle, { color: theme.gray }]}>{groupTitle}</Text>
                                    <FlatList 
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        data={suggestionGroups[groupTitle]}
                                        keyExtractor={(i) => i.id.toString()}
                                        renderItem={renderSuggestionCard}
                                        contentContainerStyle={{ paddingRight: 20, paddingTop: 10 }}
                                    />
                                </View>
                            ))
                        ) : (
                            <View style={[styles.emptySuggestionBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={{ fontFamily: FONTS.regular, color: theme.gray, textAlign: 'center' }}>
                                    Hãy thêm nhiều đồ vào tủ để Stylist AI có thể gợi ý cho bạn nhé!
                                </Text>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    imageContainer: { width: '100%', height: height * 0.55, position: 'relative' },
    mainImage: { width: '100%', height: '100%' },
    topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
    backBtn: { position: 'absolute', top: 50, left: 20, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    
    infoContainer: { padding: 25, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, elevation: 20, shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
    categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 12, elevation: 3 },
    categoryText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFF', letterSpacing: 0.5 },
    itemName: { fontFamily: FONTS.bold, fontSize: 26, lineHeight: 34 },
    priceText: { fontFamily: FONTS.bold, fontSize: 22, paddingBottom: 5 },
    dateText: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 25 },

    // LƯỚI THÔNG SỐ (LUÔN CÂN ĐỐI)
    specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 25 },
    specCard: { width: (width - 65) / 2, padding: 18, borderRadius: 25, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    specTitle: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 4 },
    specValue: { fontFamily: FONTS.bold, fontSize: 15 },
    colorDot: { width: 24, height: 24, borderRadius: 12, marginBottom: 6, borderWidth: 1 },

    noteBox: { flexDirection: 'row', padding: 20, borderRadius: 25, marginBottom: 25, borderWidth: 1, elevation: 2 },
    noteText: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, lineHeight: 22 },

    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    tagChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10, marginBottom: 10 },
    tagText: { fontFamily: FONTS.bold, fontSize: 13 },

    // NÚT BẤM (ĐỒNG BỘ THEME LUXURY)
    publicActions: { flexDirection: 'row', gap: 15, marginTop: 15 },
    cloneBtn: { flex: 1, borderRadius: 25, elevation: 6 },
    shopeeBtn: { flex: 1.2, borderRadius: 25, elevation: 6 },
    
    personalActions: { flexDirection: 'row', gap: 15, marginTop: 15 },
    mixMatchBtn: { flex: 1, borderRadius: 25, elevation: 6 },
    iconActionBtn: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 55, borderRadius: 25 },
    btnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFF', marginLeft: 8 },

    // KHU VỰC AI STYLIST
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 5 },
    sparkleIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 0.5 },
    groupTitle: { fontFamily: FONTS.bold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    
    suggestionCard: { width: width * 0.32, aspectRatio: 3/4, borderRadius: 20, borderWidth: 1, marginRight: 15, overflow: 'hidden', elevation: 4, position: 'relative' },
    suggestionImage: { width: '100%', height: '100%' },
    miniTag: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, elevation: 3 },
    miniTagText: { fontFamily: FONTS.bold, fontSize: 10, color: '#FFF' },
    
    emptySuggestionBox: { padding: 25, borderRadius: 20, borderWidth: 1, marginTop: 15, alignItems: 'center' }
});

export default ItemDetailScreen;