import { db } from '../src/config/db.js';

export async function clearDatabase() {
  await db.query('DELETE FROM tasks');
  await db.query('DELETE FROM users');
}

export async function closeDatabase() {
  await db.close();
}
