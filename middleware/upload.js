const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration - always save locally first
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: fileFilter
});

/**
 * Middleware to upload files to both local and Cloudinary
 * After multer saves locally, this uploads to Cloudinary
 */
const uploadToCloud = async (req, res, next) => {
    // Skip if Cloudinary is disabled
    if (process.env.USE_CLOUDINARY !== 'true') {
        return next();
    }

    try {
        // Handle single file
        if (req.file) {
            const localPath = req.file.path;
            const result = await uploadToCloudinary(localPath, {
                folder: 'tmdt_ecommerce/products'
            });

            if (result.success) {
                req.file.cloudinaryUrl = result.url;
                req.file.cloudinaryPublicId = result.public_id;
            }
        }

        // Handle multiple files
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const localPath = file.path;
                const result = await uploadToCloudinary(localPath, {
                    folder: 'tmdt_ecommerce/products'
                });

                if (result.success) {
                    file.cloudinaryUrl = result.url;
                    file.cloudinaryPublicId = result.public_id;
                }
            }
        }

        // Handle files object (multiple fields)
        if (req.files && !Array.isArray(req.files)) {
            for (const fieldName in req.files) {
                for (const file of req.files[fieldName]) {
                    const localPath = file.path;
                    const result = await uploadToCloudinary(localPath, {
                        folder: `tmdt_ecommerce/${fieldName}`
                    });

                    if (result.success) {
                        file.cloudinaryUrl = result.url;
                        file.cloudinaryPublicId = result.public_id;
                    }
                }
            }
        }

        next();
    } catch (error) {
        console.error('Cloud upload error:', error);
        next(); // Continue even if cloud upload fails - local is still saved
    }
};

/**
 * Get the best available URL for an uploaded file
 * Prefers Cloudinary URL if available, falls back to local
 */
const getFileUrl = (file) => {
    if (file.cloudinaryUrl) {
        return file.cloudinaryUrl;
    }
    // Return local URL
    return '/' + file.path.replace(/\\/g, '/').replace('public/', '');
};

/**
 * Delete file from both local and Cloudinary
 */
const deleteFile = async (localPath, cloudinaryPublicId) => {
    // Delete from local
    if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
    }

    // Delete from Cloudinary
    if (cloudinaryPublicId) {
        await deleteFromCloudinary(cloudinaryPublicId);
    }
};

module.exports = upload;
module.exports.uploadToCloud = uploadToCloud;
module.exports.getFileUrl = getFileUrl;
module.exports.deleteFile = deleteFile;
