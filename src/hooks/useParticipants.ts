import { useState } from 'react';
import { ParticipantData } from '../types';
import { parseExcelFile } from '../utils/excelUtils';

export const useParticipants = () => {
  const [participantData, setParticipantData] = useState<ParticipantData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importExcelFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📄 Importing Excel file: ${file.name} (${file.size} bytes)`);
      
      const participants = await parseExcelFile(file);
      setParticipantData(participants);
      
      console.log(`✅ Successfully imported ${participants.length} participants`);
      return participants;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import Excel file';
      setError(errorMessage);
      console.error('❌ Excel import failed:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearParticipantData = () => {
    setParticipantData([]);
    setError(null);
  };

  const getParticipantName = (seatNumber: number): string => {
    const participant = participantData.find(p => p.seat === seatNumber);
    return participant?.name || `Participant ${seatNumber}`;
  };

  const getParticipantRole = (seatNumber: number, defaultRole: string): string => {
    const participant = participantData.find(p => p.seat === seatNumber);
    return participant?.role || defaultRole;
  };

  return {
    participantData,
    isLoading,
    error,
    importExcelFile,
    clearParticipantData,
    getParticipantName,
    getParticipantRole,
    hasParticipantData: participantData.length > 0
  };
};