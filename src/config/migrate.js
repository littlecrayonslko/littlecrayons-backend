import { pool } from './db.js';

const createGalleryTable = `
CREATE TABLE IF NOT EXISTS gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createBlogsTable = `
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  author VARCHAR(100) DEFAULT 'Admin',
  cover_image_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(200) NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createFranchiseTable = `
CREATE TABLE IF NOT EXISTS franchise_inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  investment_budget VARCHAR(50) NOT NULL,
  available_space_sqft INT NOT NULL,
  message TEXT,
  image_1_url VARCHAR(500) NOT NULL,
  cloudinary_id_1 VARCHAR(200) NOT NULL,
  image_2_url VARCHAR(500) NOT NULL,
  cloudinary_id_2 VARCHAR(200) NOT NULL,
  status ENUM('pending', 'under_review', 'contacted', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function runMigration() {
  try {
    console.log('🔄 Running migrations for Gallery, Blogs, and Franchise...');

    await pool.query(createGalleryTable);
    console.log('✅ 1/3 Gallery table ready');

    await pool.query(createBlogsTable);
    console.log('✅ 2/3 Blogs table ready');

    await pool.query(createFranchiseTable);
    console.log('✅ 3/3 Franchise inquiries table ready');

    console.log('🚀 All 3 tables created successfully on Aiven!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();