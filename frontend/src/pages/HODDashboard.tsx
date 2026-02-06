import React, { useState, useEffect } from 'react';
import { getPendingRequests, submitHODDecision } from '../services/requests';
import { HealthRequest, ApprovalDecision } from '../types';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const HODDashboard: React.FC = () => {
    const [requests, setRequests] = useState<HealthRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<HealthRequest | null>(null);
    const [decision, setDecision] = useState<ApprovalDecision>(ApprovalDecision.APPROVED);
    const [comment, setComment] = useState('');
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
        } catch (err) {
            console.error('Failed to load requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await submitHODDecision(selectedRequest.id, decision, comment);
            setSuccess(`High-risk case ${decision === ApprovalDecision.APPROVED ? 'approved' : 'rejected'} successfully!`);
            setSelectedRequest(null);
            setComment('');
            loadRequests();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit decision');
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
                <h1>HOD Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Review and approve high-risk medical cases.
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
                                <h3>High-Risk Case Review</h3>
                                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                                    <strong>⚠️ HIGH RISK CASE</strong>
                                </div>
                                <p><strong>Request ID:</strong> {selectedRequest.id.slice(-8)}</p>
                                <p><strong>Symptoms:</strong> {selectedRequest.symptoms}</p>
                                {selectedRequest.doctorReport && (
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                                        <p><strong>Doctor's Notes:</strong></p>
                                        <p>{selectedRequest.doctorReport.notes}</p>
                                    </div>
                                )}

                                <form onSubmit={handleDecision} style={{ marginTop: '1.5rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">HOD Decision *</label>
                                        <select
                                            className="input-field"
                                            value={decision}
                                            onChange={(e) => setDecision(e.target.value as ApprovalDecision)}
                                        >
                                            <option value={ApprovalDecision.APPROVED}>Approve</option>
                                            <option value={ApprovalDecision.REJECTED}>Reject</option>
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Comment</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Add your comments..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-md">
                                        <button
                                            type="submit"
                                            className={`btn ${decision === ApprovalDecision.APPROVED ? 'btn-success' : 'btn-danger'}`}
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Processing...' : `${decision === ApprovalDecision.APPROVED ? 'Approve' : 'Reject'}`}
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
                            <p style={{ color: 'var(--text-muted)' }}>No high-risk cases pending review.</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                actions={
                                    <button onClick={() => setSelectedRequest(request)} className="btn btn-danger">
                                        Review High-Risk Case
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

export default HODDashboard;
