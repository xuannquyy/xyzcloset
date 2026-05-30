import React, { useContext } from 'react';
import { 
    StyleSheet, 
    StatusBar, 
    Platform, 
    KeyboardAvoidingView, 
    TouchableWithoutFeedback, 
    Keyboard,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SIZES } from '../theme/theme'; 
import { SettingsContext } from '../context/SettingsContext'; // Import Context
import { lightColors } from '../theme/theme';

const ScreenWrapper = ({ children, style, withPadding = false }) => {
    const insets = useSafeAreaInsets();
    
    // Lấy theme từ Context, nếu lỗi thì lấy lightColors làm mặc định (Fallback)
    const context = useContext(SettingsContext);
    const theme = context?.theme || lightColors;
    
    return (
        <View style={[
            styles.container, 
            { paddingTop: insets.top, backgroundColor: theme.background }, // Dùng theme.background
            withPadding && { paddingHorizontal: SIZES.padding }, 
            style
        ]}>
            <StatusBar barStyle={context?.isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} translucent={false} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 0} 
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>{children}</View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ScreenWrapper;