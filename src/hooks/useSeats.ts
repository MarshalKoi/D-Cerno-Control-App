import { useState, useEffect } from 'react';
import { Seat, SidecarStatus } from '../types';
import { ApiService } from '../services/api';

export const useSeats = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidecarStatus, setSidecarStatus] = useState<SidecarStatus>('checking');
  const [speakerOrder, setSpeakerOrder] = useState<number[]>([]);
  const [requestOrder, setRequestOrder] = useState<number[]>([]);

  const fetchSeats = async () => {
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [seatsData, speakerOrderData, requestOrderData] = await Promise.all([
        ApiService.fetchSeats(),
        ApiService.fetchSpeakerOrder(),
        ApiService.fetchRequestOrder()
      ]);
      
      setSeats(seatsData);
      setSpeakerOrder(speakerOrderData);
      setRequestOrder(requestOrderData);
      setSidecarStatus('online');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSidecarStatus('offline');
      console.error('Error fetching data:', err);
    }
  };

  const updateSeatStatus = async (seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean) => {
    try {
      const success = await ApiService.updateSeatStatus(seatNumber, microphoneOn, requestingToSpeak);
      if (success) {
        // Refresh seats data after successful update
        fetchSeats();
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
      setSidecarStatus(isHealthy ? 'online' : 'offline');
      return isHealthy;
    } catch {
      setSidecarStatus('offline');
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
    sidecarStatus,
    speakerOrder,
    requestOrder,
    fetchSeats,
    updateSeatStatus,
    refreshSeats,
    setError
  };
};