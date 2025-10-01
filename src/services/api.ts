import { Seat } from '../types';

const API_PORTS = [8080, 8081, 8082, 8083];

export class ApiService {
  private static cachedWorkingPort: number | null = null;
  private static lastHealthCheck: number = 0;
  private static readonly HEALTH_CHECK_CACHE_MS = 5000; // Cache for 5 seconds

  private static async findWorkingPort(retryCount = 0, maxRetries = 10): Promise<number | null> {
    // Check if we have a recently cached working port
    const now = Date.now();
    if (this.cachedWorkingPort && (now - this.lastHealthCheck) < this.HEALTH_CHECK_CACHE_MS) {
      console.log(`API: Using cached working port: ${this.cachedWorkingPort}`);
      return this.cachedWorkingPort;
    }

    console.log(`API: Checking for working sidecar port (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    for (const port of API_PORTS) {
      try {
        console.log(`API: Trying port ${port}...`);
        const response = await fetch(`http://localhost:${port}/health`, {
          method: 'GET'
        });
        console.log(`API: Port ${port} response:`, response.status, response.ok);
        if (response.ok) {
          console.log(`API: Found working port: ${port}`);
          // Cache the working port
          this.cachedWorkingPort = port;
          this.lastHealthCheck = now;
          return port;
        }
      } catch (error) {
        console.log(`API: Port ${port} failed:`, error);
        continue;
      }
    }
    
    // If no ports work and we haven't exceeded retries, wait and try again
    if (retryCount < maxRetries) {
      console.log(`API: No working ports found. Waiting 1 second before retry ${retryCount + 2}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.findWorkingPort(retryCount + 1, maxRetries);
    }
    
    console.log('API: No working ports found after all retries');
    // Clear cache on failure
    this.cachedWorkingPort = null;
    return null;
  }

  static async fetchSeats(): Promise<Seat[]> {
    try {
      const workingPort = await this.findWorkingPort();
      
      if (!workingPort) {
        throw new Error('Sidecar not responding on any expected port. The app is still starting up, please wait a moment and try again.');
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
        // Clear cache on API errors
        this.cachedWorkingPort = null;
        throw new Error('Failed to fetch seats data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data as Seat[] || [];
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      // Clear cache on errors to force retry next time
      this.cachedWorkingPort = null;
      throw error;
    }
  }  static async fetchSpeakerOrder(): Promise<number[]> {
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

  static async updateDiscussionSettings(mode: 'directSpeak' | 'request', customPayload?: any): Promise<boolean> {
    try {
      const workingPort = await this.findWorkingPort();
      
      if (!workingPort) {
        throw new Error('Sidecar not responding on any expected port');
      }

      // Use custom payload if provided, otherwise use defaults
      const settingsPayload = customPayload || (mode === 'directSpeak' 
        ? {
            maximumNumberOfSpeakers: 3,
            microphoneMode: "directSpeak",
            options: {
              microphoneActivationType: "toggle",
              speakerOverrideAllowed: true,
              switchOffAllowed: true,
              ledColorOn: "green",
              ledColorOff: "off"
            }
          }
        : {
            maximumNumberOfSpeakers: 3,
            microphoneMode: "request",
            options: {
              switchOffAllowed: true,
              cancelRequestAllowed: true,
              ledColorOn: "green",
              ledColorRequest: "green",
              ledColorOff: "off",
              nextInLineIndication: true
            }
          });

      const response = await fetch(`http://localhost:${workingPort}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/discussion/settings',
          data: settingsPayload
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.success;
      }
      return false;
    } catch (error) {
      console.error('Error updating discussion settings:', error);
      throw error;
    }
  }
}