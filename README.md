# Daily Astro Pictures

Daily Astro Pictures is a Nuxt app for NASA APOD browsing with local-first behavior.

This project uses:
- BYOK (Bring Your Own Key) for NASA API key management
- Local-first metadata cache
- Cache Storage-based image persistence
- PWA image runtime caching (7 days for non-saved images)

## Tech Stack

- Nuxt 4
- Nuxt UI
- Vite PWA (`@vite-pwa/nuxt`)
- Bun for package management and scripts

## Run With Bun

Install dependencies:

```bash
bun install
```

Start development server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

Generate static output (local root path):

```bash
bun run generate
```

Generate static output for GitHub Pages (`/DailyAstroPictures/` base path):

```bash
NUXT_APP_BASE_URL=/DailyAstroPictures/ bun run generate
```

## GitHub Pages Auto Deploy (GitHub Actions)

This repository is configured to deploy automatically to GitHub Pages on every push to `main`.

Workflow file:
- `.github/workflows/deploy-pages.yml`

What it does:
- Installs dependencies with Bun
- Generates static output with `NUXT_APP_BASE_URL=/<repo-name>/`
- Uploads `.output/public` as Pages artifact
- Deploys to GitHub Pages

One-time GitHub setup:
1. Open repository settings on GitHub.
2. Go to **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually from Actions tab).

Preview production build:

```bash
bun run preview
```

## Key Features

### 1) BYOK (Bring Your Own Key)

- Users can save a NASA API key on the settings page.
- API key is encrypted in-browser before storage.
- Plain API key is never stored in persistent storage.

Encryption details:
- Algorithm: AES-256-GCM
- KDF: PBKDF2 (SHA-256)
- Metadata stored: `salt`, `iv`, `iterations`, `version`, `cipherText`

Key selection priority:
1. Session-unlocked key
2. Stored encrypted key after successful unlock
3. `DEMO_KEY`

### 2) Download Modal

Users can choose:
- Image quality: `HD` or `Standard` (default: `HD`)
- Destination: `Browser Cache` or `Download as File` (default: `Browser Cache`)

If the same quality image is already stored locally, download uses cached data without a new network fetch.

### 3) Storage Architecture

Metadata (small text data):
- Stored in `localStorage`
- Includes APOD response fields and date indexes

Image data (large binary payload):
- Stored in Cache Storage
- Browser-saved images are written to a dedicated cache with no expiration policy
- Used first when rendering detail/gallery/starred pages

### 4) PWA Runtime Caching

- Service worker caches image resources only.
- Image cache strategy: `CacheFirst`
- Image cache retention: 7 days
- NASA APOD JSON API is excluded from service-worker runtime caching to avoid duplicate cache layers.

This allows recently viewed images to remain available offline for a limited period even if not manually downloaded.

When users explicitly save to Browser Cache, those entries are stored separately and are not subject to the 7-day runtime expiration.

## Settings Page

The settings page provides:
- BYOK save form (API key + passphrase + confirmation)
- Encrypted key unlock form
- Session key clear
- Stored key delete
- Default download options
- Storage usage display (`navigator.storage.estimate()`)
- Cleanup action (cache cleanup)
- Manual cleanup policy (user-triggered cleanup)

## Data Keys

Main localStorage keys:
- `apod-YYYY-MM-DD`
- `apod-items`
- `apod-starred-items`
- `apod-downloaded-items`
- `apod-browser-saved-items`
- `apod-download-preferences`
- BYOK encrypted payload key

## Manual Verification Checklist

1. Visit today page and verify APOD loads.
2. Save BYOK key in settings and confirm encryption metadata exists while plain key does not.
3. Trigger unlock flow with passphrase and verify API calls work with unlocked key.
4. Download image as browser cache and verify image appears in gallery from local cache data.
5. Download image as file and verify browser download is triggered.
6. Revisit same date and confirm image loads from Cache Storage before remote URL.
7. Check Application tab:
	- LocalStorage keys present
	- Cache Storage contains `apod-images-saved` entries for browser-saved items
	- Service worker registered
	- Image cache entries present

## Release and QA Checklist

1. Run `bun run build` and verify build completes without errors.
2. Run `NUXT_APP_BASE_URL=/DailyAstroPictures/ bun run generate` and verify static output is created.
3. Push to `main` and verify `Deploy to GitHub Pages` workflow succeeds.
4. Open the deployed URL and validate:
	- Today, Explore, Gallery, Starred, and Settings pages load
	- Browser-cached images are still available after reload
	- File download option still triggers browser download
	- BYOK save/unlock flow works

## Notes

- Browser storage quota is device/browser dependent.
- Browser cache can still be evicted by browser storage pressure policies.
- Browser-saved images are configured with no app-level expiration, but final retention depends on browser storage policy.
- If you changed base path config, clear old service worker/cache in DevTools when testing locally.
