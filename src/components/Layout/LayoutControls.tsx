import React, { useRef } from 'react';
import { LayoutSettings, SeatPosition } from '../../types';

interface LayoutControlsProps {
  layoutSettings: LayoutSettings;
  seatPositions: SeatPosition[];
  onSettingsChange: (settings: LayoutSettings) => void;
  onBackgroundUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBackground: () => void;
  onClearAllPositions: () => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
  layoutSettings,
  seatPositions,
  onSettingsChange,
  onBackgroundUpload,
  onClearBackground,
  onClearAllPositions
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearPositions = () => {
    onClearAllPositions();
  };

  return (
    <div className="view-controls">
      <div className="layout-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onBackgroundUpload}
          style={{ display: 'none' }}
        />
        
        <button 
          className="control-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📁 Upload Background
        </button>
        
        <button 
          className={`control-btn ${layoutSettings.showGrid ? 'active' : ''}`}
          onClick={() => onSettingsChange({...layoutSettings, showGrid: !layoutSettings.showGrid})}
        >
          ⊞ Grid {layoutSettings.showGrid ? 'On' : 'Off'}
        </button>
        
        <button 
          className={`control-btn ${layoutSettings.snapToGrid ? 'active' : ''}`}
          onClick={() => onSettingsChange({...layoutSettings, snapToGrid: !layoutSettings.snapToGrid})}
        >
          🧲 Snap {layoutSettings.snapToGrid ? 'On' : 'Off'}
        </button>

        <button 
          className={`control-btn ${layoutSettings.layoutLocked ? 'active' : ''}`}
          onClick={() => onSettingsChange({...layoutSettings, layoutLocked: !layoutSettings.layoutLocked})}
          title={layoutSettings.layoutLocked ? 'Layout is protected from changes' : 'Layout can be modified'}
        >
          {layoutSettings.layoutLocked ? '🔒 Locked' : '🔓 Unlocked'}
        </button>

        <button 
          className="control-btn"
          onClick={onClearBackground}
          disabled={!layoutSettings.backgroundImage}
          title="Remove background image"
        >
          🖼️ Clear Background
        </button>

        <button 
          className="control-btn danger"
          onClick={handleClearPositions}
          disabled={seatPositions.length === 0}
        >
          🗑️ Clear Positions
        </button>
      </div>
    </div>
  );
};

export default LayoutControls;