import pool from '../config/database';
import { userQueries } from '../models/User';
import { User, UserWithRole } from '../models/User';
import { Role } from '../models/Roles';
import { CreateUserRequest, UpdateUserRequest, UserResponse, PaginationParams, UserFilters } from '../models/types';
import bcrypt from 'bcrypt';

export class UserService {
    // Создание пользователя
    static async createUser(userData: CreateUserRequest): Promise<UserResponse> {
        const { username, email, password, role_id } = userData;
        
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(userQueries.create, [
            username, email, hashedPassword, role_id
        ]);
        
        const user = result.rows[0];
        return this.formatUserResponse(user);
    }

    // Получение пользователя по ID с ролью
    static async getUserById(id: number): Promise<UserResponse | null> {
        const result = await pool.query(userQueries.getById, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatUserResponse(result.rows[0]);
    }

    // Получение пользователя по email с ролью
    static async getUserByEmail(email: string): Promise<UserWithRole | null> {
        const result = await pool.query(userQueries.getByEmail, [email]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatUserWithRole(result.rows[0]);
    }

    // Получение пользователя по username с ролью
    static async getUserByUsername(username: string): Promise<UserWithRole | null> {
        const result = await pool.query(userQueries.getByUsername, [username]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatUserWithRole(result.rows[0]);
    }

    // Обновление пользователя
    static async updateUser(id: number, userData: UpdateUserRequest): Promise<UserResponse | null> {
        const { username, email, role_id } = userData;
        
        const result = await pool.query(userQueries.update, [id, username, email]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatUserResponse(result.rows[0]);
    }

    // Обновление пароля
    static async updatePassword(id: number, newPassword: string): Promise<UserResponse | null> {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await pool.query(userQueries.updatePassword, [id, hashedPassword]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatUserResponse(result.rows[0]);
    }

    // Деактивация пользователя
    static async deactivateUser(id: number): Promise<UserResponse | null> {
        const result = await pool.query(userQueries.deactivate, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatUserResponse(result.rows[0]);
    }

    // Получение всех активных пользователей с ролями
    static async getAllActiveUsers(params?: PaginationParams, filters?: UserFilters): Promise<UserResponse[]> {
        let query = userQueries.getAllActive;
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Добавляем фильтры
        if (filters?.role_id) {
            query += ` AND u.role_id = $${paramIndex}`;
            queryParams.push(filters.role_id);
            paramIndex++;
        }

        if (filters?.search) {
            query += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
            queryParams.push(`%${filters.search}%`);
            paramIndex++;
        }

        // Добавляем пагинацию
        if (params?.limit) {
            query += ` LIMIT $${paramIndex}`;
            queryParams.push(params.limit);
            paramIndex++;
            
            if (params?.offset) {
                query += ` OFFSET $${paramIndex}`;
                queryParams.push(params.offset);
            }
        }

        const result = await pool.query(query, queryParams);
        
        return result.rows.map(user => this.formatUserResponse(user));
    }

    // Проверка существования email
    static async checkEmailExists(email: string): Promise<boolean> {
        const result = await pool.query(userQueries.checkEmailExists, [email]);
        return result.rows.length > 0;
    }

    // Проверка существования username
    static async checkUsernameExists(username: string): Promise<boolean> {
        const result = await pool.query(userQueries.checkUsernameExists, [username]);
        return result.rows.length > 0;
    }

    // Проверка пароля
    static async verifyPassword(user: UserWithRole, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    }

    // Форматирование пользователя для ответа API
    private static formatUserResponse(user: any): UserResponse {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: {
                id: user.role_id,
                name: user.role_name,
                description: user.role_description,
                permissions: user.permissions || []
            },
            created_at: user.created_at,
            updated_at: user.updated_at,
            is_active: user.is_active
        };
    }

    // Форматирование пользователя с полной информацией о роли
    private static formatUserWithRole(user: any): UserWithRole {
        const role: Role = {
            id: user.role_id,
            name: user.role_name,
            description: user.role_description,
            permissions: user.permissions || [],
            created_at: user.role_created_at,
            updated_at: user.role_updated_at,
            is_active: user.role_is_active
        };

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            role,
            created_at: user.created_at,
            updated_at: user.updated_at,
            is_active: user.is_active
        };
    }
}

