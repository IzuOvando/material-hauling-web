# Client assets

Create one folder per client using this structure:

```text
client-assets/
└── client-name/
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
