import HomePageClient from './HomePageClient';
import { Category, Product, Banner } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';
const BASE_URL = API_URL.replace(/\/api$/, '');

export const revalidate = 60;

const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
};

interface ApiData {
    success?: boolean;
    categories?: Category[];
    products?: Product[];
    data?: Banner[] | { banners?: Banner[] };
}

// The /banners endpoint returns a raw array; older shapes wrapped it in
// { data: [...] } or { data: { banners: [...] } }. Handle all of them.
function extractBanners(payload: unknown): Banner[] {
    if (Array.isArray(payload)) return payload;
    const obj = payload as { data?: Banner[] | { banners?: Banner[] } } | null | undefined;
    if (Array.isArray(obj?.data)) return obj.data;
    if (Array.isArray(obj?.data?.banners)) return obj.data.banners;
    return [];
}

async function fetchJson<T>(url: string): Promise<T | null> {
    try {
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) return null;
        return await res.json() as T;
    } catch (error) {
        console.error(`SSR fetch failed: ${url}`, error);
        return null;
    }
}

export default async function HomePage() {
    const [catData, prodData, featData, bannerData] = await Promise.all([
        fetchJson<ApiData>(`${API_URL}/categories`),
        fetchJson<ApiData>(`${API_URL}/products`),
        fetchJson<ApiData>(`${API_URL}/products/featured`),
        fetchJson<ApiData>(`${API_URL}/banners`),
    ]);

    const categories: Category[] = (catData?.categories || []).map((cat: Category) => ({
        ...cat,
        image: formatImageUrl(cat.image)
    }));

    const products: Product[] = prodData?.products || [];
    const featuredProducts: Product[] = featData?.products || [];

    const banners: Banner[] = extractBanners(bannerData);

    return (
        <HomePageClient
            categories={categories}
            products={products}
            featuredProducts={featuredProducts}
            banners={banners}
        />
    );
}
