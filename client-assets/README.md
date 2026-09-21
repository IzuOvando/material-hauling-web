# Client assets

Create one folder per client using this structure:

```text
client-assets/
└── client-name/
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

Install a client's assets with:

```bash
npm run client:install -- client-name
```

The command copies files into the runtime locations under `public/`. It does not delete or modify the source folder. If `documents/qr-template.xlsx` is not present, the installer leaves the existing public QR template unchanged.

### Logo handling

The default logo (`public/images/logos/logo_mexico.svg`) is never overwritten. Each client's logo is installed as its own file, `public/images/logos/logo-client-name.svg`, so the repository default always stays available and installing one client never clobbers another.

### Enterprise images handling

Each client's enterprise images install into their own subfolder, `public/images/enterprises/client-name/`, never the shared default folder. This avoids two clients colliding on a same-named file (e.g. both providing `company-a.png`) and keeps each image's filename-without-extension lookup key intact.

The app finds the installed logo and images through `NEXT_PUBLIC_TENANT`, which the installer sets when it starts the app. `--no-start` installs the files only and prints the variable to set for a deployment.

### tenant.json

`tenant.json` is required and stops the installer with an error if missing. It holds only the values that differ from the defaults in `white-label.config.ts`, using the same nested structure. Database and auth settings stay in the repository `.env`. See `WHITE_LABEL.md` for the format, and `turist-trucks/tenant.json` for a full example.

## Demo QR template

The repository includes a dummy QR template at:

```text
client-assets/demo/documents/qr-template.xlsx
```

It contains fake truck records and the exact headers required by the QR generator. Regenerate it with:

```bash
npm run client:create-qr-template
```

Replace this file with a real client template when available.

## Reset to defaults

Before preparing another brand, restore the committed default runtime assets with:

```bash
npm run client:reset -- --confirm
```

This restores the default logo, enterprise images, and QR template under `public/`. It does not delete or modify any folder under `client-assets/`.

To also remove one untracked client source folder after resetting, provide its exact folder name:

```bash
npm run client:reset -- --confirm --remove-client client-name
```

This cleanup refuses tracked client folders and does not accept path separators.
