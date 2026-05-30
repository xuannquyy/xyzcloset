import React, { useState, useContext } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator,
    Alert 
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Gọi hàm login và trạng thái loading từ AuthContext
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Thông báo", "Bạn vui lòng nhập đầy đủ email và mật khẩu nhé!");
            return;
        }
        try {
            await login(email, password);
            // Sau khi login thành công, AuthNavigator sẽ tự động chuyển trang nhờ userToken
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Thông tin đăng nhập không chính xác, bạn kiểm tra lại nhé!";
            Alert.alert("Lỗi đăng nhập", errorMsg);
        }
    };

    return (
        <ScreenWrapper withPadding={true} style={styles.container}>
            {/* Phần Header & Logo */}
            <View style={styles.headerContainer}>
                <View style={styles.logoCircle}>
                    <Image 
                        source={require('../../assets/logo.png')} 
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.welcomeText}>Chào mừng bạn trở lại!</Text>
                <Text style={styles.brandName}>XYZ CLOSET</Text>
            </View>

            {/* Phần Form nhập liệu */}
            <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email của bạn"
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
                        <Ionicons 
                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={COLORS.accent} 
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                {/* Nút Đăng nhập */}
                <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Phần Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerText}>Đăng ký ngay</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        paddingVertical: SIZES.padding * 2,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        marginBottom: 20,
    },
    logo: {
        width: 70,
        height: 70,
    },
    welcomeText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.accent,
    },
    brandName: {
        fontFamily: FONTS.bold,
        fontSize: SIZES.largeTitle,
        color: COLORS.primary,
        letterSpacing: 2,
    },
    formContainer: {
        marginTop: 40,
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
        borderColor: 'rgba(199, 92, 113, 0.2)',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: SIZES.body,
        color: COLORS.text,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        fontFamily: FONTS.medium,
        color: COLORS.accent,
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    loginButtonText: {
        fontFamily: FONTS.bold,
        color: COLORS.white,
        fontSize: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontFamily: FONTS.regular,
        color: COLORS.text,
        fontSize: 14,
    },
    registerText: {
        fontFamily: FONTS.bold,
        color: COLORS.primary,
        fontSize: 14,
    },
});

export default LoginScreen;