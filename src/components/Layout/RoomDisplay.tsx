import { Seat } from '../../types';

interface RoomDisplayProps {
  seats: Seat[];
  updateSeatStatus: (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => Promise<boolean>;
}

const RoomDisplay = ({ seats, updateSeatStatus }: RoomDisplayProps) => {
  // Example seat positions - you can edit these coordinates to position seats correctly
  const exampleSeatPositions = [
    { seatNumber: 1, x: 20, y: 50 },
    { seatNumber: 2, x: 27, y: 33 },
    { seatNumber: 3, x: 37, y: 31 }, 
    { seatNumber: 4, x: 47, y: 30 },  
    { seatNumber: 5, x: 57, y: 30 },
    { seatNumber: 6, x: 68, y: 31 },
    { seatNumber: 7, x: 78, y: 33 },
    { seatNumber: 8, x: 84, y: 50 },
    { seatNumber: 9, x: 78, y: 68 },
    { seatNumber: 10, x: 68, y: 70 },
    { seatNumber: 11, x: 57, y: 71 },
    { seatNumber: 12, x: 47, y: 71 },
    { seatNumber: 13, x: 37, y: 70 },
    { seatNumber: 14, x: 27, y: 68 },
  ];

  const getSeatStatus = (seatNumber: number) => {
    const seat = seats.find(s => s.seatNumber === seatNumber);
    if (!seat) return 'idle';
    if (seat.microphoneOn) return 'speaking';
    if (seat.requestingToSpeak) return 'requesting';
    return 'idle';
  };

  // Toggle microphone based on your state transition logic
  const handleSeatClick = async (seatNumber: number) => {
    const seat = seats.find(s => s.seatNumber === seatNumber);
    if (!seat) return;

    const { microphoneOn, requestingToSpeak } = seat;
    let newMicrophoneOn: boolean;
    let newRequestingToSpeak: boolean;

    // State transition logic as specified:
    if (!microphoneOn && !requestingToSpeak) {
      // Idle → Speaking
      newMicrophoneOn = true;
      newRequestingToSpeak = false;
    } else if (microphoneOn && !requestingToSpeak) {
      // Speaking → Idle  
      newMicrophoneOn = false;
      newRequestingToSpeak = false;
    } else if (!microphoneOn && requestingToSpeak) {
      // Requesting → Speaking (grant the request)
      newMicrophoneOn = true;
      newRequestingToSpeak = false;
    } else {
      // This shouldn't happen, but handle edge case
      newMicrophoneOn = false;
      newRequestingToSpeak = false;
    }

    console.log(`🔄 Seat ${seatNumber} transition: {mic: ${microphoneOn}, req: ${requestingToSpeak}} → {mic: ${newMicrophoneOn}, req: ${newRequestingToSpeak}}`);
    
    try {
      await updateSeatStatus(seatNumber, newMicrophoneOn, newRequestingToSpeak);
    } catch (error) {
      console.error(`Failed to update seat ${seatNumber}:`, error);
    }
  };

  return (
    <div className="room-display">
      <div className="room-image-container">
        <div 
          className="room-background"
          style={{
            backgroundImage: 'url("/src/assets/meeting-room-plan.png")',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            position: 'relative',
            width: '100%',
            height: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        >
          {/* Positioned seat circles */}
          {exampleSeatPositions.map(position => {
            const status = getSeatStatus(position.seatNumber);
            return (
              <div
                key={position.seatNumber}
                className={`positioned-seat-circle ${status}`}
                style={{
                  position: 'absolute',
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`Seat ${position.seatNumber} - ${status} (Click to toggle)`}
                onClick={() => handleSeatClick(position.seatNumber)}
              >
                {position.seatNumber}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoomDisplay;