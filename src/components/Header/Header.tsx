import React, { useState, useEffect } from 'react';
import { formatTime } from '../../utils/timeUtils';
import { SidecarStatus, SeatStats } from '../../types';
import StatusIndicator from './StatusIndicator';
import StatsDisplay from './StatsDisplay';

interface HeaderProps {
  sidecarStatus: SidecarStatus;
  stats: SeatStats;
}

const Header: React.FC<HeaderProps> = ({ sidecarStatus, stats }) => {
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
          <div className="clock-info">
            <div className="current-time">
              <span className="time-label">Current Time:</span>
              <span className="time-value">{formatTime(currentTime)}</span>
            </div>
            <StatusIndicator status={sidecarStatus} />
          </div>
        </div>
        
        <StatsDisplay stats={stats} />
      </div>
    </header>
  );
};

export default Header;