# Dishari Boston Inc. — Website

The official website for **Dishari Boston Inc.**, a nonprofit organization dedicated to preserving and promoting South Asian cultural heritage and building community in the greater Boston area.

🌐 **Live site**: _Coming soon_

---

## Tech Stack

- **React 18** with React Router
- **Vite** — fast dev server and build tool
- **Cloudinary** — carousel image source (build-time sync)
- **Google Drive** — upcoming events, past events, and testimonials
- **weserv.nl** — image proxy for Google Drive URLs (CORS bypass)

## Features

- Responsive multi-page layout (Home, About, Events, Contact)
- Image carousel synced from Cloudinary (tag-based)
- Upcoming event banner
- Past event galleries with photos & videos
- Testimonials pulled from Google Docs
- Scroll animations
- Scroll-to-top button

## Pages

| Route              | Page             |
| ------------------ | ---------------- |
| `/`                | Home             |
| `/about`           | About            |
| `/events`          | Events           |
| `/contact`         | Contact          |
| `/event-gallery`   | Event Gallery    |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The site will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Carousel Sync (Cloudinary)

Carousel images are generated at build time from Cloudinary and written to `public/data/carousel-images.json`.

1. Create `.env.local` in the project root with:

```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_CAROUSEL_TAG=carousel
```

2. Run sync + build:

```bash
npm run build:sync
```

This runs:
1. `npm run sync:carousel`
2. `npm run build`

If your local network uses SSL inspection and you hit certificate issues, you can temporarily add:

```bash
CLOUDINARY_ALLOW_SELF_SIGNED_CERTS=true
```

Use that only for local development environments.

## Google Drive Sync

Non-carousel content is stored in shared Google Drive folders. A sync script pulls the latest data into JSON files used by the website.

```bash
# One-time: install sync dependencies
npm run sync:install

# Sync Drive-backed content (upcoming, past events, testimonials)
npm run sync
```

See [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) for full setup instructions (service account, folder sharing, etc.).

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting instructions on Hostinger (subdomain or subdirectory alongside the existing WordPress site).

## Project Structure

```
├── public/data/          # JSON data files used by the website
│   ├── carousel-images.json  # Generated from Cloudinary tag
│   ├── past-events.json
│   ├── testimonials.json
│   └── upcoming-event.json
├── scripts/
│   ├── drive-config.json           # Google Drive folder IDs
│   ├── sync-carousel-cloudinary.js # Cloudinary carousel sync script
│   └── sync-drive.js               # Drive sync script (non-carousel)
├── src/
│   ├── assets/           # Logo images
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route pages
│   ├── utils/            # Utilities (image proxy)
│   ├── App.jsx           # App root with routes
│   ├── main.jsx          # Entry point
│   └── styles.css        # Global styles
├── DEPLOYMENT.md         # Hosting guide
├── GOOGLE_DRIVE_SETUP.md # Drive sync setup
├── index.html
├── package.json
└── vite.config.js
```

## License

This project is for Dishari Boston Inc. All rights reserved.
