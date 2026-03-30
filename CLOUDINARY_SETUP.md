# Cloudinary Setup Guide

## Overview

This project uses **Cloudinary** as the primary CMS for all images and data. The sync script (`scripts/sync-cloudinary.js`) fetches image URLs and JSON data files from Cloudinary and writes them to `public/data/` at build time.

The central configuration hub is `home-page.json` — a JSON file stored in Cloudinary that defines homepage sections, references other JSON files, and configures image folder sources. See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for detailed JSON structure documentation.

## Prerequisites

- A Cloudinary account (cloud name: `dqcmzcbrp`)
- API key and secret (stored in `.env.local`)

## Environment Variables

Create a `.env.local` file in the project root:

```
CLOUDINARY_CLOUD_NAME=dqcmzcbrp
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Optional overrides (with defaults shown):

```
CLOUDINARY_PAST_EVENTS_FOLDER=Dishari/Past Events
CLOUDINARY_UPCOMING_FOLDER=Dishari/Upcoming
CLOUDINARY_CONTACT_ID=contact.json
CLOUDINARY_UPCOMING_EVENTS_ID=upcoming-events.json
CLOUDINARY_VIDEO_URLS_ID=video_urls.json
CLOUDINARY_ABOUT_US_ID=about-us.json
CLOUDINARY_ABOUT_US_FOLDER=Dishari/About_Us
CLOUDINARY_HOME_PAGE_ID=home-page.json
```

Optional (for corporate networks with SSL proxy):
```
CLOUDINARY_ALLOW_SELF_SIGNED_CERTS=true
```

> **Never commit `.env.local` to git** — it's in `.gitignore`.

## Cloudinary Folder Structure

```
Dishari/
├── About_Us/
│   ├── about_us.jpg              (org image, filename starts with "about_us")
│   └── member_name.jpg           (member pics, filename matches member name)
├── Assets/
│   └── Contact_BG.jpg            (tagged with "asset" + "contact")
├── Moments/
│   ├── photo1.jpg                (homepage moments carousel)
│   └── photo2.jpg
├── Past Events/
│   ├── 1_Poush_Sankranti_2026/
│   │   ├── Banner.jpg            (tagged with "banner")
│   │   ├── photo1.jpg
│   │   └── photo2.jpg
│   ├── 2_Agomoni_2025/
│   │   ├── Banner.jpg            (tagged with "banner")
│   │   └── ...
│   └── 3_Poush_Utsav_2025/
│       ├── Banner.png            (tagged with "banner")
│       └── ...
├── Press_Release/
│   └── <press_release_id>/
│       ├── image1.jpg
│       └── links/
│           └── tagged_asset.pdf  (tagged for link resolution)
├── Sponsors/
│   ├── sponsor1.png
│   └── sponsor2.png
└── Upcoming/
    ├── Picnic2026/
    │   ├── Banner_Picnic2026.jpg (filename starts with "banner")
    │   └── gallery1.jpg
    └── Agomoni2026/
        ├── Banner.jpg            (filename starts with "banner", tagged "carousel" + "order-2")
        ├── dancer_registration.jpg
        └── DANCE_WITH_KUMAR_SHARMA/   (sub-event folder)
            ├── Banner.jpg        (filename starts with "banner")
            └── gallery1.jpg
