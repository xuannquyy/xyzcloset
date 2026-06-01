import React, { useContext, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
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

    const stats = useMemo(() => {
        if (wardrobeItems.length === 0) return { totalItems: 0, chartData: [], mostWorn: null, leastWorn: null };

        // 1. Phân loại Category cho biểu đồ
        const counts = wardrobeItems.reduce((acc, item) => {
            const catName = item.category?.name || 'Khác';
            acc[catName] = (acc[catName] || 0) + 1;
            return acc;
        }, {});

        const allData = Object.keys(counts).map((key) => ({
            name: key.split('/')[0],
            population: counts[key],
        }));

        const sorted = allData.sort((a, b) => b.population - a.population);
        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((sum, item) => sum + item.population, 0);
        if (others > 0) top5.push({ name: 'Khác', population: others });

        const colors = [theme.primary, theme.accent, '#FF9F43', '#1DD1A1', '#54A0FF', theme.gray];
        const chartData = top5.map((item, index) => ({
            ...item, color: colors[index % colors.length], legendFontColor: theme.text, legendFontSize: 12
        }));

        // 2. Tìm đồ mặc nhiều nhất/ít nhất dựa trên wearCount mới từ Prisma
        // Lọc những item có wearCount > 0 để tính toán chính xác
        const sortedByWear = [...wardrobeItems].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));
        
        const mostWorn = sortedByWear[0]?.wearCount > 0 ? sortedByWear[0] : null;
        const leastWorn = sortedByWear.filter(i => i.wearCount > 0).pop() || null;

        return { totalItems: wardrobeItems.length, chartData, mostWorn, leastWorn };
    }, [wardrobeItems, theme]);

    if (isLoading) {
        return (
            <ScreenWrapper withPadding={true} style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>{t('tab_insights')}</Text>
                </View>

                {/* Thống kê nhanh */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>{stats.totalItems}</Text>
                        <Text style={[styles.statLabel, { color: theme.gray }]}>{t('total_outfits')}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statValue, { color: theme.primary }]}>100%</Text>
                        <Text style={[styles.statLabel, { color: theme.gray }]}>{t('harmony')}</Text>
                    </View>
                </View>

                {/* Món đồ "Chân ái" & "Cần thanh lý" */}
                <View style={styles.sectionBlock}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Phân tích chuyên sâu</Text>
                    <View style={styles.insightsGrid}>
                        <View style={[styles.insightCard, { backgroundColor: theme.card }]}>
                            <Ionicons name="heart" size={24} color="#E43F5A" />
                            <Text style={[styles.insightLabel, { color: theme.gray }]}>Mặc nhiều nhất</Text>
                            <Text numberOfLines={1} style={[styles.insightValue, { color: theme.text }]}>{stats.mostWorn?.name || 'Chưa mặc'}</Text>
                        </View>
                        <View style={[styles.insightCard, { backgroundColor: theme.card }]}>
                            <Ionicons name="trash-outline" size={24} color={theme.gray} />
                            <Text style={[styles.insightLabel, { color: theme.gray }]}>Cần thanh lý</Text>
                            <Text numberOfLines={1} style={[styles.insightValue, { color: theme.text }]}>{stats.leastWorn?.name || 'Chưa mặc'}</Text>
                        </View>
                    </View>
                </View>

                {/* Biểu đồ */}
                <View style={[styles.chartContainer, { backgroundColor: theme.card, padding: 15, borderRadius: 30 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('fav_colors')}</Text>
                    <PieChart
                        data={stats.chartData}
                        width={width - 80}
                        height={200}
                        chartConfig={{ color: (opacity = 1) => theme.text }}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                    />
                </View>
                
                {/* AI Card */}
                <View style={[styles.aiCard, { backgroundColor: theme.primary }]}>
                    <Ionicons name="sparkles" size={32} color={theme.accent} style={{ marginBottom: 15 }} />
                    <Text style={[styles.aiTitle, { color: '#FFF' }]}>{t('ai_suggestion_title')}</Text>
                    <Text style={[styles.aiDesc, { color: 'rgba(255,255,255,0.8)' }]}>{t('ai_suggestion_desc')}</Text>
                    <TouchableOpacity 
                        style={[styles.aiButton, { backgroundColor: theme.accent }]}
                        onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}
                    >
                        <Text style={[styles.aiBtnText, { color: theme.primary }]}>{t('view_suggestions')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    backBtn: { marginRight: 15 },
    title: { fontSize: 24, fontWeight: '800' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statBox: { width: '48%', padding: 25, borderRadius: 30, alignItems: 'center' },
    statValue: { fontSize: 32, fontWeight: '900' },
    statLabel: { fontSize: 11, marginTop: 5, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
    sectionBlock: { marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 15 },
    insightsGrid: { flexDirection: 'row', gap: 15 },
    insightCard: { flex: 1, padding: 20, borderRadius: 25, alignItems: 'center' },
    insightLabel: { fontSize: 11, marginTop: 10, marginBottom: 5 },
    insightValue: { fontSize: 14, fontWeight: '700' },
    chartContainer: { alignItems: 'center', marginBottom: 30 },
    aiCard: { padding: 30, borderRadius: 40, alignItems: 'flex-start' },
    aiTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
    aiDesc: { fontSize: 14, marginBottom: 20, lineHeight: 22 },
    aiButton: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
    aiBtnText: { fontWeight: '800', fontSize: 14 }
});

export default InsightsScreen;