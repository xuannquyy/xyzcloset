import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, TouchableOpacity, 
    Dimensions, Linking, FlatList, ActivityIndicator, Modal 
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
    if (!colorName) return 'transparent';
    const swatches = {
        'Đen': '#1C1C1C', 'Trắng': '#FFFFFF', 'Navy': '#1C2541', 'Xanh Navy': '#1C2541',
        'Nâu/Be': '#D2B48C', 'Be': '#D2B48C', 'Đỏ Đô': '#791127', 'Nâu': '#8B4513',
        'Xám': '#A0A0A0', 'Pastel': '#FADADD'
    };
    return swatches[colorName] || '#E5B05C'; 
};

const ItemDetailScreen = ({ route, navigation }) => {
    const { theme, isDarkMode, language, t } = useContext(SettingsContext);
    const { item, isPublic } = route.params;

    const [suggestionGroups, setSuggestionGroups] = useState({});
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [isCloning, setIsCloning] = useState(false);

    // ==========================================
    // HỆ THỐNG CUSTOM ALERT SANG TRỌNG
    // ==========================================
    const [customAlert, setCustomAlert] = useState({ 
        visible: false, title: '', message: '', type: 'error', onConfirm: null, showCancel: false 
    });

    const showAlert = (title, message, type = 'error', onConfirm = null, showCancel = false) => {
        setCustomAlert({ visible: true, title, message, type, onConfirm, showCancel });
    };

    const handleAlertConfirm = () => {
        const { onConfirm } = customAlert;
        setCustomAlert(prev => ({ ...prev, visible: false }));
        if (onConfirm) {
            setTimeout(() => { onConfirm(); }, 300); 
        }
    };

    const handleAlertCancel = () => {
        setCustomAlert(prev => ({ ...prev, visible: false }));
    };

    const getAlertIconColor = () => {
        if (customAlert.type === 'success') return theme.primary; 
        if (customAlert.type === 'confirm' || customAlert.type === 'warning') return theme.accent;
        return '#E43F5A'; 
    };

    const getAlertIconName = () => {
        if (customAlert.type === 'success') return 'checkmark-circle';
        if (customAlert.type === 'confirm' || customAlert.type === 'warning') return 'help-circle';
        return 'close-circle';
    };

    // ==========================================
    // CÁC HÀM XỬ LÝ CHÍNH
    // ==========================================
    const handleOpenShopee = async () => {
        const url = item.affiliateUrl || "https://shopee.vn/"; 
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else showAlert("Lỗi kết nối", "Không thể mở trang mua sắm lúc này.", "error");
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
            showAlert("Tuyệt vời", "Món đồ này đã được cất gọn vào Tủ đồ cá nhân của bạn!", "success", () => navigation.goBack());
        } catch (error) {
            showAlert("Thất bại", "Không thể thêm vào tủ lúc này. Vui lòng kiểm tra kết nối.", "error");
        } finally {
            setIsCloning(false);
        }
    };

    const handleDeletePersonalItem = () => {
        showAlert(
            "Xóa món đồ", 
            "Bạn có chắc chắn muốn vứt món đồ này khỏi tủ không?", 
            "confirm", 
            async () => {
                try {
                    await axiosClient.delete(`/wardrobe/${item.id}`);
                    showAlert("Thành công", "Đã xóa món đồ khỏi tủ.", "success", () => navigation.goBack());
                } catch (error) {
                    showAlert("Lỗi", "Không thể xóa món đồ lúc này.", "error");
                }
            }, 
            true
        );
    };

    const handleUpdateItem = () => {
        navigation.navigate('AddItem', { itemToEdit: item });
    };

    // ==========================================
    // 🧠 THUẬT TOÁN AI STYLIST 3.0 (PHÂN BIỆT ĐẦM VÀ CHÂN VÁY)
    // ==========================================
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
                    const currentCatName = (item.category?.name || "").toLowerCase();
                    const myTags = item.tags?.map(t => t.name.toLowerCase()) || []; 

                    const getBestPiece = (targetCategories, themeTags, excludeIds) => {
                        let candidates = allOtherItems.filter(i => 
                            targetCategories.some(cat => (i.category?.name || "").toLowerCase().includes(cat.toLowerCase())) &&
                            !excludeIds.includes(i.id) 
                        );
                        
                        if (candidates.length === 0) return null;

                        candidates.forEach(c => {
                            c.matchScore = 0;
                            const cTags = c.tags?.map(t => t.name.toLowerCase()) || [];
                            
                            themeTags.forEach(tag => {
                                if (cTags.includes(tag.toLowerCase())) c.matchScore += 5;
                            });

                            if (c.color && item.color && c.color === item.color) c.matchScore += 2; 
                            if (['Trắng', 'Đen', 'Be', 'Xám', 'Navy'].includes(c.color)) c.matchScore += 1;
                        });

                        candidates.sort((a, b) => b.matchScore - a.matchScore);
                        return candidates[0]; 
                    };

                    const themes = [
                        { 
                            title: "Set 1: Năng động ngày Hè", 
                            tags: ["mùa hè", "đi chơi", "năng động", "thoải mái", "hè"] 
                        },
                        { 
                            title: "Set 2: Thanh lịch Đi học / Thực tập", 
                            tags: ["đi học", "thực tập", "công sở", "thanh lịch", "lịch sự"] 
                        },
                        { 
                            title: "Set 3: Ton-sur-ton Cá tính", 
                            tags: myTags.length > 0 ? myTags : ["phong cách", "độc đáo"] 
                        }
                    ];

                    let usedItemIds = []; 

                    themes.forEach(theme => {
                        let outfit = [];
                        
                        // 🟢 LOGIC TÁCH BẠCH ĐÃ SỬA LỖI
                        if (currentCatName.includes("áo") && !currentCatName.includes("khoác")) {
                            // Chỉ tìm Quần hoặc Chân váy (Tuyệt đối không lấy Váy liền/Đầm)
                            const bottom = getBestPiece(["quần", "chân váy"], theme.tags, usedItemIds);
                            if(bottom) { outfit.push(bottom); usedItemIds.push(bottom.id); }
                            
                            const shoe = getBestPiece(["giày", "dép"], theme.tags, usedItemIds);
                            if(shoe) { outfit.push(shoe); usedItemIds.push(shoe.id); }
                            
                            const bag = getBestPiece(["túi", "balo", "phụ kiện"], theme.tags, usedItemIds);
                            if(bag) { outfit.push(bag); usedItemIds.push(bag.id); }
                            
                        } 
                        else if (currentCatName.includes("quần") || currentCatName.includes("chân váy")) {
                            // Tìm Áo để mặc cùng
                            const top = getBestPiece(["áo thun", "sơ mi", "áo len"], theme.tags, usedItemIds);
                            if(top) { outfit.push(top); usedItemIds.push(top.id); }
                            
                            const shoe = getBestPiece(["giày", "dép"], theme.tags, usedItemIds);
                            if(shoe) { outfit.push(shoe); usedItemIds.push(shoe.id); }
                            
                            const bag = getBestPiece(["túi", "balo"], theme.tags, usedItemIds);
                            if(bag) { outfit.push(bag); usedItemIds.push(bag.id); }
                            
                        } 
                        else if (currentCatName.includes("đầm") || currentCatName.includes("váy liền")) {
                            // Đầm là áo liền quần nên KHÔNG TÌM áo hay quần nữa, chỉ tìm Áo khoác và Phụ kiện
                            const jacket = getBestPiece(["khoác", "jacket"], theme.tags, usedItemIds);
                            if(jacket) { outfit.push(jacket); usedItemIds.push(jacket.id); }
                            
                            const shoe = getBestPiece(["giày", "cao gót", "dép"], theme.tags, usedItemIds);
                            if(shoe) { outfit.push(shoe); usedItemIds.push(shoe.id); }
                            
                            const bag = getBestPiece(["túi", "balo", "phụ kiện"], theme.tags, usedItemIds);
                            if(bag) { outfit.push(bag); usedItemIds.push(bag.id); }
                            
                        } 
                        else {
                            // Giày, Túi, Phụ kiện -> Tìm Quần Áo hoặc Đầm cho nó
                            // Ưu tiên 1: Thử tìm Đầm
                            const dress = getBestPiece(["đầm", "váy liền"], theme.tags, usedItemIds);
                            if(dress) { 
                                outfit.push(dress); usedItemIds.push(dress.id); 
                            } else {
                                // Ưu tiên 2: Tìm bộ Áo + Quần/Chân váy
                                const top = getBestPiece(["áo"], theme.tags, usedItemIds);
                                if(top) { outfit.push(top); usedItemIds.push(top.id); }
                                
                                const bottom = getBestPiece(["quần", "chân váy"], theme.tags, usedItemIds);
                                if(bottom) { outfit.push(bottom); usedItemIds.push(bottom.id); }
                            }
                        }

                        if (outfit.length > 0) {
                            finalGroups[theme.title] = outfit;
                        }
                    });
                }

                setSuggestionGroups(finalGroups);
            } catch (error) {
                console.log("Lỗi tải gợi ý:", error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [item.id, isPublic]);

    // ==========================================
    // COMPONENT THẺ GỢI Ý ĐƯỢC THIẾT KẾ LẠI
    // ==========================================
    const renderSuggestionCard = ({ item: suggestedItem }) => {
        const catName = (suggestedItem.category?.name || "").toLowerCase();
        let roleText = "Phụ kiện";
        
        // Cập nhật nhãn Label chi tiết hơn
        if (catName.includes("đầm")) roleText = "Váy liền";
        else if (catName.includes("áo khoác")) roleText = "Khoác ngoài";
        else if (catName.includes("áo")) roleText = "Áo";
        else if (catName.includes("chân váy")) roleText = "Chân Váy";
        else if (catName.includes("quần")) roleText = "Quần";
        else if (catName.includes("giày") || catName.includes("dép")) roleText = "Giày dép";
        else if (catName.includes("túi") || catName.includes("balo")) roleText = "Túi xách";

        return (
            <TouchableOpacity 
                style={[styles.suggestionCard, { borderColor: theme.border, backgroundColor: theme.card }]}
                onPress={() => navigation.push('ItemDetail', { item: suggestedItem, isPublic })}
                activeOpacity={0.8}
            >
                <Image source={{ uri: suggestedItem.imageUrl }} style={styles.suggestionImage} contentFit="cover" transition={300} />
                <LinearGradient colors={[theme.primary, theme.accent]} style={styles.miniTag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.miniTagText}>{roleText}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.mainImage} contentFit="cover" transition={300} />
                    <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.topGradient} />
                    <TouchableOpacity style={[styles.backBtn, { borderColor: theme.border }]} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>

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

                    <View style={styles.specGrid}>
                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="resize" size={22} color={item.size ? theme.primary : theme.gray} style={{ marginBottom: 5 }} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Kích cỡ</Text>
                            <Text style={[styles.specValue, { color: item.size ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.size || '---'}
                            </Text>
                        </View>
                        
                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.colorDot, { backgroundColor: getColorHex(item.color), borderColor: theme.border }]} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Màu sắc</Text>
                            <Text style={[styles.specValue, { color: item.color ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.color || '---'}
                            </Text>
                        </View>

                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="texture" size={22} color={item.material ? theme.primary : theme.gray} style={{ marginBottom: 5 }} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Chất liệu</Text>
                            <Text style={[styles.specValue, { color: item.material ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.material || '---'}
                            </Text>
                        </View>

                        <View style={[styles.specCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <FontAwesome5 name="hand-holding-water" size={18} color={item.careInstructions ? theme.primary : theme.gray} style={{ marginBottom: 8 }} />
                            <Text style={[styles.specTitle, { color: theme.gray }]}>Bảo quản</Text>
                            <Text style={[styles.specValue, { color: item.careInstructions ? theme.text : theme.gray }]} numberOfLines={1}>
                                {item.careInstructions || '---'}
                            </Text>
                        </View>
                    </View>

                    {(item.notes || item.description) && (
                        <View style={[styles.noteBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="information-circle" size={22} color={theme.accent} style={{ marginRight: 12 }} />
                            <Text style={[styles.noteText, { color: theme.text }]}>{item.notes || item.description}</Text>
                        </View>
                    )}

                    {item.tags && item.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {item.tags.map(tag => (
                                <View key={tag.id} style={[styles.tagChip, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                                    <Text style={[styles.tagText, { color: theme.primary }]}>#{tag.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}

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
                                    Hãy thêm nhiều quần áo, giày dép vào tủ để Stylist AI có thể mix-match cho bạn nhé!
                                </Text>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>

            <Modal visible={customAlert.visible} transparent={true} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.background }]}>
                        
                        <View style={[styles.alertIconWrapper, { backgroundColor: getAlertIconColor(), borderColor: theme.background }]}>
                            <Ionicons 
                                name={getAlertIconName()} 
                                size={40} color="#FFF" 
                            />
                        </View>
                        
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: theme.text }]}>{customAlert.message}</Text>
                        
                        {customAlert.showCancel ? (
                            <View style={styles.alertBtnRow}>
                                <TouchableOpacity style={[styles.alertBtnHalf, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]} onPress={handleAlertCancel}>
                                    <Text style={[styles.alertBtnText, { color: theme.text }]}>Hủy bỏ</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.alertBtnHalf, { backgroundColor: '#E43F5A' }]} onPress={handleAlertConfirm}>
                                    <Text style={[styles.alertBtnText, { color: '#FFF' }]}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.alertBtn, { backgroundColor: theme.primary }]} onPress={handleAlertConfirm}>
                                <Text style={[styles.alertBtnText, { color: '#FFF' }]}>Đã hiểu</Text>
                            </TouchableOpacity>
                        )}
                        
                    </View>
                </View>
            </Modal>

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

    publicActions: { flexDirection: 'row', gap: 15, marginTop: 15 },
    cloneBtn: { flex: 1, borderRadius: 25, elevation: 6 },
    shopeeBtn: { flex: 1.2, borderRadius: 25, elevation: 6 },
    
    personalActions: { flexDirection: 'row', gap: 15, marginTop: 15 },
    mixMatchBtn: { flex: 1, borderRadius: 25, elevation: 6 },
    iconActionBtn: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 55, borderRadius: 25 },
    btnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFF', marginLeft: 8 },

    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 5 },
    sparkleIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 20, letterSpacing: 0.5 },
    groupTitle: { fontFamily: FONTS.bold, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    
    suggestionCard: { width: width * 0.32, aspectRatio: 3/4, borderRadius: 20, borderWidth: 1, marginRight: 15, overflow: 'hidden', elevation: 4, position: 'relative' },
    suggestionImage: { width: '100%', height: '100%' },
    miniTag: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, elevation: 3 },
    miniTagText: { fontFamily: FONTS.bold, fontSize: 10, color: '#FFF' },
    emptySuggestionBox: { padding: 25, borderRadius: 20, borderWidth: 1, marginTop: 15, alignItems: 'center' },

    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '82%', borderRadius: 30, paddingHorizontal: 30, paddingBottom: 30, paddingTop: 40, alignItems: 'center', elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
    alertIconWrapper: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -35, borderWidth: 4, elevation: 15 },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 20, marginTop: 10, marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25, opacity: 0.8 },
    alertBtn: { width: '100%', paddingVertical: 14, borderRadius: 20, alignItems: 'center', elevation: 4 },
    alertBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
    alertBtnHalf: { flex: 1, paddingVertical: 14, borderRadius: 20, alignItems: 'center', elevation: 2 },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 0.5 },
});

export default ItemDetailScreen;