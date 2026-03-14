import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/checkout/success/'],
    },
    sitemap: 'https://hwasi.com/sitemap.xml',
  };
}
