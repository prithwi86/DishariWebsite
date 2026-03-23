# Cloudinary Setup Guide

## Overview

This project uses **Cloudinary** to host and serve all images (carousel, past event galleries). The sync script fetches image URLs from Cloudinary and writes them to JSON files in `public/data/`.

## Prerequisites

- A Cloudinary account (cloud name: `dqcmzcbrp`)
- API key and secret (stored in `.env.local`)

## Environment Variables

Create a `.env.local` file in the project root:

```
CLOUDINARY_CLOUD_NAME=dqcmzcbrp
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_CAROUSEL_TAG=carousel
CLOUDINARY_PAST_EVENTS_FOLDER=Dishari/Past Events
```

Optional (for corporate networks with SSL proxy):
```
CLOUDINARY_ALLOW_SELF_SIGNED_CERTS=true
```

> **Never commit `.env.local` to git** — it's in `.gitignore`.

## Cloudinary Folder Structure

```
Dishari/
└── Past Events/
    ├── 1_Poush_Sankranti_2026/
    │   ├── Banner.jpg          (tagged with "banner")
    │   ├── photo1.jpg
    │   └── photo2.jpg
    ├── 2_Agomoni_2025/
    │   ├── Banner.jpg          (tagged with "banner")
    │   └── ...
    └── 3_Poush_Utsav_2025/
        ├── Banner.png          (tagged with "banner")
        └── ...
```

### Naming Convention

Folders: `<OrderNo>_<EventName>` (e.g., `1_Poush_Sankranti_2026`)
- **OrderNo** determines display order (ascending)
- Only the top 3 events (by order) are synced

### Banner Detection

Tag one image per event folder with `banner` in Cloudinary. The sync script finds it via:
```
asset_folder="Dishari/Past Events/1_Poush_Sankranti_2026" AND tags=banner
```

### Carousel Images

Tag images with `carousel` in Cloudinary (any folder). They'll be picked up for the homepage carousel.

## Running the Sync

```bash
npm run sync
```

This generates:
| Output file | Source |
|---|---|
| `public/data/carousel-images.json` | Images tagged `carousel` |
| `public/data/past-events.json` | Asset folders under `Dishari/Past Events` |

## Build with Sync

```bash
npm run build:sync
```

Runs sync first, then builds for production.

## Adding a New Past Event

1. Create a new folder in Cloudinary: `Dishari/Past Events/<OrderNo>_<EventName>`
2. Upload images to the folder
3. Tag one image as `banner`
4. Run `npm run sync`
5. Run `npm run build`

## Supported Image Formats

jpg, jpeg, png, webp, gif, avif

## Troubleshooting

**"Missing Cloudinary env vars"**
— Check that `.env.local` exists with all three required variables.

**Empty events in JSON**
— Verify the Cloudinary account uses **asset folders** mode (not legacy/dynamic folders). The sync script uses `asset_folder` search expressions.

**Banner not found**
— Ensure the banner image is tagged with `banner` in the Cloudinary Media Library.

**SSL errors on corporate network**
— Set `CLOUDINARY_ALLOW_SELF_SIGNED_CERTS=true` in `.env.local`.
