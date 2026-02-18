import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const { loginWithOAuth } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithOAuth('google');
        } catch (err: any) {
            setError(err.message || 'Failed to login with Google');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
                <img
                    src="/cit_logo.png"
                    alt="CIT Logo"
                    style={{
                        height: '80px',
                        objectFit: 'contain',
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '8px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                />
            </div>
            <div className="glass-card animate-fadeIn" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
                <div className="text-center mb-8">
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥 Campus Care</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Welcome back! Please login to your account.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="btn w-full flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: 'white',
                        color: '#333',
                        border: '1px solid #ddd',
                        padding: '12px',
                        fontSize: '1rem'
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                            Connecting...
                        </>
                    ) : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                            Continue with Google
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
