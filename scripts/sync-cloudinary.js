import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
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
const sponsorsFolder = process.env.CLOUDINARY_SPONSORS_FOLDER || 'Dishari/Sponsors';
const contactPublicId = process.env.CLOUDINARY_CONTACT_ID || 'contact.json';
const upcomingEventsPublicId = process.env.CLOUDINARY_UPCOMING_EVENTS_ID || 'upcoming-events.json';
const videoUrlsPublicId = process.env.CLOUDINARY_VIDEO_URLS_ID || 'video_urls.json';
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
  console.log(`\n--- Syncing upcoming events (public_id: ${upcomingEventsPublicId}) ---`);

  // 1. Fetch the master JSON from Cloudinary
  const rawUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${upcomingEventsPublicId}`;
  console.log(`  Fetching ${rawUrl}`);

  let masterData;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    masterData = await res.json();
  } catch (err) {
    console.warn(`  Could not fetch upcoming-events.json: ${err.message}. Writing empty file.`);
    masterData = { events: [] };
  }

  const events = (masterData.events || []).filter((ev) => ev.id && ev.id.trim() !== '');

  if (events.length === 0) {
    console.log('  No valid events found (all missing id). Writing empty events array.');
  }

  // 2. For each event, search its Cloudinary folder for banner + images
  for (const ev of events) {
    const eventFolder = `${upcomingFolder}/${ev.id}`;
    console.log(`\n  Processing event "${ev.id}" → folder "${eventFolder}"`);

    // List all resources in this event's folder
    let resources = [];
    try {
      resources = await listAllInAssetFolder(eventFolder);
    } catch (err) {
      console.warn(`    Could not list folder "${eventFolder}": ${err.message}`);
    }

    const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
    const images = resources.filter((r) => r.resource_type === 'image' && imageFormats.includes(r.format));

    // Banner: find images starting with "banner" in filename
    const bannerCandidates = images.filter((r) => {
      const filename = r.public_id.split('/').pop().toLowerCase();
      return filename.startsWith('banner');
    });

    let bannerResource = null;
    if (bannerCandidates.length > 0) {
      bannerResource = bannerCandidates[Math.floor(Math.random() * bannerCandidates.length)];
      console.log(`    Banner found: "${bannerResource.public_id}" (${bannerCandidates.length} candidate(s))`);
    } else {
      console.log('    No banner image found.');
    }

    ev.banner = bannerResource ? toOptimizedUrl(bannerResource.public_id) : '';

    // Image URLs: all images except banner files
    const bannerId = bannerResource ? (bannerResource.asset_id || bannerResource.public_id) : null;
    const galleryImages = images
      .filter((r) => {
        const filename = r.public_id.split('/').pop().toLowerCase();
        return !filename.startsWith('banner');
      })
      .sort((a, b) => a.public_id.localeCompare(b.public_id))
      .map((r) => toOptimizedUrl(r.public_id));

    if (!ev.details) ev.details = {};
    ev.details.img_urls = galleryImages;
    console.log(`    ${galleryImages.length} gallery image(s), banner: ${ev.banner ? 'yes' : 'none'}`);
  }

  // 3. Sort by order field, fallback to id
  events.sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : Infinity;
    const orderB = typeof b.order === 'number' ? b.order : Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return (a.id || '').localeCompare(b.id || '');
  });

  // 4. Write output
  const output = {
    events,
    metadata: {
      source: 'Cloudinary',
      folder: upcomingFolder,
      total_events: events.length,
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'upcoming-events.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`\nWrote upcoming-events.json (${events.length} event(s)).`);
}

// ---------------------------------------------------------------------------
// Sponsors sync
// ---------------------------------------------------------------------------

async function syncSponsors() {
  console.log(`\n--- Syncing sponsors (folder: ${sponsorsFolder}, tag: sponsor) ---`);

  const res = await cloudinary.search
    .expression(`asset_folder="${sponsorsFolder}" AND tags=sponsor`)
    .max_results(500)
    .execute();

  const images = (res.resources || [])
    .filter((r) => ['jpg', 'jpeg', 'png', 'webp'].includes(r.format))
    .sort((a, b) => a.public_id.localeCompare(b.public_id))
    .map((r) => toOptimizedUrl(r.public_id, { width: 250 }));

  const output = {
    images,
    metadata: {
      source: 'Cloudinary',
      folder: sponsorsFolder,
      total_images: images.length,
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'sponsors.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${images.length} sponsor image URLs.`);
}

