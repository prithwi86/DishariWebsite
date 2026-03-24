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
const pastEventsFolder = process.env.CLOUDINARY_PAST_EVENTS_FOLDER || 'Dishari/Past Events';
const upcomingFolder = process.env.CLOUDINARY_UPCOMING_FOLDER || 'Dishari/Upcoming';
const maxPastEvents = 3;
const allowSelfSigned = process.env.CLOUDINARY_ALLOW_SELF_SIGNED_CERTS === 'true';

if (allowSelfSigned) {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toOptimizedUrl(publicId, { width = 1200 } = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ fetch_format: 'auto', quality: 'auto', width, crop: 'limit' }],
  });
}

async function listAllByTag(tag) {
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

async function listAllInAssetFolder(folderPath) {
  const resources = [];
  let nextCursor;
  do {
    const res = await cloudinary.search
      .expression(`asset_folder="${folderPath}"`)
      .max_results(500)
      .next_cursor(nextCursor || undefined)
      .execute();
    resources.push(...(res.resources || []));
    nextCursor = res.next_cursor;
  } while (nextCursor);
  return resources;
}

async function findBannerInFolder(folderPath) {
  const res = await cloudinary.search
    .expression(`asset_folder="${folderPath}" AND tags=banner`)
    .max_results(1)
    .execute();
  const found = (res.resources || [])[0] || null;
  if (found) {
    console.log(`  Banner tag search returned: public_id="${found.public_id}" format="${found.format}" asset_folder="${found.asset_folder}"`);
  } else {
    console.log(`  Banner tag search: no image tagged "banner" found in "${folderPath}"`);
  }
  return found;
}

/**
 * Parse an event folder name like "1_Poush Sankranti 2026" into
 * { orderNo: 1, title: "Poush Sankranti 2026" }
 */
function parseEventFolder(folderName) {
  const sep = folderName.indexOf('_');
  if (sep === -1) return null;
  const orderNo = parseInt(folderName.substring(0, sep), 10);
  const title = folderName.substring(sep + 1).trim();
  if (isNaN(orderNo) || !title) return null;
  return { orderNo, title };
}

// ---------------------------------------------------------------------------
// Carousel sync
// ---------------------------------------------------------------------------

async function syncCarousel() {
  console.log(`\n--- Syncing carousel (tag: ${carouselTag}) ---`);

  const resources = await listAllByTag(carouselTag);
  const images = resources
    .filter((r) => typeof r.public_id === 'string' && r.public_id.length > 0)
    .map((r) => toOptimizedUrl(r.public_id));

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
  console.log(`Wrote ${images.length} carousel image URLs.`);
}

// ---------------------------------------------------------------------------
// Past events sync
// ---------------------------------------------------------------------------

async function syncPastEvents() {
  console.log(`\n--- Syncing past events (folder: ${pastEventsFolder}) ---`);

  // 1. List sub-folders under the past-events root
  const { folders } = await cloudinary.api.sub_folders(pastEventsFolder);
  console.log(`Found ${folders.length} sub-folder(s):`, folders.map((f) => ({ name: f.name, path: f.path })));



  // 2. Parse and sort — highest orderNo first (most recent event first)
  const parsed = folders
    .map((f) => {
      const result = parseEventFolder(f.name);
      if (!result) console.warn(`  Skipping folder "${f.name}" — does not match pattern <OrderNo>_<EventName>`);
      return { ...result, path: f.path, name: f.name };
    })
    .filter((f) => f.orderNo != null);

  parsed.sort((a, b) => a.orderNo - b.orderNo);

  const topEvents = parsed.slice(0, maxPastEvents);

  if (topEvents.length === 0) {
    console.warn('No valid event folders found. Writing empty past-events.json.');
  }

  // 3. For each event folder, list images
  const events = [];
  for (const ev of topEvents) {
    console.log(`  Listing images in: "${ev.path}"`);
    const resources = await listAllInAssetFolder(ev.path);
    console.log(`  Found ${resources.length} image(s)`);
    if (resources.length === 0) continue;

    // Filter to image formats (jpg, png, webp, etc.)
    const images = resources.filter((r) =>
      ['jpg', 'png', 'webp', 'jpeg', 'gif', 'avif'].includes(r.format)
    );

    // Sort by public_id for deterministic order
    images.sort((a, b) => a.public_id.localeCompare(b.public_id));

    // Determine banner: search for image tagged "banner" in this folder, else first image
    const taggedBanner = await findBannerInFolder(ev.path);
    const bannerResource = taggedBanner || images[0];

    if (!bannerResource) continue;

    const bannerFilename = bannerResource.public_id.split('/').pop();
    console.log(`  Banner selected: "${bannerFilename}" (tagged: ${!!taggedBanner})`);
    const bannerUrl = toOptimizedUrl(bannerResource.public_id);
    // Exclude the banner from the gallery images (match by asset_id for reliability)
    const bannerId = bannerResource.asset_id || bannerResource.public_id;
    const imageUrls = images
      .filter((r) => (r.asset_id || r.public_id) !== bannerId)
      .map((r) => toOptimizedUrl(r.public_id));

    events.push({
      id: ev.name.replace(/\s+/g, '_'),
      title: ev.title,
      orderNo: ev.orderNo,
      banner: bannerUrl,
      images: imageUrls,
    });
  }

  const output = {
    events,
    metadata: {
      source: 'Cloudinary',
      folder: pastEventsFolder,
      total_events: events.length,
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'past-events.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${events.length} past events (${events.reduce((n, e) => n + e.images.length, 0)} total images).`);
}

// ---------------------------------------------------------------------------
// Upcoming events sync
// ---------------------------------------------------------------------------

async function syncUpcoming() {
  console.log(`\n--- Syncing upcoming banner (folder: ${upcomingFolder}, tag: banner) ---`);

  // Search for image tagged "banner" (case-insensitive) in the Upcoming folder
  const res = await cloudinary.search
    .expression(`asset_folder="${upcomingFolder}" AND tags=banner`)
    .max_results(1)
    .execute();

  const bannerResource = (res.resources || [])[0] || null;
  let bannerUrl = '';

  if (bannerResource) {
    console.log(`  Banner found: "${bannerResource.public_id}"`);
    bannerUrl = toOptimizedUrl(bannerResource.public_id);
  } else {
    console.log('  No image tagged "banner" found in Upcoming folder. Banner will be hidden.');
  }

  // Read existing upcoming-events.json to preserve the events list
  const outPath = resolve(ROOT, 'public', 'data', 'upcoming-events.json');
  let existing = { events: [] };
  try {
    const raw = (await import('fs')).readFileSync(outPath, 'utf-8');
    existing = JSON.parse(raw);
  } catch { /* file may not exist yet */ }

  const output = {
    banner: bannerUrl,
    events: existing.events || [],
    metadata: {
      source: 'Cloudinary',
      folder: upcomingFolder,
      banner_found: !!bannerResource,
      generated_at: new Date().toISOString(),
    },
  };

  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote upcoming-events.json (banner: ${bannerResource ? 'yes' : 'none'}).`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Cloudinary sync started');
  await syncCarousel();
  await syncPastEvents();
  await syncUpcoming();
  console.log('\nAll syncs complete.');
}

main().catch((error) => {
  console.error('Sync failed:', error.message || error);
  process.exit(1);
});
