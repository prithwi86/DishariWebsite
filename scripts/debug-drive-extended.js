/**
 * Extended debug script to test Google Drive API - check if service account has any access
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

  // Test 1: List files in root (shared with me)
  console.log('=== Test 1: Files in "Shared with me" ===');
  try {
    const res = await drive.files.list({
      spaces: 'drive',
      fields: 'files(id, name, mimeType)',
      pageSize: 20,
      q: 'sharedWithMe = true',
    });
    console.log(`✅ Found ${res.data.files?.length || 0} shared files/folders:\n`);
    if (res.data.files?.length > 0) {
      res.data.files.forEach(f => {
        console.log(`  - ${f.name} (${f.mimeType})`);
        console.log(`    ID: ${f.id}`);
      });
    }
  } catch (err) {
    console.error('❌ Error listing shared files:', err.message);
  }

  // Test 2: Try each folder ID from config
  console.log('\n=== Test 2: Check specific folder IDs from config ===');
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  
  const folderIds = [
    { name: 'Carousel', id: config.carousel.folderId },
    { name: 'Upcoming', id: config.upcoming.folderId },
    { name: 'Testimonials', id: config.testimonials.folderId },
  ];

  for (const folder of folderIds) {
    console.log(`\n📁 ${folder.name}: ${folder.id}`);
    try {
      const res = await drive.files.get({
        fileId: folder.id,
        fields: 'id, name, mimeType, webViewLink',
        supportsAllDrives: true,  // Enable Shared Drive support
      });
      console.log(`  ✅ Accessible: ${res.data.name}`);
      console.log(`  Link: ${res.data.webViewLink}`);
    } catch (err) {
      if (err.message.includes('File not found')) {
        console.log(`  ❌ Folder not found (ID may be wrong or folder deleted)`);
      } else if (err.message.includes('Permission denied')) {
        console.log(`  ❌ Permission denied (folder not shared with service account)`);
      } else {
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
  }
}

main().catch(err => {
  console.error('Debug failed:', err.message || err);
  process.exit(1);
});
