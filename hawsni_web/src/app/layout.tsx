import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Hawsni | Premium Fashion",
  description: "Discover premium fashion and lifestyle products at Hawsni.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cairo.variable} font-sans min-h-screen flex flex-col`}>
        {/* Navigation Bar will go here */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
