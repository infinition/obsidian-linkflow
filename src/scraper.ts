import { requestUrl } from 'obsidian';
import { LinkData } from './types';

export async function scrapeUrl(url: string): Promise<Partial<LinkData> | null> {
    // 1. Détection YouTube pour éviter le téléchargement de page (plus rapide)
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);

    if (ytMatch) {
        const videoId = ytMatch[1];
        return {
            title: `YouTube Video (${videoId})`,
            image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            description: "Vidéo YouTube sauvegardée.",
            isVideo: true,
            dateAdded: Date.now(),
            status: 'unread',
            archived: false
        };
    }

    // 2. Scraping Web classique
    try {
        const response = await requestUrl({ url: url });
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.text, "text/html");

        const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const titleTag = doc.querySelector('title')?.innerText;

        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
        const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');

        // Favicon detection
        let favicon = doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
            doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
            doc.querySelector('link[rel="icon"]')?.getAttribute('href');

        if (favicon && !favicon.startsWith('http')) {
            try {
                const urlObj = new URL(url);
                favicon = urlObj.origin + (favicon.startsWith('/') ? '' : '/') + favicon;
            } catch (e) {
                favicon = "";
            }
        }

        return {
            title: ogTitle || titleTag || url,
            image: ogImage || "",
            description: ogDesc || "",
            siteName: ogSiteName || "",
            favicon: favicon || "",
            isVideo: false,
            dateAdded: Date.now(),
            status: 'unread',
            archived: false
        };

    } catch (e) {
        console.error("LinkFlow: Erreur de scraping pour " + url, e);
        return {
            title: url,
            image: "",
            description: "Impossible de récupérer les infos.",
            siteName: "",
            favicon: "",
            isVideo: false,
            dateAdded: Date.now(),
            status: 'unread',
            archived: false
        };
    }
}