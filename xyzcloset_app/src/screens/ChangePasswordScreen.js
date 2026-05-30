import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const ChangePasswordScreen = ({ navigation }) => {
    const { theme, t } = useContext(SettingsContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu mới không khớp!");
            return;
        }
        setIsLoading(true);
        try {
            await axiosClient.put('/user/change-password', { currentPassword, newPassword });
            Alert.alert("Thành công", "Đổi mật khẩu thành công!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Lỗi", error.response?.data?.message || "Có lỗi xảy ra.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={theme.primary} /></TouchableOpacity>
                <Text style={[styles.title, { color: theme.primary }]}>Đổi mật khẩu</Text>
                <View style={{ width: 24 }} />
            </View>

            <TextInput style={[styles.input, { backgroundColor: theme.white, color: theme.text, borderColor: theme.card }]} placeholder="Mật khẩu hiện tại" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholderTextColor={theme.gray} />
            <TextInput style={[styles.input, { backgroundColor: theme.white, color: theme.text, borderColor: theme.card }]} placeholder="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor={theme.gray} />
            <TextInput style={[styles.input, { backgroundColor: theme.white, color: theme.text, borderColor: theme.card }]} placeholder="Xác nhận mật khẩu mới" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholderTextColor={theme.gray} />

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleUpdate} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
            </TouchableOpacity>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
    title: { fontFamily: FONTS.bold, fontSize: 20 },
    input: { borderRadius: SIZES.radius, padding: 15, marginBottom: 20, borderWidth: 1, fontFamily: FONTS.regular },
    button: { height: 55, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { fontFamily: FONTS.bold, color: '#FFF', fontSize: 16 }
});

export default ChangePasswordScreen;