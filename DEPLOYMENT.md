# Dishari Website — Deployment & Hosting Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Project](#building-the-project)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Deploying Manually to Hostinger](#deploying-manually-to-hostinger)
- [SPA Routing (.htaccess)](#spa-routing-htaccess)
- [Email (PHP Proxy)](#email-php-proxy)
- [Admin Panel & Google OAuth](#admin-panel--google-oauth)
- [Dashboard & Reports](#dashboard--reports)
- [Updating Content](#updating-content)
- [Data Files Reference](#data-files-reference)

---

## Prerequisites

- **Node.js** v18+ and **npm** installed
- Access to **Hostinger hPanel**
- **Cloudinary API credentials** in `.env.local`
- **Google OAuth Client ID** for admin panel (see [Admin Panel](#admin-panel--google-oauth))

## Building the Project

```bash
# Install dependencies
npm install

# Sync all data from Cloudinary and build for production
npm run build:sync
```

This generates a `dist/` folder with all static files ready for deployment.

The build includes:
- All React pages and components bundled by Vite
- `data/` folder with all synced JSON files
- `api/send-email.php` for the contact form
- `.htaccess` for SPA routing
- `favicon.png`

---

## CI/CD with GitHub Actions

Automated deployment is configured via GitHub Actions workflows. Pushing to `dev` or `main` triggers a build and FTP deploy to Hostinger.

### Workflows

| File | Trigger | Target |
|------|---------|--------|
| `.github/workflows/deploy-dev.yml` | Push to `dev` or manual dispatch | Dev subdomain (FTP) |
| `.github/workflows/deploy-prod.yml` | Push to `main` or manual dispatch | Prod subdomain (FTP) |

### How It Works

1. Checks out the repo
2. Installs Node.js 20 + `npm ci`
3. Runs `npm run build:sync` (with Cloudinary + Google env secrets)
4. Deploys the `dist/` folder to Hostinger via FTP using `SamKirkland/FTP-Deploy-Action@v4.3.5`
5. Uses `dangerous-clean-slate: true` for clean deploys

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_ALLOWED_DOMAIN` | Allowed email domain (e.g., `dishariboston.org`) |
| `DEV_FTP_HOST` | Dev FTP hostname |
| `DEV_FTP_USERNAME` | Dev FTP username |
| `DEV_FTP_PASSWORD` | Dev FTP password |
| `PROD_FTP_HOST` | Prod FTP hostname |
| `PROD_FTP_USERNAME` | Prod FTP username |
| `PROD_FTP_PASSWORD` | Prod FTP password |
| `GOOGLE_SHEETS_ID` | Google Sheets spreadsheet ID (for reports sync) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key |

Add these in GitHub → Settings → Secrets and variables → Actions.

### Code Owners

`.github/CODEOWNERS` requires `@prithwi86` approval for all PRs. Enable branch protection on `main`:
- Require pull request before merging
- Require review from Code Owners

### Manual Dispatch

You can trigger either workflow manually from GitHub → Actions → select workflow → "Run workflow".

> **Note**: The `workflow_dispatch` UI button only appears if the workflow file exists on the default branch (main).

---

## Deploying Manually to Hostinger

Deploy the React app on a subdomain (e.g., `app.dishariboston.org`).

**Steps:**

1. Log in to **Hostinger hPanel**
2. Go to **Domains → Subdomains**
3. Create a subdomain — this creates a directory like `domains/app.dishariboston.org/public_html/`
4. Run `npm run build:sync` locally
5. Upload the **contents** of the `dist/` folder to the subdomain's `public_html/` directory using:
   - **Hostinger File Manager** (hPanel → Files → File Manager), or
   - **FTP** (use credentials from hPanel → Files → FTP Accounts)
6. Visit `https://app.dishariboston.org` to verify

**No changes to `vite.config.js` needed** — the default base path `/` works since the app is at the subdomain root.

### What Gets Uploaded

```
public_html/
├── index.html
├── favicon.png           # Site favicon
├── assets/              # Vite-built JS/CSS bundles
├── data/                # JSON data files
│   ├── home-page.json
│   ├── about-us.json
│   ├── contact.json
│   ├── past-events.json
│   ├── press_release.json
│   ├── upcoming-events.json
│   ├── video_urls.json
│   ├── web-admin.json
│   └── reports.json
├── api/
│   ├── send-email.php   # SMTP2GO email proxy
│   └── sheets-report.php # Google Sheets live data proxy
└── .htaccess            # SPA routing rules
```

---

## SPA Routing (.htaccess)

The `.htaccess` file is included in `public/` and gets copied to `dist/` during build. It handles:

- Serving real files directly (JS, CSS, images, PHP)
- Routing all other requests to `index.html` for React Router

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # If the requested file exists (e.g., /api/send-email.php, images, JS), serve it directly
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Otherwise, route everything to index.html for React Router
  RewriteRule . /index.html [L]
</IfModule>
```

> Hostinger uses **LiteSpeed**, which is compatible with Apache `.htaccess` rules.

---

## Email (PHP Proxy)

The contact form sends email via **SMTP2GO** through a PHP proxy at `/api/send-email.php`.

This keeps the API key server-side (never exposed to the browser).

### Configuration

Edit `public/api/send-email.php` to set:
- `SMTP2GO_API_KEY` — your SMTP2GO API key
- `SMTP2GO_SENDER` — verified sender email (e.g., `web.admin@dishariboston.org`)
- `RECIPIENT_EMAIL` — where messages are delivered (e.g., `support@dishariboston.org`)

### Features

- Rate limiting: 5 submissions per IP per hour
- Input validation and HTML sanitization
- Proper error responses in JSON format

### Local Development

In dev mode (`npm run dev`), the contact form calls SMTP2GO directly using credentials from `.env.development` (see README). The PHP proxy is only used in production.

---

## Admin Panel & Google OAuth

The `/admin` route provides a content management UI for editing Cloudinary JSON files directly from the browser.

### Access Control

- Protected by **Google OAuth** (Google Identity Services)
- Only users with a `@dishariboston.org` Google Workspace account can sign in
- Domain restriction is enforced via the JWT `hd` (hosted domain) claim

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_ALLOWED_DOMAIN` | Allowed email domain (e.g., `dishariboston.org`) |

These must be set in `.env.local` for local development and as GitHub Secrets for CI/CD.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins for your deployment domains
4. Set the Client ID as `VITE_GOOGLE_CLIENT_ID`

---

## Dashboard & Reports

The website includes a **Dashboard** portal at `/dashboard` and a **Reports** page at `/reports` for viewing Zeffy registration data from Google Sheets.

### How It Works

- All `@dishariboston.org` users can sign in via the **Login** button in the navbar
- After sign-in, users land on the Dashboard with two options:
  - **Website Config (Admin)** — Cloudinary JSON editor, restricted by `web-admin.json` allowlist
  - **Reports Dashboard** — registration data from Google Sheets, available to all authenticated users
- In production, Reports fetches live data from `sheets-report.php` (PHP proxy with 5-min cache)
- In development, Reports reads from the static `public/data/reports.json` file

### Hostinger Setup

- `public_html/api/sheets-report.php` — PHP proxy for live Google Sheets data
- `/home/<user>/credentials/google-service-account.json` — service account key (outside web root)
- `public_html/data/web-admin.json` — admin allowlist (synced from Cloudinary)

---

## Updating Content

### Workflow

1. Update content in **Cloudinary** (images, JSON files)
2. Run `npm run build:sync` locally to verify changes
3. Push to `dev` branch → auto-deploys to dev via GitHub Actions
4. After testing, merge to `main` → auto-deploys to prod via GitHub Actions

Alternatively, upload the `dist/` folder manually via FTP (see [Deploying Manually](#deploying-manually-to-hostinger)).

### What to Update Where

| Content                | Where to Edit                                   |
| ---------------------- | ----------------------------------------------- |
| Carousel images        | Tag images with `carousel` + `order-N` in Cloudinary |
| Upcoming events        | Edit `upcoming-events.json` in Cloudinary        |
| Sub-events             | Add `sub_events` in `upcoming-events.json`, create sub-folders |
| Event banners/gallery  | Upload to `Dishari/Upcoming/<event_id>/` folder |
| Past events            | Add folders under `Dishari/Past Events/`         |
| Sponsors               | Upload to `Dishari/Sponsors/` folder             |
| Testimonials           | Edit `testimonials` array in `home-page.json`    |
| Press releases         | Edit `press_release.json` in Cloudinary          |
| Press Room header      | Edit `press_releases.header_text` in `home-page.json` |
| Contact info           | Edit `contact.json` in Cloudinary                |
| Video URLs             | Edit `video_urls.json` in Cloudinary             |
| About Us               | Edit `about-us.json` in Cloudinary               |
| Admin allowlist        | Edit `web-admin.json` in Cloudinary              |

See [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) for detailed folder structure and naming conventions.

---

## Data Files Reference

```
public/data/
  home-page.json          ← Homepage sections (upcoming events carousel, moments, sponsors, testimonials, past_events config, press_releases config)
  about-us.json           ← Organization info, committee members
  contact.json            ← Contact info, social links, background image
  past-events.json        ← Past event galleries with banners & photos
  press_release.json      ← Press release entries with images
  upcoming-events.json    ← Upcoming events with details, sub-events, registrations, media
  video_urls.json         ← Video URL mappings for events
  web-admin.json          ← Admin allowlist (emails for dashboard access)
  reports.json            ← Google Sheets registration data (Zeffy)
```

All files are generated by `npm run sync` from Cloudinary data. Do not edit them manually — changes will be overwritten on the next sync.

For detailed JSON structure documentation, see [CONTENT_GUIDE.md](CONTENT_GUIDE.md).
