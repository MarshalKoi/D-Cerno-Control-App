import React, { useState, useEffect } from 'react';
import { formatTime } from '../../utils/timeUtils';
import { SidecarStatus, SeatStats } from '../../types';
import StatusIndicator from './StatusIndicator';
import StatsDisplay from './StatsDisplay';

interface HeaderProps {
  sidecarStatus: SidecarStatus;
  stats: SeatStats;
  onSignout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidecarStatus, stats, onSignout }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every second
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 300);

    return () => clearInterval(timeTimer);
  }, []);

  return (
    <header>
      <div className="header-content">
        <div className="header-left">
          <h1>Discussion Seats Manager</h1>
          <div className="time-status-row">
            <span className="time-label">Current Time:</span>
            <span className="time-value">{formatTime(currentTime)}</span>
            <StatusIndicator status={sidecarStatus} />
          </div>
        </div>
        
        <div className="header-right">
          <StatsDisplay stats={stats} />
          {onSignout && (
            <button 
              className="signout-button"
              onClick={onSignout}
              title="Sign out"
            >
              🚪 Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;