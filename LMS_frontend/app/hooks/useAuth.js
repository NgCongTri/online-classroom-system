'use client';
import { useState, useEffect, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../utils/api';

export const useAuth = (options = {}) => {
  const pathname = usePathname();
  const defaultPublicPaths = ['/', '/register'];
  const { enabled = true, publicPaths = defaultPublicPaths } = options;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (publicPaths.includes(pathname)) {
          setLoading(false);
          return;
        }

        if (!enabled) {
          setLoading(false);
          return;
        }

        // sessionStorage is ISOLATED per tab → No conflict!
        // access_token và session_id in sessionStorage
        const accessToken = sessionStorage.getItem('access_token');
        const sessionId = sessionStorage.getItem('session_id');

        if (!accessToken || !sessionId) {
          console.log('No tokens found in sessionStorage, redirecting to login');
          setUser(null);
          setLoading(false);
          router.push('/');
          return;
        }

        // ✅ Fetch user data (API auto sends access_token and session_id via interceptor)
        const res = await api.get('/user/');
        
        console.log('User data fetched:', res.data);
        
        if (res.data && typeof res.data === 'object' && res.data.role) {
          setUser(res.data);
        } else {
          console.error('Invalid user data received:', res.data);
          setUser(null);
        }
        
      } catch (err) {
        console.error('Auth check error:', err);
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

  // ❌ REMOVED: Auto-logout on tab close
  // Reason: Cannot reliably distinguish between tab close and page refresh
  // Solution: Mark old sessions as inactive when user logs in again
  // See CustomLoginView in backend for implementation

  const logout = async () => {
    try {
      const sessionId = sessionStorage.getItem('session_id');
      
      // Send logout request (cookie auto sent by browser)
      await api.post('/logout/', { session_id: sessionId }, { withCredentials: true });
      
      console.log('Logged out successfully');
      console.log('Cookie refresh_token_' + sessionId + ' will be deleted by backend');
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    // Clear sessionStorage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('session_id');
    
    setUser(null);
    router.push('/');
  };

  return { user, loading, logout };

};