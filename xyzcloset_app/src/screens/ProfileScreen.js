import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext'; // KÉO CONTEXT
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
    const { logout, userInfo } = useContext(AuthContext);
    const { theme, t } = useContext(SettingsContext); // LẤY MÀU VÀ TỪ ĐIỂN

    const handleLogout = () => {
        Alert.alert(
            t('confirm'),
            t('confirm_logout'),
            [
                { text: t('cancel'), style: "cancel" },
                { text: t('logout'), onPress: () => logout(), style: "destructive" }
            ]
        );
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
                    style={[styles.menuItem, { borderBottomColor: theme.border }]} 
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Ionicons name="settings-outline" size={22} color={theme.primary} />
                    <Text style={[styles.menuText, { color: theme.text }]}>{t('account_settings')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuItem, { borderBottomWidth: 0 }]} 
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
                    <Text style={[styles.menuText, { color: theme.text }]}>{t('privacy_settings')}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.gray} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={theme.background} />
                <Text style={[styles.logoutText, { color: theme.background }]}>{t('logout')}</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: theme.gray }]}>{t('version')}</Text>
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
    version: { textAlign: 'center', marginTop: 20, fontFamily: FONTS.regular, fontSize: 12 }
});

export default ProfileScreen;