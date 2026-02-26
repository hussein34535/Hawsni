const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET
});

/**
 * GET /api/cloudinary/sign
 * Returns a signed upload params for direct browser-to-Cloudinary upload
 */
router.get('/sign', (req, res) => {
    try {
        const folder = req.query.folder || 'products';
        const timestamp = Math.round(new Date().getTime() / 1000);

        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp,
                folder,
                transformation: 'q_auto:good,f_auto,w_1200,c_limit'
            },
            process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            success: true,
            timestamp,
            signature,
            folder,
            cloud_name: process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY,
        });
    } catch (error) {
        console.error('Cloudinary sign error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