```

### Raw JSON Files (uploaded as type "raw")

These are stored directly in Cloudinary and fetched via public raw URL:

| public_id             | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `home-page.json`      | Central homepage config (sections, testimonials, references) |
| `upcoming-events.json`| Master event list (id, order, title, details, sub_events, registrations) |
| `contact.json`        | Contact info, social links, background image tags |
| `video_urls.json`     | Video URL mappings to merge into event data |
| `press_release.json`  | Press release entries (public_id configured in home-page.json) |
| `about-us.json`       | Organization info, committee members        |

## Sync Pipeline

Running `npm run sync` executes the following in order:

1. **syncHomePage** — Reads `home-page.json` config, resolves image URLs for upcoming_events, moments, and sponsors sections → `home-page.json`
2. **syncPastEvents** — Reads output filename from `home-page.json`, scans folders under `Dishari/Past Events` → `past-events.json`
3. **syncUpcoming** — Fetches `upcoming-events.json` from Cloudinary, scans per-event and per-sub-event folders (`Dishari/Upcoming/<id>/<sub_id>`) for banners and gallery images → `upcoming-events.json`
4. **syncPressRelease** — Reads public_id from `home-page.json`, fetches press release JSON, resolves images and link assets → `press_release.json`
5. **syncContact** — `contact.json` raw file, resolves background image by tags → `contact.json`
6. **syncAboutUs** — `about-us.json` raw file, resolves org image and member pics → `about-us.json`
7. **syncVideoUrls** — `video_urls.json` raw file, merges video URLs into target event data

## Image Ordering with Tags

You can control the display order of images in any section by adding `order-N` tags in Cloudinary:

- Tag an image with `order-1`, `order-2`, `order-3`, etc.
- The sync script sorts images by these tags (ascending)
- Images without an `order-N` tag appear after ordered images
- Works for all sections using `resolveImageUrls` (upcoming events carousel, moments, sponsors)

**Example**: To make the Agomoni banner appear first in the upcoming events carousel, tag it with both `carousel` and `order-1`.

## Naming Conventions

### Past Events

Folders: `<OrderNo>_<EventName>` (e.g., `1_Poush_Sankranti_2026`)
- **OrderNo** determines display order (ascending)
- Only the top 3 events (by order) are synced
- Tag one image per event folder with `banner` in Cloudinary

### Upcoming Events

Each event in the master `upcoming-events.json` has an `id` field (e.g., `Picnic2026`).
The sync script looks for a matching folder at `Dishari/Upcoming/<id>`.

- **Banner**: any image whose filename starts with `banner` (case-insensitive). If multiple, one is chosen randomly.
- **Gallery images**: all other images in the folder (sorted by public_id).
- **Sub-events**: each sub-event with an `id` gets its folder at `Dishari/Upcoming/<event_id>/<sub_event_id>` — same banner/gallery conventions apply.

### Carousel Images (Homepage)

Tag images with `carousel` in Cloudinary (in `Dishari/Upcoming` or subfolders). Use `order-N` tags to control display order.

### Sponsors

All images in the `Dishari/Sponsors` folder are synced as sponsor logos (250px width).

## Running the Sync

```bash
# Sync all content from Cloudinary
npm run sync

