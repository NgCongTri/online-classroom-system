'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-surface-100 p-8">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Dashboard</h2>
            <p className="text-lg">Welcome, {user.username || 'User'}! Role: {user.role || 'Unknown'}</p>
            <p>Classes and sessions will be displayed here.</p>
        </div>
        </div>
    );
}   