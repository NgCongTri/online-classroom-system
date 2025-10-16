'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api'; 

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    role: 'student',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (message) setMessage('');
  };

  const handlePasswordToggle = () => setShowPassword((v) => !v);
  const handlePasswordConfirmToggle = () => setShowPasswordConfirm((v) => !v);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;
  const isValidUsername = (username) =>
    /^[a-zA-Z0-9_]+$/.test(username) && username.length >= 3 && username.length <= 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.username.trim()) {
      setMessage('Username is required');
      setLoading(false);
      return;
    }
    if (!isValidUsername(formData.username)) {
      setMessage('Username must be 3-100 characters and contain only letters, numbers, and underscores');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setMessage('Email is required');
      setLoading(false);
      return;
    }
    if (!isValidEmail(formData.email)) {
      setMessage('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (!isValidPassword(formData.password)) {
      setMessage('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.password_confirm) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Sử dụng api utility để tự động thêm /api/ prefix
      const res = await api.post('/register/', {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirm: formData.password_confirm,
        role: formData.role,
      });

      if (res.status === 201 || res.status === 200) {
        setShowSuccess(true);
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => router.push('/'), 3000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data) {
        const data = err.response.data;
        if (data.details) {
          const msgs = [];
          for (const [field, errs] of Object.entries(data.details)) {
            msgs.push(`${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`);
          }
          setMessage(msgs.join('; '));
        } else {
          setMessage(data.message || data.error || 'Registration failed');
        }
      } else {
        setMessage('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.push('/');
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8eaf6] via-[#c5cae9] to-[#9fa8da] relative overflow-hidden p-4">
      {/* Container chính với kích thước vừa phải */}
      <div className="relative z-10 w-[768px] h-[480px] flex bg-white rounded-[20px] shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)] overflow-hidden">
        
        {/* Form Create Account - LUÔN Ở BÊN TRÁI */}
        <div className="w-1/2 px-10 py-6 relative z-20 flex flex-col justify-center bg-white">
          <h1 className="text-[28px] font-bold text-[#333] mb-3 text-center tracking-tight" style={{ fontWeight: 700 }}>Create Account</h1>

          {/* Social Login Icons */}
          <div className="flex justify-center gap-3 mb-3">
            <button type="button" className="w-9 h-9 border border-[#ddd] rounded-full flex items-center justify-center text-[#333] hover:border-[#00ff88] hover:bg-[#f6f6f6] transition-all duration-200">
              <span className="text-sm font-semibold">G+</span>
            </button>
            <button type="button" className="w-9 h-9 border border-[#ddd] rounded-full flex items-center justify-center text-[#333] hover:border-[#00ff88] hover:bg-[#f6f6f6] transition-all duration-200">
              <span className="text-sm font-semibold">f</span>
            </button>
            <button type="button" className="w-9 h-9 border border-[#ddd] rounded-full flex items-center justify-center text-[#333] hover:border-[#00ff88] hover:bg-[#f6f6f6] transition-all duration-200">
              <span className="text-sm font-semibold">in</span>
            </button>
          </div>

          <p className="text-center text-[#666] text-[12px] mb-3 font-light">or use your email for registration</p>

          {message && (
            <div className={`mb-2 p-2 text-center rounded-md text-xs ${
              showSuccess ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#ff0080]/10 text-[#ff0080]'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Name"
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2 text-[#333] text-[12px] placeholder-[#999] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2 text-[#333] text-[12px] placeholder-[#999] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-200"
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
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2 pr-10 text-[#333] text-[12px] placeholder-[#999] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={handlePasswordToggle}
                className="absolute right-3 top-2 text-[#999] hover:text-[#666] transition-colors duration-200 text-sm"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>

            <div className="relative">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2 pr-10 text-[#333] text-[12px] placeholder-[#999] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={handlePasswordConfirmToggle}
                className="absolute right-3 top-2 text-[#999] hover:text-[#666] transition-colors duration-200 text-sm"
              >
                {showPasswordConfirm ? '👁️' : '🙈'}
              </button>
            </div>

            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-[#eee] border-none rounded-md px-4 py-2 text-[#333] text-[12px] focus:outline-none focus:bg-[#e0e0e0] transition-all duration-200"
                required
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-white py-2.5 rounded-full font-bold text-[12px] tracking-[1.5px] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase"
                style={{ letterSpacing: '1.5px' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Panel di chuyển - bên phải ban đầu */}
        <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-[#00ff88] to-[#0099ff] transition-all duration-700 ease-in-out z-30 flex items-center justify-center p-12 ${
          isAnimating ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{
          borderTopRightRadius: isAnimating ? '0' : '20px',
          borderBottomRightRadius: isAnimating ? '0' : '20px',
          borderTopLeftRadius: isAnimating ? '20px' : '0',
          borderBottomLeftRadius: isAnimating ? '20px' : '0'
        }}>
          <div className="text-center text-white">
            <h2 className="text-[36px] font-bold mb-5 tracking-tight" style={{ fontWeight: 700 }}>Welcome Back!</h2>
            <p className="mb-8 text-[14px] leading-relaxed px-6 font-light" style={{ letterSpacing: '0.3px' }}>
              Enter your personal details to use<br />all of site features
            </p>
            <button
              onClick={handleLogin}
              disabled={isAnimating}
              className="px-12 py-2.5 border-2 border-white rounded-full font-bold text-[12px] tracking-[1.5px] hover:bg-white hover:text-[#00ff88] transition-all duration-200 disabled:opacity-50 uppercase"
              style={{ letterSpacing: '1.5px' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}