import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root or repo root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5433', 10),
  database: process.env.DB_NAME || 'taskmanager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[migrations] Connecting to database...');
    
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { rows: appliedRows } = await client.query('SELECT filename FROM schema_migrations');
    const appliedFiles = new Set(appliedRows.map((r) => r.filename));

    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`[migrations] Found ${migrationFiles.length} migration file(s).`);

    for (const file of migrationFiles) {
      if (appliedFiles.has(file)) {
        console.log(`[migrations] Skipping already applied: ${file}`);
        continue;
      }

      console.log(`[migrations] Applying: ${file}...`);
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[migrations] Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrations] Failed to apply ${file}:`, err);
        throw err;
      }
    }

    console.log('[migrations] All migrations applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[migrations] Migration failed:', err.message);
  process.exit(1);
});
