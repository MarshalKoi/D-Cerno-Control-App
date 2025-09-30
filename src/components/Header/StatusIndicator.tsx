import React from 'react';
import { SidecarStatus } from '../../types';

interface StatusIndicatorProps {
  status: SidecarStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return '🔄 Checking...';
      case 'online':
        return '🟢 Online';
      case 'offline':
        return '🔴 Offline';
      default:
        return '❓ Unknown';
    }
  };

  return (
    <div className="sidecar-status">
      <span className="status-label">API Service:</span>
      <span className={`status-indicator ${status}`}>
        {getStatusDisplay()}
      </span>
    </div>
  );
};

export default StatusIndicator;