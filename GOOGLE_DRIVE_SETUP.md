# Google Drive Sync Guide

This is the complete guide for syncing website content (images, videos, testimonials) from Google Drive.

## Overview

Once set up, you'll be able to:
- Store section images in Google Drive folders
- Run a single command to sync all content to your website
- Add/remove images from Drive, then re-sync with one command
- Keep sections hidden automatically when folders are empty

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `Dishari Carousel` (or any name)
5. Click **"Create"**
6. Wait for the project to be created, then select it

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, search for **"Google Drive API"**
2. Click on "Google Drive API"
3. Click the **"Enable"** button
4. Wait for it to finish enabling

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
   - Click the menu icon (☰) → API & Services → Credentials

2. Click **"+ Create Credentials"** → **"OAuth client ID"**

3. If prompted, configure the **OAuth Consent Screen** first:
   - Select **"External"** (or "Internal" for Google Workspace accounts)
   - Click **"Create"**
   - Fill in:
     - **App name**: `Dishari Carousel`
     - **User support email**: Your email address
     - **Developer contact**: Your email address
   - Click **"Save and Continue"** through Scopes and Test Users
   - Click **"Back to Dashboard"**

4. Go back to **Credentials** → **"+ Create Credentials"** → **"OAuth client ID"**
   - Application type: **"Desktop application"**
   - Name: `Dishari Carousel Desktop`
   - Click **"Create"**

5. Click **"Download JSON"** and save the file as **`credentials.json`** in the project root

> **Already have credentials from the old WordPress project?** Copy the existing `credentials.json` directly — it works with this project too.

## Step 4: Install Dependencies

```powershell
cd C:\Users\pghos6\Downloads\DishariWebsite
npm run sync:install
```

This installs the `googleapis` npm package needed by the sync script.

## Step 5: Find Your Google Drive Folder IDs

The folder ID is in the URL when you open a folder in Google Drive:

```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

The current folder IDs are pre-configured in `scripts/drive-config.json`:

| Section           | Folder ID                              |
| ----------------- | -------------------------------------- |
| Carousel          | `1dcXSMMWbvlFgVmMAYw2xgj6NMsdGrt6O`   |
| Upcoming Event    | `1FGE7oeIqJZrEQZLOM39VQkYOvjYq7HoP`   |
| Testimonials      | `17Q0oycfkCQXWrZvpDEQFUU7rF-iEl6ds`   |
| Event 1           | `1CaocYN_vG67QwBvkEaKmfG1miARek8vk`   |
| Event 2           | `1uOzeRLuENGAolBpeKc0GVEcXMrEXLGUi`   |
| Event 3           | `1svSU77SBDmxWw3lbAMBo62kAgjVRZJgR`   |

To update folder IDs, edit `scripts/drive-config.json`.

## Step 6: Upload Images to Google Drive

1. Open the appropriate Google Drive folder
2. Upload your images (JPG, PNG, GIF, WebP)
3. **Important**: The script only syncs files in the main folder, not subfolders

## Step 7: Run the Sync Script

```powershell
cd C:\Users\pghos6\Downloads\DishariWebsite
npm run sync
```

**First time only:** A browser window will open asking for Google account permission. Click **"Allow"** to grant read-only access to your Drive files. A `token.json` file is created so you won't need to authenticate again.

### Sync specific sections

```powershell
npm run sync -- --only carousel
npm run sync -- --only upcoming
npm run sync -- --only events
npm run sync -- --only testimonials
```

## Using the Script Going Forward

Every time you add or remove content from your Google Drive folders:

```powershell
npm run sync
```

You won't need to authenticate again (the token is saved). Just run the command and refresh your website.

---

## What the Script Does

When you run `npm run sync`, the script:

1. Connects to Google Drive using your OAuth credentials
2. For each configured folder:
   - Lists all image/video files
   - Generates direct-view URLs
   - Updates the corresponding JSON file in `public/data/`
3. For testimonials:
   - Reads Google Docs from the testimonials folder
   - Exports each doc's text content
   - Uses the doc filename as the person's name

### Output Files

| Script section    | Output file                          |
| ----------------- | ------------------------------------ |
| Carousel          | `public/data/carousel-images.json`   |
| Upcoming Event    | `public/data/upcoming-event.json`    |
| Past Events       | `public/data/past-events.json`       |
| Testimonials      | `public/data/testimonials.json`      |

---

## Troubleshooting

### "credentials.json not found"
- Download the credentials file from Google Cloud Console (Step 3)
- Or copy it from the old WordPress project
- Save it as exactly `credentials.json` (lowercase) in the project root

### "No images found in folder"
- Make sure images are in the root of the folder (not in subfolders)
- Check that files have extensions: .jpg, .jpeg, .png, .gif, .webp
- Verify the folder ID is correct in `scripts/drive-config.json`

### "Access denied" or "Permission error"
- Delete `token.json` from the project root
- Run `npm run sync` again — you'll be prompted to re-authenticate
- Make sure you're signed into the correct Google account

### "Token expired" or authentication errors
- Delete `token.json`
- Run `npm run sync` again

### "Invalid Google account"
- Delete both `token.json` and `credentials.json`
- Download new credentials from Google Cloud Console
- Try again

### Images don't appear on website
- Check browser console (F12) for errors
- Make sure you're running `npm run dev` for local development
- Refresh the page
- Run `npm run sync` again

---

## Security Notes

- `credentials.json` and `token.json` are **local-only** and listed in `.gitignore`
- They are **never** committed to the repository or uploaded to the website
- The OAuth token only grants **read-only** access to Google Drive
- If sharing your code, these files are already excluded via `.gitignore`

---

## Migrating from the Old WordPress Project

If you were using the Python `sync_google_drive.py` script from the old project:

1. **Credentials**: Copy your existing `credentials.json` to this project root — it works as-is
2. **Token**: The old `token.pickle` is not compatible. Delete it; the new script will create `token.json` on first run
3. **Folder IDs**: Already pre-configured in `scripts/drive-config.json` (extracted from the existing JSON data files)
4. **Python is no longer required**: The sync script is now written in Node.js and uses npm

### Old vs New commands

| Old (Python)                     | New (Node.js)                       |
| -------------------------------- | ----------------------------------- |
| `python sync_google_drive.py`    | `npm run sync`                      |
| Interactive folder ID prompts    | Pre-configured in drive-config.json |
| `pip install google-*`           | `npm run sync:install`              |
| `token.pickle`                   | `token.json`                        |
| Output: `wwwroot/*.json`         | Output: `public/data/*.json`        |
