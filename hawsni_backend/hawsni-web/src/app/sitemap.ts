import { MetadataRoute } from 'next';
import { productsApi } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hwasi.com';

  // Static routes
  const staticRoutes = [
    '',
    '/products',
    '/categories',
    '/login',
    '/register',
    '/wishlist',
    '/cart',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic product routes
  try {
    const productsRes = await productsApi.getAll();
    if (productsRes.data && Array.isArray(productsRes.data)) {
      const productRoutes = productsRes.data.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
      return [...staticRoutes, ...productRoutes];
    }
  } catch (error) {
    console.error('Sitemap generation error:', error);
  }

  return staticRoutes;
}
