import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Отключаем SSL для локальной разработки
});

export default pool;

