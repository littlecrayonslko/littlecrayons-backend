import { pool } from '../config/db.js';
import { uploadImageStream, deleteImage } from '../config/cloudinary.js';

// POST /api/franchise
export const submitFranchiseInquiry = async (req, res, next) => {
  try {
    const {
      applicant_name,
      email,
      phone,
      city,
      state,
      investment_budget,
      available_space_sqft,
      message,
    } = req.body;

    const files = req.files || [];

    // 1. Validate required text fields
    if (!applicant_name || !email || !phone || !city || !state || !investment_budget || !available_space_sqft) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, phone, city, state, budget, space) are required.',
      });
    }

    // 2. Enforce exactly 2 images
    if (files.length !== 2) {
      return res.status(400).json({
        success: false,
        message: `Exactly 2 property images are required. You provided ${files.length}.`,
      });
    }

    // 3. Upload both images concurrently to Cloudinary under 'franchise'
    const [img1, img2] = await Promise.all([
      uploadImageStream(files[0].buffer, 'franchise'),
      uploadImageStream(files[1].buffer, 'franchise'),
    ]);

    // 4. Save into MySQL
    const sql = `
      INSERT INTO franchise_inquiries (
        applicant_name, email, phone, city, state, 
        investment_budget, available_space_sqft, message,
        image_1_url, cloudinary_id_1, image_2_url, cloudinary_id_2
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      applicant_name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      city.trim(),
      state.trim(),
      investment_budget.trim(),
      parseInt(available_space_sqft, 10),
      message ? message.trim() : null,
      img1.url,
      img1.publicId,
      img2.url,
      img2.publicId,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Franchise inquiry submitted successfully.',
      inquiry_id: result.insertId,
      images: [img1.url, img2.url],
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/franchise
export const getAllFranchiseInquiries = async (req, res, next) => {
  try {
    const [inquiries] = await pool.query(
      'SELECT * FROM franchise_inquiries ORDER BY created_at DESC'
    );
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/franchise/:id
export const deleteFranchiseInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT cloudinary_id_1, cloudinary_id_2 FROM franchise_inquiries WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    // Delete both images from Cloudinary
    await Promise.all([
      deleteImage(rows[0].cloudinary_id_1),
      deleteImage(rows[0].cloudinary_id_2),
    ]);

    // Delete row from MySQL
    await pool.query('DELETE FROM franchise_inquiries WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Franchise inquiry and associated images deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};