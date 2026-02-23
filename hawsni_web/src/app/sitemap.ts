import { MetadataRoute } from 'next';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://hawsni.vercel.app';

    // 1. Fetch Dynamic Data
    let products: any[] = [];
    let categories: any[] = [];

    try {
        const [prodRes, catRes] = await Promise.all([
            productService.getProducts(),
            categoryService.getCategories()
        ]);
        if (prodRes.success) products = prodRes.products;
        if (catRes.success) categories = catRes.categories;
    } catch (error) {
        console.error('Sitemap data fetch failed:', error);
    }

    // 2. Map Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        '',
        '/search',
        '/profile',
        '/profile/orders',
        '/profile/addresses',
        '/profile/details',
        '/profile/coupons',
        '/cart',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));

    // 3. Map Category Routes
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
        url: `${baseUrl}/search?category=${String(cat._id || cat.id)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    // 4. Map Product Routes
    const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
        url: `${baseUrl}/product/${String(prod._id || prod.id)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.6,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
