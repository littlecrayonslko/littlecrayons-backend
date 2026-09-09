import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image buffer directly to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folderName - Subfolder inside Cloudinary (e.g., 'gallery', 'blogs')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadImageStream = (fileBuffer, folderName = 'general') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `littlecrayons/${folderName}`,
        resource_type: 'image',
        format: 'webp', // Auto-converts images to lightweight WebP
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an image from Cloudinary by its public ID
 * @param {string} publicId
 */
export const deleteImage = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;