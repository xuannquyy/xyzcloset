import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../theme/theme';

const { width } = Dimensions.get('window');

const NotificationBanner = ({ visible, data, onClose, theme }) => {
    const slideAnim = useRef(new Animated.Value(-150)).current; // Khởi tạo vị trí ẩn phía trên màn hình

    useEffect(() => {
        if (visible && data) {
            // 1. Trượt xuống hiển thị banner
            Animated.timing(slideAnim, {
                toValue: 20, // Khoảng cách cách đỉnh màn hình (Safe Area)
                duration: 400,
                useNativeDriver: true,
            }).start();

            // 2. Tự động ẩn sau 5 giây (5000ms)
            const timer = setTimeout(() => {
                hideBanner();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [visible, data]);

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: -150, // Trượt ngược lên trên để ẩn
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (onClose) onClose();
        });
    };

    if (!visible || !data) return null;

    // Phân loại màu sắc/icon theo type tương tự màn hình trước của bạn
    const isOutfit = data.type === 'OUTFIT';
    const accentColor = isOutfit ? "#10AC84" : "#FF9F43";
    const iconName = isOutfit ? "shirt" : "partly-sunny";

    return (
        <Animated.View style={[
            styles.bannerContainer, 
            { 
                transform: [{ translateY: slideAnim }],
                backgroundColor: theme.background === '#121212' ? '#1E1E1E' : '#FFFFFF',
                shadowColor: "#000",
            }
        ]}>
            <View style={styles.headerRow}>
                <View style={[styles.iconBadge, { backgroundColor: accentColor + '20' }]}>
                    <Ionicons name={iconName} size={18} color={accentColor} />
                </View>
                <Text style={[styles.appTitle, { color: theme.gray }]}>GỢI Ý HÔM NAY</Text>
                <TouchableOpacity onPress={hideBanner}>
                    <Ionicons name="close" size={18} color={theme.gray} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: theme.text }]}>{data.title}</Text>
            <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
                {data.message}
            </Text>

            {/* Hiển thị hình ảnh trang phục được bốc ngẫu nhiên từ seed.js */}
            {data.suggestion && (
                <View style={styles.outfitPreview}>
                    {data.suggestion.top && (
                        <Image source={{ uri: data.suggestion.top.imageUrl }} style={styles.clothThumb} />
                    )}
                    {data.suggestion.bottom && (
                        <Image source={{ uri: data.suggestion.bottom.imageUrl }} style={styles.clothThumb} />
                    )}
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        position: 'absolute',
        top: 30, // Điều chỉnh lại cho khớp Safe Area tùy máy
        left: 15,
        right: 15,
        borderRadius: 16,
        padding: 15,
        zIndex: 9999, // Luôn luôn nằm trên cùng tất cả các tầng giao diện
        elevation: 10,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5.65,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    iconBadge: { padding: 4, borderRadius: 6, marginRight: 8 },
    appTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1 },
    title: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 3 },
    message: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 18, marginBottom: 5 },
    outfitPreview: { flexDirection: 'row', marginTop: 5, gap: 10 },
    clothThumb: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#f5f5f5', resizeMode: 'contain' }
});

export default NotificationBanner;