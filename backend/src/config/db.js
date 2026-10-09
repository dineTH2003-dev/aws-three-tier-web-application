import pg from 'pg';
import { config } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

export const pool = new Pool(config.db);

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle database client');
});

export const db = {
  query: (text, params) => pool.query(text, params),
  ping: async () => {
    const res = await pool.query('SELECT 1 AS ok');
    return res.rows[0]?.ok === 1;
  },
  getClient: () => pool.connect(),
  close: () => pool.end(),
};
