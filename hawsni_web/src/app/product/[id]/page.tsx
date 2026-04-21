'use client';

import { useParams } from 'next/navigation';
import { productService } from '@/services/productService';
import { useEffect, useState } from 'react';
import ProductPageClient from './ProductPageClient';
import { Product } from '@/types';

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      productService.getProductById(id).then(res => {
        if (res.success) {
          setProduct(res.product);
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0E4435] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center font-cairo">
      <p>المنتج غير موجود</p>
    </div>
  );

  return <ProductPageClient initialProduct={product} />;
}