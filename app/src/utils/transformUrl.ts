/**
 * URL Transformation Utility
 * Transforms backend URLs to use correct host for device/emulator.
 * Handles: localhost URLs, stale IP addresses (e.g. old 192.168.x.x), relative paths.
 * External URLs (e.g. https://api.dicebear.com) are left untouched.
 */
import { SOCKET_URL } from '@/config/env';

/**
 * Transform backend URL to use the correct host.
 * Avatar/asset URLs may be stored with stale IPs when the server's network changes.
 * This function detects server paths (/store/, /uploads/) and rewrites the origin.
 */
export function transformUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  // Relative path - prepend SOCKET_URL
  if (url.startsWith('/')) {
    return `${SOCKET_URL}${url}`;
  }

  // Detect URLs pointing to our server by known path prefixes.
  // This handles localhost, 127.0.0.1, and any stale/current IP addresses.
  const serverPathMatch = url.match(/^https?:\/\/[^/]+(\/(?:store|uploads|api)\/.*)$/);
  if (serverPathMatch) {
    return `${SOCKET_URL}${serverPathMatch[1]}`;
  }

  // Fallback: replace localhost/127.0.0.1 with SOCKET_URL
  return url
    .replace(/http:\/\/localhost:3000/g, SOCKET_URL)
    .replace(/http:\/\/127\.0\.0\.1:3000/g, SOCKET_URL)
    .replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, SOCKET_URL);
}
