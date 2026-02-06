import React, { useState } from 'react';
import { scanGateToken } from '../services/requests';
import Navbar from '../components/Navbar';

const GateDashboard: React.FC = () => {
    const [token, setToken] = useState('');
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setScanning(true);
        setResult(null);

        try {
            await scanGateToken(token);
            setResult({ success: true, message: '✓ Exit authorized! Student may leave.' });
            setToken('');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Invalid or expired token';
            setResult({ success: false, message: `⚠️ ${message}` });
        } finally {
            setScanning(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                    <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚪</div>
                        <h1>Gate Exit Scanner</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Scan student exit authorization tokens to verify and log exits.
                        </p>

                        <form onSubmit={handleScan}>
                            <div className="input-group">
                                <label htmlFor="token" className="input-label">
                                    Exit Token
                                </label>
                                <input
                                    id="token"
                                    type="text"
                                    className="input-field"
                                    placeholder="Paste or scan token here..."
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.1rem', fontFamily: 'monospace' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full" disabled={scanning} style={{ padding: '1rem' }}>
                                {scanning ? (
                                    <>
                                        <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                                        Scanning...
                                    </>
                                ) : (
                                    '🔍 Scan Token'
                                )}
                            </button>
                        </form>

                        {result && (
                            <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '2rem', fontSize: '1.1rem' }}>
                                {result.message}
                            </div>
                        )}

                        <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                SCANNER STATUS
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', background: 'var(--accent-success)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                                <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>ONLINE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GateDashboard;
