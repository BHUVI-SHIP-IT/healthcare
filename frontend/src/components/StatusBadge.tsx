import React from 'react';
import { HealthRequestStatus } from '../types';

interface StatusBadgeProps {
    status: HealthRequestStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getBadgeClass = (status: HealthRequestStatus): string => {
        switch (status) {
            case HealthRequestStatus.PENDING_CA:
                return 'badge badge-warning';
            case HealthRequestStatus.CA_APPROVED:
            case HealthRequestStatus.RECEPTION_ACK:
            case HealthRequestStatus.DOCTOR_REVIEW:
            case HealthRequestStatus.HOD_REVIEW:
                return 'badge badge-info';
            case HealthRequestStatus.EXIT_AUTHORIZED:
            case HealthRequestStatus.COMPLETED:
                return 'badge badge-success';
            case HealthRequestStatus.REJECTED:
            case HealthRequestStatus.CANCELLED:
                return 'badge badge-danger';
            default:
                return 'badge badge-primary';
        }
    };

    const getStatusText = (status: HealthRequestStatus): string => {
        switch (status) {
            case HealthRequestStatus.PENDING_CA:
                return 'Pending Advisor';
            case HealthRequestStatus.CA_APPROVED:
                return 'Advisor Approved';
            case HealthRequestStatus.RECEPTION_ACK:
                return 'At Reception';
            case HealthRequestStatus.DOCTOR_REVIEW:
                return 'Doctor Review';
            case HealthRequestStatus.HOD_REVIEW:
                return 'HOD Review';
            case HealthRequestStatus.EXIT_AUTHORIZED:
                return 'Exit Authorized';
            case HealthRequestStatus.COMPLETED:
                return 'Completed';
            case HealthRequestStatus.REJECTED:
                return 'Rejected';
            case HealthRequestStatus.CANCELLED:
                return 'Cancelled';
            default:
                return status;
        }
    };

    return <span className={getBadgeClass(status)}>{getStatusText(status)}</span>;
};

export default StatusBadge;
