'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Declare gtag function for TypeScript
declare global {
    interface Window {
        gtag: (command: string, ...args: any[]) => void;
        dataLayer: any[];
    }
}

const GoogleAnalytics = () => {
    // Requires NEXT_PUBLIC_GA_ID in your environment variables
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!gaId || !pathname) return;

        // On route change, we map to page_view event in GA4
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', gaId, {
                page_path: pathname + searchParams.toString(),
            });
        }
    }, [pathname, searchParams, gaId]);

    if (!gaId) return null;

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${gaId}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />
        </>
    );
};

// Helper to track custom e-commerce events (AddToCart, Purchase, etc)
export const trackGAEvent = (eventName: string, params?: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    }
};

export default GoogleAnalytics;
