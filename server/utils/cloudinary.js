// Cloudinary configuration for image uploads
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary - support both CLOUDINARY_URL and individual env vars
if (process.env.CLOUDINARY_URL) {
    // Use CLOUDINARY_URL if provided (contains cloud_name, api_key, api_secret)
    cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
    });
} else {
    // Fall back to individual environment variables
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blog-app',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ],
    },
});

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

module.exports = {
    cloudinary,
    upload,
};
