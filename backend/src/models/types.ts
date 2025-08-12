import { User, UserWithRole } from './User';
import { Role, RoleWithUsers } from './Roles';

// Типы для запросов к базе данных
export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    role_id: number;
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    role_id?: number;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
    permissions: string[];
}

export interface UpdateRoleRequest {
    name?: string;
    description?: string;
    permissions?: string[];
}

// Типы для ответов API
export interface UserResponse {
    id: number;
    username: string;
    email: string;
    role: {
        id: number;
        name: string;
        description?: string;
        permissions: string[];
    };
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}

export interface RoleResponse {
    id: number;
    name: string;
    description?: string;
    permissions: string[];
    user_count: number;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}

// Типы для фильтрации и пагинации
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface UserFilters {
    role_id?: number;
    is_active?: boolean;
    search?: string;
}

export interface RoleFilters {
    is_active?: boolean;
    has_permission?: string;
    search?: string;
}

// Типы для результатов запросов
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

// Типы для аутентификации
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role_id?: number; // Если не указано, будет назначена роль по умолчанию
}

export interface AuthResponse {
    user: UserResponse;
    token: string;
    refresh_token?: string;
}

// Типы для проверки разрешений
export interface PermissionCheck {
    user_id: number;
    required_permissions: string[];
}

export interface HasPermissionResult {
    has_permission: boolean;
    missing_permissions: string[];
    user_permissions: string[];
}

