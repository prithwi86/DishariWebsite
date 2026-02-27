/**
 * Simple image proxy server for Google Drive images
 * Runs as middleware with Vite dev server
 */

import axios from 'axios';

export function setupImageProxy(app) {
  // Proxy endpoint for images
  app.get('/api/image', async (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      // Set appropriate headers
      res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');

      res.send(response.data);
    } catch (error) {
      console.error('Image proxy error:', error.message);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  });
}
