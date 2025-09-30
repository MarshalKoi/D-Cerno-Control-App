export interface Seat {
  seatNumber: number;
  microphoneOn: boolean;
  requestingToSpeak: boolean;
  role: string;
}

export interface SeatPosition {
  seatNumber: number;
  x: number;
  y: number;
}

export interface LayoutSettings {
  backgroundImage: string | null;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layoutLocked: boolean;
}

export interface SeatStats {
  total: number;
  speaking: number;
  requesting: number;
  idle: number;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export type SidecarStatus = 'checking' | 'online' | 'offline';

export interface DragState {
  draggedSeat: number | null;
  dragOffset: { x: number; y: number };
}