import './App.css';
import Header from './components/Header/Header';
import ErrorMessage from './components/UI/ErrorMessage';
import SpeakingQueue from './components/Seats/SpeakingQueue';
import RequestingQueue from './components/Seats/RequestingQueue';
import RoomDisplay from './components/Layout/RoomDisplay';
import { useSeats } from './hooks/useSeats';
import { useParticipants } from './hooks/useParticipants';
import { sortSeatsByPriority, calculateSeatStats } from './utils/seatSorting';

function App() {
  const {
    seats,
    error,
    speakerOrder,
    requestOrder,
    updateSeatStatus,
    refreshSeats
  } = useSeats();

  const {
    importExcelFile,
    getParticipantName,
    getParticipantRole,
    isLoading,
    error: importError,
    hasParticipantData
  } = useParticipants();

  // Sort seats by priority and order from API
  const sortedSeats = sortSeatsByPriority(seats, speakerOrder, requestOrder);

  // Get summary statistics
  const stats = calculateSeatStats(seats);

  // Get speaking and requesting seats
  const speakingSeats = sortedSeats.filter(seat => seat.microphoneOn);
  const requestingSeats = sortedSeats.filter(seat => seat.requestingToSpeak && !seat.microphoneOn);

  // Handle Excel import
  const handleImportExcel = async (file: File) => {
    try {
      await importExcelFile(file);
    } catch (err) {
      console.error('Failed to import Excel file:', err);
    }
  };

  return (
    <div className="container">
      <Header 
        stats={stats} 
        onImportExcel={handleImportExcel}
        isImporting={isLoading}
        hasParticipantData={hasParticipantData}
      />

      {error && (
        <ErrorMessage error={error} onRetry={refreshSeats} />
      )}

      {importError && (
        <ErrorMessage error={importError} onRetry={() => {}} />
      )}

      <main>
        {sortedSeats.length > 0 ? (
          <div className="main-layout">
            <div className="queues-panel">
              <SpeakingQueue 
                seats={speakingSeats}
                updateSeatStatus={updateSeatStatus}
                getParticipantName={getParticipantName}
                getParticipantRole={getParticipantRole}
              />
              <RequestingQueue 
                seats={requestingSeats}
                updateSeatStatus={updateSeatStatus}
                getParticipantName={getParticipantName}
                getParticipantRole={getParticipantRole}
              />
            </div>

            <div className="room-display">
              <RoomDisplay 
                seats={sortedSeats} 
                updateSeatStatus={updateSeatStatus}
              />
            </div>
          </div>
        ) : (
          <div className="no-data">No seats data available</div>
        )}
      </main>
    </div>
  );
}

export default App;