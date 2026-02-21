import type { RequestHandler } from './$types';

/**
 * Audio stream proxy endpoint.
 * Tauri's WebKit webview blocks cross-origin audio from CDNs like Tidal.
 * This proxies the audio stream through our SvelteKit dev server so
 * the <audio> element can play it from the same origin.
 */
export const GET: RequestHandler = async ({ url, request }) => {
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    try {
        const upstreamHeaders = new Headers();
        request.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            if (['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host'].includes(lowerKey)) {
                return;
            }
            upstreamHeaders.set(key, value);
        });

        if (!upstreamHeaders.has('User-Agent')) {
            upstreamHeaders.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15');
        }

        // Force identity encoding so the upstream sends plain data that Node can forward without zstd artifacts.
        upstreamHeaders.set('Accept-Encoding', 'identity');

        const response = await fetch(targetUrl, {
            headers: upstreamHeaders,
        });

        if (!response.ok && response.status !== 206) {
            console.error(`[Proxy] Upstream returned ${response.status} for ${targetUrl}`);
            return new Response(`Upstream error: ${response.status}`, { status: response.statusText ? 502 : response.status });
        }

        // Stream the body through to the client with correct headers
        const headers = new Headers();

        response.headers.forEach((value, key) => {
            const lowerKey = key.toLowerCase();
            // Don't forward hop-by-hop headers or content-encoding
            if (['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-encoding'].includes(lowerKey)) {
                return;
            }
            headers.set(key, value);
        });

        // Allow cross-origin access
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Range');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    } catch (error) {
        console.error('[Proxy] Failed to fetch:', error);
        return new Response('Proxy fetch failed', { status: 502 });
    }
};
