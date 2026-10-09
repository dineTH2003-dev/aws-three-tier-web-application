import { usersRepository } from '../repositories/users.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';

export const authService = {
  async register({ name, email, password }) {
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = await usersRepository.create({
      name,
      email,
      passwordHash,
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token,
    };
  },

  async login({ email, password }) {
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await verifyPassword(user.password_hash, password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token,
    };
  },

  async getProfile(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  },
};
