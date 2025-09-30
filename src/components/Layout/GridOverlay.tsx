import React from 'react';
import { LayoutSettings } from '../../types';

interface GridOverlayProps {
  layoutSettings: LayoutSettings;
}

const GridOverlay: React.FC<GridOverlayProps> = ({ layoutSettings }) => {
  if (!layoutSettings.showGrid) return null;

  const gridStyle = {
    backgroundSize: `${layoutSettings.gridSize}px ${layoutSettings.gridSize}px`,
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
    `
  };

  return <div className="grid-overlay" style={gridStyle} />;
};

export default GridOverlay;