import React from 'react';

interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  return (
    <div className="error-message">
      <p>Error: {error}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
};

export default ErrorMessage;