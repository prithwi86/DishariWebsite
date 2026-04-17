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
const pastEventsFolder = process.env.CLOUDINARY_PAST_EVENTS_FOLDER || 'Dishari/Past Events';
const upcomingFolder = process.env.CLOUDINARY_UPCOMING_FOLDER || 'Dishari/Upcoming';
const contactPublicId = process.env.CLOUDINARY_CONTACT_ID || 'contact.json';
const upcomingEventsPublicId = process.env.CLOUDINARY_UPCOMING_EVENTS_ID || 'upcoming-events.json';
const videoUrlsPublicId = process.env.CLOUDINARY_VIDEO_URLS_ID || 'video_urls.json';
const aboutUsPublicId = process.env.CLOUDINARY_ABOUT_US_ID || 'about-us.json';
const aboutUsFolder = process.env.CLOUDINARY_ABOUT_US_FOLDER || 'Dishari/About_Us';
const homePagePublicId = process.env.CLOUDINARY_HOME_PAGE_ID || 'home-page.json';
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

async function listAllInAssetFolder(folderPath) {
  const resources = [];
  let nextCursor;
  do {
    const res = await cloudinary.search
      .expression(`asset_folder="${folderPath}"`)
      .with_field('tags')
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
// Home page sync
// ---------------------------------------------------------------------------

/**
 * Generic helper: fetch images from Cloudinary based on img_urls config object.
 * Reads folder, include_subfolders, and tag from the JSON itself.
 * Sorts results by order-N tag if present (e.g. order-1, order-2).
 */
async function resolveImageUrls(config, { width = 1200 } = {}) {
  const folder = config.folder;
  const tag = config.tag || '';
  const includeSubfolders = config.include_subfolders === true;

  if (!folder) return [];

  // Extract order from tags like "order-1", "order-2"
  const getOrder = (resource) => {
    const tags = resource.tags || [];
    for (const t of tags) {
      const match = t.match(/^order-(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return Infinity;
  };

  if (tag) {
    // Search for tagged images in folder (and optionally subfolders)
    const expressions = [];
    expressions.push(`asset_folder="${folder}" AND tags=${tag}`);
    if (includeSubfolders) {
      expressions.push(`asset_folder:${folder}/* AND tags=${tag}`);
    }

    const allResources = [];
    for (const expr of expressions) {
      const res = await cloudinary.search.expression(expr).with_field('tags').max_results(500).execute();
      allResources.push(...(res.resources || []));
    }

    // Deduplicate and sort by order tag
    const seen = new Set();
    return allResources
      .filter((r) => {
        if (!r.public_id || seen.has(r.public_id)) return false;
        seen.add(r.public_id);
        return true;
      })
      .sort((a, b) => getOrder(a) - getOrder(b))
      .map((r) => toOptimizedUrl(r.public_id, { width }));
  }

  // No tag — just list all images in folder, sorted by order tag
  const resources = await listAllInAssetFolder(folder);
  return resources
    .filter((r) => typeof r.public_id === 'string' && r.public_id.length > 0)
    .sort((a, b) => getOrder(a) - getOrder(b))
    .map((r) => toOptimizedUrl(r.public_id, { width }));
}

async function syncHomePage() {
  console.log('\n--- Syncing home page ---');

  // Fetch the home-page.json from Cloudinary
  const rawUrl = cloudinary.url(homePagePublicId, { resource_type: 'raw', secure: true });
  console.log(`  Fetching home page JSON from: ${rawUrl}`);
  const res = await fetch(rawUrl);
  if (!res.ok) {
    console.warn(`  Failed to fetch home-page.json (${res.status}). Skipping.`);
    return;
  }
  const data = await res.json();
  const body = data.body || {};

  // --- Upcoming Events ---
  const upcomingConfig = body.upcoming_events?.img_urls || {};
  console.log(`  Upcoming events: folder="${upcomingConfig.folder}", tag="${upcomingConfig.tag}", subfolders=${upcomingConfig.include_subfolders}`);
  const upcomingUrls = await resolveImageUrls(upcomingConfig);
  console.log(`  Found ${upcomingUrls.length} upcoming image(s).`);
  if (body.upcoming_events?.img_urls) body.upcoming_events.img_urls.urls = upcomingUrls;

  // --- Moments ---
  const momentsConfig = body.moments?.img_urls || {};
  console.log(`  Moments: folder="${momentsConfig.folder}", tag="${momentsConfig.tag}", subfolders=${momentsConfig.include_subfolders}`);
  const momentsUrls = await resolveImageUrls(momentsConfig);
  console.log(`  Found ${momentsUrls.length} moments image(s).`);
  if (body.moments?.img_urls) body.moments.img_urls.urls = momentsUrls;

  // --- Sponsors ---
  const sponsorsConfig = body.sponsors?.img_urls || {};
  console.log(`  Sponsors: folder="${sponsorsConfig.folder}", tag="${sponsorsConfig.tag}", subfolders=${sponsorsConfig.include_subfolders}`);
  const sponsorsUrls = await resolveImageUrls(sponsorsConfig, { width: 250 });
  console.log(`  Found ${sponsorsUrls.length} sponsor image(s).`);
  if (body.sponsors?.img_urls) body.sponsors.img_urls.urls = sponsorsUrls;

  // --- Past Events ---
  const pastEventsJsonFile = body.past_events?.json_file;
  if (pastEventsJsonFile) {
    console.log(`  Past events: json_file="${pastEventsJsonFile}" (synced separately by syncPastEvents)`);
  }

  data.body = body;

  const outPath = resolve(ROOT, 'public', 'data', 'home-page.json');
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  console.log(`  Wrote home-page.json.`);
}

// ---------------------------------------------------------------------------
// Past events sync
// ---------------------------------------------------------------------------

async function syncPastEvents() {
  // Read output filename from home-page.json
  const homePagePath = resolve(ROOT, 'public', 'data', 'home-page.json');
  let pastEventsFileName = 'past-events.json';
  try {
    const homeData = JSON.parse(readFileSync(homePagePath, 'utf-8'));
    pastEventsFileName = homeData.body?.past_events?.json_file || pastEventsFileName;
  } catch (err) {
    console.warn(`  Could not read home-page.json for past_events config: ${err.message}. Using default filename.`);
  }

  console.log(`\n--- Syncing past events (folder: ${pastEventsFolder}, output: ${pastEventsFileName}) ---`);

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

  const outPath = resolve(ROOT, 'public', 'data', pastEventsFileName);
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${pastEventsFileName}: ${events.length} past events (${events.reduce((n, e) => n + e.images.length, 0)} total images).`);
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

    // Process sub-events
    if (Array.isArray(ev.sub_events)) {
      for (const sub of ev.sub_events) {
        if (!sub.id) continue;
        const subFolder = `${eventFolder}/${sub.id}`;
        console.log(`\n    Processing sub-event "${sub.id}" → folder "${subFolder}"`);

        let subResources = [];
        try {
          subResources = await listAllInAssetFolder(subFolder);
        } catch (err) {
          console.warn(`      Could not list folder "${subFolder}": ${err.message}`);
        }

        const subImages = subResources.filter((r) => r.resource_type === 'image' && imageFormats.includes(r.format));

        // Sub-event banner
        const subBannerCandidates = subImages.filter((r) => {
          const filename = r.public_id.split('/').pop().toLowerCase();
          return filename.startsWith('banner');
        });

        let subBannerResource = null;
        if (subBannerCandidates.length > 0) {
          subBannerResource = subBannerCandidates[Math.floor(Math.random() * subBannerCandidates.length)];
          console.log(`      Sub-event banner found: "${subBannerResource.public_id}"`);
        } else {
          console.log('      No sub-event banner found.');
        }

        sub.banner = subBannerResource ? toOptimizedUrl(subBannerResource.public_id) : '';

        // Sub-event gallery images (exclude banners)
        const subGalleryImages = subImages
          .filter((r) => {
            const filename = r.public_id.split('/').pop().toLowerCase();
            return !filename.startsWith('banner');
          })
          .sort((a, b) => a.public_id.localeCompare(b.public_id))
          .map((r) => toOptimizedUrl(r.public_id));

        if (!sub.details) sub.details = {};
        sub.details.img_urls = subGalleryImages;
        console.log(`      ${subGalleryImages.length} sub-event image(s), banner: ${sub.banner ? 'yes' : 'none'}`);
      }
    }
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

// ---------------------------------------------------------------------------
// Press Release sync
// ---------------------------------------------------------------------------

const pressReleaseFolder = 'Dishari/Press_Release';

async function syncPressRelease() {
  console.log(`\n--- Syncing press releases ---`);

  // Read public_id from home-page.json
  const homePagePath = resolve(ROOT, 'public', 'data', 'home-page.json');
  let candidateId = 'press_release.json';
  try {
    const homeData = JSON.parse(readFileSync(homePagePath, 'utf-8'));
    candidateId = homeData.body?.press_releases?.json_file_public_id || candidateId;
  } catch (err) {
    console.warn(`  Could not read home-page.json for press_releases config: ${err.message}. Using default public_id.`);
  }

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
// About Us sync
// ---------------------------------------------------------------------------

async function syncAboutUs() {
  const rawUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/${aboutUsPublicId}`;
  console.log(`\n--- Syncing about-us (${rawUrl}) ---`);

  let data;
  try {
    const res = await fetch(rawUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.warn(`  Could not fetch about-us.json: ${err.message}. Skipping.`);
    return;
  }

  const org = data.organization;
  if (!org) {
    console.warn('  Invalid format (missing organization). Skipping.');
    return;
  }

  // Fetch all images in the About_Us folder
  const images = await listAllInAssetFolder(aboutUsFolder);
  console.log(`  Found ${images.length} image(s) in ${aboutUsFolder}.`);

  // Build a list of lowercase filenames for starts-with matching
  const imgEntries = images.map((img) => ({
    key: img.public_id.split('/').pop().toLowerCase(),
    resource: img,
  }));

  // Resolve org-level image (filename starts with "about_us")
  const aboutImg = imgEntries.find((e) => e.key.startsWith('about_us'));
  if (aboutImg) {
    org.Img_Url = toOptimizedUrl(aboutImg.resource.public_id, { width: 800 });
    console.log(`  Org image resolved: ${org.Img_Url}`);
  } else {
    console.warn('  No "about_us" image found in folder.');
  }

  // Resolve member pics
  const committees = org['Who We Are']?.commities || [];
  for (const committee of committees) {
    for (const member of committee.members || []) {
      // Match by member name: convert to lowercase, replace spaces with underscores
      const nameKey = member.name.toLowerCase().replace(/[\s()]+/g, '_').replace(/_+$/, '');
      const match = imgEntries.find((e) => e.key.startsWith(nameKey));
      if (match) {
        member.pic_url = toOptimizedUrl(match.resource.public_id, { width: 200 });
        console.log(`  Member pic for "${member.name}": ${member.pic_url}`);
      } else {
        console.log(`  No pic found for "${member.name}" (looked for "${nameKey}").`);
      }
    }
  }

  const outPath = resolve(ROOT, 'public', 'data', 'about-us.json');
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  console.log('Wrote about-us.json.');
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
// Google Sheets → Registration Reports
// ---------------------------------------------------------------------------

async function syncSheets() {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_ID || '').replace(/"/g, '').trim();
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').replace(/"/g, '').trim();
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/"/g, '').replace(/\\n/g, '\n').trim();

  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.warn('Skipping Google Sheets sync – missing GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_PRIVATE_KEY.');
    return;
  }

  const { google } = await import('googleapis');

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Tabs to pull and the columns we care about
  const tabConfigs = [
    {
      tab: 'Picnic',
      cols: ['eventTitle', 'ticketQty', 'firstname', 'lastname', 'totalAmount', 'createdAtUtc'],
    },
  ];

  const result = {};

  for (const { tab, cols } of tabConfigs) {
    console.log(`  Fetching tab "${tab}"…`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A1:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      console.warn(`  Tab "${tab}" has no data rows.`);
      result[tab] = [];
      continue;
    }

    const header = rows[0];
    const colIndices = cols.map((c) => {
      const idx = header.findIndex((h) => h.toLowerCase() === c.toLowerCase());
      if (idx === -1) console.warn(`  Column "${c}" not found in "${tab}".`);
      return { name: c, idx };
    });

    const dataRows = rows.slice(1).map((row) => {
      const obj = {};
      for (const { name, idx } of colIndices) {
        obj[name] = idx >= 0 ? (row[idx] || '') : '';
      }
      return obj;
    });

    result[tab] = dataRows;
    console.log(`  Got ${dataRows.length} rows from "${tab}".`);
  }

  const outPath = resolve(ROOT, 'public', 'data', 'reports.json');
  const output = {
    tabs: result,
    metadata: {
      source: 'Google Sheets',
      generated_at: new Date().toISOString(),
    },
  };
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
  console.log(`  Wrote ${outPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Cloudinary sync started');
  await syncHomePage();
  await syncPastEvents();
  await syncUpcoming();
  await syncPressRelease();
  await syncContact();
  await syncAboutUs();
  await syncVideoUrls();
  await syncSheets();
  console.log('\nAll syncs complete.');
}

main().catch((error) => {
  console.error('Sync failed:', error.message || error);
  process.exit(1);
});
