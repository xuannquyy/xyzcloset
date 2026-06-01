import React, { useContext, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image'; 
import ScreenWrapper from '../components/ScreenWrapper';
import { SettingsContext } from '../context/SettingsContext';
import axiosClient from '../api/axiosClient';

const { width } = Dimensions.get('window');

const InsightsScreen = ({ navigation }) => {
    const { theme, t } = useContext(SettingsContext);
    const [wardrobeItems, setWardrobeItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPersonalWardrobe = async () => {
            try {
                const res = await axiosClient.get('/wardrobe'); 
                setWardrobeItems(res.data);
            } catch (error) {
                console.log("Lỗi fetch:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPersonalWardrobe();
    }, []);

    // Logic tính toán PieChart
    const stats = useMemo(() => {
        if (wardrobeItems.length === 0) return { totalItems: 0, chartData: [] };

        const counts = wardrobeItems.reduce((acc, item) => {
            const catName = item.category?.name || 'Khác';
            acc[catName] = (acc[catName] || 0) + 1;
            return acc;
        }, {});

        const allData = Object.keys(counts).map((key) => ({
            name: key.split('/')[0],
            population: counts[key],
        }));

        const totalItems = wardrobeItems.length;
        const sorted = allData.sort((a, b) => b.population - a.population);
        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((sum, item) => sum + item.population, 0);

        if (others > 0) top5.push({ name: 'Khác', population: others });

        const colors = [theme.primary, theme.accent, '#FF9F43', '#1DD1A1', '#54A0FF', theme.gray];

        const chartData = top5.map((item, index) => ({
            ...item,
            color: colors[index % colors.length],
            legendFontColor: theme.text,
            legendFontSize: 12
        }));

        return { totalItems, chartData };
    }, [wardrobeItems, theme]);

    // Logic lọc "Chân ái" (Top mặc nhiều nhất)
    const mostWornItems = useMemo(() => {
        if (!wardrobeItems.length) return [];
        const sorted = [...wardrobeItems].sort((a, b) => {
            const countA = a.outfitIds?.length || 0;
            const countB = b.outfitIds?.length || 0;
            return countB - countA;
        });
        return sorted.filter(item => (item.outfitIds?.length || 0) > 0).slice(0, 5);
    }, [wardrobeItems]);

    // Logic lọc "Gợi ý dọn tủ" (Ít mặc nhất hoặc chưa từng mặc)
    const leastWornItems = useMemo(() => {
        if (!wardrobeItems.length) return [];
        const sorted = [...wardrobeItems].sort((a, b) => {
            const countA = a.outfitIds?.length || 0;
            const countB = b.outfitIds?.length || 0;
            return countA - countB;
        });
        return sorted.filter(item => (item.outfitIds?.length || 0) === 0).slice(0, 5);
    }, [wardrobeItems]);

    // 🟢 TÍNH NĂNG MỚI: Logic tính tỷ lệ Áo/Quần (Smart Shopping Gap)
    const wardrobeGapAdvice = useMemo(() => {
        if (wardrobeItems.length < 5) return "Hãy thêm nhiều trang phục hơn để hệ thống phân tích nhé!";
        
        let topsCount = 0;
        let bottomsCount = 0;

        wardrobeItems.forEach(item => {
            const cat = (item.category?.name || '').toLowerCase();
            if (cat.includes('áo') || cat.includes('top')) topsCount++;
            if (cat.includes('quần') || cat.includes('váy') || cat.includes('bottom')) bottomsCount++;
        });

        if (bottomsCount === 0) return "Tủ đồ của bạn đang thiếu Quần/Váy. Hãy bổ sung ngay để bắt đầu phối đồ!";
        
        const ratio = topsCount / bottomsCount;
        
        if (ratio > 3) {
            return `Bạn đang có quá nhiều Áo so với Quần (${topsCount} Áo / ${bottomsCount} Quần). Gợi ý: Lần mua sắm tới, hãy ưu tiên chọn Quần/Váy có màu trung tính để tận dụng hết số áo hiện có.`;
        } else if (ratio < 1) {
            return `Bạn đang có nhiều Quần/Váy hơn Áo. Gợi ý: Hãy sắm thêm áo thun hoặc sơ mi cơ bản để phong phú hóa tủ đồ của mình!`;
        } else {
            return `Tuyệt vời! Tỷ lệ Áo và Quần của bạn đang rất cân đối. Bạn là một người mua sắm có kế hoạch!`;
        }
    }, [wardrobeItems]);

    // Component dùng chung để render một thẻ sản phẩm
    const renderItemCard = (item, isMostWorn) => {
        const usageCount = item.outfitIds?.length || 0;
        return (
            <TouchableOpacity key={item.id} style={[styles.itemCard, { backgroundColor: theme.card }]} activeOpacity={0.8}>
                <Image 
                    source={{ uri: item.imageUrl }} 
                    style={styles.itemImage} 
                    contentFit="cover" 
                    cachePolicy="memory-disk" 
                />
                <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.itemUsage, { color: isMostWorn ? theme.primary : theme.accent }]}>
                        {isMostWorn ? `Đã phối ${usageCount} lần` : 'Chưa sử dụng'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <ScreenWrapper withPadding={true} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper withPadding={false} style={{ backgroundColor: theme.background }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                {/* Header */}
                <View style={[styles.header, { paddingHorizontal: 20 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>{t('tab_insights')}</Text>
                </View>

                {/* Thống kê nhanh */}
                <View style={[styles.statsRow, { paddingHorizontal: 20 }]}>
                    <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.card, borderWidth: 1 }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>{stats.totalItems}</Text>
                        <Text style={[styles.statLabel, { color: theme.text, opacity: 0.7 }]}>Tổng trang phục</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.card, borderWidth: 1 }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>100%</Text>
                        <Text style={[styles.statLabel, { color: theme.text, opacity: 0.7 }]}>Độ hài hòa</Text>
                    </View>
                </View>

                {/* 🟢 TÍNH NĂNG MỚI: Giao diện Tư vấn Mua sắm */}
                <View style={{ backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1, marginHorizontal: 20, marginBottom: 35, padding: 20, borderRadius: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Ionicons name="bulb" size={24} color={theme.primary} />
                        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginLeft: 10 }}>Tư vấn Mua sắm</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: theme.text, opacity: 0.8, lineHeight: 22 }}>
                        {wardrobeGapAdvice}
                    </Text>
                </View>

                {/* Trang phục "Chân ái" */}
                {mostWornItems.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 20 }]}>Trang phục "Chân ái"</Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.text, paddingHorizontal: 20 }]}>Những item được bạn tận dụng tối đa trong các set đồ.</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, marginTop: 15 }}>
                            {mostWornItems.map(item => renderItemCard(item, true))}
                        </ScrollView>
                    </View>
                )}

                {/* Gợi ý dọn tủ / Thanh lý */}
                {leastWornItems.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 20 }]}>Gợi ý dọn tủ</Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.text, paddingHorizontal: 20 }]}>Có vẻ những item này đang bị bỏ quên, bạn có thể cân nhắc thanh lý hoặc quyên góp.</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, marginTop: 15 }}>
                            {leastWornItems.map(item => renderItemCard(item, false))}
                        </ScrollView>
                    </View>
                )}

                {/* Biểu đồ phân bổ */}
                <View style={[styles.chartContainer, { backgroundColor: theme.card, borderColor: theme.card, borderWidth: 1, marginHorizontal: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Phân bổ trang phục</Text>
                    <PieChart
                        data={stats.chartData}
                        width={width - 80}
                        height={200}
                        chartConfig={{ color: (opacity = 1) => theme.text }}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute={false}
                    />
                </View>
                
                {/* Card Chức năng: Giải cứu trang phục */}
                <View style={[styles.aiCard, { backgroundColor: theme.primary, marginHorizontal: 20 }]}>
                    <Ionicons name="color-wand" size={32} color={theme.accent} style={{ marginBottom: 15 }} />
                    <Text style={[styles.aiTitle, { color: '#FFF' }]}>Giải cứu đồ "tồn kho"</Text>
                    <Text style={[styles.aiDesc, { color: 'rgba(255,255,255,0.8)' }]}>
                        Bạn có một vài món đồ ít khi được sử dụng. Hãy thử mang chúng ra phối thành một set đồ mới toanh xem sao!
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.aiButton, { backgroundColor: theme.accent }]}
                        onPress={() => navigation.navigate('Outfit')}
                    >
                        <Text style={[styles.aiBtnText, { color: theme.primary }]}>Bắt đầu phối đồ</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    backBtn: { marginRight: 15 },
    title: { fontSize: 24, fontWeight: '800' },
    
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    statBox: { width: '48%', padding: 20, borderRadius: 24, alignItems: 'center' },
    statValue: { fontSize: 32, fontWeight: '900' },
    statLabel: { fontSize: 12, marginTop: 5, fontWeight: '600', textTransform: 'uppercase' },
    
    sectionContainer: { marginBottom: 35 },
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 5 },
    sectionSubtitle: { fontSize: 13, opacity: 0.6, lineHeight: 18 },
    
    itemCard: { width: 140, borderRadius: 20, overflow: 'hidden', marginRight: 15 },
    itemImage: { width: 140, height: 160 },
    itemInfo: { padding: 12 },
    itemName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
    itemUsage: { fontSize: 12, fontWeight: '600' },

    chartContainer: { alignItems: 'center', marginBottom: 35, padding: 20, borderRadius: 30 },
    
    aiCard: { padding: 30, borderRadius: 30, alignItems: 'flex-start', marginTop: 10 },
    aiTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
    aiDesc: { fontSize: 14, marginBottom: 20, lineHeight: 22 },
    aiButton: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
    aiBtnText: { fontWeight: '800', fontSize: 14 }
});

export default InsightsScreen;