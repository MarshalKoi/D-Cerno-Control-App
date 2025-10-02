import { useState, useEffect } from 'react';
import { Seat } from '../types';
import { ApiService } from '../services/api';

export const useSeats = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [speakerOrder, setSpeakerOrder] = useState<number[]>([]);
  const [requestOrder, setRequestOrder] = useState<number[]>([]);

  const fetchSeats = async () => {
    setError(null);
    
    try {
      console.log('🔄 Fetching all data via universal endpoint...');
      const startTime = Date.now();
      
      // Fetch all data in one call using the universal endpoint
      const allData = await ApiService.fetchAllData();
      
      const endTime = Date.now();
      console.log(`✅ Universal fetch completed in ${endTime - startTime}ms - Seats: ${allData.seats.length}, Speakers: ${allData.speakerOrder.length}, Requests: ${allData.requestOrder.length}`);
      
      setSeats(allData.seats);
      setSpeakerOrder(allData.speakerOrder);
      setRequestOrder(allData.requestOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      console.error('Error fetching data:', err);
    }
  };

  const updateSeatStatus = async (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => {
    try {
      const success = await ApiService.updateSeatStatus(seatNumber, microphoneOn, requestingToSpeak);
      if (success) {
        // No need to refresh manually - hybrid clock will handle immediate updates
        console.log(`✅ Seat ${seatNumber} updated - hybrid clock will refresh data`);
        return true;
      }
      throw new Error('Failed to update seat status');
    } catch (error) {
      console.error('Error updating seat status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update seat status');
      return false;
    }
  };

  const checkSidecarHealth = async () => {
    try {
      const isHealthy = await ApiService.checkHealth();
      return isHealthy;
    } catch {
      return false;
    }
  };

  const refreshSeats = () => {
    fetchSeats();
  };

  // Auto-refresh data every second
  useEffect(() => {
    // Check sidecar health first
    const initializeApp = async () => {
      const isHealthy = await checkSidecarHealth();
      if (isHealthy) {
        fetchSeats();
      }
    };

    initializeApp();

    // Set up auto-refresh at 1 second intervals
    const dataTimer = setInterval(() => {
      fetchSeats();
    }, 1000);

    // Check sidecar health every 30 seconds
    const healthTimer = setInterval(() => {
      checkSidecarHealth();
    }, 30000);

    return () => {
      clearInterval(dataTimer);
      clearInterval(healthTimer);
    };
  }, []);

  return {
    seats,
    error,
    speakerOrder,
    requestOrder,
    fetchSeats,
    updateSeatStatus,
    refreshSeats,
    setError
  };
};