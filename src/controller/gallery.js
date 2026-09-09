import { pool } from '../config/db.js';
import { uploadImageStream, deleteImage } from '../config/cloudinary.js';

// POST /api/gallery
export const uploadGalleryImage = async (req, res, next) => {
  try {
    const { title, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const { url, publicId } = await uploadImageStream(req.file.buffer, 'gallery');

    const sql = `
      INSERT INTO gallery (title, image_url, cloudinary_public_id, category)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      title.trim(),
      url,
      publicId,
      category ? category.trim() : 'General',
    ]);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: result.insertId,
        title,
        image_url: url,
        category: category || 'General',
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
    let sql = 'SELECT id, title, image_url, category, created_at FROM gallery';
    const params = [];

    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
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
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    await deleteImage(rows[0].cloudinary_public_id);
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};