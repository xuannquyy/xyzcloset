import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

const FAQScreen = ({ navigation }) => {
    const { theme, t } = useContext(SettingsContext);
    const faqs = [
        { q: "Làm sao để thêm quần áo vào tủ?", a: "Rất đơn giản! Bạn vào mục 'Tủ đồ', bấm biểu tượng Dấu Cộng (+) ở góc phải, sau đó chụp ảnh hoặc tải ảnh lên từ thư viện, phân loại và bấm Lưu." },
        { q: "XYZ CLOSET có miễn phí không?", a: "Ứng dụng hoàn toàn miễn phí cho các tính năng cơ bản như quản lý tủ đồ, loại bỏ nền ảnh và tính năng thử đồ (Phòng phối đồ)." },
        { q: "Chức năng Tủ đồ mẫu là gì?", a: "Đây là kho đồ có sẵn do hệ thống tự động gieo hạt (Seed Data) giúp bạn trải nghiệm ngay tính năng phối đồ mà không cần mất thời gian chụp ảnh quần áo thực tế của mình." },
        { q: "Tôi có thể đổi ảnh đại diện không?", a: "Hoàn toàn được! Bạn hãy vào tab 'Hồ sơ', chọn 'Cài đặt tài khoản' và chạm vào bức ảnh đại diện để chọn một bức ảnh mới từ điện thoại." },
        { q: "Dữ liệu của tôi có bị rò rỉ không?", a: "Bảo mật là ưu tiên hàng đầu. Hình ảnh của bạn được tải lên các cụm máy chủ đám mây an toàn và hoàn toàn tách biệt. Không ai có thể xem tủ đồ cá nhân của bạn." }
    ];

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.primary }]}>{t('faq')}</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
                {faqs.map((item, index) => (
                    <View key={index} style={[styles.faqCard, { backgroundColor: theme.white, borderColor: theme.card }]}>
                        <View style={styles.questionContainer}>
                            <Ionicons name="help-circle" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                            <Text style={[styles.question, { color: theme.primary }]}>{item.q}</Text>
                        </View>
                        <Text style={[styles.answer, { color: theme.text }]}>{item.a}</Text>
                    </View>
                ))}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
    backBtn: { padding: 5 },
    title: { fontFamily: FONTS.bold, fontSize: 20 },
    faqCard: { padding: 15, borderRadius: SIZES.radius, marginBottom: 15, elevation: 2, borderWidth: 1 },
    questionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    question: { flex: 1, fontFamily: FONTS.bold, fontSize: 16, lineHeight: 24 },
    answer: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, textAlign: 'justify' }
});

export default FAQScreen;