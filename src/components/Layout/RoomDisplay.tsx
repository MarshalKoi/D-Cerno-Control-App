import { Seat } from '../../types';

interface RoomDisplayProps {
  seats: Seat[];
}

const RoomDisplay = ({ seats }: RoomDisplayProps) => {
  // Filter seats to show only those that are positioned or active
  const displaySeats = seats.filter(seat => seat.microphoneOn || seat.requestingToSpeak);
  
  return (
    <div className="room-display">
      <div className="room-canvas">
        {/* Placeholder for static room layout */}
        <div className="room-placeholder">
          <h3>Room Layout</h3>
          <p>Static room layout will be displayed here</p>
          
          {/* Simple seat circles for now - matching the mockup */}
          <div className="seat-circles">
            {[1, 2, 3, 4].map(index => (
              <div 
                key={index} 
                className={`seat-circle ${
                  displaySeats.some(seat => seat.seatNumber === index && seat.microphoneOn) ? 'speaking' :
                  displaySeats.some(seat => seat.seatNumber === index && seat.requestingToSpeak) ? 'requesting' : 
                  'idle'
                }`}
              >
                {index}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDisplay;