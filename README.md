# Dishari Boston Inc. — Website

The official website for **Dishari Boston Inc.**, a nonprofit organization dedicated to preserving and promoting South Asian cultural heritage and building community in the greater Boston area.

🌐 **Live site**: _Coming soon_

---

## Tech Stack

- **React 18** with React Router
- **Vite** — fast dev server and build tool
- **Google Drive** — image/content management via shared folders
- **weserv.nl** — image proxy for Google Drive URLs (CORS bypass)

## Features

- Responsive multi-page layout (Home, About, Events, Contact)
- Image carousel synced from Google Drive
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

## Google Drive Sync

Images and content are stored in shared Google Drive folders. A sync script pulls the latest data into JSON files used by the website.

```bash
# One-time: install sync dependencies
npm run sync:install

# Sync all content from Google Drive
npm run sync
```

See [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) for full setup instructions (service account, folder sharing, etc.).

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting instructions on Hostinger (subdomain or subdirectory alongside the existing WordPress site).

## Project Structure

```
├── public/data/          # JSON data files (synced from Google Drive)
│   ├── carousel-images.json
│   ├── past-events.json
│   ├── testimonials.json
│   └── upcoming-event.json
├── scripts/
│   ├── drive-config.json # Google Drive folder IDs
│   └── sync-drive.js     # Drive sync script
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
