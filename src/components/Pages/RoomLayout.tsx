import React from 'react';
import ErrorMessage from '../UI/ErrorMessage';
import LayoutControls from '../Layout/LayoutControls';
import SeatsPanel from '../Seats/SeatsPanel';
import LayoutCanvas from '../Layout/LayoutCanvas';
import { Seat, LayoutSettings, SeatPosition, DragState } from '../../types';

interface RoomLayoutProps {
  // Seats data
  seats: Seat[];
  error: string | null;
  onRetry: () => void;
  
  // Layout management
  layoutSettings: LayoutSettings;
  seatPositions: SeatPosition[];
  onSettingsChange: (settings: LayoutSettings) => void;
  onBackgroundUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBackground: () => void;
  onClearAllPositions: () => void;
  onResetAllTimers: () => void;
  
  // Seats management
  availableSeats: Seat[];
  onSeatDragStart: (seatNumber: number, event: React.MouseEvent) => void;
  getSeatPosition: (seatNumber: number) => SeatPosition | undefined;
  
  // Timer functions
  formatTime: (seatNumber: number) => string;
  isTimerRunning: (seatNumber: number) => boolean;
  onTimerReset: (seatNumber: number) => void;
  
  // Canvas functions
  dragState: DragState;
  updateSeatPosition: (seatNumber: number, x: number, y: number) => void;
  updateSeatStatus: (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => Promise<boolean>;
  onDragEnd: () => void;
  onSeatRemove: (seatNumber: number) => void;
  saveSeatPositions: (positions: SeatPosition[]) => void;
}

const RoomLayout: React.FC<RoomLayoutProps> = ({
  seats,
  error,
  onRetry,
  layoutSettings,
  seatPositions,
  onSettingsChange,
  onBackgroundUpload,
  onClearBackground,
  onClearAllPositions,
  onResetAllTimers,
  availableSeats,
  onSeatDragStart,
  getSeatPosition,
  formatTime,
  isTimerRunning,
  onTimerReset,
  dragState,
  updateSeatPosition,
  updateSeatStatus,
  onDragEnd,
  onSeatRemove,
  saveSeatPositions
}) => {
  return (
    <div className="page-container">
      <div className="page-content">
        {error && (
          <ErrorMessage error={error} onRetry={onRetry} />
        )}

        <LayoutControls
          layoutSettings={layoutSettings}
          seatPositions={seatPositions}
          onSettingsChange={onSettingsChange}
          onBackgroundUpload={onBackgroundUpload}
          onClearBackground={onClearBackground}
          onClearAllPositions={onClearAllPositions}
          onResetAllTimers={onResetAllTimers}
        />

        {seats.length > 0 ? (
          <div className="layout-container">
            <SeatsPanel
              availableSeats={availableSeats}
              onSeatDragStart={onSeatDragStart}
              formatTime={formatTime}
              isTimerRunning={isTimerRunning}
              onTimerReset={onTimerReset}
              getSeatPosition={getSeatPosition}
            />

            <LayoutCanvas
              seats={seats}
              layoutSettings={layoutSettings}
              seatPositions={seatPositions}
              dragState={dragState}
              getSeatPosition={getSeatPosition}
              updateSeatPosition={updateSeatPosition}
              updateSeatStatus={updateSeatStatus}
              onDragEnd={onDragEnd}
              onSeatRemove={onSeatRemove}
              onSeatDragStart={onSeatDragStart}
              saveSeatPositions={saveSeatPositions}
            />
          </div>
        ) : (
          <div className="no-data">No seats data available</div>
        )}
      </div>
    </div>
  );
};

export default RoomLayout;