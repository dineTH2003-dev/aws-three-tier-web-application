import { db } from '../config/db.js';

export const usersRepository = {
  async findByEmail(email) {
    const query = `
      SELECT id, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = LOWER($1)
      LIMIT 1;
    `;
    const res = await db.query(query, [email]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const query = `
      SELECT id, name, email, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash }) {
    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, LOWER($2), $3)
      RETURNING id, name, email, created_at, updated_at;
    `;
    const res = await db.query(query, [name, email, passwordHash]);
    return res.rows[0];
  },
};
