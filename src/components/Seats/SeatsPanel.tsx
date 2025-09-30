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
  getSeatPosition?: (seatNumber: number) => { seatNumber: number; x: number; y: number } | undefined;
}

const SeatsPanel: React.FC<SeatsPanelProps> = ({ 
  availableSeats, 
  onSeatDragStart,
  formatTime,
  isTimerRunning,
  onTimerReset,
  getSeatPosition
}) => {
  return (
    <div className="seats-panel">
      <h3>All Seats</h3>
      <p className="panel-description">Click or Drag seats to the canvas to position them.</p>
      <div className="available-seats">
        {availableSeats.map((seat) => {
          const isPositioned = getSeatPosition?.(seat.seatNumber);
          const handleDragStart = (e: React.MouseEvent) => {
            if (isPositioned) {
              e.preventDefault(); // Prevent drag if already positioned
              return;
            }
            onSeatDragStart(seat.seatNumber, e);
          };

          return (
            <div key={seat.seatNumber} className={`available-seat-item ${isPositioned ? 'positioned' : ''}`}>
              <SeatCircle
                seat={seat}
                className={`draggable ${isPositioned ? 'already-positioned' : ''}`}
                onMouseDown={handleDragStart}
                title={isPositioned ? 'This seat is already positioned on the canvas' : undefined}
              />
              <div className="seat-info">
                <span className={`seat-role-label ${seat.role}`}>
                  {seat.role === 'chairperson' ? 'Chairperson' : 'Delegate'}
                  {isPositioned && <span className="positioned-indicator"> (Positioned)</span>}
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
          );
        })}
      </div>
      {availableSeats.length === 0 && (
        <p className="no-available">No seats data available</p>
      )}
    </div>
  );
};

export default SeatsPanel;