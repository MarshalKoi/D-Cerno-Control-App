import React from 'react';

const RecordingsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">🎬</div>
          <h2>Coming Soon</h2>
          <p>This page will include:</p>
          <ul>
            <li>Session recording management</li>
            <li>Audio/video playback controls</li>
            <li>Recording timeline with speaker segments</li>
            <li>Export and sharing options</li>
            <li>Search and filter recordings</li>
            <li>Automatic transcription (future)</li>
          </ul>
          
          <div className="recording-preview">
            <h3>Recording Features</h3>
            <div className="feature-grid">
              <div className="feature-item">
                <span className="feature-icon">🎵</span>
                <span className="feature-text">Audio Recording</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span className="feature-text">Speaker Analytics</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⏱️</span>
                <span className="feature-text">Timestamp Markers</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💾</span>
                <span className="feature-text">Auto-Save</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span className="feature-text">Search & Filter</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📤</span>
                <span className="feature-text">Export Options</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingsPage;