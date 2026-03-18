/**
 * Debug script to test Google Drive API connection and folder access
 */

import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const CREDS_PATH = resolve(ROOT, 'credentials.json');
const CONFIG_PATH = resolve(__dirname, 'drive-config.json');

async function main() {
  if (!existsSync(CREDS_PATH)) {
    console.error('❌ credentials.json not found');
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  console.log('✅ credentials.json loaded');
  console.log('   Service Account:', creds.client_email);
  console.log('   Project ID:', creds.project_id);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });
  console.log('✅ Authenticated with Google Drive API\n');

  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

  // Test carousel folder
  const carouselId = config.carousel.folderId;
  console.log(`Testing Carousel folder: ${carouselId}`);
  try {
    const folderRes = await drive.files.get({
      fileId: carouselId,
      fields: 'id, name, mimeType, owners',
    });
    console.log('  ✅ Folder accessible:', folderRes.data.name);
    console.log('  📁 Owners:', folderRes.data.owners?.map(o => o.emailAddress).join(', '));

    // List files in folder
    const filesRes = await drive.files.list({
      q: `'${carouselId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 50,
    });
    console.log(`  📊 Total files: ${filesRes.data.files?.length || 0}`);
    if (filesRes.data.files?.length > 0) {
      console.log('  Files:');
      filesRes.data.files.forEach(f => {
        console.log(`    - ${f.name} (${f.mimeType})`);
      });
    }

    // Try with image filter
    const imagesRes = await drive.files.list({
      q: `'${carouselId}' in parents and trashed = false and mimeType contains 'image'`,
      fields: 'files(id, name, mimeType, size)',
      pageSize: 50,
    });
    console.log(`  🖼️  Image files: ${imagesRes.data.files?.length || 0}`);
    if (imagesRes.data.files?.length > 0) {
      console.log('  Image Files:');
      imagesRes.data.files.forEach(f => {
        console.log(`    - ${f.name} (${f.mimeType})`);
      });
    }
  } catch (err) {
    console.error('  ❌ Error accessing folder:', err.message);
  }
}

main().catch(err => {
  console.error('Debug failed:', err.message || err);
  process.exit(1);
});
