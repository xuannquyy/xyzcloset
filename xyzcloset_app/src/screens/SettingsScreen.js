import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Alert, Share, Linking, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import axiosClient from '../api/axiosClient';

const SettingsScreen = ({ navigation }) => {
    // KÉO THEME VÀ HÀM DỊCH (t) TỪ CONTEXT
    const { isDarkMode, toggleTheme, language, toggleLanguage, theme, t } = useContext(SettingsContext);
    
    const [dailyReminder, setDailyReminder] = useState(true);
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggleLanguage = () => {
        toggleLanguage(language === 'vi' ? 'en' : 'vi');
    };

    const handleShareApp = async () => { /* Giữ nguyên logic cũ */ };
    const handleFeedback = () => { /* Giữ nguyên logic cũ */ };
    const handleToggleBiometrics = async (newValue) => { /* Giữ nguyên logic cũ */ };
    const handleClearData = () => { /* Giữ nguyên logic cũ */ };

    return (
        // TRUYỀN MÀU NỀN MỚI VÀO SCREEN WRAPPER
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.primary }]}>{t('settings_title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* HIỂN THỊ & NGÔN NGỮ */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('display_lang')}</Text>
                <View style={[styles.settingCard, { backgroundColor: theme.white, borderColor: theme.border }]}>
                    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="moon-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('dark_mode')}</Text>
                        </View>
                        <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: theme.gray, true: theme.primary }} thumbColor="#FFFFFF" />
                    </View>
                    <View style={[styles.settingItem, styles.noBorder]}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="language-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('lang_label')}</Text>
                        </View>
                        <TouchableOpacity style={[styles.langBtn, { backgroundColor: theme.card }]} onPress={handleToggleLanguage}>
                            <Text style={[styles.langText, { color: theme.text }]}>{language === 'vi' ? 'Tiếng Việt' : 'English'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* TỦ ĐỒ & BẢO MẬT */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('wardrobe_security')}</Text>
                <View style={[styles.settingCard, { backgroundColor: theme.white, borderColor: theme.border }]}>
                    
                    {/* Nhắc nhở */}
                    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="notifications-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('daily_reminder')}</Text>
                        </View>
                        <Switch value={dailyReminder} onValueChange={setDailyReminder} trackColor={{ false: theme.gray, true: theme.primary }} thumbColor="#FFFFFF" />
                    </View>

                    {/* Khóa ứng dụng (ĐÃ SỬA: Đổi styles.noBorder thành kẻ viền để chèn mục Đổi mật khẩu bên dưới) */}
                    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="finger-print-outline" size={22} color={theme.primary} />
                            <View>
                                <Text style={[styles.settingText, { color: theme.text }]}>{t('app_lock')}</Text>
                                <Text style={[styles.settingDesc, { color: theme.gray }]}>{t('app_lock_desc')}</Text>
                            </View>
                        </View>
                        <Switch value={useBiometrics} onValueChange={handleToggleBiometrics} trackColor={{ false: theme.gray, true: theme.primary }} thumbColor="#FFFFFF" />
                    </View>

                    {/* MỤC MỚI THÊM: Đổi mật khẩu (Nằm cuối nên dùng styles.noBorder) */}
                    <TouchableOpacity 
                        style={[styles.settingItem, styles.noBorder]} 
                        onPress={() => navigation.navigate('ChangePassword')}
                    >
                        <View style={styles.itemLeft}>
                            <Ionicons name="key-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('change_password')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                    </TouchableOpacity>

                </View>

                {/* HỖ TRỢ & THÔNG TIN */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('support_info')}</Text>
                <View style={[styles.settingCard, { backgroundColor: theme.white, borderColor: theme.border }]}>
                    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={() => navigation.navigate('FAQ')}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="help-circle-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('faq')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={handleFeedback}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="chatbubbles-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('feedback')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={handleShareApp}>
                        <View style={styles.itemLeft}>
                            <Ionicons name="share-social-outline" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('share')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingItem, styles.noBorder]} onPress={() => navigation.navigate('Policy')}>
                        <View style={styles.itemLeft}>
                            <MaterialIcons name="policy" size={22} color={theme.primary} />
                            <Text style={[styles.settingText, { color: theme.text }]}>{t('policy')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: '#E43F5A' }]} onPress={handleClearData} disabled={isDeleting}>
                    {isDeleting ? <ActivityIndicator color="#FFF" /> : (
                        <>
                            <Ionicons name="trash-outline" size={22} color="#FFF" />
                            <Text style={styles.dangerText}>{t('delete_data')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
    backBtn: { padding: 5 },
    title: { fontFamily: FONTS.bold, fontSize: 20 },
    sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, marginTop: 15, marginBottom: 10, marginLeft: 5 },
    settingCard: { borderRadius: SIZES.radius, paddingHorizontal: 15, elevation: 2, borderWidth: 1 },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    noBorder: { borderBottomWidth: 0 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    settingText: { fontFamily: FONTS.medium, fontSize: 15, marginLeft: 15 },
    settingDesc: { fontFamily: FONTS.regular, fontSize: 12, marginLeft: 15, marginTop: 2 },
    langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    langText: { fontFamily: FONTS.medium, fontSize: 13 },
    dangerBtn: { flexDirection: 'row', height: 55, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginTop: 35, elevation: 4 },
    dangerText: { fontFamily: FONTS.bold, color: '#FFF', fontSize: 16, marginLeft: 10 }
});

export default SettingsScreen;