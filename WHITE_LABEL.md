# White-label configuration guide

Front-end branding and UI copy are defined once in `white-label.config.ts` (the schema and the Spanish defaults) and overridden per tenant by a JSON file inside that tenant's folder under `tenant-assets/`. The backend and database are untouched.

## How it works

1. `white-label.config.ts` holds every label, color and asset path with a Spanish default. Components import `whiteLabelConfig` from it.
2. `tenant-assets/<tenant>/tenant.json` holds only the values that differ from the defaults, as nested keys that mirror the config.
3. `NEXT_PUBLIC_TENANT=<tenant>` selects the folder. `next.config.mjs` aliases `@tenant` to that tenant's `tenant.json`, so only the selected tenant's file is bundled. With no tenant set, the defaults apply.
4. The config deep-merges the tenant file over the defaults. A key missing from `tenant.json` falls back to the default.

`NEXT_PUBLIC_*` values are inlined at build/dev-server start, so one tenant means one build or deployment. Restart the dev server after changing `tenant.json` or the tenant variable.

## What the config contains

- `app`: app name, short name, tagline, metadata, locale
- `theme`: the three tenant colors as hex (`primary`, `secondary`, `accent`); `getThemeCssVars` (`src/lib/theme.ts`) converts them to the RGB-channel CSS variables Tailwind consumes
- `assets`: enterprise images paths and the QR template
- `auth`: login text
- `ui`: all user-facing copy, grouped by area

Only those three tenant colors exist. Hover and active states use opacity on the base color (for example `hover:bg-secondary/90`).

The root layout mounts `TenantBrandingProvider`, and components read the current values with `useTenantBranding()`. The shared application composition lives in `src/components/app-shell/AppShell.tsx`.

## Writing a tenant file

`tenant-assets/<tenant>/tenant.json` mirrors the config structure. Include only what changes:

```json
{
  "app": { "name": "Atlas Haul", "locale": "en" },
  "theme": { "primary": "#1a365d", "secondary": "#f97316", "accent": "#0e7490" },
  "ui": {
    "frenteSelector": { "title": "Choose a work site" },
    "general": { "singularFrente": "site", "pluralFrentes": "sites" }
  }
}
```

`tenant-assets/turist-trucks/tenant.json` is a full working example. Key paths are the ones in `white-label.config.ts`; the exported `TenantConfig` type describes the allowed shape.

Templated strings keep their `{token}` placeholders (for example `{frente}`, `{count}`, `{filename}`) exactly as in the default.

When a tenant is set, the enterprise images path is derived automatically: `/images/enterprises/<tenant>` and `public/images/enterprises/<tenant>`. A `tenant.json` can still override it. The logo is not part of `tenant.json` at all — see "Installing tenant assets" below.

## Installing tenant assets

Non-technical users can prepare a tenant folder under `tenant-assets/`:

```text
tenant-assets/
└── tenant-name/
	├── tenant.json
	├── branding/
	│   └── logo.svg             # or .png/.jpg/.jpeg/.webp — any size or shape
	├── enterprises/
	│   ├── company-a.png
	│   └── company-b.jpg
	└── documents/              # optional
		└── qr-template.xlsx    # optional
```

Then run:

```bash
npm run tenant:install -- tenant-name
```

The installer normalizes the logo (see below) and validates the enterprise images, then copies the enterprise images and QR template into the existing runtime locations under `public/`. A tenant QR template is optional. If it is not provided, the existing public template remains unchanged. The source folder is preserved, so the same tenant package can be installed again or reviewed before deployment.

### Logo normalization

Drop any single `logo.{svg,png,jpg,jpeg,webp}` into `branding/` — any pixel size, any aspect ratio (a wide wordmark, a square icon, anything). The installer uses `sharp` to resize it (preserving its aspect ratio, never cropping) and pad it with a transparent background onto a canvas that matches the *proportions* of the default `logo_mexico.svg`, so every tenant's logo renders in the same box in the navbar — not bigger or smaller depending on its own shape. The result is written to `tenant-assets/tenant-name/branding/logo.normalized.png`, which `next.config.mjs`'s `@tenant-logo` webpack alias then points `BrandMark.tsx` at (a build-time import, not a `public/` URL — nothing to copy there). Re-run `tenant:install` any time the source logo changes.

Enterprise images install into their own subfolder, `public/images/enterprises/tenant-name/`, never the shared default folder — this avoids two tenants colliding on a same-named file and preserves each image's filename-without-extension lookup key (used by `EnterprisesImagesInitializer` to key preloaded canvases by business name). Pass `--no-start` to install without starting; the installer then prints the tenant variable to set in the deployment environment.

`tenant:install` requires `tenant-assets/<tenant-name>/tenant.json` and stops with an error if it is missing. It starts the dev server with `NEXT_PUBLIC_TENANT=<tenant-name>`. Database, auth and other secrets stay in the repository `.env`.

The demo QR template is generated at `tenant-assets/demo/documents/qr-template.xlsx` with fake records. Run `npm run tenant:create-qr-template` to recreate it.

## Resetting the active tenant

Before installing another brand, run:

```bash
npm run tenant:reset -- --confirm
```

The guarded reset restores the committed default enterprise images and QR template under `public/` (the logo is never installed under `public/` — see "Logo normalization" above), removes any leftover `public/images/logos/logo-<tenant>.*` file from the old pre-normalization pipeline, and clears every tenant's generated `branding/logo.normalized.png` (regenerated by the next `tenant:install`). It refuses to run when those runtime assets have uncommitted changes.

By itself, it never removes source folders under `tenant-assets/`. To strip one out — this repo is a base template, not a place to accumulate every client's folder, so this works even for a committed/tracked one, the shipped `turist-trucks` demo included — pass its exact name:

```bash
npm run tenant:reset -- --confirm --remove-tenant tenant-name
```

A tracked folder is removed via `git rm` (staged for commit); an untracked one is deleted outright.

This deletes only the named untracked folder under `tenant-assets/`; it rejects tracked folders and unsafe path values.

## Locale-aware date/calendar

- `MonthYearPicker.tsx` derives its month abbreviations from `Intl.DateTimeFormat(app.locale, { month: "short" })` instead of a hardcoded Spanish array.
- `TrucksDateRangePicker.tsx` picks a `date-fns` locale (`enUS` for `app.locale: "en"`, `es` otherwise) for the day-picker calendar. Only `es`/`en` are mapped explicitly; any other locale value falls back to `es`.
- `ui.general.ofConnector` is a bare connector ("del" in Spanish) used to assemble compound aria-labels such as `"{actions} {of} {frente}"`. The word order may not suit every language.

All `aria-label`s in the codebase are now config-driven — verified with a full-repo sweep, not just the components listed above.

## Recommended rollout

1. Start with the app name, colors, and login copy.
2. Override the main dashboard and records labels.
3. Tune the administrator/user-management UI copy.
4. Keep the defaults in Spanish as the repository’s baseline.

## Rule of thumb

If the change is only visible in browser copy or branding, it belongs in `white-label.config.ts`.
If it impacts API logic, database structure, or business rules, it stays out of scope for this white-label pass.
