# Dishari Boston Inc. — Website

The official website for **Dishari Boston Inc.**, a nonprofit organization dedicated to preserving and promoting South Asian cultural heritage and building community in the greater Boston area.

---

## Tech Stack

- **React 18** with React Router v6
- **Vite** — fast dev server and build tool
- **Cloudinary** — all images, JSON data files, and media (build-time sync)
- **Google OAuth** — admin panel authentication (Google Identity Services, restricted to `@dishariboston.org`)
- **GitHub Actions** — CI/CD pipeline for dev and prod deployments via FTP
- **SMTP2GO** — transactional email (via PHP proxy in production)
- **Google Fonts** — Pacifico & Quicksand (Contact page)

## Features

- Responsive multi-page layout (Home, About, Events, Contact, Press, Admin)
- **3D frosted glass UI** — glass card effects with backdrop blur on Home and Events page sections
- **Centralized content management** via `home-page.json` in Cloudinary — controls homepage sections, testimonials, and references to other JSON files
- **JSON commenting convention** — prefix keys with `_` to disable fields without deleting (`stripCommentedFields` in `jsonHelper.js`)
- Image carousel synced from Cloudinary with `order-N` tag-based sorting
- **Dynamic upcoming events system** — events driven by Cloudinary JSON with per-event folders for banners, gallery images, and sub-events
- Individual event pages with registration modal overlays (embed forms + external URLs), sub-event cards with 3D glass effects, image gallery with lightbox, and video section
- Past event galleries with photos & videos
- Press releases with individual detail pages (public_id configured in home-page.json)
- Testimonials managed directly in home-page.json
- Sponsors carousel synced from Cloudinary
- About Us page with committee members (images auto-resolved)
- Contact page with animated SVG illustration and email form
- Dynamic social media links in footer (loaded from Cloudinary JSON)
- Scroll animations and scroll-to-top button
- **Admin panel** at `/admin` — Google OAuth-protected content editor for Cloudinary JSON files
- **CI/CD** — GitHub Actions workflows for automated dev/prod deployment via FTP

## Pages

| Route              | Page                    |
| ------------------ | ----------------------- |
| `/`                | Home                    |
| `/about`           | About                   |
| `/events`          | Events                  |
| `/contact`         | Contact                 |
| `/event-gallery`   | Event Gallery           |
| `/event/:id`       | Individual Event Page   |
| `/press/:id`       | Press Release Detail    |
| `/admin`           | Admin Panel (OAuth-protected) |

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
# Sync all data from Cloudinary and build
npm run build:sync
```

Output goes to the `dist/` folder.

The `build:sync` command runs:
1. `npm run sync` — fetches all data from Cloudinary (home page config, past events, upcoming events with sub-events, press releases, contact info, about us, video URLs)
2. `npm run build` — builds the production bundle

### Sync Only

```bash
npm run sync
```

Runs `scripts/sync-cloudinary.js` which syncs all content from Cloudinary into `public/data/` JSON files.

## Cloudinary Setup

All content is managed via Cloudinary. See [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md) for the full setup guide including folder structure, naming conventions, and environment variables.

Create a `.env.local` file in the project root with:

```bash
CLOUDINARY_CLOUD_NAME=dqcmzcbrp
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_ALLOWED_DOMAIN=dishariboston.org
```

If your local network uses SSL inspection, you can temporarily add:

```bash
CLOUDINARY_ALLOW_SELF_SIGNED_CERTS=true
```

## Email (Contact Form)

The contact form uses **SMTP2GO** for sending emails:

- **Production** (Hostinger): Uses a PHP proxy at `/api/send-email.php` — the API key stays server-side
- **Development**: Calls SMTP2GO directly using credentials from `.env.development` (gitignored)

To enable email in local dev, create `.env.development`:

```bash
VITE_SMTP2GO_API_KEY=your_api_key
VITE_SMTP2GO_SENDER=web.admin@dishariboston.org
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting instructions on Hostinger.

## Project Structure

```
├── .github/
│   ├── CODEOWNERS                # PR approval rules (@prithwi86)
│   └── workflows/
│       ├── deploy-dev.yml        # CI/CD: push to dev → FTP deploy
│       └── deploy-prod.yml       # CI/CD: push to main → FTP deploy
├── public/
│   ├── api/
│   │   └── send-email.php        # SMTP2GO proxy for production
│   ├── data/                     # JSON data files (generated by sync)
│   │   ├── home-page.json        # Homepage sections (upcoming events, moments, sponsors, testimonials, press config, past events config)
│   │   ├── about-us.json         # Organization info & committee members
│   │   ├── contact.json          # Contact info & social links
│   │   ├── past-events.json      # Past event galleries
│   │   ├── press_release.json    # Press releases
│   │   ├── upcoming-events.json  # Upcoming events with sub-events and full details
│   │   └── video_urls.json       # Video URL mappings
│   ├── favicon.png               # Site favicon
│   └── .htaccess                 # SPA routing for Hostinger
├── scripts/
│   └── sync-cloudinary.js        # Master sync script (all content)
├── src/
│   ├── assets/                   # Static assets (logo, fallback images)
│   ├── components/               # Reusable UI components
│   │   ├── AnimateOnScroll.jsx   # Scroll-triggered animations
│   │   ├── Carousel.jsx
│   │   ├── Footer.jsx            # Dynamic social links from contact.json
│   │   ├── Lightbox.jsx          # Image lightbox overlay
│   │   ├── Navbar.jsx            # Dynamic upcoming events dropdown
│   │   ├── PastEvents.jsx
│   │   ├── PressRelease.jsx
│   │   ├── ScrollToTop.jsx
│   │   ├── ScrollToTopButton.jsx # Floating scroll-to-top button
│   │   ├── Sponsors.jsx
│   │   ├── Testimonials.jsx
│   │   └── UpcomingEventBanner.jsx
│   ├── context/
│   │   └── AuthContext.jsx       # Google OAuth provider (GIS)
│   ├── pages/
│   │   ├── About.jsx
│   │   ├── Admin.jsx             # Admin panel (OAuth-protected)
│   │   ├── Contact.jsx           # Animated SVG + email form
│   │   ├── EventGallery.jsx
│   │   ├── Events.jsx
│   │   ├── FutureEvent.jsx       # Dynamic event page (/event/:id)
│   │   ├── Home.jsx
│   │   └── PressReleasePage.jsx
│   ├── utils/
│   │   ├── cloudinary.js
│   │   ├── jsonHelper.js         # stripCommentedFields() for _ prefix convention
│   │   └── proxyImage.js
│   ├── App.jsx                   # App root with routes + AuthProvider
│   ├── main.jsx                  # Entry point
│   └── styles.css                # Global styles
├── CLOUDINARY_SETUP.md           # Cloudinary setup guide
├── CONTENT_GUIDE.md              # JSON content structure guide
├── DEPLOYMENT.md                 # Hosting & CI/CD guide
├── index.html
├── package.json
└── vite.config.js
```

## License

This project is for Dishari Boston Inc. All rights reserved.
