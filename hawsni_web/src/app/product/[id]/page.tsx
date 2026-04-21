import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productService } from '@/services/productService';
import ProductPageClient from './ProductPageClient';
import { Product } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hwasi.com';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const res = await productService.getProductById(id);
    if (!res.success || !res.product) {
      return { 
        title: 'Product Not Found | هوسي',
        description: 'المنتج غير موجود أو تم حذفه.'
      };
    }

    const product = res.product;
    const finalPrice = product.discount 
      ? (product.price - (product.price * product.discount / 100)).toFixed(2) 
      : product.price.toFixed(2);

    const title = `${product.name} | هوسي للأزياء`;
    const description = `اشتري ${product.name} الآن بسعر ${finalPrice} ج.م. جودة متميزة وتصاميم فريدة من هوسي للأزياء. توصيل سريع لجميع المحافظات.`;
    
    const ogImage = product.images?.[0]?.startsWith('http') 
      ? product.images[0] 
      : `${BASE_URL}${product.images?.[0] || '/default-og.jpg'}`;

    return {
      title,
      description,
      alternates: {
        canonical: `${BASE_URL}/product/${id}`,
      },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/product/${id}`,
        images: [{ url: ogImage, width: 800, height: 800, alt: product.name }],
        type: 'article',
        siteName: 'هوسي للأزياء'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      }
    };
  } catch (error) {
    return { title: 'Hwasi - Premium Fashion' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const res = await productService.getProductById(id);
  
  if (!res.success || !res.product) {
    notFound();
  }

  const product = res.product as Product;
  const finalPrice = product.discount 
    ? (product.price - (product.price * product.discount / 100)).toFixed(2) 
    : product.price.toFixed(2);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description || `تسوق ${product.name} من هوسي للأزياء. جودة عالية وتوصيل سريع في مصر.`,
    sku: (product as any).sku || (product as any)._id || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Hwasi'
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/product/${id}`,
      priceCurrency: 'EGP',
      price: finalPrice,
      availability: (product.stock ?? 0) > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    },
    ...(product.rating && product.rating > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.num_reviews || '1'
      }
    } : {})
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient initialProduct={product} />
    </>
  );
}