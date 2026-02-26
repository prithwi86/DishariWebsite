/**
 * Proxy a Google Drive (or any) image URL through weserv.nl to bypass CORS.
 */
export function proxyImageUrl(url) {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=404`;
}
