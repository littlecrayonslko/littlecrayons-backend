import { Router } from 'express';
import { uploadSingleImage } from '../middleware/multering.js';
import {
  uploadGalleryImage,
  getAllGalleryImages,
  deleteGalleryImage,
} from '../controller/gallery.js';

import { uploadTwoImages } from '../middleware/multering.js';
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

import { loginAdmin } from '../controller/users.js';

const router = Router();

// ================= GALLERY ROUTES =================
router.get('/gallery', getAllGalleryImages);
router.post('/gallery', uploadSingleImage, uploadGalleryImage);
router.delete('/gallery/:id', deleteGalleryImage);

router.post('/franchise', uploadTwoImages, submitFranchiseInquiry);
router.get('/franchise', getAllFranchiseInquiries);
router.delete('/franchise/:id', deleteFranchiseInquiry);

router.post('/blogs', uploadSingleImage, createBlog);
router.get('/blogs', getAllBlogs);
router.get('/blogs/:slug', getBlogBySlug);
router.delete('/blogs/:id', deleteBlog);

router.post('/admin/login', loginAdmin);

export default router;