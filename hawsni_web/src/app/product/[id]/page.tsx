'use client';

import { useState } from 'react';
import { Product } from '@/types';

interface ProductPageClientProps {
  initialProduct: Product;
}

export default function ProductPageClient({ initialProduct }: ProductPageClientProps) {
  // نستخدم البيانات المجلوبة من السيرفر كقيمة أولية لمنع ظهور الشاشة الفارغة
  const [product, setProduct] = useState<Product>(initialProduct);

  if (!product) {
    return null; // أو يمكنك وضع تصميم لصفحة التحميل
  }

  return (
    <div className="min-h-screen">
      {/* 
        ضع هنا كل أكواد الـ JSX الخاصة بعرض المنتج 
        (الصور، السعر، زر الإضافة للسلة، إلخ...)
        التي كانت في ملف الكلاينت القديم
      */}

      <h1>{product.name}</h1>
      <p>{product.price} ج.م</p>
    </div>
  );
}