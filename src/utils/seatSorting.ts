import { Seat } from '../types';

export const sortSeatsByPriority = (
  seats: Seat[], 
  speakerOrder: number[], 
  requestOrder: number[]
): Seat[] => {
  return seats.sort((a, b) => {
    // Priority sorting: Speaking > Requesting > Idle
    const getPriority = (seat: Seat) => {
      if (seat.microphoneOn) return 3; // Speaking - highest priority
      if (seat.requestingToSpeak) return 2; // Requesting - medium priority
      return 1; // Idle - lowest priority
    };
    
    const priorityDiff = getPriority(b) - getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by order from API (first pressed first)
    if (a.microphoneOn && b.microphoneOn) {
      // Both speaking - use speaker order
      const aIndex = speakerOrder.indexOf(a.seatNumber);
      const bIndex = speakerOrder.indexOf(b.seatNumber);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex; // Earlier in list = first to speak
      }
    } else if (a.requestingToSpeak && b.requestingToSpeak && !a.microphoneOn && !b.microphoneOn) {
      // Both requesting - use request order
      const aIndex = requestOrder.indexOf(a.seatNumber);
      const bIndex = requestOrder.indexOf(b.seatNumber);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex; // Earlier in list = first to request
      }
    }
    
    // Fallback to seat number if no order data available
    return a.seatNumber - b.seatNumber;
  });
};

export const calculateSeatStats = (seats: Seat[]) => {
  return {
    total: seats.length,
    speaking: seats.filter(s => s.microphoneOn).length,
    requesting: seats.filter(s => s.requestingToSpeak && !s.microphoneOn).length,
    idle: seats.filter(s => !s.microphoneOn && !s.requestingToSpeak).length
  };
};