import { Seat } from '../../types';

interface RequestingQueueProps {
  seats: Seat[];
  updateSeatStatus: (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => Promise<boolean>;
  getParticipantName: (seatNumber: number) => string;
  getParticipantRole: (seatNumber: number, defaultRole: string) => string;
}

const RequestingQueue = ({ seats, updateSeatStatus, getParticipantName, getParticipantRole }: RequestingQueueProps) => {
  const handleGrantSpeaking = async (seat: Seat) => {
    await updateSeatStatus(seat.seatNumber, true, false);
  };

  const handleDenyRequest = async (seat: Seat) => {
    await updateSeatStatus(seat.seatNumber, false, false);
  };

  return (
    <div className="queue-section">
      <div className="queue-header">
        <h3>Requesting</h3>
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
                <td colSpan={3} className="empty-queue">No requests</td>
              </tr>
            ) : (
              seats.map((seat) => (
                <tr key={seat.seatNumber} className="seat-row">
                  <td className="seat-number">
                    <div className="seat-actions">
                      <button 
                        className="seat-toggle-btn requesting"
                        onClick={() => handleGrantSpeaking(seat)}
                        title={`Grant speaking permission to seat ${seat.seatNumber}`}
                      >
                        {seat.seatNumber}
                      </button>
                      <button 
                        className="deny-btn"
                        onClick={() => handleDenyRequest(seat)}
                        title={`Deny request from seat ${seat.seatNumber}`}
                      >
                        ×
                      </button>
                    </div>
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

export default RequestingQueue;