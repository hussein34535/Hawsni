'use client';

import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Conditionally hide padding on checkout, product, and cart pages
  const isMinimalLayout = pathname.includes('/checkout') || pathname.includes('/product/') || pathname.includes('/cart');

  return (
    <main 
      className={`
        flex-1 w-full max-w-7xl mx-auto transition-all duration-300
        ${isMinimalLayout ? 'pt-0' : 'pt-20'}
      `}
    >
      {children}
    </main>
  );
}
