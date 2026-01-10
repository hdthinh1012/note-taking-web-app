import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class BcryptService {
  /**
   * Hash a password using bcrypt with salt.
   * @param {string} password - The plain text password.
   * @returns {Promise<string>} The hashed password.
   */
  static hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a plain password with a hash.
   * @param {string} password - The plain text password.
   * @param {string} hash - The hashed password.
   * @returns {Promise<boolean>} True if match, false otherwise.
   */
  static comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

export { BcryptService };
