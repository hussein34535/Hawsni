'use client';

import Script from 'next/script';

const MicrosoftClarity = () => {
    // If no ID is provided in ENV, we don't load the script.
    // Replace with your actual ID or set NEXT_PUBLIC_CLARITY_ID in your environment
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

    if (!clarityId) return null;

    return (
        <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                    (function(c,l,a,r,i,t,y){
                        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    })(window, document, "clarity", "script", "${clarityId}");
                `,
            }}
        />
    );
};

export default MicrosoftClarity;
