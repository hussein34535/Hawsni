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
        const folder = (req.query.folder || 'products').trim();
        const eager = (req.query.eager || '').trim();
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Cloudinary requires ALL parameters (except file, api_key, and signature) 
        // to be included in the signature, in alphabetical order.
        const paramsToSign = {
            folder,
            timestamp
        };

        if (eager) paramsToSign.eager = eager;

        const apiSecret = (process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET || '').trim();
        
        if (!apiSecret) {
            throw new Error('Cloudinary API Secret is missing in environment variables');
        }

        const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

        // Log the string to sign in dev to compare with Cloudinary error
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Cloudinary] Params to sign:', paramsToSign);
        }

        res.json({
            success: true,
            timestamp,
            signature,
            folder,
            eager,
            cloud_name: (process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
            api_key: (process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY || '').trim(),
        });
    } catch (error) {
        console.error('Cloudinary sign error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
