'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
      const response = await axios.post('http://localhost:8000/api/login/', formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      setMessage('Login successful!');
      setShowSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Login failed! Email or password is incorrect.');
    }
    setLoading(false);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    router.push('/forgot-password');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    router.push('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden p-4">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-[-10%] w-[300px] h-[300px] bg-radial-gradient from-[#00ff88]/10 to-transparent rounded-full animate-float1"></div>
        <div className="absolute top-60 right-[-5%] w-[200px] h-[200px] bg-radial-gradient from-[#0099ff]/6 to-transparent rounded-full animate-float2"></div>
        <div className="absolute bottom-20 left-10 w-[150px] h-[150px] bg-radial-gradient from-[#ff0080]/4 to-transparent rounded-full animate-float3"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-[#151520] border border-[#2a2a35] rounded-xl p-8 shadow-2xl backdrop-blur-md font-georgia transition-all duration-300 hover:shadow-neon">
        <div className="flex justify-center mb-5">
          <div className="text-4xl bg-gradient-to-r from-[#00ff88] to-[#0099ff] bg-clip-text text-transparent filter drop-shadow-neon animate-pulse">
            ⚡
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-white mb-2">Sign In</h2>
          <p className="text-[#a0a0b0] text-sm">Access your account</p>
        </div>

        {showSuccess && (
          <div className="text-center mb-6 opacity-100 transition-all duration-500">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-[#00ff88] to-[#0099ff] rounded-full flex items-center justify-center text-[#0a0a0f] text-xl animate-successPulse shadow-neon-success">
              ✓
            </div>
            <h3 className="text-white text-lg font-semibold mb-1">Welcome back!</h3>
            <p className="text-[#a0a0b0] text-sm">Redirecting to your dashboard...</p>
          </div>
        )}

        {message && !showSuccess && (
          <div className={`mb-5 p-3 text-center rounded-md text-sm transition-all duration-300 ${
            message.includes('successful') ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'bg-[#ff0080]/10 text-[#ff0080] border border-[#ff0080]/20'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              {showPassword ?'👁️':'🙈'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={handleRememberMe}
                className="w-4 h-4 text-[#00ff88] bg-[#1a1a25] border-[#2a2a35] rounded focus:ring-[#00ff88] focus:ring-2 transition-colors"
              />
              <span className="text-sm text-[#a0a0b0]">Remember me</span>
            </label>
            <a href="/forgot-password" onClick={handleForgotPassword} className="text-sm text-[#00ff88] hover:text-[#0099ff] transition-colors duration-200">
              Forgot Password?
            </a>
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
                Signing In...
              </>
            ) : (
              'Sign In'
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
            onClick={handleRegister}
            className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md py-2.5 text-[#00ff88] font-medium text-sm hover:bg-[#2a2a35] hover:border-[#00ff88] hover:shadow-social-glow transition-all duration-300"
          >
            Create an Account
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
        @keyframes successPulse {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
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
        .shadow-neon-success {
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
        }
        .bg-radial-gradient {
          background: radial-gradient(circle, var(--color) 0%, transparent 70%);
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite alternate;
        }
        @keyframes pulse {
          from { filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.3)); }
          to { filter: drop-shadow(0 0 30px rgba(0, 255, 136, 0.6)); }
        }
        .animate-float1 { animation: float1 6s ease-in-out infinite; }
        .animate-float2 { animation: float2 8s ease-in-out infinite; }
        .animate-float3 { animation: float3 7s ease-in-out infinite; }
        .animate-successPulse { animation: successPulse 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .peer-valid ~ label { @apply -top-5 left-2 scale-90 text-[#00ff88]; }
        .peer:focus ~ label { @apply -top-5 left-2 scale-90 text-[#00ff88]; }
        .peer:has-value ~ label { @apply -top-5 left-2 scale-90 text-[#00ff88]; }
      `}</style>
    </div>
  );
}