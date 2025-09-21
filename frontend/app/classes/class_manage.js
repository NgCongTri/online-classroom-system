'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Classes() {
    const [user, setUser] = useState(null);
    const [classes, setClasses] = useState([]);
    const [classForm, setClassForm] = useState({ name: '', description: '', start_date: '', end_date: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const API_URL = 'http://localhost:8000/api/';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Kiểm tra đăng nhập và lấy danh sách lớp học
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser || !token) {
        router.push('/');
        return;
        }
        setUser(JSON.parse(storedUser));
        fetchClasses();
    }, []);

    // Tạo instance axios với header Authorization
    const axiosInstance = axios.create({
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    // Lấy danh sách lớp học
    const fetchClasses = async () => {
        try {
        const response = await axiosInstance.get(`${API_URL}classes/`);
        setClasses(response.data);
        setMessage('');
        } catch (error) {
        setMessage('Lỗi khi lấy danh sách lớp học: ' + (error.response?.data?.detail || 'Lỗi không xác định'));
        }
    };

    // Xử lý tạo lớp học mới
    const handleClassSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
        await axiosInstance.post(`${API_URL}classes/`, classForm);
        setMessage('Tạo lớp học thành công!');
        setClassForm({ name: '', description: '', start_date: '', end_date: '' });
        fetchClasses();
        } catch (error) {
        setMessage('Lỗi khi tạo lớp học: ' + (error.response?.data?.detail || 'Lỗi không xác định'));
        }
        setLoading(false);
    };

    // Xử lý đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        router.push('/');
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">Đang tải...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-6 text-white">
        <div className="max-w-4xl mx-auto bg-[#151520] border border-[#2a2a35] rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Quản lý Lớp học - {user.role}</h1>
            <button
                onClick={handleLogout}
                className="bg-[#ff0080] text-white px-4 py-2 rounded-md hover:bg-[#cc0066] transition-colors"
            >
                Đăng xuất
            </button>
            </div>

            {message && (
            <div
                className={`mb-4 p-3 rounded-md text-sm ${
                message.includes('thành công')
                    ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
                    : 'bg-[#ff0080]/10 text-[#ff0080] border-[#ff0080]/20'
                }`}
            >
                {message}
            </div>
            )}

            {/* Form tạo lớp học (chỉ cho admin và giảng viên) */}
            {(user.role === 'lecturer' || user.role === 'admin') && (
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Tạo Lớp học Mới</h2>
                <form onSubmit={handleClassSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Tên lớp học"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2 text-white"
                    required
                />
                <textarea
                    placeholder="Mô tả lớp học"
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2 text-white"
                />
                <input
                    type="date"
                    value={classForm.start_date}
                    onChange={(e) => setClassForm({ ...classForm, start_date: e.target.value })}
                    className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2 text-white"
                    required
                />
                <input
                    type="date"
                    value={classForm.end_date}
                    onChange={(e) => setClassForm({ ...classForm, end_date: e.target.value })}
                    className="w-full bg-[#1a1a25] border border-[#2a2a35] rounded-md px-3 py-2 text-white"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#00ff88] to-[#0099ff] text-[#0a0a0f] px-4 py-2 rounded-md hover:shadow-button-glow transition-all"
                >
                    {loading ? 'Đang tạo...' : 'Tạo Lớp học'}
                </button>
                </form>
            </div>
            )}

            {/* Danh sách lớp học */}
            <div>
            <h2 className="text-xl font-semibold mb-4">Danh sách Lớp học</h2>
            {classes.length === 0 ? (
                <p className="text-[#a0a0b0]">Chưa có lớp học nào.</p>
            ) : (
                <ul className="space-y-2">
                {classes.map((cls) => (
                    <li key={cls.id} className="bg-[#1a1a25] p-3 rounded-md">
                    {cls.name} (Mã lớp: {cls.class_code}) - {cls.description || 'Không có mô tả'} 
                    <br />
                    <span className="text-[#a0a0b0] text-sm">
                        Từ {cls.start_date} đến {cls.end_date} | Giảng viên: {cls.lecturer}
                    </span>
                    </li>
                ))}
                </ul>
            )}
            </div>
        </div>

        <style jsx>{`
            .shadow-button-glow {
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
            }
        `}</style>
        </div>
    );
}