// ---------------------------------------------------------------------------
// Testimonials sync
// ---------------------------------------------------------------------------

const testimonialsPublicId = process.env.CLOUDINARY_TESTIMONIALS_ID || 'testimonials.json';

async function syncTestimonials() {
  const rawUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${testimonialsPublicId}`;
  console.log(`\n--- Syncing testimonials (${rawUrl}) ---`);

  let data;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.warn(`  Could not fetch testimonials: ${err.message}. Writing empty file.`);
    data = { testimonials: [] };
  }

  // Validate structure
  if (!Array.isArray(data.testimonials)) {
    console.warn('  Invalid format (missing testimonials array). Writing empty file.');
    data = { testimonials: [] };
  }

  const output = {
    testimonials: data.testimonials,
    metadata: {
      source: 'Cloudinary',
      total: data.testimonials.length,
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'testimonials.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${data.testimonials.length} testimonials.`);
}

// ---------------------------------------------------------------------------
// Press Release sync
// ---------------------------------------------------------------------------

const pressReleaseFolder = 'Dishari/Press_Release';

async function syncPressRelease() {
  console.log(`\n--- Syncing press releases ---`);

  // Try direct public_id first, then fall back to Cloudinary search
  const candidateId = process.env.CLOUDINARY_PRESS_RELEASE_ID || 'press_release.json';
  const directUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${candidateId}`;

  let data;
  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      console.log(`  Fetched directly: ${directUrl}`);
      data = await res.json();
    } else {
      console.log(`  Direct fetch failed (${res.status}), searching Cloudinary...`);
      // Search for any raw resource matching press_release* in the asset folder
      const searchRes = await cloudinary.search
        .expression(`resource_type:raw AND asset_folder="${pressReleaseFolder}"`)
        .sort_by('public_id', 'asc')
        .max_results(10)
        .execute();

      const match = (searchRes.resources || []).find((r) =>
        r.public_id.startsWith('press_release')
      );

      if (match) {
        console.log(`  Found via search: public_id="${match.public_id}"`);
        const fallbackUrl = match.secure_url;
        const fbRes = await fetch(fallbackUrl);
        if (!fbRes.ok) throw new Error(`HTTP ${fbRes.status} from ${fallbackUrl}`);
        data = await fbRes.json();
      } else {
        throw new Error('No press_release* file found in Cloudinary');
      }
    }
  } catch (err) {
    console.warn(`  Could not fetch press releases: ${err.message}. Writing empty file.`);
    data = { press_releases: [] };
  }

  if (!Array.isArray(data.press_releases)) {
    console.warn('  Invalid format (missing press_releases array). Writing empty file.');
    data = { press_releases: [] };
  }

  // For each press release, fetch images and resolve tagged link assets
  for (const pr of data.press_releases) {
    const prFolder = `${pressReleaseFolder}/${pr.id}`;

    // --- Fetch images for this press release ---
    try {
      const imgRes = await cloudinary.search
        .expression(`asset_folder="${prFolder}" AND resource_type:image`)
        .sort_by('public_id', 'asc')
        .max_results(100)
        .execute();

      pr.images = (imgRes.resources || [])
        .filter((r) => ['jpg', 'jpeg', 'png', 'webp'].includes(r.format))
        .map((r) => toOptimizedUrl(r.public_id, { width: 800 }));

      console.log(`  PR ${pr.id}: found ${pr.images.length} images`);
    } catch (err) {
      console.warn(`  PR ${pr.id}: image search failed: ${err.message}`);
      pr.images = pr.images || [];
    }

    // --- Resolve tagged link assets ---
    if (Array.isArray(pr.links)) {
      for (const link of pr.links) {
        if (!link.tag) continue;
        const linksFolder = `${prFolder}/links`;
        try {
          const linkRes = await cloudinary.search
            .expression(`asset_folder="${linksFolder}" AND tags=${link.tag}`)
            .sort_by('public_id', 'asc')
            .max_results(10)
            .execute();

          const assets = (linkRes.resources || []).map((r) =>
            cloudinary.url(r.public_id, {
              secure: true,
              resource_type: r.resource_type,
              // For raw files (PDFs etc) use raw type; for images use optimized
              ...(r.resource_type === 'image'
                ? { transformation: [{ fetch_format: 'auto', quality: 'auto' }] }
                : {}),
            })
          );

          if (assets.length > 0) {
            link.url = assets[0]; // Primary link asset
            if (assets.length > 1) link.additional_urls = assets.slice(1);
          }
          console.log(`  PR ${pr.id} link tag="${link.tag}": found ${assets.length} assets`);
        } catch (err) {
          console.warn(`  PR ${pr.id} link tag="${link.tag}": search failed: ${err.message}`);
        }
      }
    }
  }

  const output = {
    press_releases: data.press_releases,
    metadata: {
      source: 'Cloudinary',
      total: data.press_releases.length,
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'press_release.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${data.press_releases.length} press releases.`);
}

