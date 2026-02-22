const ProductService = require('../../services/productService');
const CategoryService = require('../../services/categoryService');

class SitemapController {
    async getSitemapXml(req, res) {
        try {
            // Base URL for the frontend application
            const baseUrl = 'https://hwasi.com';

            // Generate current date for lastmod
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch data
            const products = await ProductService.getAllProducts();
            const categories = await CategoryService.getAllCategories();

            // 2. Start building XML string
            let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Base pages -->
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
`;

            // 3. Add Category URLs
            if (categories && categories.length > 0) {
                categories.forEach(category => {
                    sitemap += `
    <url>
        <loc>${baseUrl}/category/${category.id}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
                });
            }

            // 4. Add Product URLs
            if (products && products.length > 0) {
                products.forEach(product => {
                    // Using product ID, but if you have a slug field, slug is better for SEO
                    sitemap += `
    <url>
        <loc>${baseUrl}/product/${product.id}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
                });
            }

            // 5. Close XML
            sitemap += `
</urlset>`;

            // Send response with proper XML content type
            res.header('Content-Type', 'application/xml');
            res.send(sitemap);

        } catch (error) {
            console.error('Error generating sitemap:', error);
            res.status(500).end();
        }
    }

    getRobotsTxt(req, res) {
        // Allow all robots and point to the sitemap
        const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://hwasi.com/sitemap.xml
`;
        res.header('Content-Type', 'text/plain');
        res.send(robotsTxt);
    }
}

module.exports = new SitemapController();
