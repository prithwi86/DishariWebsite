import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config()

// Allow self-signed certs for Cloudinary (matches sync script behavior)
if (process.env.CLOUDINARY_ALLOW_SELF_SIGNED_CERTS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

function cloudinaryDevApi() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  return {
    name: 'cloudinary-dev-api',
    configureServer(server) {
      // GET /api/cloudinary/list — list known JSON files
      server.middlewares.use('/api/cloudinary/list', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          files: [
            { id: 'about-us.json', label: 'About Us' },
            { id: 'upcoming-events.json', label: 'Upcoming Events' },
            { id: 'contact.json', label: 'Contact' },
            { id: 'video_urls.json', label: 'Video URLs' },
          ]
        }))
      })

      // GET /api/cloudinary/fetch?id=<public_id> — fetch raw JSON from Cloudinary
      server.middlewares.use('/api/cloudinary/fetch', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const publicId = url.searchParams.get('id')
        if (!publicId) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: 'Missing id parameter' }))
        }
        try {
          const rawUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`
          console.log(`[admin] Fetching: ${rawUrl}`)
          const resp = await fetch(rawUrl)
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const data = await resp.json()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        } catch (err) {
          console.error(`[admin] Fetch error:`, err.message)
          res.statusCode = 502
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      // POST /api/cloudinary/upload — upload JSON back to Cloudinary
      server.middlewares.use('/api/cloudinary/upload', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'POST only' }))
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = JSON.parse(Buffer.concat(chunks).toString())

        const { publicId, content } = body
        if (!publicId || !content) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: 'Missing publicId or content' }))
        }

        // Validate JSON
        try {
          JSON.parse(content)
        } catch {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: 'Invalid JSON content' }))
        }

        try {
          const timestamp = Math.floor(Date.now() / 1000)
          const { default: crypto } = await import('crypto')
          const params = `invalidate=true&overwrite=true&public_id=${publicId}&timestamp=${timestamp}&type=upload`
          const signature = crypto.createHash('sha1').update(params + apiSecret).digest('hex')

          const formData = new URLSearchParams()
          formData.append('file', `data:application/json;base64,${Buffer.from(content).toString('base64')}`)
          formData.append('public_id', publicId)
          formData.append('resource_type', 'raw')
          formData.append('overwrite', 'true')
          formData.append('invalidate', 'true')
          formData.append('timestamp', timestamp.toString())
          formData.append('api_key', apiKey)
          formData.append('signature', signature)
          formData.append('type', 'upload')

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
            { method: 'POST', body: formData }
          )
          const result = await uploadRes.json()
          if (!uploadRes.ok) throw new Error(result.error?.message || 'Upload failed')

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, url: result.secure_url, version: result.version }))
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), cloudinaryDevApi()],
})
