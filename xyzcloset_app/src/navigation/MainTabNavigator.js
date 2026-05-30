import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import { SettingsContext } from '../context/SettingsContext'; // Import Context
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import OutfitScreen from '../screens/OutfitScreen'; 
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    // Lấy theme và hàm dịch t() từ Context
    const { theme, t } = useContext(SettingsContext); 
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false, 
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.gray,
                tabBarLabelStyle: { fontSize: 12, marginBottom: 5 },
                tabBarStyle: {
                    backgroundColor: theme.white,
                    borderTopWidth: 0,
                    elevation: 10,
                    height: 65 + insets.bottom, 
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 10,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Wardrobe') iconName = focused ? 'shirt' : 'shirt-outline';
                    else if (route.name === 'Outfit') iconName = focused ? 'color-palette' : 'color-palette-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size + 2} color={color} />;
                },
            })}
        >
            {/* GẮN DỊCH VÀO ĐÂY */}
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tab_home') }} />
            <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ tabBarLabel: t('tab_wardrobe') }} />
            <Tab.Screen name="Outfit" component={OutfitScreen} options={{ tabBarLabel: t('tab_outfit') }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;