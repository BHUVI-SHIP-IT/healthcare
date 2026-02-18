import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyRequests, createHealthRequest } from '../services/requests';
import { HealthRequest, CreateHealthRequestDto } from '../types';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
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
    const [isOtherSymptom, setIsOtherSymptom] = useState(false);
    const [selectedSymptom, setSelectedSymptom] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const SYMPTOMS_LIST = [
        "Fever",
        "Headache",
        "Stomach Pain",
        "Cold/Flu",
        "Dizziness",
        "Fatigue",
        "Injury",
        "Menstrual Cramps",
        "Other"
    ];

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
            await createHealthRequest({
                ...formData,
                classSection: user?.classSection || ''
            });
            setSuccess('Health request submitted successfully!');
            setFormData({ symptoms: '', description: '', classSection: '' });
            setSelectedSymptom('');
            setIsOtherSymptom(false);
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
                <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', gap: '1.5rem' }}>
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
                                <select
                                    id="symptoms-select"
                                    className="input-field mb-2"
                                    value={selectedSymptom}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSelectedSymptom(value);
                                        if (value === 'Other') {
                                            setIsOtherSymptom(true);
                                            setFormData({ ...formData, symptoms: '' });
                                        } else {
                                            setIsOtherSymptom(false);
                                            setFormData({ ...formData, symptoms: value });
                                        }
                                    }}
                                    required
                                >
                                    <option value="">Select Symptom</option>
                                    {SYMPTOMS_LIST.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>

                                {isOtherSymptom && (
                                    <input
                                        type="text"
                                        className="input-field animate-fadeIn"
                                        placeholder="Please specify your symptoms..."
                                        value={formData.symptoms}
                                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                )}
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



                            <div className="flex" style={{ gap: '1rem' }}>
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

                <div className="flex" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                    <button
                        className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active
                    </button>
                    <button
                        className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>

                <div className="grid grid-2">
                    {requests
                        .filter(req => {
                            // EXIT_AUTHORIZED is now considered Active so the student can easily access their token
                            const isHistory = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(req.status);
                            return activeTab === 'history' ? isHistory : !isHistory;
                        })
                        .length === 0 ? (
                        <div className="text-center p-4" style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {activeTab === 'active'
                                    ? "No active health requests. You're all good!"
                                    : (requests.some(r => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(r.status))
                                        ? "No past requests found. Check the 'Active' tab for your current requests."
                                        : "No past health requests found.")}
                            </p>
                        </div>
                    ) : (
                        requests
                            .filter(req => {
                                const isHistory = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(req.status);
                                return activeTab === 'history' ? isHistory : !isHistory;
                            })
                            .map((request, index, filteredArray) => (
                                <RequestCard
                                    key={request.id}
                                    request={request}
                                    displayId={filteredArray.length - index}
                                    actions={
                                        request.exitAuthorization && !request.exitAuthorization.usedAt ? (
                                            <div className="w-full">
                                                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                                                    <strong>Exit Token:</strong>
                                                    <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'auto' }}>
                                                        {request.exitAuthorization.exitToken}
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
