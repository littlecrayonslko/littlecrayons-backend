import { Router } from 'express';
import { verifyToken } from '../middleware/middleware.js';
import { uploadSingleImage, uploadTwoImages } from '../middleware/multering.js';

import {
  uploadGalleryImage,
  getAllGalleryImages,
  deleteGalleryImage,
} from '../controller/gallery.js';

import {
  submitFranchiseInquiry,
  getAllFranchiseInquiries,
  deleteFranchiseInquiry,
} from '../controller/franchise.js';

import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  deleteBlog,
} from '../controller/blog.js';

import { loginAdmin, registerAdmin } from '../controller/users.js';

const router = Router();

// ================= AUTH ROUTES =================
router.post('/admin/login', loginAdmin);
router.post('/admin/register', registerAdmin);

// ================= GALLERY ROUTES =================
// Public: Website par images sabko dikhni chahiye
router.get('/gallery', getAllGalleryImages);
// Admin Only: Nayi image dalna aur delete karna
router.post('/gallery', verifyToken, uploadSingleImage, uploadGalleryImage);
router.delete('/gallery/:id', verifyToken, deleteGalleryImage);

// ================= FRANCHISE ROUTES =================
// Public: Koi bhi normal customer franchise form submit kar sakta hai (No token)
router.post('/franchise', uploadTwoImages, submitFranchiseInquiry);
// Admin Only: Inquiries dekhna aur delete karna
router.get('/franchise', verifyToken, getAllFranchiseInquiries);
router.delete('/franchise/:id', verifyToken, deleteFranchiseInquiry);

// ================= BLOG ROUTES =================
// Public: Website visitors blogs padh sakte hain
router.get('/blogs', getAllBlogs);
router.get('/blogs/:slug', getBlogBySlug);
// Admin Only: Blog create aur delete karna
router.post('/blogs', verifyToken, uploadSingleImage, createBlog);
router.delete('/blogs/:id', verifyToken, deleteBlog);

export default router;