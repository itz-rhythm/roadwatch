const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'roadwatch_complaints',
    allowed_formats: ['jpg', 'jpeg', 'png', 'mp4'],
    transformation: [{ width: 800, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