// ---------------------------------------------------------------------------
// Contact sync
// ---------------------------------------------------------------------------

const assetsFolder = process.env.CLOUDINARY_ASSETS_FOLDER || 'Dishari/Assets';

async function syncContact() {
  const rawUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${contactPublicId}`;
  console.log(`\n--- Syncing contact (${rawUrl}) ---`);

  let data;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.warn(`  Could not fetch contact: ${err.message}. Writing empty file.`);
    data = { contact: {} };
  }

  if (!data.contact || typeof data.contact !== 'object') {
    console.warn('  Invalid format (missing contact object). Writing empty file.');
    data = { contact: {} };
  }

  // Resolve background image from Cloudinary using tags
  const tags = data.contact.background_img_tag;
  if (Array.isArray(tags) && tags.length > 0) {
    const tagFilter = tags.map((t) => `tags=${t}`).join(' AND ');
    const expr = `asset_folder="${assetsFolder}" AND ${tagFilter} AND resource_type:image`;
    console.log(`  Searching background image: ${expr}`);
    try {
      const searchRes = await cloudinary.search
        .expression(expr)
        .sort_by('public_id', 'asc')
        .max_results(1)
        .execute();
      const match = (searchRes.resources || [])[0];
      if (match) {
        data.contact.background_img_url = toOptimizedUrl(match.public_id, { width: 1920 });
        console.log(`  Background image resolved: ${data.contact.background_img_url}`);
      } else {
        console.warn('  No background image found for given tags.');
      }
    } catch (err) {
      console.warn(`  Background image search failed: ${err.message}`);
    }
  }

  const output = {
    contact: data.contact,
    metadata: {
      source: 'Cloudinary',
      generated_at: new Date().toISOString(),
    },
  };

  const outPath = resolve(ROOT, 'public', 'data', 'contact.json');
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote contact.json.`);
}

// ---------------------------------------------------------------------------
// Video URLs sync — merges external video links into target JSON files
// ---------------------------------------------------------------------------

async function syncVideoUrls() {
  const rawUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${videoUrlsPublicId}`;
  console.log(`\n--- Syncing video URLs (${rawUrl}) ---`);

  let data;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.warn(`  Could not fetch video_urls.json: ${err.message}. Skipping.`);
    return;
  }

  const entries = data.video_urls || [];
  if (entries.length === 0) {
    console.log('  No video URL entries found. Skipping.');
    return;
  }

  for (const entry of entries) {
    const targetFile = entry.file_name;
    const eventId = entry.event_id;
    const urls = entry.urls || [];

    if (!targetFile || !eventId) {
      console.warn(`  Skipping entry with missing file_name or event_id.`);
      continue;
    }

    const targetPath = resolve(ROOT, 'public', 'data', targetFile);
    let targetData;
    try {
      const raw = readFileSync(targetPath, 'utf-8');
      targetData = JSON.parse(raw);
    } catch (err) {
      console.warn(`  Could not read ${targetFile}: ${err.message}. Skipping.`);
      continue;
    }

    // Find the event by id in the events array
    const events = targetData.events || [];
    const event = events.find((ev) => ev.id === eventId);
    if (!event) {
      console.warn(`  Event "${eventId}" not found in ${targetFile}. Skipping.`);
      continue;
    }

    if (!event.details) event.details = {};
    event.details.video_urls = urls;
    console.log(`  Merged ${urls.length} video URL(s) into "${eventId}" in ${targetFile}.`);

    writeFileSync(targetPath, `${JSON.stringify(targetData, null, 2)}\n`, 'utf-8');
  }

  console.log('Video URL sync complete.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Cloudinary sync started');
  await syncCarousel();
  await syncPastEvents();
  await syncUpcoming();
  await syncSponsors();
  await syncTestimonials();
  await syncPressRelease();
  await syncContact();
  await syncVideoUrls();
  console.log('\nAll syncs complete.');
}

main().catch((error) => {
  console.error('Sync failed:', error.message || error);
  process.exit(1);
});
