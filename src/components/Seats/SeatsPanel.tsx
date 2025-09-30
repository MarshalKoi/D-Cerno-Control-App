import React from 'react';
import { Seat } from '../../types';
import SeatCircle from './SeatCircle';

interface SeatsPanelProps {
  availableSeats: Seat[];
  onSeatDragStart: (seatNumber: number, event: React.MouseEvent) => void;
}

const SeatsPanel: React.FC<SeatsPanelProps> = ({ availableSeats, onSeatDragStart }) => {
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
            <span className={`seat-role-label ${seat.role}`}>
              {seat.role === 'chairperson' ? 'Chairperson' : 'Delegate'}
            </span>
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