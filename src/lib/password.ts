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
 *
 * Only bcrypt-hashed passwords are accepted.  Legacy plaintext passwords
 * must be migrated (re-hashed) before they can be used for login.
 */
export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<boolean> {
  if (!isBcryptHash(stored)) {
    // Reject plaintext-stored passwords — they must be migrated first
    // (use the admin panel or RECOVERY_MODE to set a new password).
    return false;
  }
  return bcrypt.compare(plaintext, stored);
}

/**
 * Check if a string looks like a bcrypt hash.
 * Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long.
 */
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}
