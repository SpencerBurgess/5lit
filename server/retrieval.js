import fetch from 'node-fetch';

// 1) Short neutral summary (best default)
export async function fetchWikipediaSummary(topic, timeoutMs = 8000) {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeoutMs);
        const r = await fetch(url, {
            signal: ctrl.signal
        });
        clearTimeout(t);
        if (!r.ok) return null;
        const j = await r.json();
        // Keep context short for small models
        return j?.extract ? j.extract.slice(0, 1200) : null;
    } catch {
        return null;
    }
}

// 2) Optional: disambiguate a broad topic to pick the best page
export async function searchWikipediaTitles(query, limit = 5) {
    try {
        const u = new URL('https://www.mediawiki.org/w/api.php');
        u.search = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: query,
            srlimit: String(limit),
            format: 'json',
            origin: '*'
        }).toString();
        const r = await fetch(u);
        if (!r.ok) return [];
        const j = await r.json();
        return (j?.query?.search || []).map(x => x.title);
    } catch {
        return [];
    }
}