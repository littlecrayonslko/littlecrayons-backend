import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { pool } from './config/db.js'; // Curly braces lagaye named export ke liye

async function createAdmin() {
  const email = 'admin@littlecrayons.com';
  const rawPassword = 'AdminPassword123';

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const query = `
    INSERT INTO users (email, password, role) 
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE password = VALUES(password);
  `;

  try {
    await pool.query(query, [email, hashedPassword, 'admin']);
    console.log('✅ Admin created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${rawPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();