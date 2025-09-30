import { LayoutSettings } from '../types';

export const snapToGrid = (x: number, y: number, layoutSettings: LayoutSettings) => {
  if (!layoutSettings.snapToGrid) return { x, y };
  const { gridSize } = layoutSettings;
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  };
};