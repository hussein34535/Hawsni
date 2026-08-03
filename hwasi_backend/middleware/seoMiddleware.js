const ProductService = require('../services/productService');
const CategoryService = require('../services/categoryService');

const BOT_USER_AGENTS = [
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'slurp',
    'facebot',
    'ia_archiver',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'whatsapp',
    'telegrambot',
    'pinterest',
    'bot',
    'crawler',
    'spider'
];

const seoMiddleware = async (req, res, next) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const isBot = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));

    // Only intercept product and category routes for bots
    const productMatch = req.path.match(/^\/product\/([^\/]+)/);
    const categoryMatch = req.path.match(/^\/category\/([^\/]+)/);

    if (isBot && (productMatch || categoryMatch)) {
        try {
            let seoData = {
                title: 'Hwasi',
                description: 'Premium Fashion & Lifestyle Shopping',
                image: 'https://hwasi.com/icons/Icon-192.png',
                url: `https://hwasi.com${req.path}`,
                price: ''
            };

            if (productMatch) {
                const productId = productMatch[1];
                const product = await ProductService.getProductById(productId);
                if (product) {
                    seoData.title = product.name;
                    seoData.description = product.description || '';
                    if (product.images && product.images.length > 0) {
                        seoData.image = product.images[0];
                    }
                    seoData.price = `${product.price} EGP`;
                }
            } else if (categoryMatch) {
                const categoryId = categoryMatch[1];
                const category = await CategoryService.getCategoryById(categoryId);
                if (category) {
                    seoData.title = category.name;
                    seoData.description = `Shop ${category.name} at Hwasi`;
                    seoData.image = category.image_url || category.imageUrl || seoData.image;
                }
            }

            return res.render('seo-preview', seoData);
        } catch (error) {
            console.error('SEO Middleware Error:', error);
            // Fallback to normal rendering if data fetch fails
            return next();
        }
    }

    next();
};

module.exports = seoMiddleware;
