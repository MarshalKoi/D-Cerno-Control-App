import React, { useState } from 'react';

interface SigninScreenProps {
  onSignin: (token: string, remember?: boolean) => Promise<boolean>;
  isLoading?: boolean;
  error?: string;
}

const SigninScreen: React.FC<SigninScreenProps> = ({ onSignin, isLoading = false, error }) => {
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(true); // Default to remembering
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!token.trim()) {
      setLocalError('API key is required');
      return;
    }

    try {
      const success = await onSignin(token.trim(), remember);
      if (!success) {
        setLocalError('Invalid API key or connection failed');
      }
    } catch (err) {
      setLocalError('Failed to authenticate. Please try again.');
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    setLocalError(''); // Clear error when user types
  };

  return (
    <div className="signin-screen">
      <div className="signin-container">
        <div className="signin-header">
          <h1>D-Cerno Control App</h1>
          <p>Please enter your API key to access the discussion control system.</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="token">API key</label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={handleTokenChange}
              placeholder="Enter your API key"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-text">Remember me (keep me signed in)</span>
            </label>
          </div>

          {(error || localError) && (
            <div className="error-message">
              {error || localError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !token.trim()}
            className="signin-button"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SigninScreen;