import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../context/AuthContext';
import { SettingsContext, SettingsProvider } from '../context/SettingsContext';
import { COLORS } from '../theme/theme';

// Import các màn hình...
import MainTabNavigator from './MainTabNavigator'; 
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import AddItemScreen from '../screens/AddItemScreen';
import SavedOutfitsScreen from '../screens/SavedOutfitsScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PolicyScreen from '../screens/PolicyScreen';
import FAQScreen from '../screens/FAQScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import BodyShapeScreen from '../screens/BodyShapeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import InsightsScreen from '../screens/InsightsScreen';
import OutfitScreen from '../screens/OutfitScreen';

const Stack = createNativeStackNavigator();

// Component chính xử lý logic điều hướng
const AppContent = () => {
    const { isLoading, userToken } = useContext(AuthContext);
    
    // ĐẢM BẢO KHÔNG DÙNG THEME Ở ĐÂY NẾU KHÔNG CẦN THIẾT, 
    // TRÁNH LỖI UNDEFINED KHI CONTEXT CHƯA LOAD XONG
    
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken !== null ? (
                    <>
                        <Stack.Screen name="MainApp" component={MainTabNavigator} />
                        <Stack.Screen name="AddItem" component={AddItemScreen} />
                        <Stack.Screen name="SavedOutfits" component={SavedOutfitsScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Policy" component={PolicyScreen} />
                        <Stack.Screen name="FAQ" component={FAQScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                        <Stack.Screen name="BodyShape" component={BodyShapeScreen} />
                        <Stack.Screen name="Notification" component={NotificationScreen} />
                        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
                        <Stack.Screen name="Insights" component={InsightsScreen} />
                        <Stack.Screen name="Outfit" component={OutfitScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

// EXPORT ĐÚNG CẤU TRÚC ĐỂ PROVIDER BỌC LẤY CONTENT
export default function AppNavigator() {
    return (
        <SettingsProvider>
            <AppContent />
        </SettingsProvider>
    );
}