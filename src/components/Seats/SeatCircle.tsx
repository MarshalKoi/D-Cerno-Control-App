import React from 'react';
import { Seat } from '../../types';

interface SeatCircleProps {
  seat: Seat;
  className?: string;
  title?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const SeatCircle: React.FC<SeatCircleProps> = ({
  seat,
  className = '',
  title,
  onMouseDown,
  onClick,
  onContextMenu,
  onDoubleClick,
  style,
  children
}) => {
  const getSeatClasses = () => {
    const baseClasses = ['seat-circle'];
    
    if (seat.microphoneOn) {
      baseClasses.push('speaking');
    } else if (seat.requestingToSpeak) {
      baseClasses.push('requesting');
    }
    
    if (className) {
      baseClasses.push(className);
    }
    
    return baseClasses.join(' ');
  };

  const getSeatTitle = () => {
    if (title) return title;
    
    const status = seat.microphoneOn 
      ? ' - Speaking' 
      : seat.requestingToSpeak 
        ? ' - Requesting' 
        : ' - Idle';
    
    return `Seat ${seat.seatNumber} (${seat.role})${status}`;
  };

  return (
    <div 
      className={getSeatClasses()}
      title={getSeatTitle()}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      style={style}
    >
      {seat.role === 'chairperson' && (
        <div className="chairperson-star">★</div>
      )}
      <span className="seat-number">{seat.seatNumber}</span>
      {children}
    </div>
  );
};

export default SeatCircle;