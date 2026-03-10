import { MetadataRoute } from 'next'

const BASE_URL = 'https://hwasi.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static routes
    const routes = [
        '',
        '/cart',
        '/profile',
        '/products',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    try {
        // Fetch products for dynamic routes
        const productsRes = await fetch(`${API_URL}/products`);
        const productsData = await productsRes.json();
        const products = productsData.data || [];

        const productRoutes = products.map((product: any) => ({
            url: `${BASE_URL}/product/${product.id}`,
            lastModified: new Date(product.updated_at || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))

        // Fetch categories
        const categoriesRes = await fetch(`${API_URL}/categories`);
        const categoriesData = await categoriesRes.json();
        const categories = categoriesData.data || [];

        const categoryRoutes = categories.map((cat: any) => ({
            url: `${BASE_URL}/products?category=${cat.id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.5,
        }))

        return [...routes, ...productRoutes, ...categoryRoutes]
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return routes
    }
}
