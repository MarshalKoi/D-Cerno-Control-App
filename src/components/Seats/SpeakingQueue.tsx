import { Seat } from '../../types';

interface SpeakingQueueProps {
  seats: Seat[];
  updateSeatStatus: (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => Promise<boolean>;
  getParticipantName: (seatNumber: number) => string;
  getParticipantRole: (seatNumber: number, defaultRole: string) => string;
}

const SpeakingQueue = ({ seats, updateSeatStatus, getParticipantName, getParticipantRole }: SpeakingQueueProps) => {
  const handleToggleMicrophone = async (seat: Seat) => {
    await updateSeatStatus(seat.seatNumber, !seat.microphoneOn, false);
  };

  return (
    <div className="queue-section">
      <div className="queue-header">
        <h3>Speaking</h3>
      </div>
      <div className="queue-table">
        <table>
          <thead>
            <tr>
              <th>Seat</th>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {seats.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-queue">No speakers</td>
              </tr>
            ) : (
              seats.map((seat) => (
                <tr key={seat.seatNumber} className="seat-row">
                  <td className="seat-number">
                    <button 
                      className="seat-toggle-btn active"
                      onClick={() => handleToggleMicrophone(seat)}
                      title={`Turn off microphone for seat ${seat.seatNumber}`}
                    >
                      {seat.seatNumber}
                    </button>
                  </td>
                  <td className="seat-name">
                    {getParticipantName(seat.seatNumber)}
                  </td>
                  <td className="seat-role">{getParticipantRole(seat.seatNumber, seat.role)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpeakingQueue;