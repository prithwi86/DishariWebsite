# Dishari Website — Deployment & Hosting Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Project](#building-the-project)
- [Hosting Options on Hostinger](#hosting-options-on-hostinger)
  - [Option 1: Subdomain (Recommended)](#option-1-subdomain-recommended)
  - [Option 2: Subdirectory](#option-2-subdirectory)
- [Google Drive Sync](#google-drive-sync)
  - [Setup](#sync-setup)
  - [Usage](#sync-usage)
  - [Configuration](#sync-configuration)
- [Updating Content](#updating-content)

---

## Prerequisites

- **Node.js** v18+ and **npm** installed
- Access to **Hostinger hPanel**
- (For Drive sync) A **Google Cloud** project with Drive API enabled and a service account key

## Building the Project

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This generates a `dist/` folder with all static files ready for deployment.

---

## Hosting Options on Hostinger

> Your existing WordPress site will remain untouched with both options below.

### Option 1: Subdomain (Recommended)

Deploy the React app on a subdomain like `new.yourdomain.com`.

**Steps:**

1. Log in to **Hostinger hPanel**
2. Go to **Domains → Subdomains**
3. Create a subdomain (e.g., `new`, `app`, or `beta`) — this creates a folder like:
   - `public_html/new/` or
   - `domains/new.yourdomain.com/public_html/`
4. Run `npm run build` locally
5. Upload the **contents** of the `dist/` folder to the subdomain's root directory using:
   - **Hostinger File Manager** (hPanel → Files → File Manager), or
   - **FTP** (use credentials from hPanel → Files → FTP Accounts)
6. Visit `https://new.yourdomain.com` to verify

**No changes to `vite.config.js` needed** — the default base path `/` works since the app is at the subdomain root.

**Pros:**
- Completely isolated from the WordPress site
- Easy to set up and manage
- Can later swap to the main domain when ready
- Separate SSL certificate (auto-provisioned by Hostinger)

---

### Option 2: Subdirectory

Deploy the React app under a path like `yourdomain.com/newsite/`.

**Steps:**

1. Update `vite.config.js` to set the base path:

   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/newsite/',   // ← add this line
   })
   ```

2. Run `npm run build`
3. Upload the **contents** of the `dist/` folder to `public_html/newsite/` on Hostinger
4. Add this `.htaccess` file inside `public_html/newsite/` to support client-side routing:

   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /newsite/
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /newsite/index.html [L]
   </IfModule>
   ```

5. Visit `https://yourdomain.com/newsite/` to verify

**Pros:**
- No subdomain needed
- Same SSL certificate as the main site

**Cons:**
- Shares the domain with WordPress — slightly more complex routing
- Must remember to set `base` in Vite config

---

## Google Drive Sync

The website's content (carousel images, event galleries, testimonials, upcoming event banners) is managed via shared Google Drive folders. A sync script pulls the latest file list from Drive and updates the JSON data files in `public/data/`.

### Sync Setup

1. **Create a Google Cloud project** (if you don't have one):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the **Google Drive API**

2. **Create a Service Account:**
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → Service Account**
   - Download the JSON key file
   - Save it as `credentials.json` in the project root (it's gitignored)

3. **Share Drive folders** with the service account email (found in `credentials.json` → `client_email`). Give it **Viewer** access.

4. **Install sync dependencies:**

   ```bash
   npm run sync:install
   ```

### Sync Usage

```bash
# Sync all data from Google Drive
npm run sync

# Sync only a specific dataset
npm run sync -- --only carousel
npm run sync -- --only events
npm run sync -- --only testimonials
npm run sync -- --only upcoming
```

### Sync Configuration

Edit `scripts/drive-config.json` to update folder IDs or add new Drive sources:

```json
{
  "carousel": {
    "folderId": "YOUR_FOLDER_ID",
    "output": "public/data/carousel-images.json"
  }
}
```

The folder IDs can be found in the Google Drive URL when viewing a folder:
`https://drive.google.com/drive/folders/{FOLDER_ID}`

---

## Updating Content

### Workflow

1. Add/remove images in the shared Google Drive folders
2. Run `npm run sync` to update the JSON data files
3. Run `npm run build` to rebuild the site
4. Upload the new `dist/` folder to Hostinger

### Automated (Optional)

You can set up a **GitHub Action** to auto-build on push. See `.github/workflows/` if configured.

---

## Folder Structure Reference

```
public/data/
  carousel-images.json   ← Home page carousel images
  past-events.json       ← Event gallery images & videos
  testimonials.json      ← Testimonial quotes
  upcoming-event.json    ← Upcoming event banner
```

Each JSON file contains:
- Direct Google Drive URLs for images/videos
- Metadata with the source `folder_id` for re-syncing
