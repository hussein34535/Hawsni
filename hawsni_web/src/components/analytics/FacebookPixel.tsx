"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
    interface Window {
        fbq: any;
        _fbq: any;
    }
}

export const trackEvent = (eventName: string, options?: any) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", eventName, options);
    }
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hwasibackend.vercel.app/api';

const FacebookPixelEvents = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // Default to the provided ID
    const [pixelId, setPixelId] = useState<string | null>('917878230740262');

    // 1. Fetch Pixel ID from Backend Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/settings/public`);
                const data = await res.json();
                if (data.success && data.data?.meta_pixel_id) {
                    setPixelId(data.data.meta_pixel_id);
                }
            } catch (err) {
                // Fallback to env if API fails
                const envId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
                if (envId) setPixelId(envId);
            }
        };
        fetchSettings();
    }, []);

    // 2. Track PageView on route changes
    useEffect(() => {
        if (!pixelId) return;

        if (window.fbq) {
            window.fbq("track", "PageView");
        }
    }, [pathname, searchParams, pixelId]);

    if (!pixelId) return null;

    return (
        <>
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                />
            </noscript>
        </>
    );
};

const FacebookPixel = () => {
    return (
        <Suspense fallback={null}>
            <FacebookPixelEvents />
        </Suspense>
    );
};

export default FacebookPixel;
