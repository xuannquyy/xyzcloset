import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Modal, Share, Linking, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import axiosClient from '../api/axiosClient';

const SettingsScreen = ({ navigation }) => {
    const { isDarkMode, toggleTheme, language, toggleLanguage, theme, t } = useContext(SettingsContext);
    
    const [dailyReminder, setDailyReminder] = useState(true);
    const [useBiometrics, setUseBiometrics] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // 🟢 HỆ THỐNG CUSTOM ALERT SANG TRỌNG
    const [customAlert, setCustomAlert] = useState({ 
        visible: false, 
        title: '', 
        message: '', 
        type: 'error', 
        onConfirm: null, 
        showCancel: false 
    });

    const showAlert = (title, message, type = 'error', onConfirm = null, showCancel = false) => {
        setCustomAlert({ visible: true, title, message, type, onConfirm, showCancel });
    };

    const handleToggleLanguage = () => {
        toggleLanguage(language === 'vi' ? 'en' : 'vi');
    };

    const handleShareApp = async () => { 
        try {
            const result = await Share.share({
                message: 'Khám phá ngay ứng dụng thời trang AI - XYZCloset! Giúp bạn quản lý tủ đồ và phối đồ cực chuẩn. Tải ngay tại: https://xyzcloset.com',
            });
            if (result.action === Share.sharedAction) {
                console.log("Đã chia sẻ thành công!");
            }
        } catch (error) {
            showAlert('Lỗi', 'Không thể chia sẻ ứng dụng lúc này.', 'error');
        }
    };

    const handleFeedback = () => { 
        const email = 'support@xyzcloset.com'; 
        const subject = 'Góp ý ứng dụng XYZCloset';
        const body = 'Chào đội ngũ phát triển,\n\nTôi muốn góp ý về vấn đề:\n';
        
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                showAlert('Không tìm thấy ứng dụng', 'Điện thoại của bạn chưa cài đặt ứng dụng Email nào để gửi hỗ trợ.', 'error');
            }
        });
    };

    const handleToggleBiometrics = async (newValue) => { 
        if (newValue) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                return showAlert('Lỗi thiết bị', 'Điện thoại của bạn không hỗ trợ cảm biến vân tay hoặc Face ID.', 'error');
            }

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                return showAlert('Chưa cài đặt', 'Bạn cần cài đặt vân tay/khuôn mặt trong phần Cài đặt của điện thoại trước.', 'warning');
            }

            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Xác thực để bật khóa ứng dụng',
                cancelLabel: 'Hủy bỏ',
                fallbackLabel: 'Dùng mật khẩu'
            });

            if (auth.success) {
                setUseBiometrics(true);
            } else {
                showAlert('Thất bại', 'Xác thực không thành công, vui lòng thử lại.', 'error');
            }
        } else {
            setUseBiometrics(false);
        }
    };

    const handleClearData = () => { 
        showAlert(
            'Xóa dữ liệu',
            'Bạn có chắc chắn muốn xóa toàn bộ tủ đồ và outfit? Hành động này không thể hoàn tác!',
            'warning',
            async () => {
                setIsDeleting(true);
                try {
                    await axiosClient.delete('/users/clear-data'); 
                    showAlert('Thành công', 'Dữ liệu của bạn đã được dọn sạch.', 'success');
                } catch (error) {
                    showAlert('Lỗi', 'Không thể xóa dữ liệu lúc này, vui lòng thử lại sau.', 'error');
                } finally {
                    setIsDeleting(false);
                }
            },
            true // Hiển thị nút Hủy
        );
    };

    return (
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

                    {/* Khóa ứng dụng sinh trắc học */}
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

                    {/* Đổi mật khẩu */}
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

            {/* 🟢 CUSTOM ALERT LUXURY */}
            <Modal visible={customAlert.visible} transparent={true} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.card }]}>
                        <View style={[styles.alertIconWrapper, { backgroundColor: customAlert.type === 'success' ? '#27AE60' : customAlert.type === 'warning' ? '#E5B05C' : '#E43F5A', borderColor: theme.card }]}>
                            <Ionicons name={customAlert.type === 'success' ? "checkmark-circle" : customAlert.type === 'warning' ? "warning" : "close-circle"} size={40} color="#FFF" />
                        </View>
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{customAlert.title}</Text>
                        <Text style={[styles.alertMessage, { color: theme.gray }]}>{customAlert.message}</Text>
                        
                        {customAlert.showCancel ? (
                            <View style={styles.alertBtnRow}>
                                <TouchableOpacity 
                                    style={[styles.alertBtnHalf, { backgroundColor: 'rgba(150,150,150,0.15)' }]} 
                                    onPress={() => setCustomAlert({ ...customAlert, visible: false })}
                                >
                                    <Text style={[styles.alertBtnText, { color: theme.text }]}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.alertBtnHalf, { backgroundColor: '#E43F5A' }]} 
                                    onPress={() => {
                                        setCustomAlert({ ...customAlert, visible: false });
                                        if (customAlert.onConfirm) customAlert.onConfirm();
                                    }}
                                >
                                    <Text style={[styles.alertBtnText, { color: '#FFF' }]}>Xóa ngay</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.alertBtn, { backgroundColor: theme.primary }]} 
                                onPress={() => {
                                    setCustomAlert({ ...customAlert, visible: false });
                                    if (customAlert.onConfirm) customAlert.onConfirm();
                                }}
                            >
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
    dangerText: { fontFamily: FONTS.bold, color: '#FFF', fontSize: 16, marginLeft: 10 },

    // STYLE CUSTOM ALERT
    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '82%', borderRadius: 30, paddingHorizontal: 30, paddingBottom: 30, paddingTop: 40, alignItems: 'center', elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
    alertIconWrapper: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -35, borderWidth: 4, elevation: 15 },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 20, marginTop: 10, marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25, opacity: 0.8 },
    alertBtn: { width: '100%', paddingVertical: 14, borderRadius: 20, alignItems: 'center', elevation: 4 },
    alertBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    alertBtnHalf: { width: '47%', paddingVertical: 14, borderRadius: 20, alignItems: 'center', elevation: 2 },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 0.5 },
});

export default SettingsScreen;