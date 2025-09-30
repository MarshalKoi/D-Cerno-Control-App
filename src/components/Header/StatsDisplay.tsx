import React from 'react';
import { SeatStats } from '../../types';

interface StatsDisplayProps {
  stats: SeatStats;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  return (
    <div className="stats-summary">
      <div className="stat-item">
        <span className="stat-number">{stats.total}</span>
        <span className="stat-label">Total Seats</span>
      </div>
      <div className="stat-item speaking">
        <span className="stat-number">{stats.speaking}</span>
        <span className="stat-label">Speaking</span>
      </div>
      <div className="stat-item requesting">
        <span className="stat-number">{stats.requesting}</span>
        <span className="stat-label">Requesting</span>
      </div>
      <div className="stat-item idle">
        <span className="stat-number">{stats.idle}</span>
        <span className="stat-label">Idle</span>
      </div>
    </div>
  );
};

export default StatsDisplay;