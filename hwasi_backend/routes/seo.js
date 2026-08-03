const express = require('express');
const router = express.Router();
const SitemapController = require('../controllers/api/sitemapController');

// SEO Routes
router.get('/sitemap.xml', SitemapController.getSitemapXml);
router.get('/robots.txt', SitemapController.getRobotsTxt);

module.exports = router;
