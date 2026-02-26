/**
 * Google Drive → JSON sync script for Dishari Website.
 *
 * Reads image/video/doc references from shared Google Drive folders
 * and writes the JSON data files used by the website.
 *
 * Uses OAuth 2.0 (Desktop app) credentials — same as the old Python script.
 * The first run opens a browser for authentication; subsequent runs reuse
 * the saved token.json.
 *
 * Requirements:
 *   npm install googleapis open   (run via `npm run sync:install`)
 *
 * Usage:
 *   node scripts/sync-drive.js                    # sync everything
 *   node scripts/sync-drive.js --only carousel    # sync one dataset
 *   node scripts/sync-drive.js --only events
 *   node scripts/sync-drive.js --only testimonials
 *   node scripts/sync-drive.js --only upcoming
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { URL } from 'url';

// ---------- paths ----------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const CONFIG_PATH = resolve(__dirname, 'drive-config.json');
const CREDS_PATH = resolve(ROOT, 'credentials.json');
const TOKEN_PATH = resolve(ROOT, 'token.json');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// ---------- helpers --------------------------------------------------------

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

/**
 * Authenticate using OAuth 2.0 (Desktop app flow).
 * Compatible with the credentials.json from the old WordPress/Python project.
 * Saves and reuses token.json so the browser prompt only happens once.
 */
async function authorize() {
  if (!existsSync(CREDS_PATH)) {
    console.error(
      '\n❌  credentials.json not found in the project root.\n' +
      '   See GOOGLE_DRIVE_SETUP.md for instructions.\n'
    );
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web || {};

  if (!client_id || !client_secret) {
    console.error('❌  Invalid credentials.json — expected OAuth 2.0 Desktop credentials.');
    process.exit(1);
  }

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3000');

  // Try to load a previously saved token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);

    // Check if token needs refresh
    if (token.expiry_date && token.expiry_date < Date.now()) {
      console.log('🔄 Refreshing expired token…');
      try {
        const { credentials } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(credentials);
        writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
      } catch {
        console.log('⚠️  Token refresh failed — re-authenticating…');
        await getNewToken(oAuth2Client);
      }
    }
  } else {
    await getNewToken(oAuth2Client);
  }

  return google.drive({ version: 'v3', auth: oAuth2Client });
}

/**
 * Open a browser for the user to grant permission, then capture the auth code
 * via a temporary local HTTP server (like the old Python script's run_local_server).
 */
