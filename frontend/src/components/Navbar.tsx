import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();

    const getRoleBadgeClass = (role: Role): string => {
        switch (role) {
            case Role.STUDENT:
                return 'badge badge-info';
            case Role.CLASS_ADVISOR:
                return 'badge badge-primary';
            case Role.HEALTH_RECEPTIONIST:
                return 'badge badge-success';
            case Role.DOCTOR:
                return 'badge badge-danger';
            case Role.HOD:
                return 'badge badge-warning';
            case Role.GATE_AUTHORITY:
                return 'badge badge-primary';
            case Role.ADMIN:
                return 'badge badge-danger';
            default:
                return 'badge badge-primary';
        }
    };

    const getRoleDisplayName = (role: Role): string => {
        return role.replace('_', ' ');
    };

    const parseClassSection = (classSection?: string) => {
        if (!classSection) return null;

        // Handle new format: "CSE - 2024 - A"
        if (classSection.includes(' - ')) {
            const parts = classSection.split(' - ');
            if (parts.length === 3) {
                return {
                    department: parts[0],
                    year: parts[1],
                    section: parts[2]
                };
            }
        }

        // Handle legacy format if needed: "2ND_YEAR_O_CSE"
        const parts = classSection.split('_');
        if (parts.length >= 4) {
            return {
                year: `${parts[0]} ${parts[1]}`,
                section: parts[2],
                department: parts.slice(3).join(' ')
            };
        }
        return null;
    };

    const studentInfo = (user?.role === Role.STUDENT)
        ? parseClassSection(user?.classSection)
        : null;

    // Fallback for name if fullName is missing
    const getDisplayName = () => {
        if (user?.fullName) return user.fullName;
        if (user?.email) {
            return user.email.split('@')[0].split('.')[0]; // mbhuvaneswar from mbhuvaneswar.cse2024...
        }
        return 'User';
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/cit_logo.png" alt="CIT Logo" style={{ height: '40px', objectFit: 'contain' }} />
                    Campus Care
                </div>
                {user && (
                    <div className="navbar-menu">
                        <div className="navbar-user">
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{getDisplayName()}</div>
                                {studentInfo ? (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                        {studentInfo.department} • {studentInfo.year} • Section {studentInfo.section}
                                    </div>
                                ) : (
                                    user.classSection && (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                            {user.classSection}
                                        </div>
                                    )
                                )}
                            </div>
                            <span className={getRoleBadgeClass(user.role)}>
                                {getRoleDisplayName(user.role)}
                            </span>
                            <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
