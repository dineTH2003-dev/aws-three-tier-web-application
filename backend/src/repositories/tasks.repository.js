import { db } from '../config/db.js';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const tasksRepository = {
  async create({ userId, title, description = null, status = 'pending', priority = 'medium' }) {
    const query = `
      INSERT INTO tasks (user_id, title, description, status, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, title, description, status, priority, created_at, updated_at;
    `;
    const res = await db.query(query, [userId, title, description, status, priority]);
    return mapRow(res.rows[0]);
  },

  async findAllByUser(userId, { status, priority } = {}) {
    const conditions = ['user_id = $1'];
    const values = [userId];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      conditions.push(`priority = $${values.length}`);
    }

    const query = `
      SELECT id, user_id, title, description, status, priority, created_at, updated_at
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC;
    `;

    const res = await db.query(query, values);
    return res.rows.map(mapRow);
  },

  async findByIdAndUser(id, userId) {
    const query = `
      SELECT id, user_id, title, description, status, priority, created_at, updated_at
      FROM tasks
      WHERE id = $1 AND user_id = $2
      LIMIT 1;
    `;
    const res = await db.query(query, [id, userId]);
    return mapRow(res.rows[0]);
  },

  async update(id, userId, fields) {
    const setClauses = [];
    const values = [id, userId];

    const updatableKeys = ['title', 'description', 'status', 'priority'];
    for (const key of updatableKeys) {
      if (fields[key] !== undefined) {
        values.push(fields[key]);
        setClauses.push(`${key} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.findByIdAndUser(id, userId);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE tasks
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, title, description, status, priority, created_at, updated_at;
    `;

    const res = await db.query(query, values);
    return mapRow(res.rows[0]);
  },

  async delete(id, userId) {
    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const res = await db.query(query, [id, userId]);
    return res.rowCount > 0;
  },
};
