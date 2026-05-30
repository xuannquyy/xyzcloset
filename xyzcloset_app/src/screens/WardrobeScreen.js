import React, { useState, useEffect, useContext } from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, FlatList, 
    ActivityIndicator, Dimensions, TextInput 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width } = Dimensions.get('window');

const WardrobeScreen = ({ navigation }) => {
    const { theme, language, t } = useContext(SettingsContext);
    
    // STATES
    const [activeTab, setActiveTab] = useState('public'); // 'personal' | 'public'
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState(''); // State lưu từ khóa tìm kiếm
    
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. TẢI DANH MỤC
    const fetchCategories = async () => {
        try {
            const res = await axiosClient.get('/categories'); 
            setCategories([{ id: 'All', name: 'All' }, ...res.data]);
        } catch (error) {
            console.log("Lỗi tải danh mục:", error);
            setCategories([{ id: 'All', name: 'All' }]);
        }
    };

    // 2. TẢI QUẦN ÁO
    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const endpoint = activeTab === 'personal' ? '/wardrobe' : '/wardrobe/public';
            const res = await axiosClient.get(endpoint);
            setItems(res.data);
        } catch (error) {
            console.log("Lỗi tải quần áo:", error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    // 3. LỌC ITEM THEO CẢ DANH MỤC VÀ TỪ KHÓA TÌM KIẾM
    const filteredItems = items.filter(item => {
        const matchCategory = selectedCategory === 'All' || item.categoryId === selectedCategory || item.category?.name === selectedCategory;
        const matchSearch = (item.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const renderItemCard = ({ item }) => (
        <TouchableOpacity 
            style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
                // 🟢 THÊM LỆNH NÀY CHUYỂN TRANG
                navigation.navigate('ItemDetail', { 
                    item: item, 
                    isPublic: activeTab === 'public' // Báo cho trang kia biết đây là đồ cá nhân hay đồ Shopee
                });
            }}
        >
            <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.itemImage} 
                contentFit="cover" 
                transition={300} 
                cachePolicy="memory-disk"
            />
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={{ backgroundColor: theme.background }}>
            
            {/* HEADER & TABS */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('my_wardrobe')}</Text>
                
                <View style={[styles.tabContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'public' && [styles.activeTab, { backgroundColor: theme.primary }]]}
                        onPress={() => setActiveTab('public')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'public' ? '#FFF' : theme.gray }]}>
                            {t('available_tab')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabBtn, activeTab === 'personal' && [styles.activeTab, { backgroundColor: theme.primary }]]}
                        onPress={() => setActiveTab('personal')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'personal' ? '#FFF' : theme.gray }]}>
                            {t('personal_tab')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* THANH TÌM KIẾM SANG TRỌNG */}
            <View style={styles.searchWrapper}>
                <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Ionicons name="search-outline" size={20} color={theme.gray} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder={t('search_placeholder')}
                        placeholderTextColor={theme.gray}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing" // Hiện nút X để xóa nhanh trên iOS
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.gray} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* THANH CUỘN DANH MỤC */}
            <View style={styles.categoryWrapper}>
                <FlatList 
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={categories}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    renderItem={({ item }) => {
                        const isSelected = selectedCategory === (item.id === 'All' ? 'All' : item.id);
                        return (
                            <TouchableOpacity 
                                style={[
                                    styles.categoryChip, 
                                    { 
                                        backgroundColor: isSelected ? theme.primary : theme.card,
                                        borderColor: isSelected ? theme.primary : theme.border
                                    }
                                ]}
                                onPress={() => setSelectedCategory(item.id === 'All' ? 'All' : item.id)}
                            >
                                <Text style={[styles.categoryText, { color: isSelected ? '#FFF' : theme.text }]}>
                                    {item.name === 'All' ? t('all') : item.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* LƯỚI QUẦN ÁO (GRID) */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : filteredItems.length > 0 ? (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItemCard}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="search-outline" size={60} color={theme.border} />
                    <Text style={[styles.emptyText, { color: theme.gray }]}>
                        {searchQuery.length > 0 ? t('empty_search') : (activeTab === 'personal' ? t('empty_personal') : t('empty_public'))}
                    </Text>
                </View>
            )}

            {/* NÚT FLOAT (FAB) ĐỂ THÊM ĐỒ MỚI NẾU Ở TAB CÁ NHÂN */}
            {activeTab === 'personal' && (
                <TouchableOpacity 
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={() => navigation.navigate('AddItem')}
                >
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>
            )}

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 24, marginBottom: 20 },
    
    tabContainer: { flexDirection: 'row', borderRadius: 25, borderWidth: 1, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
    activeTab: { elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    tabText: { fontFamily: FONTS.bold, fontSize: 14 },
    
    searchWrapper: { paddingHorizontal: 20, marginBottom: 15 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', height: 45, borderRadius: SIZES.radius, borderWidth: 1, paddingHorizontal: 15 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, height: '100%' },

    categoryWrapper: { marginBottom: 15 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10 },
    categoryText: { fontFamily: FONTS.medium, fontSize: 13 },
    
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '20%' },
    emptyText: { fontFamily: FONTS.regular, fontSize: 14, marginTop: 15, textAlign: 'center', paddingHorizontal: 40 },
    
    gridContainer: { paddingHorizontal: 15, paddingBottom: 100 },
    itemCard: { width: (width - 50) / 2, margin: 5, borderRadius: SIZES.radius, borderWidth: 1, overflow: 'hidden' },
    itemImage: { width: '100%', aspectRatio: 3/4 },
    
    fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 }
});

export default WardrobeScreen;