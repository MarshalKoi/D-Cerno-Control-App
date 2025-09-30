import React from 'react';
import { Seat, SeatPosition, LayoutSettings } from '../../types';
import SeatCircle from './SeatCircle';

interface PositionedSeatProps {
  seat: Seat;
  position: SeatPosition;
  layoutSettings: LayoutSettings;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

const PositionedSeat: React.FC<PositionedSeatProps> = ({
  seat,
  position,
  layoutSettings,
  isDragging,
  onMouseDown,
  onClick,
  onContextMenu,
  onDoubleClick,
  onRemove
}) => {
  const getClassName = () => {
    const classes = ['positioned'];
    if (isDragging) classes.push('dragging');
    if (layoutSettings.layoutLocked) classes.push('locked');
    return classes.join(' ');
  };

  const getTitle = () => {
    const baseTitle = `Seat ${seat.seatNumber} (${seat.role})`;
    const actionHint = layoutSettings.layoutLocked 
      ? ' - Click to toggle microphone' 
      : ' - Drag to move, Right-click to remove';
    const status = seat.microphoneOn 
      ? ' - Speaking' 
      : seat.requestingToSpeak 
        ? ' - Requesting' 
        : ' - Idle';
    
    return baseTitle + actionHint + status;
  };

  const getStyle = (): React.CSSProperties => ({
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    cursor: layoutSettings.layoutLocked ? 'pointer' : 'move'
  });

  return (
    <SeatCircle
      seat={seat}
      className={getClassName()}
      title={getTitle()}
      style={getStyle()}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      {/* Remove button - only shows when unlocked and on hover */}
      {!layoutSettings.layoutLocked && (
        <button 
          className="seat-remove-btn"
          onClick={onRemove}
          title="Remove from layout"
        >
          ✕
        </button>
      )}
    </SeatCircle>
  );
};

export default PositionedSeat;