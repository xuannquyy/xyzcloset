import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Cần cài thêm thư viện này

const IP_ADDRESS = '192.168.1.7'; 

const axiosClient = axios.create({
    baseURL: `http://${IP_ADDRESS}:5000/api`,
    headers: { 'Content-Type': 'application/json' },
});

// Tự động đính kèm Token vào mọi yêu cầu gửi lên Backend
axiosClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;