import React from 'react';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = false }) => {
    if (fullScreen) {
        return (
            <div className="spinner-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
        </div>
    );
};

export default LoadingSpinner;
