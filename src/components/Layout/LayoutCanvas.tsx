import React, { useRef } from 'react';
import { Seat, LayoutSettings, SeatPosition, DragState } from '../../types';
import { snapToGrid } from '../../utils/gridUtils';
import GridOverlay from './GridOverlay';
import CanvasInstructions from './CanvasInstructions';
import PositionedSeat from '../Seats/PositionedSeat';

interface LayoutCanvasProps {
  seats: Seat[];
  layoutSettings: LayoutSettings;
  seatPositions: SeatPosition[];
  dragState: DragState;
  getSeatPosition: (seatNumber: number) => SeatPosition | undefined;
  updateSeatPosition: (seatNumber: number, x: number, y: number) => void;
  updateSeatStatus: (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => Promise<boolean>;
  onDragEnd: () => void;
  onSeatRemove: (seatNumber: number) => void;
  onSeatDragStart: (seatNumber: number, event: React.MouseEvent) => void;
  saveSeatPositions: (positions: SeatPosition[]) => void;
}

const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
  seats,
  layoutSettings,
  seatPositions,
  dragState,
  getSeatPosition,
  updateSeatPosition,
  updateSeatStatus,
  onDragEnd,
  onSeatRemove,
  onSeatDragStart,
  saveSeatPositions
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (dragState.draggedSeat === null || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = event.clientX - rect.left - dragState.dragOffset.x;
    const rawY = event.clientY - rect.top - dragState.dragOffset.y;
    
    const snapped = snapToGrid(rawX, rawY, layoutSettings);
    updateSeatPosition(dragState.draggedSeat, snapped.x, snapped.y);
  };

  const handleCanvasMouseUp = () => {
    if (dragState.draggedSeat !== null) {
      // Save positions when drag ends
      saveSeatPositions(seatPositions);
      onDragEnd();
    }
  };

  const getCanvasStyle = (): React.CSSProperties => ({
    backgroundImage: layoutSettings.backgroundImage ? `url(${layoutSettings.backgroundImage})` : undefined,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
  });

  const positionedSeats = seats.filter(seat => getSeatPosition(seat.seatNumber));

  return (
    <div className="layout-canvas-container">
      <div 
        ref={canvasRef}
        className="layout-canvas"
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={getCanvasStyle()}
      >
        <GridOverlay layoutSettings={layoutSettings} />

        {/* Positioned Seats */}
        {positionedSeats.map((seat) => {
          const position = getSeatPosition(seat.seatNumber)!;
          return (
            <PositionedSeat
              key={seat.seatNumber}
              seat={seat}
              position={position}
              layoutSettings={layoutSettings}
              isDragging={dragState.draggedSeat === seat.seatNumber}
              onMouseDown={(e) => {
                // Only allow drag when unlocked and left click
                if (!layoutSettings.layoutLocked && e.button === 0) {
                  onSeatDragStart(seat.seatNumber, e);
                }
              }}
              onClick={(e) => {
                if (layoutSettings.layoutLocked && e.button === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  // Toggle microphone status
                  const newMicrophoneOn = !seat.microphoneOn;
                  updateSeatStatus(seat.seatNumber, newMicrophoneOn, false);
                }
              }}
              onContextMenu={(e) => {
                if (!layoutSettings.layoutLocked) {
                  e.preventDefault();
                  onSeatRemove(seat.seatNumber);
                }
              }}
              onDoubleClick={(e) => {
                if (!layoutSettings.layoutLocked) {
                  e.preventDefault();
                  onSeatRemove(seat.seatNumber);
                }
              }}
              onRemove={(e) => {
                e.stopPropagation();
                onSeatRemove(seat.seatNumber);
              }}
            />
          );
        })}

        <CanvasInstructions layoutSettings={layoutSettings} />
      </div>
    </div>
  );
};

export default LayoutCanvas;