import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Must match the exact key and fallback from your login controller
const JWT_SECRET = process.env.JWT_TOKEN || process.env.JWT_SECRET || 'my_super_secure_default_secret_key_123';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};