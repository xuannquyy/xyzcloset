import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // 1. Hàm Đăng nhập
    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await axiosClient.post('/auth/login', { email, password });
            
            // Lưu thông tin vào State
            setUserInfo(response.data.user);
            setUserToken(response.data.token);

            // Lưu Token vào bộ nhớ máy để dùng cho lần sau
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));

            console.log('Đăng nhập thành công!');
        } catch (e) {
            console.log(`Lỗi đăng nhập: ${e}`);
            throw e; // Đẩy lỗi ra để màn hình Login hiển thị Alert
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Hàm Đăng xuất
    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    // 3. Hàm kiểm tra xem đã đăng nhập chưa (chạy khi vừa mở App)
    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            let info = await AsyncStorage.getItem('userInfo');
            
            if (token) {
                setUserToken(token);
                setUserInfo(JSON.parse(info));
            }
        } catch (e) {
            console.log(`Lỗi kiểm tra đăng nhập: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo, setUserInfo }}>
            {children}
        </AuthContext.Provider>
    );
};