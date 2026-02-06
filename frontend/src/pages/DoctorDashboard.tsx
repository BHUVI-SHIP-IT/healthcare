import React, { useState, useEffect } from 'react';
import { getPendingRequests, submitDoctorReport } from '../services/requests';
import { HealthRequest, RiskLevel } from '../types';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const DoctorDashboard: React.FC = () => {
    const [requests, setRequests] = useState<HealthRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<HealthRequest | null>(null);
    const [notes, setNotes] = useState('');
    const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.LOW);
    const [submitting, setSubmitting] = useState(false);
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

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await submitDoctorReport(selectedRequest.id, notes, riskLevel);
            setSuccess('Doctor report submitted successfully!');
            setSelectedRequest(null);
            setNotes('');
            setRiskLevel(RiskLevel.LOW);
            loadRequests();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <h1>Doctor Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Review patients and submit medical assessments.
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

                {selectedRequest && (
                    <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="card">
                                <h3>Submit Medical Report</h3>
                                <p><strong>Patient Request:</strong> {selectedRequest.id.slice(-8)}</p>
                                <p><strong>Symptoms:</strong> {selectedRequest.symptoms}</p>
                                {selectedRequest.description && <p><strong>Description:</strong> {selectedRequest.description}</p>}

                                <form onSubmit={handleSubmitReport}>
                                    <div className="input-group">
                                        <label className="input-label">Medical Notes *</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Enter detailed medical notes..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            required
                                            rows={5}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Risk Level *</label>
                                        <select
                                            className="input-field"
                                            value={riskLevel}
                                            onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                                        >
                                            <option value={RiskLevel.LOW}>Low - Minor condition</option>
                                            <option value={RiskLevel.MEDIUM}>Medium - Requires monitoring</option>
                                            <option value={RiskLevel.HIGH}>High - Requires HOD approval</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-md">
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                                            {submitting ? 'Submitting...' : 'Submit Report'}
                                        </button>
                                        <button type="button" onClick={() => setSelectedRequest(null)} className="btn btn-secondary">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-2">
                    {requests.length === 0 ? (
                        <div className="text-center p-4" style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No patients waiting at this time.</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                actions={
                                    <button onClick={() => setSelectedRequest(request)} className="btn btn-primary">
                                        Submit Report
                                    </button>
                                }
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default DoctorDashboard;
