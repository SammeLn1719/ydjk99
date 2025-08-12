import { Pool } from 'pg';
import { Role } from './Roles';

// TypeScript интерфейс для пользователя
export interface User {
    id?: number;
    username: string;
    email: string;
    password: string;
    role_id: number;
    role?: Role; // Ссылка на модель роли
    created_at?: Date;
    updated_at?: Date;
    is_active?: boolean;
}

// Интерфейс для пользователя с полной информацией о роли
export interface UserWithRole extends Omit<User, 'role_id'> {
    role: Role;
}

// SQL схема для создания таблицы пользователей
export const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
);
`;

// SQL схема для создания индексов
export const createUsersIndexes = `
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
`;

// Функция для инициализации таблицы пользователей
export const initUsersTable = async (pool: Pool) => {
    try {
        await pool.query(createUsersTable);
        await pool.query(createUsersIndexes);
        console.log('Users table initialized successfully');
    } catch (error) {
        console.error('Error initializing users table:', error);
        throw error;
    }
};

// SQL запросы для работы с пользователями
export const userQueries = {
    // Создание пользователя
    create: `
        INSERT INTO users (username, email, password, role_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role_id, created_at, is_active
    `,
    
    // Получение пользователя по ID
    getById: `
        SELECT u.id, u.username, u.email, u.role_id, u.created_at, u.updated_at, u.is_active,
               r.id as role_id, r.name as role_name, r.description as role_description, 
               r.permissions as role_permissions, r.created_at as role_created_at, 
               r.updated_at as role_updated_at, r.is_active as role_is_active
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
    `,
    
    // Получение пользователя по email
    getByEmail: `
        SELECT u.id, u.username, u.email, u.password, u.role_id, u.created_at, u.updated_at, u.is_active,
               r.id as role_id, r.name as role_name, r.description as role_description, 
               r.permissions as role_permissions, r.created_at as role_created_at, 
               r.updated_at as role_updated_at, r.is_active as role_is_active
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = $1
    `,
    
    // Получение пользователя по username
    getByUsername: `
        SELECT u.id, u.username, u.email, u.password, u.role_id, u.created_at, u.updated_at, u.is_active,
               r.id as role_id, r.name as role_name, r.description as role_description, 
               r.permissions as role_permissions, r.created_at as role_created_at, 
               r.updated_at as role_updated_at, r.is_active as role_is_active
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.username = $1
    `,
    
    // Обновление пользователя
    update: `
        UPDATE users 
        SET username = $2, email = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, username, email, role_id, updated_at, is_active
    `,
    
    // Обновление пароля
    updatePassword: `
        UPDATE users 
        SET password = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, username, email, role_id, updated_at, is_active
    `,
    
    // Деактивация пользователя
    deactivate: `
        UPDATE users 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, username, email, role_id, updated_at, is_active
    `,
    
    // Получение всех активных пользователей
    getAllActive: `
        SELECT u.id, u.username, u.email, u.role_id, u.created_at, u.updated_at, u.is_active,
               r.id as role_id, r.name as role_name, r.description as role_description, 
               r.permissions as role_permissions, r.created_at as role_created_at, 
               r.updated_at as role_updated_at, r.is_active as role_is_active
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.is_active = TRUE
        ORDER BY u.created_at DESC
    `,
    
    // Проверка существования email
    checkEmailExists: `
        SELECT id FROM users WHERE email = $1
    `,
    
    // Проверка существования username
    checkUsernameExists: `
        SELECT id FROM users WHERE username = $1
    `,
    
    // Получение пользователей с детальной информацией о ролях и статистикой
    getUsersWithRoleDetails: `
        SELECT 
            u.id, u.username, u.email, u.role_id, u.created_at, u.updated_at, u.is_active,
            r.id as role_id, r.name as role_name, r.description as role_description, 
            r.permissions as role_permissions, r.created_at as role_created_at, 
            r.updated_at as role_updated_at, r.is_active as role_is_active,
            COUNT(m.id) as message_count,
            COUNT(c.id) as conversation_count
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN messages m ON u.id = m.user_id
        LEFT JOIN conversations c ON u.id = c.user_id
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.username, u.email, u.role_id, u.created_at, u.updated_at, u.is_active,
                 r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at, r.is_active
        ORDER BY u.created_at DESC
    `,
    
    // Получение пользователей по роли
    getUsersByRole: `
        SELECT 
            u.id, u.username, u.email, u.role_id, u.created_at, u.updated_at, u.is_active,
            r.id as role_id, r.name as role_name, r.description as role_description, 
            r.permissions as role_permissions, r.created_at as role_created_at, 
            r.updated_at as role_updated_at, r.is_active as role_is_active
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE r.name = $1 AND u.is_active = TRUE AND r.is_active = TRUE
        ORDER BY u.created_at DESC
    `,
    
    // Получение пользователей с определенными разрешениями
    getUsersByPermission: `
        SELECT DISTINCT
            u.id, u.username, u.email, u.role_id, u.created_at, u.updated_at, u.is_active,
            r.id as role_id, r.name as role_name, r.description as role_description, 
            r.permissions as role_permissions, r.created_at as role_created_at, 
            r.updated_at as role_updated_at, r.is_active as role_is_active
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE r.permissions @> $1::jsonb 
          AND u.is_active = TRUE 
          AND r.is_active = TRUE
        ORDER BY u.created_at DESC
    `,
    
    // Получение статистики пользователей по ролям
    getUserStatsByRole: `
        SELECT 
            r.name as role_name,
            r.description as role_description,
            COUNT(u.id) as total_users,
            COUNT(CASE WHEN u.is_active = TRUE THEN 1 END) as active_users,
            COUNT(CASE WHEN u.is_active = FALSE THEN 1 END) as inactive_users,
            MIN(u.created_at) as first_user_created,
            MAX(u.created_at) as last_user_created
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id
        WHERE r.is_active = TRUE
        GROUP BY r.id, r.name, r.description
        ORDER BY total_users DESC
    `
};
