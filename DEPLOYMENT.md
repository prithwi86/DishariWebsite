# Dishari Website — Deployment & Hosting Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Project](#building-the-project)
- [Deploying to Hostinger (Subdomain)](#deploying-to-hostinger-subdomain)
- [SPA Routing (.htaccess)](#spa-routing-htaccess)
- [Email (PHP Proxy)](#email-php-proxy)
- [Updating Content](#updating-content)
- [Data Files Reference](#data-files-reference)

---

## Prerequisites

- **Node.js** v18+ and **npm** installed
- Access to **Hostinger hPanel**
- **Cloudinary API credentials** in `.env.local`

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

---

## Deploying to Hostinger (Subdomain)

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
├── assets/              # Vite-built JS/CSS bundles
├── data/                # JSON data files
│   ├── carousel-images.json
│   ├── contact.json
│   ├── past-events.json
│   ├── press_release.json
│   ├── sponsors.json
│   ├── testimonials.json
│   ├── upcoming-events.json
│   └── video_urls.json
├── api/
│   └── send-email.php   # SMTP2GO email proxy
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

## Updating Content

### Workflow

1. Update content in **Cloudinary** (images, JSON files)
2. Run `npm run build:sync` locally
3. Upload the new `dist/` folder contents to Hostinger

### What to Update Where

| Content                | Where to Edit                                   |
| ---------------------- | ----------------------------------------------- |
| Carousel images        | Tag/untag images with `carousel` in Cloudinary  |
| Upcoming events        | Edit `upcoming-events.json` in Cloudinary        |
| Event banners/gallery  | Upload to `Dishari/Upcoming/<event_id>/` folder |
| Past events            | Add folders under `Dishari/Past Events/`         |
| Sponsors               | Upload to `Dishari/Sponsors/` folder             |
| Testimonials           | Edit `testimonials.json` in Cloudinary           |
| Press releases         | Edit `press_release.json` in Cloudinary          |
| Contact info           | Edit `contact.json` in Cloudinary                |
| Video URLs             | Edit `video_urls.json` in Cloudinary             |

See [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) for detailed folder structure and naming conventions.

---

## Data Files Reference

```
public/data/
  carousel-images.json    ← Homepage carousel (Cloudinary tag: carousel)
  contact.json            ← Contact info, social links, background image
  past-events.json        ← Past event galleries with banners & photos
  press_release.json      ← Press release entries
  sponsors.json           ← Sponsor logos
  testimonials.json       ← Testimonial quotes
  upcoming-events.json    ← Upcoming events with details, registrations, media
  video_urls.json         ← Video URL mappings for events
```

All files are generated by `npm run sync` from Cloudinary data. Do not edit them manually — changes will be overwritten on the next sync.
