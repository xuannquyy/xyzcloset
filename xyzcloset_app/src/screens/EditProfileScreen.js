import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenWrapper from '../components/ScreenWrapper';
import { FONTS, SIZES } from '../theme/theme';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axiosClient';

const EditProfileScreen = ({ navigation }) => {
    const { userInfo, setUserInfo } = useContext(AuthContext); 
    const { theme, t } = useContext(SettingsContext);
    
    const [name, setName] = useState(userInfo?.fullName || '');
    const [avatar, setAvatar] = useState(userInfo?.avatarUrl || null);
    const [isUpdating, setIsUpdating] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
        });
        if (!result.canceled) setAvatar(result.assets[0].uri);
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('fullName', name);
            if (avatar && avatar !== userInfo.avatarUrl) {
                const uriParts = avatar.split('.');
                formData.append('avatar', { uri: avatar, name: `avatar.${uriParts[uriParts.length - 1]}`, type: `image/${uriParts[uriParts.length - 1]}` });
            }
            const response = await axiosClient.put('/user/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUserInfo({ ...userInfo, fullName: response.data.user.fullName, avatarUrl: response.data.user.avatarUrl }); 
            Alert.alert("Thành công", "Thông tin của bạn đã được cập nhật!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Lỗi", "Không thể cập nhật: " + (error.response?.data?.message || error.message));
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <ScreenWrapper withPadding={true} style={{ backgroundColor: theme.background }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.primary }]}>{t('account_settings')}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                    <Image source={{ uri: avatar || 'https://ui-avatars.com/api/?name=User' }} style={[styles.avatar, { borderColor: theme.primary }]} />
                    <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
                        <Ionicons name="camera" size={20} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.hintText, { color: theme.gray }]}>{t('tap_to_change_avatar')}</Text>

                <Text style={[styles.label, { color: theme.primary }]}>{t('full_name')}</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.white, color: theme.text, borderColor: theme.card }]} value={name} onChangeText={setName} placeholder={t('enter_name')} placeholderTextColor={theme.gray} />

                <Text style={[styles.label, { color: theme.primary }]}>{t('email_readonly')}</Text>
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.gray, borderColor: theme.card }]} value={userInfo?.email} editable={false} />

                <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{t('save_changes')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
    title: { fontFamily: FONTS.bold, fontSize: 20 },
    avatarContainer: { alignSelf: 'center', marginTop: 30, marginBottom: 10 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
    cameraIcon: { position: 'absolute', bottom: 5, right: 5, padding: 8, borderRadius: 20, elevation: 3 },
    hintText: { fontFamily: FONTS.regular, fontSize: 12, textAlign: 'center', marginBottom: 30 },
    label: { fontFamily: FONTS.medium, marginBottom: 8 },
    input: { borderRadius: SIZES.radius, padding: 15, marginBottom: 20, borderWidth: 1 },
    saveButton: { height: 55, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', elevation: 4, marginTop: 20 },
    saveText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 }
});

export default EditProfileScreen;