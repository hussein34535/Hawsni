import { Metadata } from 'next';
import { productService } from '@/services/productService';
import ProductPageClient from './ProductPageClient';
import { Product } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await productService.getProductById(id);
    if (!res.success || !res.product) {
      return { title: 'Product Not Found | Hwasi' };
    }
    const product = res.product;
    const finalPrice = product.discount 
      ? product.price - (product.price * product.discount / 100) 
      : product.price;

    const title = `${product.name} | هوسي للأزياء`;
    const description = `اشتري ${product.name} الآن بسعر ${finalPrice} ج.م. جودة متميزة وتصاميم فريدة من هوسي للأزياء.`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: product.images?.[0] ? [{ url: product.images[0] }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.images?.[0] ? [product.images[0]] : [],
      }
    };
  } catch (error) {
    return { title: 'Hwasi - Premium Fashion' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const res = await productService.getProductById(id);
  const product = res.product as Product;

  // JSON-LD Structured Data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name,
    image: product?.images,
    description: `Shop ${product?.name} at Hwasi. Premium quality fashion in Egypt.`,
    sku: product?.id || product?._id,
    brand: {
      '@type': 'Brand',
      name: 'Hwasi'
    },
    offers: {
      '@type': 'Offer',
      url: `https://hwasi.com/product/${id}`,
      priceCurrency: 'EGP',
      price: product?.discount 
        ? product.price - (product.price * product.discount / 100) 
        : product.price,
      availability: (product?.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product?.rating || '5.0',
      reviewCount: product?.num_reviews || '1'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient />
    </>
  );
}
