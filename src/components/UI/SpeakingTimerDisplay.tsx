import React from 'react';

interface SpeakingTimerDisplayProps {
  seatNumber: number;
  displayTime: string;
  isRunning: boolean;
  onReset: () => void;
  className?: string;
}

const SpeakingTimerDisplay: React.FC<SpeakingTimerDisplayProps> = ({
  seatNumber,
  displayTime,
  isRunning,
  onReset,
  className = ''
}) => {
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent seat click events
    onReset();
  };

  return (
    <div className={`speaking-timer-display ${className} ${isRunning ? 'running' : 'paused'}`}>
      <span className="timer-time">{displayTime}</span>
      {isRunning && <span className="timer-indicator">●</span>}
      <button 
        className="timer-reset-btn"
        onClick={handleReset}
        title={`Reset timer for seat ${seatNumber}`}
        type="button"
      >
        ↻
      </button>
    </div>
  );
};

export default SpeakingTimerDisplay;