# Tenant assets

Create one folder per tenant using this structure:

```text
tenant-assets/
└── tenant-name/
    ├── tenant.json             # required: copy, colors, metadata overrides
    ├── branding/
    │   └── logo.svg
    ├── enterprises/
    │   ├── company-a.png
    │   └── company-b.jpg
    └── documents/              # optional
        └── qr-template.xlsx    # optional
```

Supported enterprise image formats: `.png`, `.jpg`, `.jpeg`, `.webp`, and `.svg`.

Install a tenant's assets with:

```bash
npm run tenant:install -- tenant-name
```

The command copies files into the runtime locations under `public/`. It does not delete or modify the source folder. If `documents/qr-template.xlsx` is not present, the installer leaves the existing public QR template unchanged.

### Logo handling

The default logo (`public/images/logos/logo_mexico.svg`) is never overwritten. Each tenant's logo is installed as its own file, `public/images/logos/logo-tenant-name.svg`, so the repository default always stays available and installing one tenant never clobbers another.

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

This restores the default logo, enterprise images, and QR template under `public/`. It does not delete or modify any folder under `tenant-assets/`.

To also remove one untracked tenant source folder after resetting, provide its exact folder name:

```bash
npm run tenant:reset -- --confirm --remove-tenant tenant-name
```

This cleanup refuses tracked tenant folders and does not accept path separators.
