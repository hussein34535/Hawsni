import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hwasi.com'),
  title: 'Hwasi - Premium Fashion & Style in Egypt | هَوَسي للأزياء',
  description: 'Shop the latest fashion trends at Hwasi (هَوَسي). Premium quality, local craftsmanship, and unique styles delivered to your doorstep in Egypt. اكتشف أحدث صيحات الموضة مع هَوَسي.',
  keywords: 'hwasi, Hwasi, هَوَسي, الهَوَسي, fashion, Egypt, style, clothing, premium, ecommerce, ملابس, أزياء, تسوق, مصر',
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    title: 'Hwasi - Premium Fashion & Style | هَوَسي',
    description: 'Discover the ultimate fashion destination in Egypt. Shop unique collections at Hwasi (هَوَسي).',
    url: 'https://hwasi.com',
    siteName: 'Hwasi',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Hwasi Logo',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hwasi - Premium Fashion | هَوَسي',
    description: 'Premium Fashion & Style in Egypt. Shop at Hwasi.',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://hwasi.com',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ToastContainer from "@/components/layout/ToastContainer";
import FacebookPixel from "@/components/analytics/FacebookPixel";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import ChatWidget from "@/components/chat/ChatWidget";
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
          <FacebookPixel />
          <GoogleAnalytics />
          <MicrosoftClarity />
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
