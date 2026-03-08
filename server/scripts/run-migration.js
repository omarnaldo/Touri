import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'TouriDB',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const migrationPath = path.join(__dirname, '../../database/migrations/001_add_email_verification.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Migration completed successfully');
    pool.end();
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    pool.end();
    process.exit(1);
  });
