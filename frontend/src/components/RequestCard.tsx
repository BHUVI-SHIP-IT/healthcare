import React from 'react';
import { HealthRequest } from '../types';
import StatusBadge from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface RequestCardProps {
    request: HealthRequest;
    onViewDetails?: (request: HealthRequest) => void;
    actions?: React.ReactNode;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onViewDetails, actions }) => {
    return (
        <div className="glass-card card animate-fadeIn">
            <div className="card-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>
                            Request #{request.id.slice(-8)}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <StatusBadge status={request.status} />
                </div>
            </div>

            <div className="card-body">
                <div className="mb-2">
                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Symptoms:</strong>
                    <p style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>{request.symptoms}</p>
                </div>

                {request.description && (
                    <div className="mb-2">
                        <strong style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Description:</strong>
                        <p style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>{request.description}</p>
                    </div>
                )}

                {request.classSection && (
                    <div className="mb-2">
                        <strong style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Class:</strong>
                        <span style={{ marginLeft: '0.5rem' }}>{request.classSection}</span>
                    </div>
                )}

                {request.doctorReport && (
                    <div className="mb-2">
                        <strong style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Risk Level:</strong>
                        <span className={`badge ${request.doctorReport.riskLevel === 'HIGH' ? 'badge-danger' : request.doctorReport.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`} style={{ marginLeft: '0.5rem' }}>
                            {request.doctorReport.riskLevel}
                        </span>
                    </div>
                )}
            </div>

            {(actions || onViewDetails) && (
                <div className="card-footer">
                    {onViewDetails && (
                        <button onClick={() => onViewDetails(request)} className="btn btn-secondary">
                            View Details
                        </button>
                    )}
                    {actions}
                </div>
            )}
        </div>
    );
};

export default RequestCard;
