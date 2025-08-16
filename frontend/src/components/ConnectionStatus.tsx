import React from 'react';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  isConnected: boolean;
  onReconnect?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  onReconnect 
}) => {
  return (
    <div className={`connection-status-container ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">
          {isConnected ? 'Подключено' : 'Отключено'}
        </span>
      </div>
      {!isConnected && onReconnect && (
        <button className="reconnect-btn" onClick={onReconnect}>
          Переподключиться
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;

