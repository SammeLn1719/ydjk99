import pool from '../config/database';
import { roleQueries } from '../models/Roles';
import { Role, RoleWithUsers } from '../models/Roles';
import { CreateRoleRequest, UpdateRoleRequest, RoleResponse, PaginationParams, RoleFilters } from '../models/types';

export class RoleService {
    // Создание роли
    static async createRole(roleData: CreateRoleRequest): Promise<RoleResponse> {
        const { name, description, permissions } = roleData;
        
        const result = await pool.query(roleQueries.create, [
            name, description, JSON.stringify(permissions)
        ]);
        
        const role = result.rows[0];
        return this.formatRoleResponse(role);
    }

    // Получение роли по ID
    static async getRoleById(id: number): Promise<RoleResponse | null> {
        const result = await pool.query(roleQueries.getById, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatRoleResponse(result.rows[0]);
    }

    // Получение роли по имени
    static async getRoleByName(name: string): Promise<Role | null> {
        const result = await pool.query(roleQueries.getByName, [name]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatRole(result.rows[0]);
    }

    // Обновление роли
    static async updateRole(id: number, roleData: UpdateRoleRequest): Promise<RoleResponse | null> {
        const { name, description, permissions } = roleData;
        
        const result = await pool.query(roleQueries.update, [
            id, name, description, JSON.stringify(permissions)
        ]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatRoleResponse(result.rows[0]);
    }

    // Деактивация роли
    static async deactivateRole(id: number): Promise<RoleResponse | null> {
        const result = await pool.query(roleQueries.deactivate, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return this.formatRoleResponse(result.rows[0]);
    }

    // Получение всех активных ролей
    static async getAllActiveRoles(params?: PaginationParams, filters?: RoleFilters): Promise<RoleResponse[]> {
        let query = roleQueries.getAllActive;
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Добавляем фильтры
        if (filters?.has_permission) {
            query = roleQueries.getByPermission;
            queryParams.push(JSON.stringify([filters.has_permission]));
            paramIndex++;
        }

        if (filters?.search) {
            query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
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
        
        return result.rows.map(role => this.formatRoleResponse(role));
    }

    // Получение ролей с количеством пользователей
    static async getRolesWithUserCount(): Promise<RoleResponse[]> {
        const result = await pool.query(roleQueries.getAllWithUserCount);
        
        return result.rows.map(role => this.formatRoleResponse(role));
    }

    // Проверка существования роли по имени
    static async checkNameExists(name: string): Promise<boolean> {
        const result = await pool.query(roleQueries.checkNameExists, [name]);
        return result.rows.length > 0;
    }

    // Получение ролей с определенным разрешением
    static async getRolesByPermission(permission: string): Promise<Role[]> {
        const result = await pool.query(roleQueries.getByPermission, [JSON.stringify([permission])]);
        
        return result.rows.map(role => this.formatRole(role));
    }

    // Получение роли с пользователями
    static async getRoleWithUsers(id: number): Promise<RoleWithUsers | null> {
        const roleResult = await pool.query(roleQueries.getById, [id]);
        
        if (roleResult.rows.length === 0) {
            return null;
        }

        const role = roleResult.rows[0];
        
        // Получаем пользователей с этой ролью
        const usersResult = await pool.query(`
            SELECT id, username, email, created_at, updated_at, is_active
            FROM users
            WHERE role_id = $1 AND is_active = TRUE
            ORDER BY created_at DESC
        `, [id]);

        const users = usersResult.rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            password: '', // Не возвращаем пароль в контексте ролей
            role_id: id,
            created_at: user.created_at,
            updated_at: user.updated_at,
            is_active: user.is_active
        }));

        return {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
            users,
            user_count: users.length,
            created_at: role.created_at,
            updated_at: role.updated_at,
            is_active: role.is_active
        };
    }

    // Проверка разрешений пользователя
    static async checkUserPermissions(userId: number, requiredPermissions: string[]): Promise<boolean> {
        const result = await pool.query(`
            SELECT r.permissions
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1 AND u.is_active = TRUE AND r.is_active = TRUE
        `, [userId]);

        if (result.rows.length === 0) {
            return false;
        }

        const userPermissions = result.rows[0].permissions || [];
        return requiredPermissions.every(permission => userPermissions.includes(permission));
    }

    // Форматирование роли для ответа API
    private static formatRoleResponse(role: any): RoleResponse {
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
            user_count: role.user_count || 0,
            created_at: role.created_at,
            updated_at: role.updated_at,
            is_active: role.is_active
        };
    }

    // Форматирование роли
    private static formatRole(role: any): Role {
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions || [],
            created_at: role.created_at,
            updated_at: role.updated_at,
            is_active: role.is_active
        };
    }
}
