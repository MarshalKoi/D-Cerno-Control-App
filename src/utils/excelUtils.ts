import { ParticipantData } from '../types';
import * as XLSX from 'xlsx';

// Enhanced Excel parsing function supporting both .csv and .xlsx/.xls files
export const parseExcelFile = async (file: File): Promise<ParticipantData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let participants: ParticipantData[] = [];
        
        // Determine file type and parse accordingly
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.csv')) {
          // Handle CSV files as text
          const text = data as string;
          participants = parseCSVContent(text);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          // Handle Excel files using xlsx library
          const workbook = XLSX.read(data, { type: 'array' });
          participants = parseExcelWorkbook(workbook);
        } else {
          throw new Error('Unsupported file format. Please use .csv, .xlsx, or .xls files.');
        }
        
        console.log(`📊 Parsed ${participants.length} participants from ${fileName}`);
        resolve(participants);
      } catch (error) {
        console.error('Error parsing file:', error);
        reject(new Error('Failed to parse file. Please ensure it has Seat, Name, and Role columns.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read file based on type
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

// Parse CSV content
const parseCSVContent = (text: string): ParticipantData[] => {
  const participants: ParticipantData[] = [];
  
  // Split into lines and process
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    return [];
  }
  
  // Check if first line contains headers (Seat, Name, Role)
  const headers = lines[0].toLowerCase();
  const startIndex = headers.includes('seat') && headers.includes('name') && headers.includes('role') ? 1 : 0;
  
  // Process data lines
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
    
    if (columns.length >= 3) {
      const seatNum = parseInt(columns[0]);
      const name = columns[1] || `Participant ${seatNum}`;
      const role = columns[2] || 'Participant';
      
      if (!isNaN(seatNum) && seatNum > 0) {
        participants.push({
          seat: seatNum,
          name: name,
          role: role
        });
      }
    }
  }
  
  return participants;
};

// Parse Excel workbook
const parseExcelWorkbook = (workbook: XLSX.WorkBook): ParticipantData[] => {
  const participants: ParticipantData[] = [];
  
  // Get the first worksheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No worksheet found in Excel file');
  }
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert worksheet to JSON array
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (jsonData.length === 0) {
    return [];
  }
  
  // Find header row and column indices
  let headerRowIndex = -1;
  let seatColIndex = -1;
  let nameColIndex = -1;
  let roleColIndex = -1;
  
  // Search for header row (look in first few rows)
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row)) {
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase().trim();
        if (cell === 'seat') seatColIndex = j;
        if (cell === 'name') nameColIndex = j;
        if (cell === 'role') roleColIndex = j;
      }
      
      // If we found all three columns, this is our header row
      if (seatColIndex !== -1 && nameColIndex !== -1 && roleColIndex !== -1) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  // If no proper headers found, try to guess column order (Seat, Name, Role)
  if (headerRowIndex === -1) {
    if (jsonData[0] && jsonData[0].length >= 3) {
      headerRowIndex = 0;
      seatColIndex = 0;
      nameColIndex = 1;
      roleColIndex = 2;
    } else {
      throw new Error('Could not find Seat, Name, and Role columns in Excel file');
    }
  }
  
  // Process data rows
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row)) {
      const seatValue = row[seatColIndex];
      const nameValue = row[nameColIndex];
      const roleValue = row[roleColIndex];
      
      // Skip empty rows
      if (!seatValue && !nameValue && !roleValue) continue;
      
      const seatNum = typeof seatValue === 'number' ? seatValue : parseInt(String(seatValue || ''));
      const name = String(nameValue || '').trim() || `Participant ${seatNum}`;
      const role = String(roleValue || '').trim() || 'Participant';
      
      if (!isNaN(seatNum) && seatNum > 0) {
        participants.push({
          seat: seatNum,
          name: name,
          role: role
        });
      }
    }
  }
  
  return participants;
};

// Helper function to get participant name with fallback
export const getParticipantName = (seatNumber: number, participantData: ParticipantData[]): string => {
  const participant = participantData.find(p => p.seat === seatNumber);
  return participant?.name || `Participant ${seatNumber}`;
};

// Helper function to get participant role with fallback
export const getParticipantRole = (seatNumber: number, participantData: ParticipantData[], defaultRole: string): string => {
  const participant = participantData.find(p => p.seat === seatNumber);
  return participant?.role || defaultRole;
};