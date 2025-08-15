import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Страница не найдена</h1>
        <p className="error-description">
          Извините, запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="error-actions">
          <Link to="/" className="home-button">
            Вернуться на главную
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="back-button"
          >
            Назад
          </button>
        </div>
      </div>
      <div className="not-found-illustration">
        <div className="floating-elements">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
