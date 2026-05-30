import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert 
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) {
            Alert.alert("Thông báo", "Bạn vui lòng nhập email đã đăng ký nhé!");
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.post('/auth/forgot-password', { email });
            Alert.alert(
                "Thành công", 
                "Mã xác nhận (OTP) đã được gửi đến email của bạn.",
                [
                    { 
                        text: "Tiếp tục", 
                        // Chuyển trang và truyền luôn email sang trang sau để khỏi nhập lại
                        onPress: () => navigation.navigate('ResetPassword', { email: email }) 
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
            {/* Nút quay lại */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.header}>
                <Ionicons name="lock-closed-outline" size={60} color={COLORS.primary} style={styles.icon} />
                <Text style={styles.title}>Quên mật khẩu?</Text>
                <Text style={styles.subtitle}>
                    Đừng lo lắng! Hãy nhập email bạn đã đăng ký, chúng tôi sẽ gửi mã xác nhận 6 số để giúp bạn khôi phục tài khoản.
                </Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập email của bạn"
                        placeholderTextColor={COLORS.gray}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <TouchableOpacity 
                    style={styles.sendButton} 
                    onPress={handleSendOTP}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.sendButtonText}>Gửi mã xác nhận</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    backButton: { marginTop: 20, width: 40, height: 40, justifyContent: 'center' },
    header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
    icon: { marginBottom: 20 },
    title: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.primary, marginBottom: 15 },
    subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
    form: { flex: 1 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: SIZES.radius, paddingHorizontal: 15, height: 60, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(199, 92, 113, 0.1)' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text },
    sendButton: { backgroundColor: COLORS.primary, height: 60, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
    sendButtonText: { fontFamily: FONTS.bold, color: COLORS.white, fontSize: 16 }
});

export default ForgotPasswordScreen;