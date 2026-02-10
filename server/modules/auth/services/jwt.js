import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Create a JWT token.
 * @param {Object} payload - The payload to encode in the JWT. Example: { userId: string, username: string, role?: string }
 * @param {Object} [options] - Additional jwt.sign options (e.g., expiresIn)
 * @returns {string} The signed JWT token
 */
function createJwtToken(payload, options = {}) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h', ...options });
}

function verifyJwtToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

export { createJwtToken, verifyJwtToken };
