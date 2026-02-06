import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: Role.STUDENT,
        // For students and class advisors
        year: '',
        section: '',
        department: '',
        // For HODs
        hodDepartment: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const years = ['1ST_YEAR', '2ND_YEAR', '3RD_YEAR', '4TH_YEAR'];
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    const departments = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Build classSection for students and class advisors
            let classSection = '';
            let department = '';

            if (formData.role === Role.STUDENT || formData.role === Role.PROXY_STUDENT || formData.role === Role.CLASS_ADVISOR) {
                if (!formData.year || !formData.section || !formData.department) {
                    setError('Please select year, section, and department');
                    setLoading(false);
                    return;
                }
                classSection = `${formData.year}_${formData.section}_${formData.department}`;
            }

            if (formData.role === Role.HOD) {
                if (!formData.hodDepartment) {
                    setError('Please select department');
                    setLoading(false);
                    return;
                }
                department = formData.hodDepartment;
            }

            await register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                classSection,
                department,
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const needsClassSection = formData.role === Role.STUDENT ||
        formData.role === Role.PROXY_STUDENT ||
        formData.role === Role.CLASS_ADVISOR;
    const needsDepartment = formData.role === Role.HOD;

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="glass-card animate-fadeIn" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
                <div className="text-center mb-4">
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥 Campus Care</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Create your account to get started.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="fullName" className="input-label">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            className="input-field"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="input-field"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="role" className="input-label">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            className="input-field"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value={Role.STUDENT}>Student</option>
                            <option value={Role.PROXY_STUDENT}>Proxy Student</option>
                            <option value={Role.CLASS_ADVISOR}>Class Advisor</option>
                            <option value={Role.HEALTH_RECEPTIONIST}>Health Receptionist</option>
                            <option value={Role.DOCTOR}>Doctor</option>
                            <option value={Role.HOD}>HOD</option>
                            <option value={Role.GATE_AUTHORITY}>Gate Authority</option>
                            <option value={Role.ADMIN}>Admin</option>
                        </select>
                    </div>

                    {needsClassSection && (
                        <>
                            <div className="input-group">
                                <label htmlFor="year" className="input-label">
                                    Year {formData.role === Role.CLASS_ADVISOR && '(You Manage)'}
                                </label>
                                <select
                                    id="year"
                                    name="year"
                                    className="input-field"
                                    value={formData.year}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y.replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label htmlFor="section" className="input-label">
                                    Section {formData.role === Role.CLASS_ADVISOR && '(You Manage)'}
                                </label>
                                <select
                                    id="section"
                                    name="section"
                                    className="input-field"
                                    value={formData.section}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Section</option>
                                    {sections.map((s) => (
                                        <option key={s} value={s}>
                                            Section {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label htmlFor="department" className="input-label">
                                    Department {formData.role === Role.CLASS_ADVISOR && '(You Manage)'}
                                </label>
                                <select
                                    id="department"
                                    name="department"
                                    className="input-field"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.year && formData.section && formData.department && (
                                <div className="alert alert-success">
                                    <span>ℹ️</span>
                                    {formData.role === Role.CLASS_ADVISOR ? 'You will manage' : 'Your class'}:{' '}
                                    <strong>{formData.year.replace('_', ' ')} Section {formData.section} - {formData.department}</strong>
                                </div>
                            )}
                        </>
                    )}

                    {needsDepartment && (
                        <div className="input-group">
                            <label htmlFor="hodDepartment" className="input-label">
                                Department (You Head)
                            </label>
                            <select
                                id="hodDepartment"
                                name="hodDepartment"
                                className="input-field"
                                value={formData.hodDepartment}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary-400)', fontWeight: 600, textDecoration: 'none' }}>
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
