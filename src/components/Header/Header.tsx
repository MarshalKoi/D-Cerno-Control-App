import { useState, useEffect } from 'react';
import { formatTime } from '../../utils/timeUtils';
import { SeatStats } from '../../types';
import StatsDisplay from './StatsDisplay';

interface HeaderProps {
  stats: SeatStats;
  onImportExcel?: (file: File) => void;
  isImporting?: boolean;
  hasParticipantData?: boolean;
}

const Header = ({ stats, onImportExcel, isImporting = false, hasParticipantData = false }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every second
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 300);

    return () => clearInterval(timeTimer);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
    }
    // Reset input to allow re-selecting the same file
    event.target.value = '';
  };

  return (
    <header>
      <div className="header-content">
        <div className="header-left">
          <div className="current-time">
            <span className="time-value">{formatTime(currentTime)}</span>
          </div>
        </div>
        
        <div className="header-center">
          <StatsDisplay stats={stats} />
        </div>

        <div className="header-right">
          <label 
            className={`import-excel-btn ${isImporting ? 'loading' : ''} ${hasParticipantData ? 'has-data' : ''}`}
            title={hasParticipantData ? "Participant data loaded - Import new Excel file" : "Import participant data from Excel file"}
          >
            {isImporting ? '⏳ Importing...' : hasParticipantData ? '✅ Import Excel' : '📄 Import Excel'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>
    </header>
  );
};

export default Header;