import React, { useState, useEffect } from 'react';
import { getPendingRequests, acknowledgeArrival, authorizeExit } from '../services/requests';
import { HealthRequest } from '../types';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const ReceptionistDashboard: React.FC = () => {
    const [requests, setRequests] = useState<HealthRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (requestId: string) => {
        setLoading(true);
        try {
            await acknowledgeArrival(requestId);
            alert('Arrival acknowledged successfully!');
            loadRequests(); // Changed from fetchRequests to loadRequests to match existing function name
        } catch (error) {
            console.error('Failed to acknowledge arrival:', error);
            alert('Failed to acknowledge arrival');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorizeExit = async (requestId: string) => {
        setProcessing(requestId);
        setError('');
        setSuccess('');

        try {
            const result = await authorizeExit(requestId);
            setSuccess(`Exit authorized! Token: ${result.token}`);
            loadRequests();
            loadRequests();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to authorize exit';
            setError(errorMessage);
            console.error('Full Error:', err);
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <h1>Reception Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Acknowledge student arrivals and authorize exits.
                </p>

                {success && (
                    <div className="alert alert-success">
                        <span>✓</span>
                        {success}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <div className="grid grid-2">
                    {requests.length === 0 ? (
                        <div className="text-center p-4" style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No active requests at this time.</p>
                        </div>
                    ) : (
                        requests.map((request) => {
                            const canAcknowledge = request.status === 'CA_APPROVED';
                            const canAuthorize =
                                (request.status === 'DOCTOR_REVIEW' && request.doctorReport?.riskLevel !== 'HIGH') ||
                                (request.status === 'HOD_REVIEW' && request.hodDecision?.decision === 'APPROVED');

                            return (
                                <RequestCard
                                    key={request.id}
                                    request={request}
                                    actions={
                                        <>
                                            {canAcknowledge && (
                                                <button
                                                    onClick={() => handleAcknowledge(request.id)}
                                                    className="btn btn-success"
                                                    disabled={processing === request.id}
                                                >
                                                    {processing === request.id ? 'Processing...' : 'Acknowledge Arrival'}
                                                </button>
                                            )}
                                            {canAuthorize && !request.exitAuthorization && (
                                                <button
                                                    onClick={() => handleAuthorizeExit(request.id)}
                                                    className="btn btn-primary"
                                                    disabled={processing === request.id}
                                                >
                                                    {processing === request.id ? 'Processing...' : 'Authorize Exit'}
                                                </button>
                                            )}
                                        </>
                                    }
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

export default ReceptionistDashboard;
