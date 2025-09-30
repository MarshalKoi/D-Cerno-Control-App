import { useState, useEffect } from 'react';
import { LayoutSettings, SeatPosition } from '../types';

const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  backgroundImage: null,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  layoutLocked: false
};

export const useLayout = () => {
  const [seatPositions, setSeatPositions] = useState<SeatPosition[]>([]);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(DEFAULT_LAYOUT_SETTINGS);

  const loadLayoutSettings = () => {
    try {
      const saved = localStorage.getItem('room-layout-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setLayoutSettings(settings);
      }
      
      const savedPositions = localStorage.getItem('seat-positions');
      if (savedPositions) {
        setSeatPositions(JSON.parse(savedPositions));
      }
    } catch (error) {
      console.error('Error loading layout settings:', error);
    }
  };

  const saveLayoutSettings = (settings: LayoutSettings) => {
    setLayoutSettings(settings);
    localStorage.setItem('room-layout-settings', JSON.stringify(settings));
  };

  const saveSeatPositions = (positions: SeatPosition[]) => {
    setSeatPositions(positions);
    localStorage.setItem('seat-positions', JSON.stringify(positions));
  };

  const getSeatPosition = (seatNumber: number) => {
    return seatPositions.find(pos => pos.seatNumber === seatNumber);
  };

  const updateSeatPosition = (seatNumber: number, x: number, y: number) => {
    const updatedPositions = seatPositions.map(pos =>
      pos.seatNumber === seatNumber
        ? { ...pos, x, y }
        : pos
    );
    
    // If seat doesn't have a position yet, add it
    if (!seatPositions.find(pos => pos.seatNumber === seatNumber)) {
      updatedPositions.push({
        seatNumber,
        x,
        y
      });
    }
    
    setSeatPositions(updatedPositions);
  };

  const removeSeatPosition = (seatNumber: number) => {
    const updatedPositions = seatPositions.filter(pos => pos.seatNumber !== seatNumber);
    saveSeatPositions(updatedPositions);
  };

  const clearAllPositions = () => {
    saveSeatPositions([]);
  };

  // Load saved settings on component mount
  useEffect(() => {
    loadLayoutSettings();
  }, []);

  return {
    seatPositions,
    layoutSettings,
    saveLayoutSettings,
    saveSeatPositions,
    getSeatPosition,
    updateSeatPosition,
    removeSeatPosition,
    clearAllPositions
  };
};