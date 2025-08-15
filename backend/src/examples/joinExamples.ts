import pool from '../config/database';
import { userQueries } from '../models/User';
import { roleQueries } from '../models/Roles';

// Примеры использования JOIN'ов между пользователями и ролями

export class JoinExamples {
    
    // 1. Получение всех пользователей с полной информацией о ролях
    static async getAllUsersWithRoles() {
        const result = await pool.query(userQueries.getAllActive);
        return result.rows;
    }

    // 2. Получение пользователей определенной роли
    static async getUsersByRoleName(roleName: string) {
        const result = await pool.query(userQueries.getUsersByRole, [roleName]);
        return result.rows;
    }

    // 3. Получение пользователей с определенными разрешениями
    static async getUsersWithPermission(permission: string) {
        const result = await pool.query(userQueries.getUsersByPermission, [JSON.stringify([permission])]);
        return result.rows;
    }

    // 4. Получение статистики пользователей по ролям
    static async getUserStatsByRole() {
        const result = await pool.query(userQueries.getUserStatsByRole);
        return result.rows;
    }

    // 5. Получение ролей с количеством пользователей
    static async getRolesWithUserCount() {
        const result = await pool.query(roleQueries.getAllWithUserCount);
        return result.rows;
    }

    // 6. Получение ролей с детальной информацией о пользователях
    static async getRolesWithUserDetails() {
        const result = await pool.query(roleQueries.getRolesWithUserDetails);
        return result.rows;
    }

    // 7. Получение роли с пользователями (детальный просмотр)
    static async getRoleWithUsersDetailed(roleId: number) {
        const result = await pool.query(roleQueries.getRoleWithUsersDetailed, [roleId]);
        return result.rows;
    }

    // 8. Получение статистики разрешений
    static async getPermissionStats() {
        const result = await pool.query(roleQueries.getPermissionStats);
        return result.rows;
    }

    // 9. Получение ролей с пересекающимися разрешениями
    static async getRolesWithOverlappingPermissions() {
        const result = await pool.query(roleQueries.getRolesWithOverlappingPermissions);
        return result.rows;
    }

    // 10. Сложный JOIN с агрегацией - пользователи с ролями и статистикой активности
    static async getUsersWithRoleAndActivityStats() {
        const query = `
            SELECT 
                u.id, u.username, u.email, u.created_at, u.is_active,
                r.name as role_name, r.description as role_description,
                r.permissions as role_permissions,
                COUNT(m.id) as message_count,
                COUNT(DISTINCT c.id) as conversation_count,
                MAX(m.created_at) as last_message_date,
                CASE 
                    WHEN MAX(m.created_at) > NOW() - INTERVAL '7 days' THEN 'active'
                    WHEN MAX(m.created_at) > NOW() - INTERVAL '30 days' THEN 'recent'
                    ELSE 'inactive'
                END as activity_status
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN messages m ON u.id = m.user_id
            LEFT JOIN conversations c ON u.id = c.user_id
            WHERE u.is_active = TRUE AND r.is_active = TRUE
            GROUP BY u.id, u.username, u.email, u.created_at, u.is_active,
                     r.name, r.description, r.permissions
            ORDER BY message_count DESC, u.created_at DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // 11. JOIN с подзапросом - роли с топ пользователями
    static async getRolesWithTopUsers(limit: number = 5) {
        const query = `
            SELECT 
                r.id, r.name, r.description,
                json_agg(
                    json_build_object(
                        'id', u.id,
                        'username', u.username,
                        'email', u.email,
                        'created_at', u.created_at,
                        'message_count', COALESCE(msg_counts.count, 0)
                    ) ORDER BY COALESCE(msg_counts.count, 0) DESC
                ) as top_users
            FROM roles r
            LEFT JOIN users u ON r.id = u.role_id AND u.is_active = TRUE
            LEFT JOIN (
                SELECT 
                    user_id,
                    COUNT(*) as count
                FROM messages
                GROUP BY user_id
            ) msg_counts ON u.id = msg_counts.user_id
            WHERE r.is_active = TRUE
            GROUP BY r.id, r.name, r.description
            ORDER BY r.name
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // 12. JOIN с оконными функциями - пользователи с ранжированием по активности
    static async getUsersWithActivityRanking() {
        const query = `
            SELECT 
                u.id, u.username, u.email, u.created_at,
                r.name as role_name,
                COUNT(m.id) as message_count,
                RANK() OVER (ORDER BY COUNT(m.id) DESC) as activity_rank,
                RANK() OVER (PARTITION BY r.id ORDER BY COUNT(m.id) DESC) as role_activity_rank,
                PERCENT_RANK() OVER (ORDER BY COUNT(m.id)) as activity_percentile
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN messages m ON u.id = m.user_id
            WHERE u.is_active = TRUE AND r.is_active = TRUE
            GROUP BY u.id, u.username, u.email, u.created_at, r.name, r.id
            ORDER BY message_count DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }

    // 13. JOIN с условной логикой - пользователи с расширенными разрешениями
    static async getUsersWithExtendedPermissions() {
        const query = `
            SELECT 
                u.id, u.username, u.email,
                r.name as role_name,
                r.permissions as base_permissions,
                CASE 
                    WHEN r.name = 'admin' THEN array_append(r.permissions, 'super_admin')
                    WHEN r.name = 'moderator' THEN array_append(r.permissions, 'extended_moderation')
                    ELSE r.permissions
                END as extended_permissions,
                CASE 
                    WHEN r.permissions @> '["admin"]' THEN 'full_access'
                    WHEN r.permissions @> '["moderate"]' THEN 'moderation_access'
                    WHEN r.permissions @> '["write"]' THEN 'write_access'
                    ELSE 'read_only'
                END as access_level
            FROM users u
            INNER JOIN roles r ON u.role_id = r.id
            WHERE u.is_active = TRUE AND r.is_active = TRUE
            ORDER BY u.created_at DESC
        `;
        
        const result = await pool.query(query);
        return result.rows;
    }
}

// Примеры использования
export const exampleUsage = async () => {
    console.log('=== Примеры использования JOIN\'ов ===\n');

    // 1. Получение всех пользователей с ролями
    const usersWithRoles = await JoinExamples.getAllUsersWithRoles();
    console.log('Пользователи с ролями:', usersWithRoles.length);

    // 2. Получение пользователей роли "admin"
    const adminUsers = await JoinExamples.getUsersByRoleName('admin');
    console.log('Администраторы:', adminUsers.length);

    // 3. Получение пользователей с разрешением "write"
    const writeUsers = await JoinExamples.getUsersWithPermission('write');
    console.log('Пользователи с разрешением write:', writeUsers.length);

    // 4. Статистика по ролям
    const roleStats = await JoinExamples.getUserStatsByRole();
    console.log('Статистика по ролям:', roleStats);

    // 5. Роли с количеством пользователей
    const rolesWithCount = await JoinExamples.getRolesWithUserCount();
    console.log('Роли с количеством пользователей:', rolesWithCount);

    // 6. Статистика разрешений
    const permissionStats = await JoinExamples.getPermissionStats();
    console.log('Статистика разрешений:', permissionStats);
};