function getNewToken(oAuth2Client) {
  return new Promise((resolvePromise, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });

    // Start a tiny HTTP server to capture the redirect
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost:3000');
        const code = url.searchParams.get('code');
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h2>Missing authorization code.</h2>');
          return;
        }

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>✅ Authentication successful! You can close this tab.</h2>');
        server.close();
        console.log('✔ Authentication successful — token saved to token.json');
        resolvePromise();
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h2>❌ Authentication failed: ${err.message}</h2>`);
        server.close();
        reject(err);
      }
    });

    server.listen(3000, async () => {
      console.log('\n🔐 Opening browser for Google authentication…');
      console.log('   If the browser does not open, visit this URL:\n');
      console.log(`   ${authUrl}\n`);

      // Open the URL in the default browser
      try {
        const open = (await import('open')).default;
        await open(authUrl);
      } catch {
        // 'open' package not installed — user must open manually
        console.log('   (Install the "open" npm package for auto-browser-open)');
      }
    });
  });
}

/** Build a direct-view URL from a Drive file ID. */
function driveUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/** List all files in a folder, handling pagination. */
async function listFiles(drive, folderId, mimeFilter = null) {
  const files = [];
  let pageToken = null;

  do {
    let q = `'${folderId}' in parents and trashed = false`;
    if (mimeFilter) q += ` and mimeType contains '${mimeFilter}'`;

    const res = await drive.files.list({
      q,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 1000,
      pageToken,
      orderBy: 'name',
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

/** List subfolders inside a parent folder. */
async function listSubfolders(drive, parentFolderId) {
  return listFiles(drive, parentFolderId, 'application/vnd.google-apps.folder');
}

/** Separate images and videos from a flat file list. */
function categorize(files) {
  const images = [];
  const videos = [];
  for (const f of files) {
    if (f.mimeType.startsWith('image/')) images.push(driveUrl(f.id));
    else if (f.mimeType.startsWith('video/')) videos.push(driveUrl(f.id));
  }
  return { images, videos };
}

// ---------- syncers --------------------------------------------------------

async function syncCarousel(drive, config) {
  const cfg = config.carousel;
  console.log(`  ↻ Carousel (folder ${cfg.folderId})`);

  const files = await listFiles(drive, cfg.folderId, 'image');
  const images = files.map((f) => driveUrl(f.id));

  const data = {
    images,
    metadata: {
      source: 'Google Drive',
      folder_id: cfg.folderId,
      total_images: images.length,
    },
  };
  writeFileSync(resolve(ROOT, cfg.output), JSON.stringify(data, null, 2) + '\n');
  console.log(`    ✔ ${images.length} images → ${cfg.output}`);
}

async function syncUpcoming(drive, config) {
  const cfg = config.upcoming;
  console.log(`  ↻ Upcoming event (folder ${cfg.folderId})`);

  const files = await listFiles(drive, cfg.folderId, 'image');
  const images = files.map((f) => driveUrl(f.id));

  const data = {
    images,
    metadata: {
      source: 'Google Drive',
      folder_id: cfg.folderId,
      total_images: images.length,
    },
  };
  writeFileSync(resolve(ROOT, cfg.output), JSON.stringify(data, null, 2) + '\n');
  console.log(`    ✔ ${images.length} images → ${cfg.output}`);
}

async function syncTestimonials(drive, config) {
  const cfg = config.testimonials;
  console.log(`  ↻ Testimonials (folder ${cfg.folderId})`);

  // Testimonials are Google Docs in a shared folder
  const files = await listFiles(drive, cfg.folderId);
  const docs = files.filter(
    (f) => f.mimeType === 'application/vnd.google-apps.document'
  );

  const testimonials = [];
  for (const doc of docs) {
    // Export the doc as plain text so we can grab the body
    const res = await drive.files.export({
      fileId: doc.id,
      mimeType: 'text/plain',
    });
    const text = (res.data || '').toString().trim();

    // Use the doc name as the person's name
    testimonials.push({
      name: doc.name,
      text,
      file_id: doc.id,
    });
  }

  const data = {
    testimonials,
    metadata: {
      source: 'Google Drive',
      folder_id: cfg.folderId,
      total: testimonials.length,
    },
  };
  writeFileSync(resolve(ROOT, cfg.output), JSON.stringify(data, null, 2) + '\n');
  console.log(`    ✔ ${testimonials.length} testimonials → ${cfg.output}`);
}

async function syncEvents(drive, config) {
  const cfg = config.events;
  console.log(`  ↻ Past events`);

  const events = [];
  for (const ev of cfg.eventFolders) {
    console.log(`    • ${ev.title} (folder ${ev.folderId})`);
    const files = await listFiles(drive, ev.folderId);
    const { images, videos } = categorize(files);

    events.push({
      id: ev.id,
      title: ev.title,
      banner: images[0] || '',
      images,
      videos,
      folder_id: ev.folderId,
    });
    console.log(`      ${images.length} images, ${videos.length} videos`);
  }

  const data = { events };
  writeFileSync(resolve(ROOT, cfg.output), JSON.stringify(data, null, 2) + '\n');
  console.log(`    ✔ ${events.length} events → ${cfg.output}`);
}

// ---------- main -----------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  const only = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

  const config = loadConfig();
  const drive = await authorize();

  console.log('\n🔄  Syncing data from Google Drive …\n');

  const tasks = {
    carousel: () => syncCarousel(drive, config),
    upcoming: () => syncUpcoming(drive, config),
    testimonials: () => syncTestimonials(drive, config),
    events: () => syncEvents(drive, config),
  };

  if (only) {
    if (!tasks[only]) {
      console.error(`Unknown dataset "${only}". Options: ${Object.keys(tasks).join(', ')}`);
      process.exit(1);
    }
    await tasks[only]();
  } else {
    for (const [, run] of Object.entries(tasks)) await run();
  }

  console.log('\n✅  Sync complete.\n');
}

main().catch((err) => {
  console.error('Sync failed:', err.message || err);
  process.exit(1);
});
