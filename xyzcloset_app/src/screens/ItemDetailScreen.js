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

const getColorHex = (colorName) => {
    const swatches = {
        'Đen': '#1C1C1C', 'Trắng': '#FFFFFF', 'Navy': '#1C2541', 'Xanh Navy': '#1C2541',
        'Nâu/Be': '#D2B48C', 'Be': '#D2B48C', 'Đỏ Đô': '#791127', 
        'Xám': '#A0A0A0', 'Pastel': '#FADADD'
    };
    return swatches[colorName] || '#E5B05C'; 
};

const ItemDetailScreen = ({ route, navigation }) => {
    const { theme, isDarkMode, language, t } = useContext(SettingsContext);
    const { item, isPublic } = route.params;

    // 🟢 ĐỔI STATE THÀNH OBJECT ĐỂ LƯU THEO TỪNG KHAY (GROUP)
    const [suggestionGroups, setSuggestionGroups] = useState({});
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [isCloning, setIsCloning] = useState(false);

    const handleOpenShopee = async () => {
        const url = item.affiliateUrl || "https://shopee.vn/"; 
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert("Lỗi", "Không thể mở trang mua sắm lúc này.");
    };

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

    const handleUpdateItem = () => {
        navigation.navigate('AddItem', { itemToEdit: item });
    };

    // ====================================================================
    // 🧠 AI STYLIST THUẬT TOÁN PHỐI ĐỒ (MATCHING ALGORITHM)
    // ====================================================================
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const endpoint = isPublic ? '/wardrobe/public' : '/wardrobe';
                const res = await axiosClient.get(endpoint);
                const allOtherItems = res.data.filter((i) => i.id !== item.id);
                
                let finalGroups = {};

                if (isPublic) {
                    // TAB SHOPEE: Chỉ cần gợi ý sản phẩm tương tự cùng loại
                    finalGroups["Sản phẩm tương tự"] = allOtherItems.filter(i => i.categoryId === item.categoryId).slice(0, 6);
                } else {
                    // TAB TỦ ĐỒ CÁ NHÂN: Thuật toán AI Stylist
                    const currentCatName = item.category?.name || "";
                    const myTags = item.tags?.map(t => t.name) || []; // Lấy mốc Mùa/Thời tiết/Hoàn cảnh

                    // Hàm 1: Chấm điểm dựa trên Tag (Đồng điệu ngữ cảnh)
                    const calculateMatchScore = (targetItem) => {
                        let score = 0;
                        const targetTags = targetItem.tags?.map(t => t.name) || [];
                        myTags.forEach(tag => {
                            if (targetTags.includes(tag)) score += 2; // Cùng tag +2 điểm
                        });
                        return score;
                    };

                    // Hàm 2: Lọc danh mục và xếp hạng
                    const getBestMatches = (categoryKeywords) => {
                        let matches = allOtherItems.filter(i => 
                            categoryKeywords.some(keyword => (i.category?.name || "").includes(keyword))
                        );
                        // Sắp xếp theo điểm Tag (Giúp áo mùa đông đi kèm quần mùa đông)
                        matches.sort((a, b) => calculateMatchScore(b) - calculateMatchScore(a));
                        return matches.slice(0, 5); // Lấy top 5 món ngon nhất
                    };

                    // PHÂN NHÁNH LOGIC GỢI Ý CHÉO
                    if (currentCatName.includes("Áo") && !currentCatName.includes("khoác")) {
                        finalGroups["Nên mặc cùng (Quần/Váy)"] = getBestMatches(["Quần", "Váy"]);
                        finalGroups["Giày & Phụ kiện đi kèm"] = getBestMatches(["Giày", "Phụ kiện", "Túi"]);
                    } 
                    else if (currentCatName.includes("Quần") || currentCatName.includes("Váy")) {
                        finalGroups["Nên phối với (Áo)"] = getBestMatches(["Áo"]);
                        finalGroups["Giày & Phụ kiện đi kèm"] = getBestMatches(["Giày", "Phụ kiện", "Túi"]);
                    } 
                    else if (currentCatName.includes("Đầm")) {
                        finalGroups["Khoác ngoài sành điệu"] = getBestMatches(["khoác"]);
                        finalGroups["Giày & Phụ kiện đi kèm"] = getBestMatches(["Giày", "Phụ kiện", "Túi"]);
                    } 
                    else if (currentCatName.includes("Giày") || currentCatName.includes("Túi")) {
                        finalGroups["Trang phục phù hợp"] = getBestMatches(["Áo", "Quần", "Váy", "Đầm"]);
                    } 
                    else {
                        finalGroups["Gợi ý mix & match"] = getBestMatches(["Áo", "Quần", "Váy", "Đầm", "Giày"]);
                    }
                }

                // Lọc bỏ những khay (group) không có sản phẩm nào
                const cleanGroups = {};
                Object.keys(finalGroups).forEach(key => {
                    if (finalGroups[key] && finalGroups[key].length > 0) {
                        cleanGroups[key] = finalGroups[key];
                    }
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

    // Component render từng thẻ đồ nhỏ trong khay gợi ý
    const renderSuggestionCard = ({ item: suggestedItem }) => (
        <TouchableOpacity 
            style={[styles.suggestionCard, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => navigation.push('ItemDetail', { item: suggestedItem, isPublic })}
        >
            <Image source={{ uri: suggestedItem.imageUrl }} style={styles.suggestionImage} contentFit="cover" transition={300} />
            {suggestedItem.tags && suggestedItem.tags.length > 0 && (
                <View style={styles.miniTag}>
                    <Text style={styles.miniTagText}>Trùng khớp</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* 1. KHU VỰC ẢNH FULL MÀN HÌNH */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.mainImage} contentFit="cover" transition={300} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* 2. KHỐI THÔNG TIN CHÍNH */}
                <View style={[styles.infoContainer, { backgroundColor: theme.background }]}>
                    
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.categoryBadge, { backgroundColor: theme.accent }]}>
                                <Text style={styles.categoryText}>{item.category?.name || "Thời trang"}</Text>
                            </View>
                            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                        </View>
                        {isPublic && item.price && (
                            <Text style={[styles.priceText, { color: theme.primary }]}>
                                {item.price.toLocaleString('vi-VN')}đ
                            </Text>
                        )}
                    </View>

                    {!isPublic && (
                        <Text style={[styles.dateText, { color: theme.gray }]}>
                            <Ionicons name="time-outline" size={14} /> Đã thêm ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                    )}

                    {/* 3. KHỐI THÔNG SỐ CHI TIẾT */}
                    <View style={styles.specGrid}>
                        {item.size && (
                            <View style={[styles.specCard, { backgroundColor: isDarkMode ? '#1C2541' : '#FFF', borderColor: theme.border }]}>
                                <Ionicons name="resize" size={22} color={theme.accent} style={{ marginBottom: 5 }} />
                                <Text style={[styles.specTitle, { color: theme.gray }]}>Kích cỡ</Text>
                                <Text style={[styles.specValue, { color: theme.text }]}>{item.size}</Text>
                            </View>
                        )}
                        {item.color && (
                            <View style={[styles.specCard, { backgroundColor: isDarkMode ? '#1C2541' : '#FFF', borderColor: theme.border }]}>
                                <View style={[styles.colorDot, { backgroundColor: getColorHex(item.color) }]} />
                                <Text style={[styles.specTitle, { color: theme.gray }]}>Màu sắc</Text>
                                <Text style={[styles.specValue, { color: theme.text }]} numberOfLines={1}>{item.color}</Text>
                            </View>
                        )}
                        {item.material && (
                            <View style={[styles.specCard, { backgroundColor: isDarkMode ? '#1C2541' : '#FFF', borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="texture" size={22} color={theme.accent} style={{ marginBottom: 5 }} />
                                <Text style={[styles.specTitle, { color: theme.gray }]}>Chất liệu</Text>
                                <Text style={[styles.specValue, { color: theme.text }]} numberOfLines={1}>{item.material}</Text>
                            </View>
                        )}
                        {item.careInstructions && (
                            <View style={[styles.specCard, { backgroundColor: isDarkMode ? '#1C2541' : '#FFF', borderColor: theme.border }]}>
                                <FontAwesome5 name="hand-holding-water" size={18} color={theme.accent} style={{ marginBottom: 8 }} />
                                <Text style={[styles.specTitle, { color: theme.gray }]}>Bảo quản</Text>
                                <Text style={[styles.specValue, { color: theme.text }]} numberOfLines={1}>{item.careInstructions}</Text>
                            </View>
                        )}
                    </View>

                    {(item.notes || item.description) && (
                        <View style={[styles.noteBox, { backgroundColor: theme.card }]}>
                            <Ionicons name="information-circle" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                            <Text style={[styles.noteText, { color: theme.text }]}>{item.notes || item.description}</Text>
                        </View>
                    )}

                    {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {item.tags.map(tag => (
                                <View key={tag.id} style={[styles.tagChip, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    <Text style={[styles.tagText, { color: theme.primary }]}>#{tag.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 4. NÚT HÀNH ĐỘNG */}
                    {isPublic ? (
                        <View style={styles.publicActions}>
                            <TouchableOpacity style={styles.cloneBtn} onPress={handleCloneToWardrobe} disabled={isCloning}>
                                <LinearGradient colors={['#E5B05C', '#D49A44']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    {isCloning ? <ActivityIndicator color="#FFF" /> : (
                                        <><Ionicons name="download-outline" size={22} color="#FFF" /><Text style={styles.btnText}>Lưu vào Tủ</Text></>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shopeeBtn} onPress={handleOpenShopee}>
                                <LinearGradient colors={['#EE4D2D', '#FF7337']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <MaterialCommunityIcons name="shopping-outline" size={22} color="#FFF" />
                                    <Text style={styles.btnText}>Mua trên Shopee</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.personalActions}>
                            <TouchableOpacity style={styles.mixMatchBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Outfit' })}>
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

                    {/* ============================================== */}
                    {/* 5. GỢI Ý PHỐI ĐỒ CHIA KHAY CHUYÊN NGHIỆP (AI) */}
                    {/* ============================================== */}
                    <View style={{ marginTop: 45 }}>
                        <View style={styles.aiHeader}>
                            <Ionicons name="sparkles" size={22} color={theme.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                {isPublic ? (language === 'vi' ? "Có thể bạn sẽ thích" : "You might also like") : (language === 'vi' ? "Stylist Gợi Ý Phối Đồ" : "Mix & Match Ideas")}
                            </Text>
                        </View>
                        
                        {isLoadingSuggestions ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 15 }} />
                        ) : Object.keys(suggestionGroups).length > 0 ? (
                            // Render Từng khay (Group) đồ riêng biệt
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
                            <Text style={{ fontFamily: FONTS.regular, color: theme.gray, fontStyle: 'italic', marginTop: 15 }}>
                                {language === 'vi' ? "Tủ đồ của bạn chưa đủ đa dạng để phối món này." : "Not enough items in wardrobe to mix & match."}
                            </Text>
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
    topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
    backBtn: { position: 'absolute', top: 50, left: 20, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    
    infoContainer: { padding: 25, borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -40, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
    categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
    categoryText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFF', letterSpacing: 0.5 },
    itemName: { fontFamily: FONTS.bold, fontSize: 26, lineHeight: 34 },
    priceText: { fontFamily: FONTS.bold, fontSize: 22, paddingBottom: 5 },
    dateText: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 20 },

    specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginVertical: 20 },
    specCard: { width: (width - 65) / 2, padding: 15, borderRadius: 20, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
    specTitle: { fontFamily: FONTS.medium, fontSize: 12, marginBottom: 4 },
    specValue: { fontFamily: FONTS.bold, fontSize: 15 },
    colorDot: { width: 22, height: 22, borderRadius: 11, marginBottom: 5, borderWidth: 1, borderColor: '#DDD' },

    noteBox: { flexDirection: 'row', padding: 18, borderRadius: 20, marginBottom: 20 },
    noteText: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, lineHeight: 22 },

    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    tagChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10, marginBottom: 10 },
    tagText: { fontFamily: FONTS.bold, fontSize: 13 },

    publicActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
    cloneBtn: { flex: 1, borderRadius: 25, elevation: 8, shadowColor: '#E5B05C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },
    shopeeBtn: { flex: 1.2, borderRadius: 25, elevation: 8, shadowColor: '#EE4D2D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },
    
    personalActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
    mixMatchBtn: { flex: 1, borderRadius: 25, elevation: 8, shadowColor: '#791127', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    iconActionBtn: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    
    actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 55, borderRadius: 25 },
    btnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFF', marginLeft: 8 },

    // KHU VỰC GỢI Ý CẢI TIẾN
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 0.5 },
    groupTitle: { fontFamily: FONTS.bold, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
    suggestionCard: { width: width * 0.3, aspectRatio: 3/4, borderRadius: 15, borderWidth: 1, marginRight: 15, overflow: 'hidden', elevation: 3, position: 'relative' },
    suggestionImage: { width: '100%', height: '100%' },
    miniTag: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(229, 176, 92, 0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
    miniTagText: { fontFamily: FONTS.bold, fontSize: 9, color: '#1C2541' }
});

export default ItemDetailScreen;