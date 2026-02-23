import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://hawsni.vercel.app'; // Update with real URL if known

    // Core pages
    const routes = [
        '',
        '/profile',
        '/profile/orders',
        '/profile/addresses',
        '/profile/details',
        '/profile/coupons',
        '/search',
        '/cart',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
