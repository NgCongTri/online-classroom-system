'use client';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useClassManagement(userId, userRole) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let endpoint = '/classes/';
            if (userRole === 'student') {
                endpoint = '/classes/my-classes/';
            }
            
            const res = await api.get(endpoint);
            setClasses(res.data || []);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError(err.message);
            setClasses([]);
        } finally {
            setLoading(false);
        }
    };

    const createClass = async (formData) => {
        try {
            const res = await api.post('/classes/', formData);
            await fetchClasses(); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            console.error('Error creating class:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    };

    const deleteClass = async (classId) => {
        try {
            await api.delete(`/classes/${classId}/`);
            await fetchClasses(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error('Error deleting class:', err);
            return { success: false, error: err.response?.data || err.message };
        }
    };

    useEffect(() => {
        if (userId) {
            fetchClasses();
        }
    }, [userId]);

    return {
        classes,
        loading,
        error,
        fetchClasses,
        createClass,
        deleteClass,
        setClasses
    };
}
