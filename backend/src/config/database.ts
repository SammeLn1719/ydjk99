import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Отключаем SSL для локальной разработки
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.query('SELECT NOW()')
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error', err.stack));

  export async function initDatabase() {
    try {
      const sqlContent = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'init-db.sql'), 'utf8');
      await pool.query(sqlContent);
      console.log('Database initialized successfully');
    } catch (error: any) {
      if (error.code === '23505') {
        console.log('Database already initialized, skipping...');
      } else {
        console.error('Error initializing database:', error);
        throw error;
      }
    }
  }


export default pool;

