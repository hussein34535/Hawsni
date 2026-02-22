export default async function handler(req, res) {
    try {
        const response = await fetch('https://hwasibackend.vercel.app/sitemap.xml');

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch backend sitemap' });
        }

        const xmlText = await response.text();

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache deeply for 1 day across Vercel CDNs

        return res.status(200).send(xmlText);
    } catch (error) {
        console.error('Sitemap Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
