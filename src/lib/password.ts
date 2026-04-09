/**
 * Password hashing utilities using bcryptjs.
 *
 * All admin passwords are stored as bcrypt hashes.
 * Plaintext passwords are never persisted.
 */

import bcrypt from "bcryptjs";

/** Number of salt rounds for bcrypt hashing. */
const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * Also supports legacy plaintext comparison for migration:
 * if the stored value is NOT a bcrypt hash, it falls back to direct comparison.
 */
export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plaintext, stored);
  }
  // Legacy plaintext comparison (for migration period)
  return plaintext === stored;
}

/**
 * Check if a string looks like a bcrypt hash.
 * Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long.
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}
