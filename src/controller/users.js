import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Fallback or explicit check to prevent crash
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secure_default_secret_key_123';

export const registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@admin.com`;

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [cleanUsername, cleanEmail]
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
      cleanUsername,
      cleanEmail,
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

export const loginAdmin = async (req, res, next) => {
  try {
    const identifier = req.body.identifier || req.body.id || req.body.username || req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required.',
      });
    }

    const cleanId = identifier.toString().trim();

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
        message: 'Invalid credentials.',
      });
    }

    const admin = rows[0];

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Use JWT_SECRET safely
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
      JWT_TOKEN,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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