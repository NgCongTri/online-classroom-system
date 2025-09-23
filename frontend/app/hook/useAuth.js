'use client';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
        try {
            const response = await api.get('/user/', { withCredentials: true }); // Xác nhận
            console.log('User fetched:', response.data);
            setUser(response.data);
        } catch (error) {
            console.error('Auth error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            config: error.config, // Xem header gửi đi
            });
            router.push('/');
        } finally {
            setLoading(false);
        }
        };
        checkAuth();
    }, [router]);

    const logout = async () => {
        try {
        await api.post('/logout/');
        setUser(null);
        router.push('/');
        } catch (error) {
        console.error('Logout failed:', error);
        }
    };

    return { user, loading, logout };
};