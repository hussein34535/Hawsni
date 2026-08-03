/**
 * Ensures that an image URL is absolute and properly formatted for Cloudinary.
 * Handles Cloudinary public IDs, relative paths, and already absolute URLs.
 */
const ensureAbsoluteUrl = (url, cloudName = 'hwasibackend') => {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('http')) return url;
    
    // If it's a relative path starting with a Cloudinary public ID, prepend the base URL
    // Regex matches common Cloudinary public IDs
    if (url.match(/^[a-z0-9_]+(\.[a-z0-9]+)?$/i)) {
        return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    }
    
    return url;
};

/**
 * Extracts and cleans image URLs from various sources (scraped, direct, files).
 */
const cleanImageUrls = (urls, cloudName) => {
    if (!urls) return [];
    const urlArray = Array.isArray(urls) ? urls : [urls];
    return urlArray
        .map(u => typeof u === 'string' ? u : String(u))
        .map(u => ensureAbsoluteUrl(u.trim(), cloudName))
        .filter(u => u && u.startsWith('http'));
};

module.exports = {
    ensureAbsoluteUrl,
    cleanImageUrls
};
