import React, { useState, useCallback, useContext } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, FlatList, 
    TextInput, ActivityIndicator, Dimensions, StatusBar, Modal, ScrollView 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; 

const SavedOutfitsScreen = ({ navigation }) => {
    const { theme, isDarkMode } = useContext(SettingsContext);
    
    const [outfits, setOutfits] = useState([]);
    const [allTags, setAllTags] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]); 

    // State điều khiển các Modal điều hướng cao cấp
    const [selectedOutfit, setSelectedOutfit] = useState(null);
    const [isActionModalVisible, setActionModalVisible] = useState(false);
    const [isFilterSheetVisible, setFilterSheetVisible] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [outfitRes, tagsRes] = await Promise.all([
                axiosClient.get('/outfits'),
                axiosClient.get('/tags')
            ]);
            setOutfits(outfitRes.data.reverse() || []);
            setAllTags(tagsRes.data || []); 
        } catch (error) {
            console.log("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    // Group các tag theo loại (Mùa, Phong cách...) để hiển thị trong bộ lọc nâng cao
    const groupedTags = allTags.reduce((acc, tag) => {
        acc[tag.type] = acc[tag.type] || [];
        acc[tag.type].push(tag);
        return acc;
    }, {});

    const toggleFilter = (tagId) => {
        if (activeFilters.includes(tagId)) {
            setActiveFilters(activeFilters.filter(id => id !== tagId));
        } else {
            setActiveFilters([...activeFilters, tagId]);
        }
    };

    const handleDeleteOutfit = async () => {
        if (!selectedOutfit) return;
        setIsDeleting(true);
        try {
            await axiosClient.delete(`/outfits/${selectedOutfit.id}`);
            setOutfits(prev => prev.filter(item => item.id !== selectedOutfit.id));
            setActionModalVisible(false);
            setSelectedOutfit(null);
        } catch (error) {
            console.log("Lỗi khi xóa outfit:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredOutfits = outfits.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesFilter = true;
        if (activeFilters.length > 0) {
            const outfitTagIds = item.tags ? item.tags.map(t => t.id) : (item.tagIds || []);
            matchesFilter = activeFilters.some(filterId => outfitTagIds.includes(filterId));
        }
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const openOutfitActions = (outfit) => {
        setSelectedOutfit(outfit);
        setActionModalVisible(true);
    };

    const renderOutfitCard = ({ item }) => (
        <TouchableOpacity 
            style={[styles.cardContainer, { backgroundColor: theme.card }]}
            activeOpacity={0.85}
            onPress={() => openOutfitActions(item)}
            onLongPress={() => openOutfitActions(item)}
        >
            <View style={[styles.imageWrapper, { backgroundColor: isDarkMode ? '#111A33' : '#F4F5F8' }]}>
                <Image 
                    source={{ uri: item.canvasImageUrl }} 
                    style={styles.outfitImage} 
                    contentFit="cover" 
                    transition={300} 
                />
                <TouchableOpacity 
                    style={styles.moreActionBtn}
                    onPress={() => openOutfitActions(item)}
                >
                    <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />
                </TouchableOpacity>

                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagCountBadge}>
                        <Ionicons name="pricetag-outline" size={10} color="#FFFFFF" />
                        <Text style={styles.tagCountText}>{item.tags.length}</Text>
                    </View>
                )}
            </View>

            <View style={styles.infoWrapper}>
                <Text style={[styles.outfitName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.outfitDate, { color: theme.gray }]}>
                    {formatDate(item.createdAt)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
                        <Ionicons name="chevron-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.titleCenter}>
                        <Text style={[styles.mainHeading, { color: theme.text }]}>Lookbook</Text>
                        <Text style={[styles.subHeading, { color: theme.gray }]}>{outfits.length} Set đồ cá nhân</Text>
                    </View>
                    <View style={{ width: 40 }} /> 
                </View>

                {/* Thanh tìm kiếm tích hợp nút mở bộ lọc VIP */}
                <View style={styles.searchRow}>
                    <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
                        <Ionicons name="search-outline" size={18} color={theme.gray} style={styles.searchIcon} />
                        <TextInput 
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Tìm kiếm phong cách..."
                            placeholderTextColor={theme.gray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={16} color={theme.gray} />
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.advancedFilterBtn, 
                            { backgroundColor: activeFilters.length > 0 ? theme.primary : theme.card }
                        ]}
                        onPress={() => setFilterSheetVisible(true)}
                    >
                        <Ionicons name="options-outline" size={20} color={activeFilters.length > 0 ? '#FFF' : theme.text} />
                        {activeFilters.length > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Khay hiển thị các tag đang được active để nhanh chóng tắt */}
                {activeFilters.length > 0 && (
                    <View style={styles.activeFiltersWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {activeFilters.map(filterId => {
                                const currentTag = allTags.find(t => t.id === filterId);
                                if (!currentTag) return null;
                                return (
                                    <TouchableOpacity 
                                        key={filterId} 
                                        style={[styles.activeFilterChip, { backgroundColor: theme.primary }]}
                                        onPress={() => toggleFilter(filterId)}
                                    >
                                        <Text style={styles.activeFilterText}>#{currentTag.name}</Text>
                                        <Ionicons name="close" size={14} color="#FFF" />
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity onPress={() => setActiveFilters([])} style={styles.clearAllFiltersBtn}>
                                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: theme.primary }}>Xóa hết</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}
            </SafeAreaView>

            {/* Grid hiển thị danh sách Lookbook */}
            <View style={styles.gridContainer}>
                {isLoading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="small" color={theme.primary} />
                    </View>
                ) : filteredOutfits.length > 0 ? (
                    <FlatList 
                        data={filteredOutfits}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                        renderItem={renderOutfitCard}
                    />
                ) : (
                    <View style={styles.centerBox}>
                        <Ionicons name="journal-outline" size={60} color={theme.border} style={{ marginBottom: 15 }} />
                        <Text style={[styles.emptyTextTitle, { color: theme.text }]}>Không tìm thấy Set đồ</Text>
                        <Text style={[styles.emptyTextSub, { color: theme.gray }]}>
                            {searchQuery !== '' || activeFilters.length > 0 
                                ? "Hãy thử thay đổi từ khóa hoặc bộ lọc phân loại khác xem sao." 
                                : "Khám phá phòng thử đồ ngay để lưu lại bộ sưu tập chuẩn Stylist nhé."}
                        </Text>
                    </View>
                )}
            </View>

            {/* ==========================================
                MODAL 1: BỘ LỌC NÂNG CAO (BOTTOM SHEET)
            ========================================== */}
            <Modal visible={isFilterSheetVisible} animationType="slide" transparent={true} onRequestClose={() => setFilterSheetVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterSheetVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.bottomSheet, { backgroundColor: theme.background, height: height * 0.7 }]}>
                        <View style={styles.sheetHandle} />
                        <Text style={[styles.sheetTitle, { color: theme.text }]}>Bộ lọc phân loại</Text>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                            {Object.keys(groupedTags).length === 0 ? (
                                <Text style={[styles.emptyTextSub, { color: theme.gray, marginTop: 40 }]}>Chưa có thẻ dữ liệu nào được khởi tạo.</Text>
                            ) : (
                                Object.keys(groupedTags).map(type => (
                                    <View key={type} style={styles.filterGroupSection}>
                                        <Text style={[styles.filterGroupHeading, { color: theme.primary }]}>{type}</Text>
                                        <View style={styles.filterChipsRow}>
                                            {groupedTags[type].map(tag => {
                                                const isSelected = activeFilters.includes(tag.id);
                                                return (
                                                    <TouchableOpacity 
                                                        key={tag.id} 
                                                        onPress={() => toggleFilter(tag.id)}
                                                        style={[
                                                            styles.premiumTagChip, 
                                                            { 
                                                                backgroundColor: isSelected ? theme.primary : theme.card, 
                                                                borderColor: isSelected ? theme.primary : theme.border 
                                                            }
                                                        ]}
                                                    >
                                                        <Text style={[styles.premiumTagText, { color: isSelected ? '#FFF' : theme.text, fontFamily: isSelected ? FONTS.bold : FONTS.medium }]}>
                                                            #{tag.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <View style={[styles.sheetFooterAction, { backgroundColor: theme.background }]}>
                            <TouchableOpacity style={[styles.applyFilterBtn, { backgroundColor: theme.primary }]} onPress={() => setFilterSheetVisible(false)}>
                                <Text style={styles.applyFilterText}>Áp dụng bộ lọc</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ==========================================
                MODAL 2: CHI TIẾT TAG & QUẢN LÝ XÓA OUTFIT
            ========================================== */}
            <Modal visible={isActionModalVisible} animationType="slide" transparent={true} onRequestClose={() => setActionModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.bottomSheet, { backgroundColor: theme.background, height: height * 0.55 }]}>
                        <View style={styles.sheetHandle} />
                        
                        {selectedOutfit && (
                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View style={styles.actionOutfitPreviewRow}>
                                        <Image source={{ uri: selectedOutfit.canvasImageUrl }} style={styles.actionPreviewImage} contentFit="cover" />
                                        <View style={{ flex: 1, marginLeft: 15, justifyContent: 'center' }}>
                                            <Text style={[styles.actionOutfitName, { color: theme.text }]}>{selectedOutfit.name}</Text>
                                            <Text style={[styles.actionOutfitDate, { color: theme.gray }]}>Được tạo vào ngày {formatDate(selectedOutfit.createdAt)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.actionTagsSection}>
                                        <Text style={[styles.actionSectionTitle, { color: theme.text }]}>Các thẻ đính kèm ({selectedOutfit.tags?.length || 0})</Text>
                                        <View style={styles.filterChipsRow}>
                                            {selectedOutfit.tags && selectedOutfit.tags.length > 0 ? (
                                                selectedOutfit.tags.map(tag => (
                                                    <View key={tag.id} style={[styles.displayTagChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                                        <Text style={[styles.displayTagText, { color: theme.text }]}>#{tag.name}</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: theme.gray, italic: true }}>Set đồ này chưa được gắn thẻ nào.</Text>
                                            )}
                                        </View>
                                    </View>
                                </ScrollView>

                                <View style={styles.actionFooter}>
                                    <TouchableOpacity 
                                        style={[styles.deleteOutfitBtn, { backgroundColor: isDarkMode ? 'rgba(228, 63, 90, 0.15)' : '#FFF5F6', borderColor: '#E43F5A' }]} 
                                        onPress={handleDeleteOutfit}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator size="small" color="#E43F5A" />
                                        ) : (
                                            <>
                                                <Ionicons name="trash-outline" size={18} color="#E43F5A" style={{ marginRight: 6 }} />
                                                <Text style={styles.deleteOutfitText}>Xóa Set đồ khỏi bộ sưu tập</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    // Header Luxury VIP
    header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    titleCenter: { alignItems: 'center' },
    mainHeading: { fontFamily: FONTS.bold, fontSize: 22, letterSpacing: -0.5 },
    subHeading: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 2 },
    
    // Search & Filter Row Layout
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, height: '100%' },
    advancedFilterBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative', elevation: 1, shadowColor: '#000', shadowOpacity: 0.02 },
    filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#E43F5A', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    filterBadgeText: { color: '#FFF', fontSize: 10, fontFamily: FONTS.bold },

    // Active Filters List
    activeFiltersWrapper: { marginTop: 10, marginBottom: 2 },
    activeFilterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4 },
    activeFilterText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFF' },
    clearAllFiltersBtn: { justifyContent: 'center', paddingHorizontal: 8 },

    // Premium Fashion Grid Lookbook (3:4 Ratio)
    gridContainer: { flex: 1, paddingHorizontal: 24 },
    listContent: { paddingBottom: 40, paddingTop: 4 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 20 },
    cardContainer: { width: CARD_WIDTH, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
    imageWrapper: { width: '100%', height: CARD_WIDTH * 1.33, position: 'relative', overflow: 'hidden' }, // Tỷ lệ vàng 3:4 chuyên nghiệp
    outfitImage: { width: '100%', height: '100%' },
    moreActionBtn: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    tagCountBadge: { position: 'absolute', bottom: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', alignItems: 'center', gap: 4 },
    tagCountText: { color: '#FFF', fontFamily: FONTS.bold, fontSize: 10 },
    infoWrapper: { padding: 14 },
    outfitName: { fontFamily: FONTS.bold, fontSize: 14, marginBottom: 3, letterSpacing: -0.1 },
    outfitDate: { fontFamily: FONTS.regular, fontSize: 11 },

    // Center UI States
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyTextTitle: { fontFamily: FONTS.bold, fontSize: 16, marginBottom: 6 },
    emptyTextSub: { fontFamily: FONTS.regular, fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.7 },

    // Premium Bottom Sheets Layout
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    bottomSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30, elevation: 20 },
    sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontFamily: FONTS.bold, fontSize: 18, textAlign: 'center', marginBottom: 15 },
    
    // Filter Sheet Styles
    filterGroupSection: { marginBottom: 20 },
    filterGroupHeading: { fontFamily: FONTS.bold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    premiumTagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
    premiumTagText: { fontSize: 13 },
    sheetFooterAction: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10 },
    applyFilterBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    applyFilterText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFF' },

    // Outfit Action & Detail Sheet Styles
    actionOutfitPreviewRow: { flexDirection: 'row', paddingVertical: 10, marginBottom: 20 },
    actionPreviewImage: { width: 70, height: 90, borderRadius: 16, backgroundColor: '#F4F5F8' },
    actionOutfitName: { fontFamily: FONTS.bold, fontSize: 16, marginBottom: 4 },
    actionOutfitDate: { fontFamily: FONTS.medium, fontSize: 12 },
    actionTagsSection: { marginTop: 10, paddingBottom: 40 },
    actionSectionTitle: { fontFamily: FONTS.bold, fontSize: 14, marginBottom: 12 },
    displayTagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
    displayTagText: { fontFamily: FONTS.medium, fontSize: 13 },
    actionFooter: { marginTop: 20 },
    deleteOutfitBtn: { width: '100%', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1 },
    deleteOutfitText: { fontFamily: FONTS.bold, fontSize: 14, color: '#E43F5A' }
});

export default SavedOutfitsScreen;