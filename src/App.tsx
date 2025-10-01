import React, { useEffect, useState } from 'react';
import './App.css';
import Header from './components/Header/Header';
import ConfirmModal from './components/UI/ConfirmModal';
import Navigation, { NavigationPage } from './components/Navigation/Navigation';
import DiscussionMode from './components/Pages/DiscussionMode';
import RoomLayout from './components/Pages/RoomLayout';
import AudioPage from './components/Pages/AudioPage';
import SigninScreen from './components/Auth/SigninScreen';
import { useSeats } from './hooks/useSeats';
import { useLayout } from './hooks/useLayout';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useModal } from './hooks/useModal';
import { useSpeakingTimers } from './hooks/useSpeakingTimers';
import { useAuth } from './hooks/useAuth';
import { sortSeatsByPriority, calculateSeatStats } from './utils/seatSorting';

function App() {
  const { isAuthenticated, isLoading: authLoading, error: authError, signin, signout } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('layout');
  
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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'discussion':
        return <DiscussionMode />;

      case 'layout':
        return (
          <RoomLayout
            seats={sortedSeats}
            error={error}
            onRetry={refreshSeats}
            layoutSettings={layoutSettings}
            seatPositions={seatPositions}
            onSettingsChange={saveLayoutSettings}
            onBackgroundUpload={handleBackgroundUpload}
            onClearBackground={handleClearBackground}
            onClearAllPositions={handleClearAllPositions}
            onResetAllTimers={handleResetAllTimers}
            availableSeats={availableSeats}
            onSeatDragStart={startDrag}
            getSeatPosition={getSeatPosition}
            formatTime={formatTime}
            isTimerRunning={isTimerRunning}
            onTimerReset={resetTimer}
            dragState={dragState}
            updateSeatPosition={updateSeatPosition}
            updateSeatStatus={updateSeatStatus}
            onDragEnd={endDrag}
            onSeatRemove={handleSeatRemove}
            saveSeatPositions={saveSeatPositions}
          />
        );

      case 'audio':
        return <AudioPage />;

      default:
        return <RoomLayout
          seats={sortedSeats}
          error={error}
          onRetry={refreshSeats}
          layoutSettings={layoutSettings}
          seatPositions={seatPositions}
          onSettingsChange={saveLayoutSettings}
          onBackgroundUpload={handleBackgroundUpload}
          onClearBackground={handleClearBackground}
          onClearAllPositions={handleClearAllPositions}
          onResetAllTimers={handleResetAllTimers}
          availableSeats={availableSeats}
          onSeatDragStart={startDrag}
          getSeatPosition={getSeatPosition}
          formatTime={formatTime}
          isTimerRunning={isTimerRunning}
          onTimerReset={resetTimer}
          dragState={dragState}
          updateSeatPosition={updateSeatPosition}
          updateSeatStatus={updateSeatStatus}
          onDragEnd={endDrag}
          onSeatRemove={handleSeatRemove}
          saveSeatPositions={saveSeatPositions}
        />;
    }
  };

  // Show signin screen if not authenticated
  if (!isAuthenticated) {
    return (
      <SigninScreen 
        onSignin={signin}
        isLoading={authLoading}
        error={authError || undefined}
      />
    );
  }

  return (
    <div className="app-layout">
      <Navigation 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <main className="main-content">
        <Header 
          stats={stats}
          sidecarStatus={sidecarStatus}
          onSignout={signout}
        />
        {renderCurrentPage()}
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