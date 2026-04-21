'use client';

import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Conditionally hide padding on checkout and product pages
  const isMinimalLayout = pathname.includes('/checkout') || pathname.includes('/product/');

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
