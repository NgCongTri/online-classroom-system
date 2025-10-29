'use client';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to decode JWT and check expiration
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Token expired if exp time is less than current time
    // Add 1 minute buffer to refresh before actual expiration
    return exp < (now + 60000);
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

api.interceptors.request.use(
  (config) => {
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
    
    // If 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Prevent infinite loop - if refresh endpoint also returns 401
      if (originalRequest.url?.includes('/token/refresh/')) {
        // Refresh token also expired → Force logout
        console.log('❌ Refresh token expired, logging out...');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('session_id');
        window.location.href = '/';
        return Promise.reject(error);
      }
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      // Mark as retrying to prevent duplicate refresh calls
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const sessionId = sessionStorage.getItem('session_id');
        
        if (!sessionId) {
          throw new Error('No session ID found');
        }
        
        console.log('🔄 Access token expired, refreshing for session:', sessionId);
        
        // Call refresh endpoint (cookie refresh_token_{session_id} sent automatically)
        const refreshResponse = await axios.post(
          'http://localhost:8000/api/token/refresh/',
          {},  // Empty body - backend reads refresh token from cookie
          { 
            withCredentials: true,
            headers: {
              'X-Session-ID': sessionId
            }
          }
        );
        
        const newAccessToken = refreshResponse.data.access;
        
        // Save new access token to sessionStorage
        sessionStorage.setItem('access_token', newAccessToken);
        
        console.log('✅ Access token refreshed successfully');
        
        // Update the failed request's authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Notify all queued requests with new token
        onRefreshed(newAccessToken);
        isRefreshing = false;
        
        // Retry the original request with new token
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Refresh failed → Force logout
        isRefreshing = false;
        refreshSubscribers = [];
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('session_id');
        
        // Redirect to login page
        window.location.href = '/';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;