# Sync + build for production
npm run build:sync
```

## Output Files

| Output file                       | Source                                |
| --------------------------------- | ------------------------------------- |
| `public/data/home-page.json`      | Homepage sections (upcoming events, moments, sponsors, testimonials, past_events config, press_releases config) |
| `public/data/past-events.json`    | Folders under `Dishari/Past Events`   |
| `public/data/upcoming-events.json`| Master JSON + per-event/sub-event folder scans |
| `public/data/press_release.json`  | Press release JSON + image resolution |
| `public/data/contact.json`        | Raw `contact.json` + image resolution |
| `public/data/about-us.json`       | Raw `about-us.json` + member pics     |

## Upcoming Events JSON Structure

The master `upcoming-events.json` uploaded to Cloudinary should follow this structure:

```json
{
  "events": [
    {
      "id": "Picnic2026",
      "order": 1,
      "title": "Dishari Picnic 2026",
      "details": {
        "description": ["Paragraph 1", "Paragraph 2"],
        "date": "06/13/2026",
        "time": "",
        "venue": "Hopkinton State Park, Hopkinton, MA",
        "address": "",
        "registrations": [
          {
            "button_text": "Event Registration",
            "external_url": "https://www.zeffy.com/...",
            "internal_url": "",
            "embeded_form": "<div>...<iframe src='...'></iframe></div>"
          }
        ]
      },
      "sub_events": [
        {
          "id": "DANCE_WITH_KUMAR_SHARMA",
          "order": 1,
          "title": "Dance With Kumar Sharma",
          "banner": "",
          "details": {
            "description": ["Intro paragraph", "• Bullet point 1", "• Bullet point 2"],
            "date": "",
            "time": "",
            "venue": "",
            "address": "",
            "img_urls": [],
            "video_urls": [],
            "registrations": []
          }
        }
      ]
    }
  ]
}
```

The sync script enriches each event (and sub-event) with:
- `banner` — resolved from the event's Cloudinary folder (filename starts with `banner`)
- `details.img_urls` — gallery images from the folder
- `details.video_urls` — merged from `video_urls.json` if matching entry exists

Sub-event folders live at `Dishari/Upcoming/<event_id>/<sub_event_id>` and follow the same banner/gallery conventions.

### Registration Priority

On the event page, registration buttons follow this priority:
1. `embeded_form` — shown as collapsible inline iframe (supports raw HTML snippets or plain URLs)
2. `internal_url` — opens in same tab
3. `external_url` — opens in new tab

### Description Formatting

Each item in the `description` array renders as a paragraph. To show bullet points, prefix lines with `•`:
```json
"description": [
  "Package includes:",
  "• Three virtual mentoring sessions",
  "• One in-person mentoring session",
  "• Stage performance"
]
```

## Adding Content

### Add a New Upcoming Event

1. Add an entry to `upcoming-events.json` in Cloudinary with a unique `id`
2. Create a folder `Dishari/Upcoming/<id>` in Cloudinary
3. Upload a banner image (filename starting with `banner`), tag with `carousel` and `order-N` for homepage carousel position
4. Upload any gallery images
5. Run `npm run build:sync`

### Add a Sub-Event

1. Add a `sub_events` entry to the parent event in `upcoming-events.json`
2. Create a folder `Dishari/Upcoming/<event_id>/<sub_event_id>` in Cloudinary
3. Upload banner and gallery images (same conventions as main events)
4. Run `npm run build:sync`

### Add a New Past Event

1. Create a folder `Dishari/Past Events/<OrderNo>_<EventName>` in Cloudinary
2. Upload images and tag one as `banner`
3. Run `npm run build:sync`

### Update Testimonials

Edit the `testimonials` array in `home-page.json` in Cloudinary. Each entry has `name` and `text` fields.

### Update Press Releases

Edit `press_release.json` in Cloudinary (public_id configured in `home-page.json`). Run `npm run build:sync`.

### Update Contact Info / Social Links

Edit `contact.json` in Cloudinary and run `npm run build:sync`.

### Add Video URLs to Events

Edit `video_urls.json` in Cloudinary — each entry maps to an event by `file_name` and `event_id`. Run `npm run build:sync`.

## Supported Image Formats

jpg, jpeg, png, webp, gif, avif

## Troubleshooting

**"Missing Cloudinary env vars"**
— Check that `.env.local` exists with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

**Empty events in JSON**
— Verify the Cloudinary account uses **asset folders** mode (not legacy/dynamic folders). The sync script uses `asset_folder` search expressions.

**Banner not found for past events**
— Ensure the banner image is tagged with `banner` in the Cloudinary Media Library.

**Images appearing in wrong order**
— Add `order-N` tags to images in Cloudinary (e.g., `order-1`, `order-2`). The sync script sorts by these tags.

**Banner not found for upcoming events**
— Ensure at least one image in the event's folder has a filename starting with `banner`.

**SSL errors on corporate network**
— Set `CLOUDINARY_ALLOW_SELF_SIGNED_CERTS=true` in `.env.local`.

**`public_id` vs `asset_folder`**
— `public_id` is the delivery URL key (used in URLs). `asset_folder` is the organizational path shown in the Cloudinary UI. They can differ — the sync script searches by `asset_folder`.
