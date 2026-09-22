# Tenant assets

Create one folder per tenant using this structure:

```text
tenant-assets/
└── tenant-name/
    ├── tenant.json             # required: copy, colors, metadata overrides
    ├── branding/
    │   └── logo.svg            # or .png/.jpg/.jpeg/.webp — any size or shape
    ├── enterprises/
    │   ├── company-a.png
    │   └── company-b.jpg
    └── documents/              # optional
        └── qr-template.xlsx    # optional
```

Supported image formats (logo and enterprise images): `.png`, `.jpg`, `.jpeg`, `.webp`, and `.svg`.

Install a tenant's assets with:

```bash
npm run tenant:install -- tenant-name
```

The command normalizes the logo (see below), then copies the enterprise images and QR template into the runtime locations under `public/`. It does not delete or modify the source folder. If `documents/qr-template.xlsx` is not present, the installer leaves the existing public QR template unchanged.

### Logo handling

The logo can be any size or aspect ratio — a wide wordmark, a square icon, whatever the client provides. `tenant:install` uses `sharp` to resize it (preserving its own aspect ratio, never cropping) and pad it with a transparent background onto a canvas matching the default logo's proportions, so every tenant's logo ends up in the same box in the navbar. The output is written to `branding/logo.normalized.png` inside the tenant's own folder — not into `public/` — and is picked up at build time by the `@tenant-logo` webpack alias in `next.config.mjs`. Re-run `tenant:install` whenever the source logo changes; the default `public/images/logos/logo_mexico.svg` itself is never touched.

### Enterprise images handling

Each tenant's enterprise images install into their own subfolder, `public/images/enterprises/tenant-name/`, never the shared default folder. This avoids two tenants colliding on a same-named file (e.g. both providing `company-a.png`) and keeps each image's filename-without-extension lookup key intact.

The app finds the installed logo and images through `NEXT_PUBLIC_TENANT`, which the installer sets when it starts the app. `--no-start` installs the files only and prints the variable to set for a deployment.

### tenant.json

`tenant.json` is required and stops the installer with an error if missing. It holds only the values that differ from the defaults in `white-label.config.ts`, using the same nested structure. Database and auth settings stay in the repository `.env`. See `WHITE_LABEL.md` for the format, and `turist-trucks/tenant.json` for a full example.

## Demo QR template

The repository includes a dummy QR template at:

```text
tenant-assets/demo/documents/qr-template.xlsx
```

It contains fake truck records and the exact headers required by the QR generator. Regenerate it with:

```bash
npm run tenant:create-qr-template
```

Replace this file with a real tenant template when available.

## Reset to defaults

Before preparing another brand, restore the committed default runtime assets with:

```bash
npm run tenant:reset -- --confirm
```

This restores the default enterprise images and QR template under `public/` (the logo is never installed under `public/` at all — see "Logo handling" above), removes any leftover `public/images/logos/logo-<tenant>.*` file from the old pre-normalization pipeline, and clears every tenant's generated `branding/logo.normalized.png`. By itself it does not delete or modify any folder under `tenant-assets/`.

To also strip a tenant's source folder — this repo is a base template you configure per client, not a place to keep every client's folder around, so this works even for a committed one, the shipped `turist-trucks` demo included — provide its exact name:

```bash
npm run tenant:reset -- --confirm --remove-tenant tenant-name
```

A tracked folder is removed via `git rm` (staged for commit); an untracked one is deleted outright. Path separators (`/`, `\`) and `.`/`..` are rejected.
