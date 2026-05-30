import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const ResetPasswordScreen = ({ route, navigation }) => {
    // Nhận email từ trang trước truyền sang
    const { email } = route.params || {}; 
    
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            Alert.alert("Thông báo", "Bạn vui lòng điền đầy đủ thông tin nhé!");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.post('/auth/reset-password', { 
                email, 
                otp, 
                newPassword 
            });
            
            Alert.alert(
                "Tuyệt vời!", 
                "Mật khẩu của bạn đã được thay đổi thành công.",
                [
                    { 
                        text: "Đăng nhập ngay", 
                        // Đổi mật khẩu xong thì quay về đúng trang Login
                        onPress: () => navigation.navigate('Login') 
                    }
                ]
            );
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi kết nối, vui lòng thử lại.";
            Alert.alert("Lỗi", errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper withPadding={true}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Tạo mật khẩu mới</Text>
                    <Text style={styles.subtitle}>
                        Mã xác nhận 6 số đã được gửi đến email <Text style={{fontFamily: FONTS.bold, color: COLORS.primary}}>{email}</Text>. Vui lòng kiểm tra hộp thư của bạn.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="keypad-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mã OTP (6 số)"
                            placeholderTextColor={COLORS.gray}
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu mới"
                            placeholderTextColor={COLORS.gray}
                            secureTextEntry={!showPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.accent} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Xác nhận mật khẩu mới"
                            placeholderTextColor={COLORS.gray}
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.resetButton} 
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.resetButtonText}>Xác nhận & Đổi mật khẩu</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    backButton: { marginTop: 20, width: 40, height: 40, justifyContent: 'center' },
    header: { marginTop: 20, marginBottom: 30 },
    title: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.primary, marginBottom: 15 },
    subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, lineHeight: 22 },
    form: { flex: 1 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 15, height: 60, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(199, 92, 113, 0.1)' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text },
    resetButton: { backgroundColor: COLORS.primary, height: 60, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 4 },
    resetButtonText: { fontFamily: FONTS.bold, color: COLORS.white, fontSize: 16 }
});

export default ResetPasswordScreen;