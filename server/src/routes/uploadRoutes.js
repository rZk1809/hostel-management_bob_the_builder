const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Map MIME types to extensions securely
const getExtension = (mimetype) => {
    switch (mimetype) {
        case 'image/jpeg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/webp': return '.webp';
        default: return null;
    }
};

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const ext = getExtension(file.mimetype) || path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Images only!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload an image file' });
    }

    // Return relative URL for storage in DB
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: imageUrl, message: 'Image uploaded successfully' });
});

module.exports = router;
