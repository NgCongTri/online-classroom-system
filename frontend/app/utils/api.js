'use client';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
  withCredentials: true, // Đảm bảo gửi cookie
});

export default api;