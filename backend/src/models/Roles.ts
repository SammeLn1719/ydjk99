import { Pool } from 'pg';
import { User } from './User';

// TypeScript интерфейс для роли
export interface Role {
    id?: number;
    name: string;
    description?: string;
    permissions: string[]; // JSON массив разрешений
    users?: User[]; // Ссылка на пользователей с этой ролью
    created_at?: Date;
    updated_at?: Date;
    is_active?: boolean;
}

// Интерфейс для роли с информацией о пользователях
export interface RoleWithUsers extends Omit<Role, 'users'> {
    users: User[];
    user_count?: number;
}

// SQL схема для создания таблицы ролей
export const createRolesTable = `
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(50) UNIQUE DEFAULT 'USER',
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
`;

// SQL схема для создания индексов ролей
export const createRolesIndexes = `
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_permissions ON roles USING GIN(permissions);
`;

// Функция для инициализации таблицы ролей
export const initRolesTable = async (pool: Pool) => {
    try {
        await pool.query(createRolesTable);
        await pool.query(createRolesIndexes);
        console.log('Roles table initialized successfully');
    } catch (error) {
        console.error('Error initializing roles table:', error);
        throw error;
    }
};

// Функция для создания базовых ролей
export const createDefaultRoles = async (pool: Pool) => {
    try {
        const defaultRoles = [
            {
                name: 'admin',
                description: 'Администратор системы',
                permissions: ['read', 'write', 'delete', 'admin']
            },
            {
                name: 'moderator',
                description: 'Модератор',
                permissions: ['read', 'write', 'moderate']
            },
            {
                name: 'user',
                description: 'Обычный пользователь',
                permissions: ['read', 'write']
            },
            {
                name: 'guest',
                description: 'Гость (только чтение)',
                permissions: ['read']
            }
        ];

        for (const role of defaultRoles) {
            await pool.query(
                `INSERT INTO roles (name, description, permissions) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (name) DO NOTHING`,
                [role.name, role.description, JSON.stringify(role.permissions)]
            );
        }
        
        console.log('Default roles created successfully');
    } catch (error) {
        console.error('Error creating default roles:', error);
        throw error;
    }
};

// SQL запросы для работы с ролями
export const roleQueries = {
    // Создание роли
    create: `
        INSERT INTO roles (name, description, permissions)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, permissions, created_at, is_active
    `,
    
    // Получение роли по ID
    getById: `
        SELECT id, name, description, permissions, created_at, updated_at, is_active
        FROM roles
        WHERE id = $1
    `,
    
    // Получение роли по имени
    getByName: `
        SELECT id, name, description, permissions, created_at, updated_at, is_active
        FROM roles
        WHERE name = $1
    `,
    
    // Обновление роли
    update: `
        UPDATE roles 
        SET name = $2, description = $3, permissions = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, description, permissions, updated_at, is_active
    `,
    
    // Деактивация роли
    deactivate: `
        UPDATE roles 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, name, description, permissions, updated_at, is_active
    `,
    
    // Получение всех активных ролей
    getAllActive: `
        SELECT id, name, description, permissions, created_at, updated_at, is_active
        FROM roles
        WHERE is_active = TRUE
        ORDER BY name
    `,
    
    // Получение ролей с количеством пользователей
    getAllWithUserCount: `
        SELECT r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at, r.is_active,
               COUNT(u.id) as user_count,
               COUNT(CASE WHEN u.is_active = TRUE THEN 1 END) as active_users,
               COUNT(CASE WHEN u.is_active = FALSE THEN 1 END) as inactive_users
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id
        WHERE r.is_active = TRUE
        GROUP BY r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at, r.is_active
        ORDER BY r.name
    `,
    
    // Проверка существования роли по имени
    checkNameExists: `
        SELECT id FROM roles WHERE name = $1
    `,
    
    // Получение ролей с определенным разрешением
    getByPermission: `
        SELECT id, name, description, permissions, created_at, updated_at, is_active
        FROM roles
        WHERE is_active = TRUE AND permissions @> $1::jsonb
        ORDER BY name
    `,
    
    // Получение ролей с детальной информацией о пользователях
    getRolesWithUserDetails: `
        SELECT 
            r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at, r.is_active,
            COUNT(u.id) as total_users,
            COUNT(CASE WHEN u.is_active = TRUE THEN 1 END) as active_users,
            COUNT(CASE WHEN u.is_active = FALSE THEN 1 END) as inactive_users,
            MIN(u.created_at) as first_user_created,
            MAX(u.created_at) as last_user_created,
            AVG(EXTRACT(EPOCH FROM (NOW() - u.created_at))/86400) as avg_user_age_days
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id
        WHERE r.is_active = TRUE
        GROUP BY r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at, r.is_active
        ORDER BY total_users DESC
    `,
    
    // Получение ролей с пользователями (для детального просмотра)
    getRoleWithUsersDetailed: `
        SELECT 
            r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at, r.is_active,
            u.id as user_id, u.username, u.email, u.created_at as user_created_at, 
            u.updated_at as user_updated_at, u.is_active as user_is_active
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id
        WHERE r.id = $1 AND r.is_active = TRUE
        ORDER BY u.created_at DESC
    `,
    
    // Получение статистики разрешений
    getPermissionStats: `
        SELECT 
            permission,
            COUNT(*) as role_count,
            COUNT(CASE WHEN r.is_active = TRUE THEN 1 END) as active_roles,
            COUNT(DISTINCT u.id) as total_users_with_permission
        FROM roles r
        CROSS JOIN LATERAL jsonb_array_elements_text(r.permissions) AS permission
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = TRUE
        GROUP BY permission
        ORDER BY total_users_with_permission DESC
    `,
    
    // Получение ролей с пересекающимися разрешениями
    getRolesWithOverlappingPermissions: `
        SELECT 
            r1.id as role1_id, r1.name as role1_name,
            r2.id as role2_id, r2.name as role2_name,
            r1.permissions && r2.permissions as common_permissions,
            array_length(r1.permissions && r2.permissions, 1) as common_count
        FROM roles r1
        CROSS JOIN roles r2
        WHERE r1.id < r2.id 
          AND r1.is_active = TRUE 
          AND r2.is_active = TRUE
          AND r1.permissions && r2.permissions IS NOT NULL
        ORDER BY common_count DESC
    `
};

// Константы для стандартных разрешений
export const Permissions = {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    ADMIN: 'admin',
    MODERATE: 'moderate',
    CREATE_USER: 'create_user',
    DELETE_USER: 'delete_user',
    MANAGE_ROLES: 'manage_roles',
    VIEW_LOGS: 'view_logs'
} as const;

// Тип для разрешений
export type Permission = typeof Permissions[keyof typeof Permissions];
