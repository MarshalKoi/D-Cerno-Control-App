import { useState, useEffect, useCallback } from 'react';
import { Seat } from '../types';

interface SpeakingTimerData {
  totalTime: number; // Total accumulated speaking time in seconds
  startTime: number | null; // When current speaking session started (timestamp)
  isRunning: boolean; // Whether timer is currently running
}

export const useSpeakingTimers = () => {
  const [timers, setTimers] = useState<Map<number, SpeakingTimerData>>(new Map());
  const [, forceUpdate] = useState(0);

  // Force re-render every second to update display
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update timers based on seat microphone status
  const updateTimers = useCallback((seats: Seat[]) => {
    const now = Date.now();
    
    setTimers(prevTimers => {
      const newTimers = new Map(prevTimers);
      
      seats.forEach(seat => {
        const currentTimer = newTimers.get(seat.seatNumber) || {
          totalTime: 0,
          startTime: null,
          isRunning: false
        };

        let updatedTimer = { ...currentTimer };

        // Handle microphone state changes
        if (seat.microphoneOn && !currentTimer.isRunning) {
          // Started speaking - start timer
          updatedTimer = {
            ...currentTimer,
            startTime: now,
            isRunning: true
          };
        } else if (!seat.microphoneOn && currentTimer.isRunning) {
          // Stopped speaking - pause timer and accumulate time
          const sessionTime = currentTimer.startTime 
            ? Math.floor((now - currentTimer.startTime) / 1000)
            : 0;
          
          updatedTimer = {
            totalTime: currentTimer.totalTime + sessionTime,
            startTime: null,
            isRunning: false
          };
        }

        newTimers.set(seat.seatNumber, updatedTimer);
      });

      return newTimers;
    });
  }, []);

  // Reset timer for a specific seat
  const resetTimer = useCallback((seatNumber: number) => {
    setTimers(prevTimers => {
      const newTimers = new Map(prevTimers);
      newTimers.set(seatNumber, {
        totalTime: 0,
        startTime: null,
        isRunning: false
      });
      return newTimers;
    });
  }, []);

  // Reset all timers
  const resetAllTimers = useCallback(() => {
    setTimers(new Map());
  }, []);

  // Get current speaking time for a seat
  const getCurrentTime = useCallback((seatNumber: number): number => {
    const timer = timers.get(seatNumber);
    if (!timer) return 0;

    let currentTime = timer.totalTime;
    
    if (timer.isRunning && timer.startTime) {
      const sessionTime = Math.floor((Date.now() - timer.startTime) / 1000);
      currentTime += sessionTime;
    }

    return currentTime;
  }, [timers]);

  // Format time as MM:SS
  const formatTime = useCallback((seatNumber: number): string => {
    const totalSeconds = getCurrentTime(seatNumber);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [getCurrentTime]);

  // Check if timer is running for a seat
  const isTimerRunning = useCallback((seatNumber: number): boolean => {
    const timer = timers.get(seatNumber);
    return timer?.isRunning || false;
  }, [timers]);

  return {
    updateTimers,
    resetTimer,
    resetAllTimers,
    getCurrentTime,
    formatTime,
    isTimerRunning
  };
};