import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

// POST /api/auth/login
export const loginAdmin = async (req, res, next) => {
  try {
    const { id, password } = req.body;

    // 1. Strict validation
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both admin ID and password are required.',
      });
    }

    // 2. Query user by username or numeric id where role is admin
    const sql = `
      SELECT id, username, email, password_hash, role, is_active
      FROM users
      WHERE (username = ? OR id = ?) AND role = 'admin'
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [id.toString().trim(), id.toString().trim()]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.',
      });
    }

    const admin = rows[0];

    // 3. Status check
    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is disabled.',
      });
    }

    // 4. Verify password hash
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.',
      });
    }

    // 5. Send authenticated admin payload (No JWT)
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};