import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, //  only 5MB
  fileFilter,
});

router.post('/profile-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'touri/profile-images',
          resource_type: 'image',
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          resolve(uploadResult);
        }
      );

      stream.end(req.file.buffer);
    });

    // @ts-ignore
    const secureUrl = result.secure_url;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: secureUrl,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
});

export default router;

