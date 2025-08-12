import pool from './database';
import { initRolesTable, createDefaultRoles } from '../models/Roles';
import { initUsersTable } from '../models/User';

// Функция для полной инициализации базы данных
export const initializeDatabase = async () => {
    try {
        console.log('Starting database initialization...');
        
        // Создаем таблицы в правильном порядке (сначала роли, потом пользователи)
        await initRolesTable(pool);
        await initUsersTable(pool);
        
        // Создаем базовые роли
        await createDefaultRoles(pool);
        
        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
};

// Функция для проверки подключения к базе данных
export const testDatabaseConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('Database connection successful:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
};

// Функция для получения информации о таблицах
export const getDatabaseInfo = async () => {
    try {
        const tablesQuery = `
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `;
        
        const result = await pool.query(tablesQuery);
        console.log('Database tables:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Error getting database info:', error);
        throw error;
    }
};

// Экспортируем функцию для использования в основном файле
export default initializeDatabase;

