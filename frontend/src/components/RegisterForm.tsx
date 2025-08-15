import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import './RegisterForm.css';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const schema = yup.object({
  username: yup
    .string()
    .required('Имя пользователя обязательно')
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(20, 'Имя пользователя должно содержать максимум 20 символов'),
  email: yup
    .string()
    .required('Email обязателен')
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли должны совпадать'),
}).required();

const RegisterForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:8001/auth/registeration', {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      setSuccess('Регистрация прошла успешно!');
      reset();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Произошла ошибка при регистрации');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-wrapper">
        <h2>Регистрация</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className={errors.email ? 'error' : ''}
              placeholder="Введите email"
            />
            {errors.email && (
              <span className="error-text">{errors.email.message}</span>
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Подтвердите пароль"
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword.message}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
