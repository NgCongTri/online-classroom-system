'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from './utils/api';

export default function Home() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setMessage('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/login/', {
        email: formData.email,
        password: formData.password,
        remember_me: rememberMe
      });
      
      if (response.status === 200) {
        console.log('Login response:', response.data);
        
        const userData = response.data?.user;
        if (!userData) {
          console.error('No user data in response:', response.data);
          setMessage('Login failed: Invalid response from server');
          setLoading(false);
          return;
        }

        const accessToken = response.data.access;
        const sessionId = response.data.session_id;
        
        if (accessToken && sessionId) {
          sessionStorage.setItem('access_token', accessToken);
          sessionStorage.setItem('session_id', sessionId);
          
          console.log('Tokens saved to sessionStorage (isolated per tab)');
          console.log('Session ID:', sessionId);
          console.log('Refresh token in cookie: refresh_token_' + sessionId);
        } else {
          console.error('Missing tokens in response');
          setMessage('Login failed: Invalid authentication tokens');
          setLoading(false);
          return;
        }

        const userRole = userData.role;
        if (!userRole) {
          console.error('No role in user data:', userData);
          setMessage('Login failed: User role not found');
          setLoading(false);
          return;
        }

        console.log('User role:', userRole);
        setMessage('Login successful!');
        setShowSuccess(true);
        
        setTimeout(() => {
          switch (userRole) {
            case 'admin':
              console.log('Redirecting to admin dashboard');
              router.push('/dashboard/admin');
              break;
            case 'lecturer':
              console.log('Redirecting to lecturer dashboard');
              router.push('/dashboard/lecturer');
              break;
            case 'student':
              console.log('Redirecting to student dashboard');
              router.push('/dashboard/student');
              break;
            default:
              console.warn('Unknown role, redirecting to default dashboard:', userRole);
              router.push('/dashboard/student');
              break;
          }
        }, 1200);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed!';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    router.push('/forgot-password');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsAnimating(true);
    setTimeout(() => {
      router.push('/register');
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8eaf6] via-[#c5cae9] to-[#9fa8da] relative overflow-hidden p-4">
      {/* Container chính với kích thước vừa phải */}
      <div className="relative z-10 w-[768px] h-[480px] flex bg-white rounded-[20px] shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)] overflow-hidden">
        
        {/* Panel di chuyển - bên trái ban đầu */}
        <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-[#00ff88] to-[#0099ff] transition-all duration-700 ease-in-out z-30 flex items-center justify-center p-12 ${
          isAnimating ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{
          borderTopLeftRadius: isAnimating ? '0' : '20px',
          borderBottomLeftRadius: isAnimating ? '0' : '20px',
          borderTopRightRadius: isAnimating ? '20px' : '0',
          borderBottomRightRadius: isAnimating ? '20px' : '0'
        }}>
          <div className="text-center text-white">
            <h2 className="text-[36px] font-bold mb-5 tracking-tight" style={{ fontWeight: 700 }}>Hello, Friend!</h2>
            <p className="mb-8 text-[14px] leading-relaxed px-6 font-light" style={{ letterSpacing: '0.3px' }}>
              Register with your personal details to use<br />all of site features
            </p>
            <button
              onClick={handleRegister}
              disabled={isAnimating}
              className="px-12 py-2.5 border-2 border-white rounded-full font-bold text-[12px] tracking-[1.5px] hover:bg-white hover:text-[#00ff88] transition-all duration-300 disabled:opacity-50 uppercase"
              style={{ letterSpacing: '1.5px' }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Phần bên trái - placeholder */}
        <div className="w-1/2 bg-white"></div>

        {/* Form Sign In - LUÔN Ở BÊN PHẢI */}
        <div className="w-1/2 px-10 py-8 relative z-20 flex flex-col justify-center bg-white">
          <h1 className="text-[32px] font-bold text-[#333] mb-4 text-center tracking-tight" style={{ fontWeight: 700 }}>Sign In</h1>

          {/* Social Login Icons */}
          <div className="flex justify-center gap-3 mb-4">
            <button type="button" className="w-9 h-9 border border-[#ddd] rounded-full flex items-center justify-center text-[#333] hover:border-[#00ff88] hover:bg-[#f6f6f6] transition-all duration-300">
              <span className="text-sm font-semibold">G+</span>
            </button>
            <button type="button" className="w-9 h-9 border border-[#ddd] rounded-full flex items-center justify-center text-[#333] hover:border-[#00ff88] hover:bg-[#f6f6f6] transition-all duration-300">
              <span className="text-sm font-semibold">f</span>
            </button>
            <button type="button" className="w-9 h-9 border border-[#ddd] rounded-full flex items-center justify-center text-[#333] hover:border-[#00ff88] hover:bg-[#f6f6f6] transition-all duration-300">
              <span className="text-sm font-semibold">in</span>
            </button>
          </div>

          <p className="text-center text-[#666] text-[12px] mb-4 font-light">or use your email password</p>

          {message && !showSuccess && (
            <div className={`mb-3 p-2 text-center rounded-md text-xs ${
              message.includes('successful') ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff0080]/10 text-[#ff0080]'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2.5 text-[#333] text-[12px] placeholder-[#999] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-300"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2.5 pr-10 text-[#333] text-[12px] placeholder-[#999] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-300"
                required
              />
              <button
                type="button"
                onClick={handlePasswordToggle}
                className="absolute right-3 top-2.5 text-[#999] hover:text-[#666] transition-colors duration-200 text-sm"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>

            <div className="text-center pt-1">
              <a 
                href="/forgot-password" 
                onClick={handleForgotPassword} 
                className="text-[12px] text-[#666] hover:text-[#00ff88] transition-colors duration-200 font-light"
              >
                Forget Your Password?
              </a>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-white py-2.5 rounded-full font-bold text-[12px] tracking-[1.5px] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase"
                style={{ letterSpacing: '1.5px' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}