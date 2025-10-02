'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../utils/api';

export const useAuth = (options = {}) => {
  const pathname = usePathname();
  const defaultPublicPaths = ['/', '/register'];
  const { enabled = true, publicPaths = defaultPublicPaths } = options;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : null;
  };

  const removeCookie = (name) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Max-Age=0; path=/;`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip auth check for public paths
        if (publicPaths.includes(pathname)) {
          setLoading(false);
          return;
        }

        if (!enabled) {
          setLoading(false);
          return;
        }

        const res = await api.get('/user/', { withCredentials: true });
        console.log('User data fetched:', res.data);
        
        // **VALIDATION: Check if user data is valid** ✅
        if (res.data && typeof res.data === 'object' && res.data.role) {
          setUser(res.data);
        } else {
          console.error('Invalid user data received:', res.data);
          setUser(null);
        }
        
      } catch (err) {
        console.error('Auth check error:', err);
        if (err?.response?.status === 401) {
          removeCookie('access_token');
          removeCookie('refresh_token');
        }
        setUser(null);
        if (!publicPaths.includes(pathname)) {
          console.log('Not authenticated, redirecting to login');
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await api.post('/logout/', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    removeCookie('access_token');
    removeCookie('refresh_token');
    router.push('/');
  };

  return { user, loading, logout };
};