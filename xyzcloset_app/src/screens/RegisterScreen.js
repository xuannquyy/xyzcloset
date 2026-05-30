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

const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        // Kiểm tra dữ liệu đầu vào cơ bản
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert("Thông báo", "Bạn vui lòng điền đầy đủ thông tin nhé!");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp, bạn kiểm tra lại nha.");
            return;
        }

        setIsLoading(true);
        try {
            // Gọi trực tiếp API đăng ký (vì AuthContext thường chỉ giữ login/logout)
            await axiosClient.post('/auth/register', {
                fullName,
                email,
                password
            });

            Alert.alert(
                "Thành công", 
                "Tài khoản của bạn đã được tạo. Đăng nhập ngay thôi nào!",
                [{ text: "Đăng nhập", onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi đăng ký, bạn thử lại sau nhé.";
            Alert.alert("Lỗi đăng ký", errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper withPadding={true}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Tạo tài khoản</Text>
                    <Text style={styles.subtitle}>Bắt đầu hành trình định hình phong cách cùng XYZ CLOSET</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Họ và tên của bạn"
                            placeholderTextColor={COLORS.gray}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={COLORS.gray}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu"
                            placeholderTextColor={COLORS.gray}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.accent} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Xác nhận mật khẩu"
                            placeholderTextColor={COLORS.gray}
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>

                    <TouchableOpacity 
                        style={styles.registerButton} 
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 40,
    },
    backButton: {
        marginTop: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        marginTop: 30,
        marginBottom: 40,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 32,
        color: COLORS.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius,
        paddingHorizontal: 15,
        height: 60,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(199, 92, 113, 0.1)',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
    },
    registerButton: {
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    registerButtonText: {
        fontFamily: FONTS.bold,
        color: COLORS.white,
        fontSize: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
    footerText: {
        fontFamily: FONTS.regular,
        color: COLORS.text,
        fontSize: 14,
    },
    loginLink: {
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        fontSize: 14,
    },
});

export default RegisterScreen;