'use client';
import { useState, useEffect } from 'react';

export default function TokenDebugger() {
    const [tokenInfo, setTokenInfo] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const updateTokenInfo = () => {
            const token = sessionStorage.getItem('access_token');
            const sessionId = sessionStorage.getItem('session_id');

            if (token) {
                try {
                    const parts = token.split('.');
                    const payload = JSON.parse(atob(parts[1]));
                    const exp = payload.exp * 1000;
                    const now = Date.now();
                    const timeLeft = exp - now;
                    const minutesLeft = Math.floor(timeLeft / 60000);
                    const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

                    setTokenInfo({
                        sessionId,
                        expiresAt: new Date(exp).toLocaleString('vi-VN'),
                        minutesLeft,
                        secondsLeft,
                        isExpired: timeLeft < 0,
                        willExpireSoon: timeLeft < 60000, // Less than 1 minute
                    });
                } catch (error) {
                    console.error('Error parsing token:', error);
                    setTokenInfo(null);
                }
            } else {
                setTokenInfo(null);
            }
        };

        updateTokenInfo();
        const interval = setInterval(updateTokenInfo, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    if (!tokenInfo) return null;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm"
            >
                {isVisible ? '🔒 Hide Token Info' : '🔓 Show Token Info'}
            </button>

            {/* Debug Panel */}
            {isVisible && (
                <div className="fixed bottom-16 right-4 z-50 bg-white border-2 border-purple-600 rounded-lg shadow-2xl p-4 max-w-md">
                    <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Token Debugger
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Session ID:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tokenInfo.sessionId?.slice(0, 8)}...</code>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Expires At:</span>
                            <span className="font-mono text-xs">{tokenInfo.expiresAt}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Time Left:</span>
                            <span className={`font-bold ${
                                tokenInfo.isExpired 
                                    ? 'text-red-600' 
                                    : tokenInfo.willExpireSoon 
                                        ? 'text-orange-600' 
                                        : 'text-green-600'
                            }`}>
                                {tokenInfo.isExpired 
                                    ? 'EXPIRED' 
                                    : `${tokenInfo.minutesLeft}m ${tokenInfo.secondsLeft}s`
                                }
                            </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className={`px-3 py-2 rounded text-xs font-medium ${
                                tokenInfo.isExpired 
                                    ? 'bg-red-100 text-red-800' 
                                    : tokenInfo.willExpireSoon 
                                        ? 'bg-orange-100 text-orange-800' 
                                        : 'bg-green-100 text-green-800'
                            }`}>
                                {tokenInfo.isExpired 
                                    ? '❌ Token expired - Will refresh on next request' 
                                    : tokenInfo.willExpireSoon 
                                        ? '⚠️ Token expiring soon!' 
                                        : '✅ Token is valid'
                                }
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 italic">
                                💡 Token will auto-refresh when you make a request after expiration
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
