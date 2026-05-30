import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

const PolicyScreen = ({ navigation }) => {
    const { theme, t } = useContext(SettingsContext);

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.primary }]}>{t('policy')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.content}>
                <Text style={[styles.lastUpdate, { color: theme.gray }]}>Cập nhật lần cuối: Tháng 5/2026</Text>

                <Text style={[styles.heading, { color: theme.primary }]}>1. Thu thập dữ liệu</Text>
                <Text style={[styles.paragraph, { color: theme.text }]}>XYZ CLOSET cam kết bảo vệ quyền riêng tư của bạn. Chúng tôi chỉ thu thập các dữ liệu cần thiết như email, tên hiển thị và hình ảnh trang phục do bạn chủ động tải lên để phục vụ cho tính năng cốt lõi của ứng dụng.</Text>

                <Text style={[styles.heading, { color: theme.primary }]}>2. Sử dụng thông tin</Text>
                <Text style={[styles.paragraph, { color: theme.text }]}>Hình ảnh quần áo và set đồ của bạn được mã hóa và lưu trữ an toàn. Chúng tôi không sử dụng dữ liệu cá nhân của bạn cho mục đích quảng cáo hoặc chia sẻ cho bất kỳ bên thứ ba nào mà không có sự đồng ý rõ ràng từ bạn.</Text>

                <Text style={[styles.heading, { color: theme.primary }]}>3. Tính năng Sinh trắc học (FaceID/TouchID)</Text>
                <Text style={[styles.paragraph, { color: theme.text }]}>Khi bạn bật tính năng Khóa ứng dụng, dữ liệu khuôn mặt và vân tay của bạn chỉ được xử lý cục bộ trên thiết bị thông qua các API bảo mật của hệ điều hành. XYZ CLOSET tuyệt đối không lưu trữ dữ liệu này lên máy chủ.</Text>

                <Text style={[styles.heading, { color: theme.primary }]}>4. Quyền của người dùng</Text>
                <Text style={[styles.paragraph, { color: theme.text }]}>Bạn có toàn quyền truy cập, chỉnh sửa hoặc xóa vĩnh viễn toàn bộ dữ liệu của mình (bao gồm tài khoản và hình ảnh) bất cứ lúc nào thông qua chức năng "Xóa toàn bộ dữ liệu tủ đồ" trong phần Cài đặt.</Text>

                <View style={[styles.footer, { backgroundColor: theme.card, borderColor: theme.card }]}>
                    <Text style={[styles.footerText, { color: theme.primary }]}>Bằng việc sử dụng XYZ CLOSET, bạn đồng ý với các điều khoản nêu trên.</Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
    backBtn: { padding: 5 },
    title: { fontFamily: FONTS.bold, fontSize: 18 },
    content: { paddingBottom: 40 },
    lastUpdate: { fontFamily: FONTS.medium, fontSize: 13, marginBottom: 20, fontStyle: 'italic' },
    heading: { fontFamily: FONTS.bold, fontSize: 16, marginTop: 15, marginBottom: 8 },
    paragraph: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, textAlign: 'justify' },
    footer: { marginTop: 40, padding: 15, borderRadius: SIZES.radius, borderWidth: 1 },
    footerText: { fontFamily: FONTS.medium, fontSize: 13, textAlign: 'center', lineHeight: 20 }
});

export default PolicyScreen;