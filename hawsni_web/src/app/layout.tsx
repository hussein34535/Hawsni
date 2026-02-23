import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: 'Hawsni | Premium Fashion & Style in Egypt',
  description: 'Shop the latest fashion trends at Hawsni. Premium quality, local craftsmanship, and unique styles delivered to your doorstep in Egypt.',
  keywords: 'fashion, Egypt, style, clothing, premium, Hawsni, ecommerce',
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: 'Hawsni | Premium Fashion & Style',
    description: 'Discover the ultimate fashion destination in Egypt. Shop unique collections at Hawsni.',
    images: ['/logo.png'],
  },
};

import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ToastContainer from "@/components/layout/ToastContainer";
import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cairo.variable} font-cairo min-h-screen flex flex-col bg-[var(--color-bg-secondary)] pb-20 md:pb-0`}>
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full pt-20">
            {children}
          </main>
          <BottomNav />
          <ToastContainer />
        </LanguageProvider>
      </body>
    </html>
  );
}
