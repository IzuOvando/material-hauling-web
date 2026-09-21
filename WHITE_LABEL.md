# White-label configuration guide

Front-end branding and UI copy are defined once in `white-label.config.ts` (the schema and the Spanish defaults) and overridden per client by a JSON file inside that client's folder under `client-assets/`. The backend and database are untouched.

## How it works

1. `white-label.config.ts` holds every label, color and asset path with a Spanish default. Components import `whiteLabelConfig` from it.
2. `client-assets/<client>/tenant.json` holds only the values that differ from the defaults, as nested keys that mirror the config.
3. `NEXT_PUBLIC_TENANT=<client>` selects the folder. `next.config.mjs` aliases `@tenant` to that client's `tenant.json`, so only the selected client's file is bundled. With no tenant set, the defaults apply.
4. The config deep-merges the tenant file over the defaults. A key missing from `tenant.json` falls back to the default.

`NEXT_PUBLIC_*` values are inlined at build/dev-server start, so one tenant means one build or deployment. Restart the dev server after changing `tenant.json` or the tenant variable.

## What the config contains

- `app`: app name, short name, tagline, metadata, locale
- `branding`: logo and brand colors (hex)
- `theme`: the three tenant colors as space-separated RGB channels (`primary`, `secondary`, `accent`), consumed by Tailwind through CSS variables
- `assets`: enterprise images paths and the QR template
- `auth`: login text
- `ui`: all user-facing copy, grouped by area

Only those three tenant colors exist. Hover and active states use opacity on the base color (for example `hover:bg-secondary/90`).

The root layout mounts `TenantBrandingProvider`, and components read the current values with `useTenantBranding()`. The shared application composition lives in `src/components/app-shell/AppShell.tsx`.

## Writing a tenant file

`client-assets/<client>/tenant.json` mirrors the config structure. Include only what changes:

```json
{
  "app": { "name": "Atlas Haul", "locale": "en" },
  "theme": { "primary": "26 54 93", "secondary": "180 83 9", "accent": "14 116 144" },
  "ui": {
    "frenteSelector": { "title": "Choose a work site" },
    "general": { "singularFrente": "site", "pluralFrentes": "sites" }
  }
}
```

`client-assets/turist-trucks/tenant.json` is a full working example. Key paths are the ones in `white-label.config.ts`; the exported `TenantConfig` type describes the allowed shape.

Templated strings keep their `{token}` placeholders (for example `{frente}`, `{count}`, `{filename}`) exactly as in the default.

When a tenant is set, the logo and enterprise images paths are derived automatically: `/images/logos/logo-<client>.svg`, `/images/enterprises/<client>` and `public/images/enterprises/<client>`. A `tenant.json` can still override them.

## Installing client assets

Non-technical users can prepare a client folder under `client-assets/`:

```text
client-assets/
└── client-name/
	├── tenant.json
	├── branding/
	│   └── logo.svg
	├── enterprises/
	│   ├── company-a.png
	│   └── company-b.jpg
	└── documents/              # optional
		└── qr-template.xlsx    # optional
```

Then run:

```bash
npm run client:install -- client-name
```

The installer validates the logo and enterprise images, then copies them into the existing runtime locations under `public/`. A client QR template is optional. If it is not provided, the existing public template remains unchanged. The source folder is preserved, so the same client package can be installed again or reviewed before deployment.

The client's logo is installed as `public/images/logos/logo-client-name.svg`, never overwriting the default `logo_mexico.svg`. Enterprise images install into their own subfolder, `public/images/enterprises/client-name/`, never the shared default folder — this avoids two clients colliding on a same-named file and preserves each image's filename-without-extension lookup key (used by `EnterprisesImagesInitializer` to key preloaded canvases by business name). The config derives these paths from `NEXT_PUBLIC_TENANT`. Pass `--no-start` to install without starting; the installer then prints the tenant variable to set in the deployment environment.

`client:install` requires `client-assets/<client-name>/tenant.json` and stops with an error if it is missing. It starts the dev server with `NEXT_PUBLIC_TENANT=<client-name>`. Database, auth and other secrets stay in the repository `.env`.

The demo QR template is generated at `client-assets/demo/documents/qr-template.xlsx` with fake records. Run `npm run client:create-qr-template` to recreate it.

## Resetting the active client

Before installing another brand, run:

```bash
npm run client:reset -- --confirm
```

The guarded reset restores the committed default logo, enterprise images, and QR template under `public/`. It refuses to run when those runtime assets have uncommitted changes and never removes source folders under `client-assets/`.

If an untracked client source folder should also be removed, use the explicit cleanup option:

```bash
npm run client:reset -- --confirm --remove-client client-name
```

This deletes only the named untracked folder under `client-assets/`; it rejects tracked folders and unsafe path values.

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
