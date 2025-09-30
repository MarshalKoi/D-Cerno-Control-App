import React from 'react';
import { Seat } from '../../types';
import SeatCircle from './SeatCircle';
import SpeakingTimerDisplay from '../UI/SpeakingTimerDisplay';

interface SeatsPanelProps {
  availableSeats: Seat[];
  onSeatDragStart: (seatNumber: number, event: React.MouseEvent) => void;
  formatTime?: (seatNumber: number) => string;
  isTimerRunning?: (seatNumber: number) => boolean;
  onTimerReset?: (seatNumber: number) => void;
}

interface SeatsPanelProps {
  availableSeats: Seat[];
  onSeatDragStart: (seatNumber: number, event: React.MouseEvent) => void;
}

const SeatsPanel: React.FC<SeatsPanelProps> = ({ 
  availableSeats, 
  onSeatDragStart,
  formatTime,
  isTimerRunning,
  onTimerReset
}) => {
  return (
    <div className="seats-panel">
      <h3>Available Seats</h3>
      <div className="available-seats">
        {availableSeats.map((seat) => (
          <div key={seat.seatNumber} className="available-seat-item">
            <SeatCircle
              seat={seat}
              className="draggable"
              onMouseDown={(e) => onSeatDragStart(seat.seatNumber, e)}
            />
            <div className="seat-info">
              <span className={`seat-role-label ${seat.role}`}>
                {seat.role === 'chairperson' ? 'Chairperson' : 'Delegate'}
              </span>
              {formatTime && isTimerRunning && onTimerReset && (
                <SpeakingTimerDisplay
                  seatNumber={seat.seatNumber}
                  displayTime={formatTime(seat.seatNumber)}
                  isRunning={isTimerRunning(seat.seatNumber)}
                  onReset={() => onTimerReset(seat.seatNumber)}
                  className="seat-timer"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {availableSeats.length === 0 && (
        <p className="no-available">All seats positioned</p>
      )}
    </div>
  );
};

export default SeatsPanel;