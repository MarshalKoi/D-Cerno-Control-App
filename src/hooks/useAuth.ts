import { useState, useCallback, useEffect } from 'react';

const API_PORTS = [8080, 8081, 8082, 8083];
const TOKEN_STORAGE_KEY = 'dcerno_bearer_token';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signin: (token: string, remember?: boolean) => Promise<boolean>;
  signout: () => void;
  checkStoredAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findWorkingPort = async (): Promise<number | null> => {
    for (const port of API_PORTS) {
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

  const signin = useCallback(async (token: string, remember: boolean = true): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Find working sidecar port
      const workingPort = await findWorkingPort();
      if (!workingPort) {
        throw new Error('Sidecar service is not running. Please start the application properly.');
      }

      // Set the token in the sidecar
      const response = await fetch(`http://localhost:${workingPort}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set authentication token');
      }

      const result = await response.json();
      if (result.success) {
        setIsAuthenticated(true);
        setError(null);
        
        // Store token if remember is enabled
        if (remember) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
        
        return true;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signout = useCallback(() => {
    setIsAuthenticated(false);
    setError(null);
    // Clear stored token
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const checkStoredAuth = useCallback(async (): Promise<void> => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      return;
    }

    // Try to authenticate with stored token
    console.log('🔑 Found stored token, attempting auto-login...');
    await signin(storedToken, true);
  }, [signin]);

  // Auto-check for stored authentication on hook initialization
  useEffect(() => {
    checkStoredAuth();
  }, [checkStoredAuth]);

  return {
    isAuthenticated,
    isLoading,
    error,
    signin,
    signout,
    checkStoredAuth
  };
};