import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Missing or malformed Authorization header:', authHeader);
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    console.error('[CRITICAL] process.env.JWT_SECRET is UNDEFINED on the server!');
    return res.status(500).json({
      success: false,
      message: 'Internal server error: Server JWT secret key is not configured.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[AUTH FAIL] Reason:', error.name, '-', error.message);
    return res.status(401).json({
      success: false,
      message: `Unauthorized: ${error.message}`, // Prints exact reason: "jwt expired", "invalid signature", etc.
    });
  }
};