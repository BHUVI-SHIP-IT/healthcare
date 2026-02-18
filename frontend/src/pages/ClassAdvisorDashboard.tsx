import React, { useState, useEffect } from 'react';
import { getPendingRequests, approveRequest, getAdvisorRequestHistory } from '../services/requests';
import { HealthRequest, ApprovalDecision } from '../types';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const ClassAdvisorDashboard: React.FC = () => {
    const [requests, setRequests] = useState<HealthRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<HealthRequest | null>(null);
    const [decision, setDecision] = useState<ApprovalDecision>(ApprovalDecision.APPROVED);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    useEffect(() => {
        loadRequests();
    }, [activeTab]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = activeTab === 'pending'
                ? await getPendingRequests()
                : await getAdvisorRequestHistory();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await approveRequest(selectedRequest.id, decision, comment);
            setSuccess(`Request ${decision === ApprovalDecision.APPROVED ? 'approved' : 'rejected'} successfully!`);
            setSelectedRequest(null);
            setComment('');
            loadRequests();
        } catch (err: any) {
            setError(
                typeof err === 'object' && err !== null && 'message' in err
                    ? (err as any).message || JSON.stringify(err)
                    : 'Failed to process approval'
            );
            console.log('Full Error:', err); // Log to console for backup
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
                <h1 style={{ marginBottom: '0.5rem' }}>Class Advisor Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Manage health requests for your class.
                </p>

                <div className="flex" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                    <button
                        className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Approvals
                    </button>
                    <button
                        className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Request History
                    </button>
                </div>

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
                                <h3>Approve Request</h3>

                                <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Details</h4>
                                    <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                        <p style={{ margin: 0 }}><strong>Name:</strong> {selectedRequest.student?.fullName}</p>
                                        <p style={{ margin: 0 }}><strong>Class:</strong> {selectedRequest.student?.classSection || selectedRequest.classSection}</p>
                                        <p style={{ margin: 0 }}><strong>Email:</strong> {selectedRequest.student?.email}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Problem</h4>
                                    <p><strong>Symptoms:</strong> {selectedRequest.symptoms}</p>
                                    {selectedRequest.description && <p><strong>Description:</strong> {selectedRequest.description}</p>}
                                </div>

                                <form onSubmit={handleApproval}>
                                    <div className="input-group">
                                        <label className="input-label">Decision</label>
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
                                        <label className="input-label">Comment (Optional)</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Add any notes..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-md">
                                        <button type="submit" className={`btn ${decision === ApprovalDecision.APPROVED ? 'btn-success' : 'btn-danger'}`} disabled={submitting}>
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
                            <p style={{ color: 'var(--text-muted)' }}>
                                {activeTab === 'pending'
                                    ? "No pending approvals at this time."
                                    : "No request history found."}
                            </p>
                        </div>
                    ) : (
                        requests.map((request, index) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                displayId={requests.length - index}
                                actions={
                                    activeTab === 'pending' ? (
                                        <button onClick={() => setSelectedRequest(request)} className="btn btn-primary">
                                            Review
                                        </button>
                                    ) : (
                                        <span className="badge" style={{ opacity: 0.7 }}>
                                            {request.status.replace(/_/g, ' ')}
                                        </span>
                                    )
                                }
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default ClassAdvisorDashboard;
