import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

const CompleteProfilePage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form states
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<Role | null>(null);
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    const [department, setDepartment] = useState('');


    useEffect(() => {
        if (user?.email) {
            // Enforce Domain Restriction
            const allowedEmails = ['bhuvaneswar981@gmail.com', 'lolm06855@gmail.com'];
            if (!user.email.endsWith('@citchennai.net') && !allowedEmails.includes(user.email)) {
                setError('Only @citchennai.net email addresses are allowed.');
                return;
            }

            // Rule-based Role Detection
            // Pattern: name.deptYear@domain -> Student
            // Example: mbhuvaneswar.cse2024@citchennai.net
            // Regex explanation:
            // ^[a-z0-9.]+    -> Starts with alphanumeric (and dots)
            // \.             -> literal dot separator
            // [a-z]+         -> Department code (e.g., cse)
            // [0-9]{4}       -> Year (e.g., 2024)
            // @citchennai\.net$ -> Domain
            const studentRegex = /^[a-z0-9.]+\.[a-z]+[0-9]{4}@citchennai\.net$/i;

            if (studentRegex.test(user.email)) {
                setRole(Role.STUDENT);
                // Attempt to extract department and year
                try {
                    // split by @ to get local part: mbhuvaneswar.cse2024
                    const localPart = user.email.split('@')[0];

                    // Try to guess name if not set or is generic "User"
                    if (!user.fullName || user.fullName === 'User') {
                        const namePart = localPart.split('.')[0];
                        // Capitalize first letter
                        setFullName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
                    } else {
                        setFullName(user.fullName);
                    }

                    // use regex match to be safer. Match .deptYear at the end of localPart
                    const deptYearMatch = localPart.match(/\.([a-z]+)([0-9]{4})$/i);

                    if (deptYearMatch) {
                        const dept = deptYearMatch[1].toUpperCase();
                        const year = deptYearMatch[2];
                        try {
                            setDepartment(dept);
                        } catch (e) {
                            // ignore errors in state setting if unmounted
                        }
                        try {
                            setYear(year);
                        } catch (e) {
                            // ignore
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse email", e);
                }
            } else {
                // Staff (email is likely name@citchennai.net)
                if (user.email === 'lolm06855@gmail.com') {
                    setRole(Role.HEALTH_RECEPTIONIST);
                } else {
                    setRole(Role.CLASS_ADVISOR);
                }

                if (user.fullName) {
                    setFullName(user.fullName);
                } else {
                    const localPart = user.email.split('@')[0];
                    setFullName(localPart.charAt(0).toUpperCase() + localPart.slice(1));
                }
            }
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!role) throw new Error("Role could not be determined.");

            if (!role) throw new Error("Role could not be determined.");
            if (!fullName.trim()) throw new Error("Please enter your full name.");

            const updates: any = { role, fullName };

            if (role === Role.STUDENT) {
                if (!section || !year) throw new Error("Please fill in all fields.");
                updates.classSection = `${department} - ${year} - ${section}`; // Format: CSE - 2024 - A
                updates.department = department; // Save parsed department
            } else {
                // Staff
                if (role === Role.CLASS_ADVISOR) {
                    if (!department || !year || !section) throw new Error("Please fill in all fields (Dept, Year, Section).");
                    updates.classSection = `${department} - ${year} - ${section}`;
                } else {
                    // For HOD, etc.
                    updates.classSection = department;
                }
                updates.department = department;
            }

            await updateProfile(updates);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="glass-card animate-fadeIn" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}>
                <div className="text-center mb-6">
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Complete Your Profile</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        We need a few more details to set up your account.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4">
                        <span>⚠️</span>
                        {error}
                        {(error.includes('@citchennai.net') || error.includes('address')) && (
                            <div className="mt-3">
                                <button
                                    onClick={() => {
                                        useAuth().logout(); // Access logout directly or passed prop
                                        navigate('/login');
                                    }}
                                    className="btn btn-primary text-sm bg-red-600 hover:bg-red-700 border-none"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {(error.includes('@citchennai.net') || error.includes('address')) ? null : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="text"
                                value={user.email}
                                disabled
                                className="input-field opacity-75 cursor-not-allowed"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="input-label">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="input-field"
                                placeholder="Your Full Name"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Detected Role</label>
                            <input
                                type="text"
                                value={role === Role.STUDENT ? 'Student' : 'Staff / Class Advisor'}
                                disabled
                                className="input-field opacity-75 cursor-not-allowed font-semibold text-primary-600"
                            />
                        </div>

                        {role === Role.STUDENT ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="input-group">
                                        <label className="input-label">Department</label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                                            className="input-field"
                                            placeholder="CSE"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Batch Year</label>
                                        <input
                                            type="number"
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            className="input-field"
                                            placeholder="2024"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Section</label>
                                    <select
                                        value={section}
                                        onChange={(e) => setSection(e.target.value)}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Select Section</option>
                                        {Array.from({ length: 17 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                                            <option key={char} value={char}>{char}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Department</label>
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="CSE">CSE</option>
                                        <option value="IT">IT</option>
                                        <option value="AIDS">AIDS</option>
                                        {/* Add more as needed */}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Role</label>
                                    <select
                                        value={role || ''}
                                        onChange={(e) => setRole(e.target.value as Role)}
                                        className="input-field"
                                    >
                                        <option value={Role.CLASS_ADVISOR}>Class Advisor</option>
                                        <option value={Role.HOD}>HOD</option>
                                        <option value={Role.DOCTOR}>Doctor</option>
                                        <option value={Role.GATE_AUTHORITY}>Gate Authority</option>
                                        <option value={Role.HEALTH_RECEPTIONIST}>Receptionist</option>
                                    </select>
                                </div>

                                {role === Role.CLASS_ADVISOR && (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label">Batch Year</label>
                                            <input
                                                type="number"
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                className="input-field"
                                                placeholder="2024"
                                                required
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Section</label>
                                            <select
                                                value={section}
                                                onChange={(e) => setSection(e.target.value)}
                                                className="input-field"
                                                required
                                            >
                                                <option value="">Select Section</option>
                                                {Array.from({ length: 17 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                                                    <option key={char} value={char}>{char}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
                            {loading ? 'Saving Profile...' : 'Complete Profile'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CompleteProfilePage;
