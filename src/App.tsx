import { useState, useEffect } from 'react';
import './App.css';

interface Seat {
  seatNumber: number;
  microphoneOn: boolean;
  requestingToSpeak: boolean;
  role: string;
}

function App() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sidecarStatus, setSidecarStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Get unique roles for filtering
  const availableRoles = Array.from(new Set(seats.map(seat => seat.role)));
  
  // Filter and sort seats
  const filteredSeats = seats
    .filter(seat => filterRole === 'all' || seat.role === filterRole)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  // Get summary statistics
  const stats = {
    total: seats.length,
    speaking: seats.filter(s => s.microphoneOn).length,
    requesting: seats.filter(s => s.requestingToSpeak && !s.microphoneOn).length,
    idle: seats.filter(s => !s.microphoneOn && !s.requestingToSpeak).length
  };

  const fetchSeats = async () => {
    setError(null);
    
    try {
      // Try different ports in case sidecar is running on alternative port
      const ports = [8080, 8081, 8082, 8083];
      let response = null;
      let workingPort = null;
      
      for (const port of ports) {
        try {
          response = await fetch(`http://localhost:${port}/api/seats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: '/discussion/seats' // Optional - sidecar will use default if not provided
            })
          });
          
          if (response.ok) {
            workingPort = port;
            break;
          }
        } catch {
          // Try next port
          continue;
        }
      }
      
      if (!response || !workingPort) {
        throw new Error('Sidecar not responding on any expected port');
      }
      
      const result = await response.json();
      
      if (result.success) {
        const data = result.data as Seat[];
        setSeats(data || []);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      console.error('Error fetching seats:', err);
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
              {lastUpdated && (
                <div className="last-updated">
                  <span className="update-label">Last Updated:</span>
                  <span className="update-value">{formatTime(currentTime)}</span>
                </div>
              )}
              <div className="sidecar-status">
                <span className="status-label">Sidecar:</span>
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

        <div className="header-controls">
          {/* Role Filter */}
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter"
          >
            <option value="all">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={refreshSeats}>Retry</button>
        </div>
      )}

      <main>
        {filteredSeats.length > 0 ? (
          <>
            <div className="seats-info">
              <p>Showing {filteredSeats.length} of {seats.length} seats {filterRole !== 'all' && `(filtered by ${filterRole})`}</p>
            </div>
            
            <div className="seats-grid">
              {filteredSeats.map((seat) => (
                <div 
                  key={seat.seatNumber} 
                  className={`seat ${seat.microphoneOn ? 'speaking' : ''} ${seat.requestingToSpeak ? 'requesting' : ''}`}
                >
                  <div className="seat-header">
                    <div className="seat-number">#{seat.seatNumber}</div>
                    <div className={`seat-role role-${seat.role}`}>
                      {seat.role}
                    </div>
                  </div>
                  
                  <div className="seat-status">
                    {seat.microphoneOn && (
                      <span className="status-badge mic-on">🎤 Speaking</span>
                    )}
                    {seat.requestingToSpeak && !seat.microphoneOn && (
                      <span className="status-badge requesting">✋ Requesting</span>
                    )}
                    {!seat.microphoneOn && !seat.requestingToSpeak && (
                      <span className="status-badge idle">💤 Idle</span>
                    )}
                  </div>

                  <div className="seat-details">
                    <div className="detail-row">
                      <span className="detail-label">Microphone:</span>
                      <span className={`detail-value ${seat.microphoneOn ? 'active' : 'inactive'}`}>
                        {seat.microphoneOn ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Requesting:</span>
                      <span className={`detail-value ${seat.requestingToSpeak ? 'active' : 'inactive'}`}>
                        {seat.requestingToSpeak ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>

                  <div className="seat-indicators">
                    <div className={`indicator mic ${seat.microphoneOn ? 'active' : ''}`} 
                         title={`Microphone: ${seat.microphoneOn ? 'ON' : 'OFF'}`}>
                      🎤
                    </div>
                    <div className={`indicator hand ${seat.requestingToSpeak ? 'active' : ''}`}
                         title={`Requesting to speak: ${seat.requestingToSpeak ? 'YES' : 'NO'}`}>
                      ✋
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">No seats data available</div>
        )}

        {filteredSeats.length === 0 && seats.length > 0 && (
          <div className="no-data">No seats match the selected filter</div>
        )}
      </main>
    </div>
  );
}

export default App;