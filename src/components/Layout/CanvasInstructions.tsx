import React from 'react';
import { LayoutSettings } from '../../types';

interface CanvasInstructionsProps {
  layoutSettings: LayoutSettings;
}

const CanvasInstructions: React.FC<CanvasInstructionsProps> = ({ layoutSettings }) => {
  if (layoutSettings.backgroundImage) return null;

  return (
    <div className="canvas-instructions">
      <p>📁 Upload a background image to get started</p>
      <p>🖱️ Drag seats from the left panel onto this canvas</p>
    </div>
  );
};

export default CanvasInstructions;