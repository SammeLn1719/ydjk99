import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { setToken } from '../utils/auth';
import './LoginForm.css';

interface LoginFormData {
  username: string;
  password: string;
}

const schema = yup.object({
  username: yup
    .string()
    .required('Имя пользователя обязательно'),
  password: yup
    .string()
    .required('Пароль обязателен'),
}).required();

const LoginForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8001/auth/login', {
        username: data.username,
        password: data.password,
      });

      // Сохраняем токен в localStorage
      setToken(response.data.token);
      setSuccess('Вход выполнен успешно!');
      reset();
      localStorage.setItem('token', response.data.token);
      window.location.href = '/dashboard';
      // Здесь можно добавить редирект или обновление состояния приложения
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Произошла ошибка при входе');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2>Вход в систему</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              {...register('username')}
              className={errors.username ? 'error' : ''}
              placeholder="Введите имя пользователя"
            />
            {errors.username && (
              <span className="error-text">{errors.username.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              {...register('password')}
              className={errors.password ? 'error' : ''}
              placeholder="Введите пароль"
            />
            {errors.password && (
              <span className="error-text">{errors.password.message}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
