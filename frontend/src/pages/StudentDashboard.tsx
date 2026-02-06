import React, { useState, useEffect } from 'react';
import { getMyRequests, createHealthRequest } from '../services/requests';
import { HealthRequest, CreateHealthRequestDto } from '../types';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const StudentDashboard: React.FC = () => {
    const [requests, setRequests] = useState<HealthRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<CreateHealthRequestDto>({
        symptoms: '',
        description: '',
        classSection: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await getMyRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await createHealthRequest(formData);
            setSuccess('Health request submitted successfully!');
            setFormData({ symptoms: '', description: '', classSection: '' });
            setShowForm(false);
            loadRequests();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit request');
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
                <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ margin: 0 }}>My Health Requests</h1>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? 'Cancel' : '+ New Request'}
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

                {showForm && (
                    <div className="glass-card card mb-4 animate-slideIn">
                        <h3>Submit New Health Request</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label htmlFor="symptoms" className="input-label">
                                    Symptoms *
                                </label>
                                <input
                                    id="symptoms"
                                    type="text"
                                    className="input-field"
                                    placeholder="Fever, headache, etc."
                                    value={formData.symptoms}
                                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="description" className="input-label">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="input-field"
                                    placeholder="Additional details about your condition..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="classSection" className="input-label">
                                    Class Section
                                </label>
                                <input
                                    id="classSection"
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., 3A"
                                    value={formData.classSection}
                                    onChange={(e) => setFormData({ ...formData, classSection: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-md">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-2">
                    {requests.length === 0 ? (
                        <div className="text-center p-4" style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No health requests found. Create your first request!</p>
                        </div>
                    ) : (
                        requests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                actions={
                                    request.exitAuthorization && !request.exitAuthorization.usedAt ? (
                                        <div className="w-full">
                                            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                                                <strong>Exit Token:</strong>
                                                <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'auto' }}>
                                                    {request.exitAuthorization.tokenHash.slice(0, 24)}
                                                </code>
                                            </div>
                                        </div>
                                    ) : null
                                }
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;
