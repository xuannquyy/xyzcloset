import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext'; // KÉO CONTEXT
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
    const { logout, userInfo } = useContext(AuthContext);
    const { theme, t, language } = useContext(SettingsContext);

    // 🟢 STATE CHO CUSTOM LOGOUT ALERT
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

    const handleLogoutClick = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = () => {
        setLogoutModalVisible(false);
        setTimeout(() => {
            logout();
        }, 300); // Đợi hiệu ứng đóng modal mượt mà rồi mới đăng xuất
    };

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.primary }]}>{t('profile_title')}</Text>
            </View>

            <View style={[styles.profileCard, { backgroundColor: theme.white, shadowColor: theme.primary }]}>
                <Image source={{ uri: userInfo?.avatarUrl || 'https://ui-avatars.com/api/?name=User' }} style={[styles.avatar, { borderColor: theme.card }]} />
                <Text style={[styles.name, { color: theme.primary }]}>{userInfo?.fullName || 'Bạn'}</Text>
                <Text style={[styles.email, { color: theme.gray }]}>{userInfo?.email || t('email_empty')}</Text>
            </View>

            <View style={[styles.menuContainer, { backgroundColor: theme.white }]}>
            <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: theme.background }]} 
                    onPress={() => navigation.navigate('SavedOutfits')}
                >
                    <Ionicons name="albums-outline" size={22} color={theme.primary} />
                    <Text style={[styles.menuText, { color: theme.text }]}>
                        {language === 'vi' ? 'Bộ sưu tập Outfit' : 'Saved Outfits'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: theme.background }]} 
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Ionicons name="settings-outline" size={22} color={theme.primary} />
                    <Text style={[styles.menuText, { color: theme.text }]}>{t('account_settings')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomColor: theme.background }]} 
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
                    <Text style={[styles.menuText, { color: theme.text }]}>{t('privacy_settings')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomWidth: 0 }]} 
                    onPress={() => navigation.navigate('Insights')}
                >
                    <Ionicons name="bar-chart-outline" size={22} color={theme.primary} />
                     <Text style={[styles.menuText, { color: theme.text }]}>{t('tab_insights')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                </TouchableOpacity>
            </View>

            {/* Đã sửa hàm gọi onPress ở nút Đăng xuất */}
            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={handleLogoutClick}>
                <Ionicons name="log-out-outline" size={22} color={theme.background} />
                <Text style={[styles.logoutText, { color: theme.background }]}>{t('logout')}</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: theme.gray }]}>{t('version')}</Text>

            {/* 🟢 CUSTOM LUXURY ALERT MODAL CHO ĐĂNG XUẤT */}
            <Modal visible={isLogoutModalVisible} transparent={true} animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={[styles.alertBox, { backgroundColor: theme.background }]}>
                        
                        <View style={[styles.alertIconWrapper, { backgroundColor: '#E43F5A', borderColor: theme.background }]}>
                            <Ionicons name="log-out" size={36} color="#FFF" style={{ marginLeft: 4 }} />
                        </View>
                        
                        <Text style={[styles.alertTitle, { color: theme.text }]}>{t('confirm')}</Text>
                        <Text style={[styles.alertMessage, { color: theme.text }]}>{t('confirm_logout')}</Text>
                        
                        <View style={styles.alertBtnRow}>
                            <TouchableOpacity 
                                style={[styles.alertBtnHalf, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.gray }]} 
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={[styles.alertBtnText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.alertBtnHalf, { backgroundColor: '#E43F5A' }]} 
                                onPress={confirmLogout}
                            >
                                <Text style={[styles.alertBtnText, { color: '#FFF' }]}>{t('logout')}</Text>
                            </TouchableOpacity>
                        </View>
                        
                    </View>
                </View>
            </Modal>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { marginTop: 20, marginBottom: 30, alignItems: 'center' },
    title: { fontFamily: FONTS.bold, fontSize: 24 },
    profileCard: { borderRadius: SIZES.radius * 2, padding: 30, alignItems: 'center', elevation: 10, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, marginBottom: 30 },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, borderWidth: 3 },
    name: { fontFamily: FONTS.bold, fontSize: 20 },
    email: { fontFamily: FONTS.regular, fontSize: 14 },
    menuContainer: { borderRadius: SIZES.radius, paddingVertical: 10, marginBottom: 30 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1 },
    menuText: { flex: 1, marginLeft: 15, fontFamily: FONTS.medium, fontSize: 16 },
    logoutButton: { flexDirection: 'row', height: 55, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    logoutText: { fontFamily: FONTS.bold, fontSize: 16, marginLeft: 10 },
    version: { textAlign: 'center', marginTop: 20, fontFamily: FONTS.regular, fontSize: 12 },

    // 🟢 STYLE CHO CUSTOM LUXURY ALERT
    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    alertBox: { width: '82%', borderRadius: 30, paddingHorizontal: 30, paddingBottom: 30, paddingTop: 40, alignItems: 'center', elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20 },
    alertIconWrapper: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: -35, borderWidth: 4, elevation: 15 },
    alertTitle: { fontFamily: FONTS.bold, fontSize: 20, marginTop: 10, marginBottom: 10, textAlign: 'center' },
    alertMessage: { fontFamily: FONTS.regular, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25, opacity: 0.8 },
    alertBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
    alertBtnHalf: { flex: 1, paddingVertical: 14, borderRadius: 20, alignItems: 'center', elevation: 2 },
    alertBtnText: { fontFamily: FONTS.bold, fontSize: 16, letterSpacing: 0.5 },
});

export default ProfileScreen;