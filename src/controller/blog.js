import { pool } from '../config/db.js';
import { uploadImageStream, deleteImage } from '../config/cloudinary.js';

// Helper to generate SEO-friendly slugs
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// POST /api/blogs - Create a new blog post
export const createBlog = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    const file = req.file;

    // 1. Validate the 3 required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required fields.',
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'A cover image is required.',
      });
    }

    // 2. Upload image to Cloudinary under 'blogs' folder
    const { url, publicId } = await uploadImageStream(file.buffer, 'blogs');

    // 3. Generate unique slug
    let slug = generateSlug(title);
    const [existing] = await pool.query('SELECT id FROM blogs WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Save into MySQL
    const sql = `
      INSERT INTO blogs (title, slug, content, cover_image_url, cloudinary_public_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      title.trim(),
      slug,
      body.trim(),
      url,
      publicId,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Blog post published successfully.',
      data: {
        id: result.insertId,
        title: title.trim(),
        slug,
        cover_image_url: url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/blogs - Get all published blogs
export const getAllBlogs = async (req, res, next) => {
  try {
    const sql = `
      SELECT id, title, slug, cover_image_url, created_at 
      FROM blogs 
      WHERE is_published = TRUE 
      ORDER BY created_at DESC
    `;
    const [blogs] = await pool.query(sql);

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/blogs/:slug - Get single blog details by slug
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const [rows] = await pool.query(
      'SELECT id, title, slug, content, cover_image_url, created_at FROM blogs WHERE slug = ?',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found.' });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/blogs/:id - Delete blog & Cloudinary cover photo
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT cloudinary_public_id FROM blogs WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found.' });
    }

    await deleteImage(rows[0].cloudinary_public_id);
    await pool.query('DELETE FROM blogs WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Blog post and cover image deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};