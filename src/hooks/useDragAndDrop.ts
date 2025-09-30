import { useState } from 'react';
import { DragState } from '../types';

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    draggedSeat: null,
    dragOffset: { x: 0, y: 0 }
  });

  const startDrag = (seatNumber: number, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDragState({
      draggedSeat: seatNumber,
      dragOffset: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    });
  };

  const endDrag = () => {
    setDragState({
      draggedSeat: null,
      dragOffset: { x: 0, y: 0 }
    });
  };

  const isDragging = (seatNumber: number) => {
    return dragState.draggedSeat === seatNumber;
  };

  return {
    dragState,
    startDrag,
    endDrag,
    isDragging
  };
};