import { pool } from '../config/db.js';
import { uploadImageStream, deleteImage } from '../config/cloudinary.js';

// Capitalize first letter helper (e.g., 'sports' -> 'Sports')
const sanitizeCategory = (cat) => {
  if (!cat || typeof cat !== 'string') return 'General';
  const clean = cat.trim();
  if (!clean) return 'General';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

// POST /api/gallery
export const uploadGalleryImage = async (req, res, next) => {
  try {
    const { title, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Image title or caption is required' });
    }

    const formattedCategory = sanitizeCategory(category);

    // 1. Upload directly to Cloudinary 'gallery' folder
    const { url, publicId } = await uploadImageStream(req.file.buffer, 'gallery');

    // 2. Insert into TiDB
    const sql = `
      INSERT INTO gallery (title, category, image_url, cloudinary_public_id)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      title.trim(),
      formattedCategory,
      url,
      publicId,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Gallery asset uploaded successfully',
      data: {
        id: result.insertId,
        title: title.trim(),
        category: formattedCategory,
        image_url: url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gallery
export const getAllGalleryImages = async (req, res, next) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT id, title, category, image_url, created_at FROM gallery';
    const params = [];

    if (category && category.toLowerCase() !== 'all') {
      sql += ' WHERE LOWER(category) = LOWER(?)';
      params.push(category.trim());
    }

    sql += ' ORDER BY created_at DESC';

    const [images] = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/gallery/:id
export const deleteGalleryImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT cloudinary_public_id FROM gallery WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Image asset not found' });
    }

    // 1. Cloudinary asset removal
    await deleteImage(rows[0].cloudinary_public_id);

    // 2. Database row delete
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Gallery image removed successfully from Cloudinary and Database',
    });
  } catch (error) {
    next(error);
  }
};