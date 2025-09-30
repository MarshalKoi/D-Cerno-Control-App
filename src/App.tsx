import React, { useEffect } from 'react';
import './App.css';
import Header from './components/Header/Header';
import ErrorMessage from './components/UI/ErrorMessage';
import ConfirmModal from './components/UI/ConfirmModal';
import LayoutControls from './components/Layout/LayoutControls';
import SeatsPanel from './components/Seats/SeatsPanel';
import LayoutCanvas from './components/Layout/LayoutCanvas';
import { useSeats } from './hooks/useSeats';
import { useLayout } from './hooks/useLayout';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useModal } from './hooks/useModal';
import { useSpeakingTimers } from './hooks/useSpeakingTimers';
import { sortSeatsByPriority, calculateSeatStats } from './utils/seatSorting';

function App() {
  const {
    seats,
    error,
    sidecarStatus,
    speakerOrder,
    requestOrder,
    updateSeatStatus,
    refreshSeats,
    setError
  } = useSeats();

  const {
    seatPositions,
    layoutSettings,
    saveLayoutSettings,
    saveSeatPositions,
    getSeatPosition,
    updateSeatPosition,
    removeSeatPosition,
    clearAllPositions
  } = useLayout();

  const { dragState, startDrag, endDrag } = useDragAndDrop();
  const { modalState, showModal, closeModal } = useModal();
  const { updateTimers, resetTimer, resetAllTimers, formatTime, isTimerRunning } = useSpeakingTimers();

  // Sort seats by priority and order from API
  const sortedSeats = sortSeatsByPriority(seats, speakerOrder, requestOrder);

  // Update speaking timers when seats change
  useEffect(() => {
    updateTimers(sortedSeats);
  }, [sortedSeats, updateTimers]);

  // Get summary statistics
  const stats = calculateSeatStats(seats);

  // Show all seats in available list (allow duplicates to be dragged out)
  const availableSeats = sortedSeats;

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        saveLayoutSettings({
          ...layoutSettings,
          backgroundImage: imageUrl
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset the file input value to allow re-selecting the same file
    event.target.value = '';
  };

  const handleClearBackground = () => {
    showModal(
      'Remove Background Image',
      'This will remove the background image from your layout. Seat positions will remain unchanged.',
      () => {
        saveLayoutSettings({...layoutSettings, backgroundImage: null});
        closeModal();
      },
      'Remove Image',
      'Cancel'
    );
  };

  const handleClearAllPositions = async () => {
    const positionedCount = seatPositions.length;
    const seatNumbers = seatPositions.map(pos => pos.seatNumber).sort((a, b) => a - b).join(', ');
    
    showModal(
      'Clear All Seat Positions',
      `This will remove all ${positionedCount} positioned seats from the layout and deactivate their microphones:\n\nSeats: ${seatNumbers}\n\nThe background image will remain unchanged.`,
      async () => {
        // Get all positioned seat numbers
        const positionedSeatNumbers = seatPositions.map(pos => pos.seatNumber);
        
        // Deactivate microphones for all positioned seats
        const deactivationPromises = positionedSeatNumbers.map(seatNumber => 
          updateSeatStatus(seatNumber, false, false)
        );
        
        try {
          // Wait for all deactivations to complete
          await Promise.all(deactivationPromises);
          
          // Then clear all positions
          clearAllPositions();
        } catch (error) {
          console.error('Error deactivating seats:', error);
          setError('Failed to deactivate some seats. Please try again.');
        }
        
        closeModal();
      },
      'Clear All Positions',
      'Cancel',
      true // danger = true
    );
  };

  const handleResetAllTimers = () => {
    showModal(
      'Reset All Speaking Timers',
      'This will reset the speaking timers for all seats to 00:00. This action cannot be undone.',
      () => {
        resetAllTimers();
        closeModal();
      },
      'Reset All Timers',
      'Cancel'
    );
  };

  const handleSeatRemove = async (seatNumber: number) => {
    const seat = seats.find(s => s.seatNumber === seatNumber);
    if (!seat) return;
    
    showModal(
      'Remove Seat from Layout',
      `Remove seat ${seat.seatNumber} (${seat.role}) from the layout?\n\nThis seat will return to the available seats panel and microphone will be deactivated.`,
      async () => {
        // First, deactivate the microphone for this seat
        await updateSeatStatus(seatNumber, false, false);
        
        // Then remove from layout positions
        removeSeatPosition(seatNumber);
        closeModal();
      },
      'Remove Seat',
      'Cancel'
    );
  };

  return (
    <div className="container">
      <Header sidecarStatus={sidecarStatus} stats={stats} />

      {error && (
        <ErrorMessage error={error} onRetry={refreshSeats} />
      )}

      <main>
        <LayoutControls
          layoutSettings={layoutSettings}
          seatPositions={seatPositions}
          onSettingsChange={saveLayoutSettings}
          onBackgroundUpload={handleBackgroundUpload}
          onClearBackground={handleClearBackground}
          onClearAllPositions={handleClearAllPositions}
          onResetAllTimers={handleResetAllTimers}
        />

        {sortedSeats.length > 0 ? (
          <div className="layout-container">
            <SeatsPanel
              availableSeats={availableSeats}
              onSeatDragStart={startDrag}
              formatTime={formatTime}
              isTimerRunning={isTimerRunning}
              onTimerReset={resetTimer}
              getSeatPosition={getSeatPosition}
            />

            <LayoutCanvas
              seats={sortedSeats}
              layoutSettings={layoutSettings}
              seatPositions={seatPositions}
              dragState={dragState}
              getSeatPosition={getSeatPosition}
              updateSeatPosition={updateSeatPosition}
              updateSeatStatus={updateSeatStatus}
              onDragEnd={endDrag}
              onSeatRemove={handleSeatRemove}
              onSeatDragStart={startDrag}
              saveSeatPositions={saveSeatPositions}
            />
          </div>
        ) : (
          <div className="no-data">No seats data available</div>
        )}
      </main>

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeModal}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        danger={modalState.danger}
      />
    </div>
  );
}

export default App;