import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Hwasi | Premium Fashion E-Commerce",
    template: "%s | Hwasi"
  },
  description: "Experience the future of shopping with AI-powered Virtual Try-On. Discover premium fashion at Hwasi. هواسي - تجربة تسوق فريدة مع ميزة قياس الملابس بالذكاء الاصطناعي",
  keywords: ["Hwasi", "هواسي", "fashion", "e-commerce", "virtual try-on", "AI shopping", "clothes Saudi Arabia", "أزياء", "تسوق أونلاين"],
  authors: [{ name: "Hwasi Team" }],
  creator: "Hwasi",
  publisher: "Hwasi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hwasi.com",
    siteName: "Hwasi",
    title: "Hwasi | Premium Fashion & AI Virtual Try-On",
    description: "Discover premium fashion with Hwasi. Try on clothes virtually using our advanced AI technology.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Hwasi Brand Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hwasi | Premium Fashion & AI Virtual Try-On",
    description: "Experience the future of fashion shopping with Hwasi AI Try-On.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Hwasi",
  "url": "https://hwasi.com",
  "logo": "https://hwasi.com/logo.png",
  "sameAs": [
    "https://www.facebook.com/hwasi",
    "https://www.instagram.com/hwasi",
    "https://twitter.com/hwasi"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+966-XXX-XXX-XXX",
    "contactType": "customer service",
    "areaServed": "SA",
    "availableLanguage": ["Arabic", "English"]
  },
  "description": "Premium Fashion E-Commerce with AI Virtual Try-On integration."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${poppins.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
