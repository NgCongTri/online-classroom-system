'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api'; // Import api utility

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
        setTimeout(() => router.push('/'), 1200);
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

  const handleLogin = () => router.push('/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden p-4">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-[-10%] w-[300px] h-[300px] bg-radial-gradient from-[#00ff88]/10 to-transparent rounded-full animate-float1"></div>
        <div className="absolute top-60 right-[-5%] w-[200px] h-[200px] bg-radial-gradient from-[#0099ff]/6 to-transparent rounded-full animate-float2"></div>
        <div className="absolute bottom-20 left-10 w-[150px] h-[150px] bg-radial-gradient from-[#ff0080]/4 to-transparent rounded-full animate-float3"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-[#151520] border border-[#2a2a35] rounded-xl p-8 shadow-2xl backdrop-blur-md font-georgia transition-all duration-300 hover:shadow-neon">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Create Account</h2>
          <p className="text-[#a0a0b0] text-sm">Join our classroom system</p>
        </div>

        {message && (
          <div className={`mb-5 p-3 text-center rounded-md text-sm transition-all duration-300 ${
            showSuccess ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'bg-[#ff0080]/10 text-[#ff0080] border border-[#ff0080]/20'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2.5 text-white text-sm placeholder-transparent focus:border-[#00ff88] focus:bg-[#1a1a25]/80 focus:shadow-input-glow focus:outline-none transition-all duration-300 peer"
              placeholder="Username"
              required
            />
            <label htmlFor="username" className="absolute left-3 top-2.5 text-[#a0a0b0] text-sm transition-all duration-300 peer-focus:-top-5 peer-focus:left-2 peer-focus:scale-90 peer-focus:text-[#00ff88] peer-valid:-top-5 peer-valid:left-2 peer-valid:scale-90 peer-valid:text-[#00ff88]">
              Username
            </label>
          </div>

          <div className="relative">
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2.5 text-white text-sm placeholder-transparent focus:border-[#00ff88] focus:bg-[#1a1a25]/80 focus:shadow-input-glow focus:outline-none transition-all duration-300 peer"
              placeholder="Email"
              required
            />
            <label htmlFor="email" className="absolute left-3 top-2.5 text-[#a0a0b0] text-sm transition-all duration-300 peer-focus:-top-5 peer-focus:left-2 peer-focus:scale-90 peer-focus:text-[#00ff88] peer-valid:-top-5 peer-valid:left-2 peer-valid:scale-90 peer-valid:text-[#00ff88]">
              Email
            </label>
          </div>

          <div className="relative">
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2.5 text-white text-sm focus:border-[#00ff88] focus:bg-[#1a1a25]/80 focus:shadow-input-glow focus:outline-none transition-all duration-300"
              required
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
            <label className="absolute -top-5 left-2 text-[#00ff88] text-sm scale-90">Role</label>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2.5 pr-10 text-white text-sm placeholder-transparent focus:border-[#00ff88] focus:bg-[#1a1a25]/80 focus:shadow-input-glow focus:outline-none transition-all duration-300 peer"
              placeholder="Password"
              required
            />
            <label htmlFor="password" className="absolute left-3 top-2.5 text-[#a0a0b0] text-sm transition-all duration-300 peer-focus:-top-5 peer-focus:left-2 peer-focus:scale-90 peer-focus:text-[#00ff88] peer-valid:-top-5 peer-valid:left-2 peer-valid:scale-90 peer-valid:text-[#00ff88]">
              Password
            </label>
            <button
              type="button"
              onClick={handlePasswordToggle}
              className="absolute right-3 top-2.5 text-[#a0a0b0] hover:text-[#00ff88] transition-colors duration-200 text-lg"
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          <div className="relative">
            <input
              id="password_confirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2.5 pr-10 text-white text-sm placeholder-transparent focus:border-[#00ff88] focus:bg-[#1a1a25]/80 focus:shadow-input-glow focus:outline-none transition-all duration-300 peer"
              placeholder="Confirm Password"
              required
            />
            <label htmlFor="password_confirm" className="absolute left-3 top-2.5 text-[#a0a0b0] text-sm transition-all duration-300 peer-focus:-top-5 peer-focus:left-2 peer-focus:scale-90 peer-focus:text-[#00ff88] peer-valid:-top-5 peer-valid:left-2 peer-valid:scale-90 peer-valid:text-[#00ff88]">
              Confirm Password
            </label>
            <button
              type="button"
              onClick={handlePasswordConfirmToggle}
              className="absolute right-3 top-2.5 text-[#a0a0b0] hover:text-[#00ff88] transition-colors duration-200 text-lg"
            >
              {showPasswordConfirm ? '👁️' : '🙈'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] py-2.5 rounded-md font-semibold text-sm hover:shadow-button-glow focus:shadow-button-glow focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-[#0a0a0f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#2a2a35]"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#151520] text-[#a0a0b0]">or</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleLogin}
            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md py-2.5 text-[#00ff88] font-medium text-sm hover:bg-[#2a2a35] hover:border-[#00ff88] hover:shadow-social-glow transition-all duration-300"
          >
            Back to Login
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(-5px); }
          66% { transform: translateY(5px) translateX(15px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(10px) translateX(-10px); }
          66% { transform: translateY(-10px) translateX(10px); }
        }
        .shadow-neon {
          box-shadow: 0 0 40px rgba(0, 255, 136, 0.1);
        }
        .shadow-input-glow {
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
        }
        .shadow-button-glow {
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
        }
        .shadow-social-glow {
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
        }
        .animate-float1 { animation: float1 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-float3 { animation: float3 7s ease-in-out infinite; }
        .peer-valid ~ label { @apply -top-5 left-2 scale-90 text-[#00ff88]; }
        .peer:focus ~ label { @apply -top-5 left-2 scale-90 text-[#00ff88]; }
        .peer:has-value ~ label { @apply -top-5 left-2 scale-90 text-[#00ff88]; }
      `}</style>
    </div>
  );
}