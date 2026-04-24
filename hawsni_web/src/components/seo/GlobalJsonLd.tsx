import React from 'react';

export default function GlobalJsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'هوسي - Hwasi',
    url: 'https://hwasi.com',
    logo: 'https://hwasi.com/logo.png',
    description: 'Premium Fashion & Style in Egypt. Discover unique local craftsmanship with Hwasi.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG'
    },
    sameAs: [
      'https://www.facebook.com/hwasi.eg',
      'https://www.instagram.com/hwasi.eg'
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Hwasi',
    url: 'https://hwasi.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://hwasi.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
