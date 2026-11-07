/** Link helpers for Instagram reels and Amazon affiliate URLs. */

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const REEL_CODE = /^[A-Za-z0-9_-]{5,64}$/;

/**
 * Extract the reel code from an Instagram reel URL.
 * Accepts /reel/CODE, /reels/CODE and /username/reel/CODE, with or without
 * protocol, query string or trailing slash. Returns null when not a reel URL.
 */
export function extractReelCode(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.findIndex((s) => s === "reel" || s === "reels");
  if (idx === -1) return null;
  const code = segments[idx + 1];
  return code && REEL_CODE.test(code) ? code : null;
}

export function reelUrl(code: string): string {
  return `https://www.instagram.com/reel/${code}/`;
}

export function reelEmbedUrl(code: string): string {
  return `https://www.instagram.com/reel/${encodeURIComponent(code)}/embed`;
}

const AMAZON_SHORT_HOSTS = new Set(["amzn.to", "amzn.in", "amzn.eu", "a.co"]);

/**
 * An http(s) link to Amazon: any amazon.<tld> store (amazon.in, amazon.com,
 * amazon.co.uk…, with subdomains) or an official short link (amzn.to, amzn.in, a.co).
 */
export function isAmazonUrl(input: string): boolean {
  if (!isValidHttpUrl(input)) return false;
  const host = new URL(input.trim()).hostname.toLowerCase().replace(/\.$/, "");
  if (AMAZON_SHORT_HOSTS.has(host)) return true;
  return /(^|\.)amazon\.(com|in|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/.test(host);
}

/** A valid absolute http(s) URL. */
export function isValidHttpUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
