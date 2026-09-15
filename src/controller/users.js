import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

// ================= REGISTER / CREATE ADMIN =================
// POST /api/admin/register
export const registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email ? email.trim() : '']
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this username or email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const insertSql = `
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES (?, ?, ?, 'admin', 1)
    `;

    const [result] = await pool.query(insertSql, [
      username.trim(),
      email ? email.trim() : `${username.trim()}@admin.com`,
      password_hash,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully.',
      adminId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
};

// ================= LOGIN ADMIN =================
// POST /api/admin/login
export const loginAdmin = async (req, res, next) => {
  try {
    // Body me id, username ya email kuch bhi aaye, accept karega
    const identifier = req.body.id || req.body.username || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.',
      });
    }

    const cleanId = identifier.toString().trim();

    // Username, email, ya numeric ID teeno se match karega
    const sql = `
      SELECT id, username, email, password_hash, role, is_active
      FROM users
      WHERE (username = ? OR email = ? OR id = ?) AND role = 'admin'
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [cleanId, cleanId, cleanId]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.',
      });
    }

    const admin = rows[0];

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is disabled.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.',
      });
    }

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