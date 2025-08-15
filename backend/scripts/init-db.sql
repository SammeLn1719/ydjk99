-- Создать схему public если её нет
CREATE SCHEMA IF NOT EXISTS public;

-- Установить схему public
SET search_path TO public;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(55) NOT NULL,
    email VARCHAR(55) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ролей
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(24) NOT NULL DEFAULT 'user',
    UNIQUE(name)
);

-- Связующая таблица пользователей и ролей
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Вставка базовых ролей (только если их нет)
INSERT INTO roles (name) VALUES
    ('admin'),
    ('user'),
    ('moderator')
ON CONFLICT (name) DO NOTHING;