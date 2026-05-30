import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const SavedOutfitsScreen = ({ navigation }) => {
    const { theme, t } = useContext(SettingsContext);
    const [outfits, setOutfits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOutfits = async () => {
        try {
            const response = await axiosClient.get('/outfits');
            setOutfits(response.data);
        } catch (error) { console.log(error); } 
        finally { setIsLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchOutfits(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchOutfits(); };

    const handleDelete = (id) => {
        Alert.alert("Xóa Set Đồ", "Bạn có chắc chắn muốn xóa set đồ này không?", [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: async () => {
                try {
                    await axiosClient.delete(`/outfits/${id}`);
                    setOutfits(outfits.filter(item => item.id !== id));
                } catch (error) { Alert.alert("Lỗi", "Không thể xóa set đồ lúc này."); }
            }}
        ]);
    };

    const renderOutfitCard = ({ item }) => {
        const createdDate = new Date(item.createdAt).toLocaleDateString('vi-VN');
        return (
            <View style={[styles.card, { backgroundColor: theme.white, borderColor: theme.border }]}>
                <Image source={{ uri: item.canvasImageUrl }} style={styles.cardImage} />
                <View style={[styles.cardFooter, { backgroundColor: theme.white }]}>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.outfitName, { color: theme.primary }]}>{item.name}</Text>
                        <Text style={[styles.outfitDate, { color: theme.gray }]}>{t('created_date')}{createdDate}</Text>
                    </View>
                    <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: theme.card }]} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={20} color={theme.accent} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.primary }]}>{t('my_collection')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {isLoading ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View> : (
                <FlatList
                    data={outfits}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOutfitCard}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="images-outline" size={80} color={theme.card} />
                            <Text style={[styles.emptyText, { color: theme.gray }]}>{t('empty_collection')}</Text>
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, marginBottom: 25 },
    backBtn: { padding: 5 },
    headerTitle: { fontFamily: FONTS.bold, fontSize: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 30 },
    card: { borderRadius: SIZES.radius, marginBottom: 25, overflow: 'hidden', elevation: 6, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, borderWidth: 1 },
    cardImage: { width: '100%', height: 350, resizeMode: 'cover', backgroundColor: '#FFFFFF' }, // Canvas luôn xuất ra nền trắng
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    cardInfo: { flex: 1 },
    outfitName: { fontFamily: FONTS.bold, fontSize: 16, marginBottom: 4 },
    outfitDate: { fontFamily: FONTS.regular, fontSize: 13 },
    deleteBtn: { padding: 10, borderRadius: 50, marginLeft: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center', marginTop: 15, paddingHorizontal: 40, lineHeight: 22 }
});

export default SavedOutfitsScreen;