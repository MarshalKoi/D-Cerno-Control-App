import { Seat } from '../types';

const API_PORTS = [8080, 8081, 8082, 8083];

export class ApiService {
  private static async findWorkingPort(): Promise<number | null> {
    console.log('API: Checking for working sidecar port...');
    for (const port of API_PORTS) {
      try {
        console.log(`API: Trying port ${port}...`);
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET'
        });
        console.log(`API: Port ${port} response:`, response.status, response.ok);
        if (response.ok) {
          console.log(`API: Found working port: ${port}`);
          return port;
        }
      } catch (error) {
        console.log(`API: Port ${port} failed:`, error);
        continue;
      }
    }
    console.log('API: No working ports found');
    return null;
  }

  static async fetchSeats(): Promise<Seat[]> {
    const workingPort = await this.findWorkingPort();
    
    if (!workingPort) {
      throw new Error('Sidecar not responding on any expected port');
    }

    const response = await fetch(`http://localhost:${workingPort}/api/seats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/discussion/seats'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch seats data');
    }
    
    const result = await response.json();
    
    if (result.success) {
      return result.data as Seat[] || [];
    } else {
      throw new Error(result.error || 'Unknown error occurred');
    }
  }

  static async fetchSpeakerOrder(): Promise<number[]> {
    try {
      const workingPort = await this.findWorkingPort();
      
      if (!workingPort) {
        return [];
      }

      const response = await fetch(`http://localhost:${workingPort}/api/speakers`, {
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
  }

  static async fetchRequestOrder(): Promise<number[]> {
    try {
      const workingPort = await this.findWorkingPort();
      
      if (!workingPort) {
        return [];
      }

      const response = await fetch(`http://localhost:${workingPort}/api/requests`, {
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
  }

  static async updateSeatStatus(seatNumber: number, microphoneOn: boolean, requestingToSpeak: boolean): Promise<boolean> {
    try {
      const workingPort = await this.findWorkingPort();
      
      if (!workingPort) {
        throw new Error('Sidecar not responding on any expected port');
      }

      const response = await fetch(`http://localhost:${workingPort}/api/seat/${seatNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          microphoneOn,
          requestingToSpeak
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success;
      }
      return false;
    } catch (error) {
      console.error('Error updating seat status:', error);
      throw error;
    }
  }

  static async checkHealth(): Promise<boolean> {
    const workingPort = await this.findWorkingPort();
    return workingPort !== null;
  }
}