import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

dotenv.config({ path: resolve(ROOT, '.env.local') });

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const carouselTag = process.env.CLOUDINARY_CAROUSEL_TAG || 'carousel';
const allowSelfSigned = process.env.CLOUDINARY_ALLOW_SELF_SIGNED_CERTS === 'true';

if (allowSelfSigned) {
  // Local-only escape hatch for environments with SSL interception proxies.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('Warning: TLS certificate verification is disabled for this sync run.');
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary env vars. Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

function toCarouselUrl(publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ fetch_format: 'auto', quality: 'auto', width: 1200, crop: 'limit' }],
  });
}

async function listAllTaggedResources(tag) {
  const resources = [];
  let nextCursor;

  do {
    const res = await cloudinary.api.resources_by_tag(tag, {
      resource_type: 'image',
      max_results: 500,
      next_cursor: nextCursor,
    });

    resources.push(...(res.resources || []));
    nextCursor = res.next_cursor;
  } while (nextCursor);

  return resources;
}

async function main() {
  console.log(`Syncing carousel images from Cloudinary tag: ${carouselTag}`);

  const resources = await listAllTaggedResources(carouselTag);
  const images = resources
    .filter((item) => typeof item.public_id === 'string' && item.public_id.length > 0)
    .map((item) => toCarouselUrl(item.public_id));

  const output = {
    images,
    metadata: {
      source: 'Cloudinary',
      tag: carouselTag,
      total_images: images.length,
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'carousel-images.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');

  console.log(`Wrote ${images.length} image URLs to public/data/carousel-images.json`);
}

main().catch((error) => {
  console.error('Carousel sync failed:', error.message || error);
  process.exit(1);
});
