'use client';
import axios from 'axios';

/**
 * V2: API Client with Cookie Session ID Prefix
 * - Access Token → localStorage
 * - Refresh Token → httpOnly cookie với key: refresh_token_{session_id}
 * - Session ID → localStorage
 * 
 * Advantages:
 * ✅ Mỗi session có cookie riêng (không conflict)
 * ✅ Vẫn dùng httpOnly (bảo mật cao)
 * ✅ Auto refresh token độc lập cho mỗi session
 */

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,  // ✅ Auto send/receive cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ REQUEST INTERCEPTOR: Add access_token and session_id to all requests
api.interceptors.request.use(
  (config) => {
    // ✅ Get from sessionStorage (isolated per tab)
    const accessToken = sessionStorage.getItem('access_token');
    const sessionId = sessionStorage.getItem('session_id');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR: Auto refresh when access_token expires
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Prevent infinite loop
      if (originalRequest.url?.includes('/token/refresh/')) {
        // Refresh token also expired → Logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('session_id');
        window.location.href = '/';
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // Wait for token refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const sessionId = sessionStorage.getItem('session_id');
        
        if (!sessionId) {
          throw new Error('No session ID');
        }
        
        console.log('🔄 Refreshing access token for session:', sessionId);
        
        // ✅ V2: Call refresh endpoint
        // Cookie refresh_token_{session_id} is sent automatically by browser
        const refreshResponse = await axios.post(
          'http://localhost:8000/api/token/refresh/',
          { session_id: sessionId },  // Only send session_id
          { withCredentials: true }   // ✅ Browser auto sends cookie
        );
        
        const newAccessToken = refreshResponse.data.access;
        
        // ✅ Save new access_token to sessionStorage
        sessionStorage.setItem('access_token', newAccessToken);
        
        console.log('✅ Token refreshed successfully for session:', sessionId);
        
        // ✅ Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Notify waiting requests
        onRefreshed(newAccessToken);
        isRefreshing = false;
        
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Refresh failed → Logout
        isRefreshing = false;
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('session_id');
        window.location.href = '/';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;