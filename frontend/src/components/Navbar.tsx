import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();

    const getRoleBadgeClass = (role: Role): string => {
        switch (role) {
            case Role.STUDENT:
            case Role.PROXY_STUDENT:
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

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-brand">🏥 Campus Care</div>
                {user && (
                    <div className="navbar-menu">
                        <div className="navbar-user">
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
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
