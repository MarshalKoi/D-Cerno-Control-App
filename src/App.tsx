import { useState, useEffect, useRef } from 'react';
import './App.css';

interface Seat {
  seatNumber: number;
  microphoneOn: boolean;
  requestingToSpeak: boolean;
  role: string;
}

interface SeatPosition {
  seatNumber: number;
  x: number;
  y: number;
}

interface LayoutSettings {
  backgroundImage: string | null;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  layoutLocked: boolean;
}

function App() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [sidecarStatus, setSidecarStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Speaker/Request ordering state
  const [speakerOrder, setSpeakerOrder] = useState<number[]>([]);
  const [requestOrder, setRequestOrder] = useState<number[]>([]);
  
  // Layout state
  const [seatPositions, setSeatPositions] = useState<SeatPosition[]>([]);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    backgroundImage: null,
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
    layoutLocked: false
  });
  const [draggedSeat, setDraggedSeat] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    danger: false
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort seats by priority and order from API
  const sortedSeats = seats.sort((a, b) => {
    // Priority sorting: Speaking > Requesting > Idle
    const getPriority = (seat: Seat) => {
      if (seat.microphoneOn) return 3; // Speaking - highest priority
      if (seat.requestingToSpeak) return 2; // Requesting - medium priority
      return 1; // Idle - lowest priority
    };
    
    const priorityDiff = getPriority(b) - getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, sort by order from API (first pressed first)
    if (a.microphoneOn && b.microphoneOn) {
      // Both speaking - use speaker order
      const aIndex = speakerOrder.indexOf(a.seatNumber);
      const bIndex = speakerOrder.indexOf(b.seatNumber);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex; // Earlier in list = first to speak
      }
    } else if (a.requestingToSpeak && b.requestingToSpeak && !a.microphoneOn && !b.microphoneOn) {
      // Both requesting - use request order
      const aIndex = requestOrder.indexOf(a.seatNumber);
      const bIndex = requestOrder.indexOf(b.seatNumber);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex; // Earlier in list = first to request
      }
    }
    
    // Fallback to seat number if no order data available
    return a.seatNumber - b.seatNumber;
  });

  // Get summary statistics
  const stats = {
    total: seats.length,
    speaking: seats.filter(s => s.microphoneOn).length,
    requesting: seats.filter(s => s.requestingToSpeak && !s.microphoneOn).length,
    idle: seats.filter(s => !s.microphoneOn && !s.requestingToSpeak).length
  };

  // Helper function to find available sidecar port
  const findWorkingPort = async (ports: number[]): Promise<number | null> => {
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET'
        });
        if (response.ok) {
          return port;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  // Function to fetch speaker order
  const fetchSpeakerOrder = async (port: number): Promise<number[]> => {
    try {
      const response = await fetch(`http://localhost:${port}/api/speakers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/discussion/speakers'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data as number[];
        }
      }
      return [];
    } catch (error) {
      console.warn('Error fetching speaker order:', error);
      return [];
    }
  };

  // Function to fetch request order
  const fetchRequestOrder = async (port: number): Promise<number[]> => {
    try {
      const response = await fetch(`http://localhost:${port}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/discussion/requests'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data as number[];
        }
      }
      return [];
    } catch (error) {
      console.warn('Error fetching request order:', error);
      return [];
    }
  };

  const fetchSeats = async () => {
    setError(null);
    
    try {
      // Try different ports in case sidecar is running on alternative port
      const ports = [8080, 8081, 8082, 8083];
      const workingPort = await findWorkingPort(ports);
      
      if (!workingPort) {
        throw new Error('Sidecar not responding on any expected port');
      }

      // Fetch all data in parallel
      const [seatsResponse, speakerOrderData, requestOrderData] = await Promise.all([
        fetch(`http://localhost:${workingPort}/api/seats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: '/discussion/seats'
          })
        }),
        fetchSpeakerOrder(workingPort),
        fetchRequestOrder(workingPort)
      ]);
      
      if (!seatsResponse.ok) {
        throw new Error('Failed to fetch seats data');
      }
      
      const seatsResult = await seatsResponse.json();
      
      if (seatsResult.success) {
        const data = seatsResult.data as Seat[];
        setSeats(data || []);
        setSpeakerOrder(speakerOrderData);
        setRequestOrder(requestOrderData);
        setSidecarStatus('online'); // Update status when data fetch succeeds
      } else {
        setError(seatsResult.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setSidecarStatus('offline'); // Update status when fetch fails
      console.error('Error fetching data:', err);
    }
  };

  // Update current time every second
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 300);

    return () => clearInterval(timeTimer);
  }, []);

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

  const refreshSeats = () => {
    fetchSeats();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Check if sidecar is running on any expected port
  const checkSidecarHealth = async () => {
    const ports = [8080, 8081, 8082, 8083];
    
    for (const port of ports) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) {
          setSidecarStatus('online');
          return true;
        }
      } catch {
        // Try next port
      }
    }
    
    setSidecarStatus('offline');
    return false;
  };

  // Layout Management Functions
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

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        saveLayoutSettings({
          ...layoutSettings,
          backgroundImage: imageUrl
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const snapToGrid = (x: number, y: number) => {
    if (!layoutSettings.snapToGrid) return { x, y };
    const { gridSize } = layoutSettings;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  const handleSeatDragStart = (seatNumber: number, event: React.MouseEvent) => {
    setDraggedSeat(seatNumber);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (draggedSeat === null || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = event.clientX - rect.left - dragOffset.x;
    const rawY = event.clientY - rect.top - dragOffset.y;
    
    const snapped = snapToGrid(rawX, rawY);
    
    // Update position temporarily during drag
    const updatedPositions = seatPositions.map(pos =>
      pos.seatNumber === draggedSeat
        ? { ...pos, x: snapped.x, y: snapped.y }
        : pos
    );
    
    // If seat doesn't have a position yet, add it
    if (!seatPositions.find(pos => pos.seatNumber === draggedSeat)) {
      updatedPositions.push({
        seatNumber: draggedSeat,
        x: snapped.x,
        y: snapped.y
      });
    }
    
    setSeatPositions(updatedPositions);
  };

  const handleCanvasMouseUp = () => {
    if (draggedSeat !== null) {
      // Save positions when drag ends
      saveSeatPositions(seatPositions);
      setDraggedSeat(null);
    }
  };

  const getSeatPosition = (seatNumber: number) => {
    return seatPositions.find(pos => pos.seatNumber === seatNumber);
  };

  const removeSeatPosition = (seatNumber: number) => {
    const updatedPositions = seatPositions.filter(pos => pos.seatNumber !== seatNumber);
    saveSeatPositions(updatedPositions);
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', cancelText = 'Cancel', danger = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      danger
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      danger: false
    });
  };

  // Load saved settings on component mount
  useEffect(() => {
    loadLayoutSettings();
  }, []);

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <div className="header-left">
            <h1>Discussion Seats Manager</h1>
            <div className="clock-info">
              <div className="current-time">
                <span className="time-label">Current Time:</span>
                <span className="time-value">{formatTime(currentTime)}</span>
              </div>
              <div className="sidecar-status">
                <span className="status-label">API Service:</span>
                <span className={`status-indicator ${sidecarStatus}`}>
                  {sidecarStatus === 'checking' && '🔄 Checking...'}
                  {sidecarStatus === 'online' && '🟢 Online'}
                  {sidecarStatus === 'offline' && '🔴 Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Seats</span>
            </div>
            <div className="stat-item speaking">
              <span className="stat-number">{stats.speaking}</span>
              <span className="stat-label">Speaking</span>
            </div>
            <div className="stat-item requesting">
              <span className="stat-number">{stats.requesting}</span>
              <span className="stat-label">Requesting</span>
            </div>
            <div className="stat-item idle">
              <span className="stat-number">{stats.idle}</span>
              <span className="stat-label">Idle</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={refreshSeats}>Retry</button>
        </div>
      )}

      <main>
        {/* Layout Controls */}
        <div className="view-controls">
          <div className="layout-controls">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
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
              onClick={() => saveLayoutSettings({...layoutSettings, showGrid: !layoutSettings.showGrid})}
            >
              ⊞ Grid {layoutSettings.showGrid ? 'On' : 'Off'}
            </button>
            
            <button 
              className={`control-btn ${layoutSettings.snapToGrid ? 'active' : ''}`}
              onClick={() => saveLayoutSettings({...layoutSettings, snapToGrid: !layoutSettings.snapToGrid})}
            >
              🧲 Snap {layoutSettings.snapToGrid ? 'On' : 'Off'}
            </button>

            <button 
              className={`control-btn ${layoutSettings.layoutLocked ? 'active' : ''}`}
              onClick={() => saveLayoutSettings({...layoutSettings, layoutLocked: !layoutSettings.layoutLocked})}
              title={layoutSettings.layoutLocked ? 'Layout is protected from changes' : 'Layout can be modified'}
            >
              {layoutSettings.layoutLocked ? '🔒 Locked' : '🔓 Unlocked'}
            </button>

            <button 
              className="control-btn"
              onClick={() => {
                showConfirmModal(
                  'Remove Background Image',
                  'This will remove the background image from your layout. Seat positions will remain unchanged.',
                  () => {
                    saveLayoutSettings({...layoutSettings, backgroundImage: null});
                    closeConfirmModal();
                  },
                  'Remove Image',
                  'Cancel'
                );
              }}
              disabled={!layoutSettings.backgroundImage}
              title="Remove background image"
            >
              🖼️ Clear Background
            </button>

            <button 
              className="control-btn danger"
              onClick={() => {
                const positionedCount = seatPositions.length;
                const seatNumbers = seatPositions.map(pos => pos.seatNumber).sort((a, b) => a - b).join(', ');
                showConfirmModal(
                  'Clear All Seat Positions',
                  `This will remove all ${positionedCount} positioned seats from the layout:\n\nSeats: ${seatNumbers}\n\nThe background image will remain unchanged.`,
                  () => {
                    saveSeatPositions([]);
                    closeConfirmModal();
                  },
                  'Clear All Positions',
                  'Cancel',
                  true // danger = true
                );
              }}
            >
              🗑️ Clear Positions
            </button>
          </div>
        </div>

        {sortedSeats.length > 0 ? (
          <>
              <div className="layout-container">
                {/* Available Seats Panel */}
                <div className="seats-panel">
                  <h3>Available Seats</h3>
                  <div className="available-seats">
                    {sortedSeats
                      .filter(seat => !getSeatPosition(seat.seatNumber))
                      .map((seat) => (
                        <div 
                          key={seat.seatNumber}
                          className={`seat-circle draggable ${seat.microphoneOn ? 'speaking' : ''} ${seat.requestingToSpeak && !seat.microphoneOn ? 'requesting' : ''}`}
                          title={`Seat ${seat.seatNumber} (${seat.role})${seat.microphoneOn ? ' - Speaking' : seat.requestingToSpeak ? ' - Requesting' : ' - Idle'}`}
                          onMouseDown={(e) => handleSeatDragStart(seat.seatNumber, e)}
                        >
                          {seat.role === 'chairperson' && (
                            <div className="chairperson-star">★</div>
                          )}
                          <span className="seat-number">{seat.seatNumber}</span>
                        </div>
                      ))
                    }
                  </div>
                  {sortedSeats.filter(seat => !getSeatPosition(seat.seatNumber)).length === 0 && (
                    <p className="no-available">All seats positioned</p>
                  )}
                </div>

                {/* Layout Canvas */}
                <div className="layout-canvas-container">
                  <div 
                    ref={canvasRef}
                    className="layout-canvas"
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    style={{
                      backgroundImage: layoutSettings.backgroundImage ? `url(${layoutSettings.backgroundImage})` : undefined,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Grid Overlay */}
                    {layoutSettings.showGrid && (
                      <div className="grid-overlay" style={{
                        backgroundSize: `${layoutSettings.gridSize}px ${layoutSettings.gridSize}px`,
                        backgroundImage: `
                          linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                        `
                      }} />
                    )}

                    {/* Positioned Seats */}
                    {sortedSeats
                      .filter(seat => getSeatPosition(seat.seatNumber))
                      .map((seat) => {
                        const position = getSeatPosition(seat.seatNumber)!;
                        return (
                          <div 
                            key={seat.seatNumber}
                            className={`seat-circle positioned ${seat.microphoneOn ? 'speaking' : ''} ${seat.requestingToSpeak && !seat.microphoneOn ? 'requesting' : ''} ${draggedSeat === seat.seatNumber ? 'dragging' : ''} ${layoutSettings.layoutLocked ? 'locked' : ''}`}
                            title={`Seat ${seat.seatNumber} (${seat.role})${layoutSettings.layoutLocked ? ' - Layout Locked' : ' - Right-click to remove'}${seat.microphoneOn ? ' - Speaking' : seat.requestingToSpeak ? ' - Requesting' : ' - Idle'}`}
                            style={{
                              position: 'absolute',
                              left: `${position.x}px`,
                              top: `${position.y}px`,
                              cursor: layoutSettings.layoutLocked ? 'default' : 'move'
                            }}
                            onMouseDown={(e) => {
                              if (!layoutSettings.layoutLocked && e.button === 0) { // Left click to drag only when unlocked
                                handleSeatDragStart(seat.seatNumber, e);
                              }
                            }}
                            onContextMenu={(e) => {
                              if (!layoutSettings.layoutLocked) {
                                e.preventDefault();
                                showConfirmModal(
                                  'Remove Seat from Layout',
                                  `Remove seat ${seat.seatNumber} (${seat.role}) from the layout?\n\nThis seat will return to the available seats panel.`,
                                  () => {
                                    removeSeatPosition(seat.seatNumber);
                                    closeConfirmModal();
                                  },
                                  'Remove Seat',
                                  'Cancel'
                                );
                              }
                            }}
                            onDoubleClick={(e) => {
                              if (!layoutSettings.layoutLocked) {
                                e.preventDefault();
                                showConfirmModal(
                                  'Remove Seat from Layout',
                                  `Remove seat ${seat.seatNumber} (${seat.role}) from the layout?\n\nThis seat will return to the available seats panel.`,
                                  () => {
                                    removeSeatPosition(seat.seatNumber);
                                    closeConfirmModal();
                                  },
                                  'Remove Seat',
                                  'Cancel'
                                );
                              }
                            }}
                          >
                            {seat.role === 'chairperson' && (
                              <div className="chairperson-star">★</div>
                            )}
                            <span className="seat-number">{seat.seatNumber}</span>
                            
                            {/* Remove button - only shows when unlocked and on hover */}
                            {!layoutSettings.layoutLocked && (
                              <button 
                                className="seat-remove-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirmModal(
                                    'Remove Seat from Layout',
                                    `Remove seat ${seat.seatNumber} (${seat.role}) from the layout?\n\nThis seat will return to the available seats panel.`,
                                    () => {
                                      removeSeatPosition(seat.seatNumber);
                                      closeConfirmModal();
                                    },
                                    'Remove Seat',
                                    'Cancel'
                                  );
                                }}
                                title="Remove from layout"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })
                    }

                    {/* Drop Zone Instructions */}
                    {!layoutSettings.backgroundImage && (
                      <div className="canvas-instructions">
                        <p>📁 Upload a background image to get started</p>
                        <p>🖱️ Drag seats from the left panel onto this canvas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </>
        ) : (
          <div className="no-data">No seats data available</div>
        )}
      </main>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{confirmModal.title}</h3>
            </div>
            <div className="modal-body">
              <p className="modal-message">{confirmModal.message}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-cancel"
                onClick={closeConfirmModal}
              >
                {confirmModal.cancelText}
              </button>
              <button 
                className={`modal-btn modal-btn-confirm ${confirmModal.danger ? 'danger' : ''}`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;