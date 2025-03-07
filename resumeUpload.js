const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Storage for Cloudinary (Restricting to PDF & DOCX)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'job-connector', // Cloudinary folder
    allowed_formats: ['pdf', 'docx'],
    resource_type: 'raw',
  },
});

const uploadResume = multer({ storage });

module.exports = uploadResume;
