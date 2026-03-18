/**
 * Debug script to list all files in past event folders
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
  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const eventFolderIds = [
    '1CaocYN_vG67QwBvkEaKmfG1miARek8vk',
    '1uOzeRLuENGAolBpeKc0GVEcXMrEXLGUi',
    '1svSU77SBDmxWw3lbAMBo62kAgjVRZJgR',
  ];

  for (const folderId of eventFolderIds) {
    console.log(`\n📁 Checking folder: ${folderId}`);
    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      console.log(`Found ${res.data.files?.length || 0} files:`);
      (res.data.files || []).forEach((f) => {
        const isBanner = f.name.toLowerCase() === 'banner.png';
        const marker = isBanner ? '⭐ ' : '  ';
        console.log(`${marker}${f.name} (${f.mimeType}) - ${f.size} bytes`);
      });
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

main();
