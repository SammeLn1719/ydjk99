import React, { useState } from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import './AuthContainer.css';

const AuthContainer: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button
          className={`toggle-btn ${isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(true)}
        >
          Вход
        </button>
        <button
          className={`toggle-btn ${!isLogin ? 'active' : ''}`}
          onClick={() => setIsLogin(false)}
        >
          Регистрация
        </button>
      </div>
      
      {isLogin ? <LoginForm /> : <RegisterForm />}
    </div>
  );
};

export default AuthContainer;
