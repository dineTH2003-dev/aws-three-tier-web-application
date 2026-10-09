import argon2 from 'argon2';

export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hashedPassword, plainPassword) {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}
