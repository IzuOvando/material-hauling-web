# White-label configuration guide

This repository keeps the front-end branding and UI copy centralized in the root file `white-label.config.ts`.

## Purpose

- Keep all tenant-facing labels in one place.
- Allow overrides via environment variables without modifying component code.
- Keep the backend and database untouched.

## Default source of truth

Use the exported `whiteLabelConfig` object from `white-label.config.ts`.

The file exposes:
- `app`: app name, short name, tagline, locale
- `branding`: logo, brand colors
- `theme`: semantic UI colors used by Tailwind and global CSS
- `assets`: customer-owned logo-adjacent asset paths and downloadable templates
- `auth`: login text
- `ui`: all user-facing copy grouped by area

The root layout mounts `TenantBrandingProvider` for client-side branding access. Components can consume the current tenant values with `useTenantBranding()`. The provider currently uses the configured defaults and accepts partial branding overrides, leaving a future tenant resolver free to provide runtime values without changing component APIs.

The shared application composition lives in `src/components/app-shell/AppShell.tsx`. It owns the branding provider, authenticated user context, navbar, toast layer, enterprise-image initializer, and printer script. The root layout is intentionally limited to document metadata, fonts, global styles, and passing the authenticated user and page content into `AppShell`.

## Environment variable override pattern

The config uses `process.env.NEXT_PUBLIC_*` values with safe Spanish defaults.

## Fictional brand validation

The `turist-trucks` client folder includes a `brand.env` that defines a fictional `Atlas Haul` brand with a navy, orange, and cyan theme. It does not replace or modify `.env`.

Install the client's assets and start the app with its brand:

```bash
npm run client:install -- turist-trucks
```

Or start the app with a brand file only, without installing assets:

```bash
npm run brand:dev -- client-assets/turist-trucks/brand.env
```

The runner loads `.env` first, applies the selected white-label file second, and starts the dev server with the merged values. This preserves database, authentication, and other base settings while changing only the brand overrides. Stop the server and run `npm run dev` normally to return to the base environment. This validation currently keeps the existing logo asset while changing metadata, theme colors, navigation labels, login copy, and frente terminology.

Any other brand env file can be tried the same way with `npm run brand:dev -- <path>`. Files named `.env.whitelabel-*` are git-ignored for local experiments.

Example:

```bash
NEXT_PUBLIC_APP_NAME="My Brand"
NEXT_PUBLIC_APP_SHORT_NAME="MB"
NEXT_PUBLIC_PRIMARY_COLOR="#123456"
NEXT_PUBLIC_UI_FRENTE_TITLE="Select a front"
NEXT_PUBLIC_UI_USERS_ACTION_RESET="Reset password"
```

## Important notes

- Only frontend strings are white-labeled.
- No API behavior, Prisma schema, or database logic is changed.
- `src/config/index.ts` is intentionally left alone as the legacy backend config surface.

## Main UI groups

### `app`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_SHORT_NAME`
- `NEXT_PUBLIC_APP_TAGLINE`
- `NEXT_PUBLIC_APP_METADATA_TITLE`
- `NEXT_PUBLIC_APP_METADATA_DESCRIPTION`
- `NEXT_PUBLIC_LOCALE`

### `branding`
- `NEXT_PUBLIC_LOGO_URL`
- `NEXT_PUBLIC_PRIMARY_COLOR`
- `NEXT_PUBLIC_SECONDARY_COLOR`
- `NEXT_PUBLIC_ACCENT_COLOR`

### `theme`
- `NEXT_PUBLIC_THEME_PRIMARY`
- `NEXT_PUBLIC_THEME_SECONDARY`
- `NEXT_PUBLIC_THEME_ACCENT`

Theme values use the existing CSS RGB channel format, for example `19 50 43`. This keeps Tailwind opacity utilities compatible without runtime color conversion. The base theme defaults preserve the current application palette: green primary, magenta secondary, and gold accent.

### `assets`
- `NEXT_PUBLIC_LOGO_URL`
- `ENTERPRISE_IMAGES_FOLDER` (server-side filesystem path, relative to the repository root)
- `NEXT_PUBLIC_ENTERPRISE_IMAGES_DIRECTORY`
- `NEXT_PUBLIC_QR_TEMPLATE_URL`
- `NEXT_PUBLIC_QR_TEMPLATE_FILENAME`

Keep customer assets isolated under their configured folders. Database-backed frente logos remain managed by the existing upload flow and are not replaced by these static asset settings.

## Installing client assets

Non-technical users can prepare a client folder under `client-assets/`:

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

Then run:

```bash
npm run client:install -- client-name
```

The installer validates the logo and enterprise images, then copies them into the existing runtime locations under `public/`. A client QR template is optional. If it is not provided, the existing public template remains unchanged. The source folder is preserved, so the same client package can be installed again or reviewed before deployment.

The client's logo is installed as `public/images/logos/logo-client-name.svg`, never overwriting the default `logo_mexico.svg`. Enterprise images install into their own subfolder, `public/images/enterprises/client-name/`, never the shared default folder — this avoids two clients colliding on a same-named file and preserves each image's filename-without-extension lookup key (used by `EnterprisesImagesInitializer` to key preloaded canvases by business name). The installer sets `NEXT_PUBLIC_LOGO_URL`, `NEXT_PUBLIC_ENTERPRISE_IMAGES_DIRECTORY`, and `ENTERPRISE_IMAGES_FOLDER` automatically when it starts the app, so the branding provider and `/api/enterprises/images` pick them up without manual env editing. Pass `--no-start` to install without starting, in which case the installer prints these values to set in the client's `brand.env` or the deployment environment.

`client:install` requires `client-assets/<client-name>/brand.env` and stops with an error if it is missing. Pass `--brand-env=<path>` to use a different file instead.

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

### `auth`
- `NEXT_PUBLIC_LOGIN_TITLE`
- `NEXT_PUBLIC_LOGIN_SUBTITLE`
- `NEXT_PUBLIC_WELCOME_LABEL`

### `ui.frenteSelector`
- `NEXT_PUBLIC_UI_FRENTE_TITLE`
- `NEXT_PUBLIC_UI_FRENTE_SUBTITLE`
- `NEXT_PUBLIC_UI_FRENTE_CTA`
- `NEXT_PUBLIC_UI_FRENTE_SEARCH`
- `NEXT_PUBLIC_UI_FRENTE_NO_ASSIGNED_TITLE`
- `NEXT_PUBLIC_UI_FRENTE_NO_ASSIGNED_SUBTITLE`

### `ui.frentesManager`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_TITLE`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_DESC`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_NEW`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_SEARCH`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_NO_REGISTERED`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_EDIT_TITLE`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_SAVE`
- `NEXT_PUBLIC_UI_FRENTES_MANAGER_DELETE`

### `ui.materials`
- `NEXT_PUBLIC_UI_MATERIALS_TITLE`
- `NEXT_PUBLIC_UI_MATERIALS_ASSIGNED`
- `NEXT_PUBLIC_UI_MATERIALS_AVAILABLE`
- `NEXT_PUBLIC_UI_MATERIALS_EMPTY_ASSIGNED`
- `NEXT_PUBLIC_UI_MATERIALS_EMPTY_AVAILABLE`

### `ui.users`
- `NEXT_PUBLIC_UI_USERS_TITLE`
- `NEXT_PUBLIC_UI_USERS_CREATE_TITLE`
- `NEXT_PUBLIC_UI_USERS_CREATE_SUBTITLE`
- `NEXT_PUBLIC_UI_USERS_CREATE_USERNAME_LABEL`
- `NEXT_PUBLIC_UI_USERS_CREATE_PASSWORD_LABEL`
- `NEXT_PUBLIC_UI_USERS_CREATE_CONFIRM_LABEL`
- `NEXT_PUBLIC_UI_USERS_ACTION_EDIT`
- `NEXT_PUBLIC_UI_USERS_ACTION_DELETE`
- `NEXT_PUBLIC_UI_USERS_ACTION_RESET`
- `NEXT_PUBLIC_UI_USERS_TOOLBAR_NEW`

### `ui.general`
- `NEXT_PUBLIC_UI_SEARCH`
- `NEXT_PUBLIC_UI_EMPTY_MESSAGE`
- `NEXT_PUBLIC_UI_GENERAL_SAVING`

### `ui.vouchers` (additional keys)
- `NEXT_PUBLIC_UI_VOUCHERS_DELETE_BUTTON`, `..._DELETE_SUCCESS_TITLE`, `..._DELETE_SUCCESS_DESC`, `..._DELETE_ERROR_TITLE`, `..._DELETE_ERROR_DESC`
- `NEXT_PUBLIC_UI_VOUCHERS_DELETE_DIALOG_TITLE`, `..._WARNING_PREFIX`, `..._WARNING_BOLD`, `..._WARNING_MIDDLE`, `..._WARNING_SUFFIX`, `..._CONFIRM_PREFIX`, `..._CONFIRM_SUFFIX`, `..._CANCEL`
- `NEXT_PUBLIC_UI_VOUCHERS_DOWNLOAD_SUCCESS_TITLE`, `..._SUCCESS_DESC`, `..._ERROR_TITLE`, `..._ERROR_DESC`
- `NEXT_PUBLIC_UI_VOUCHERS_GENERATING_EXCEL`
- `NEXT_PUBLIC_UI_VOUCHERS_EXCEL_SUCCESS_TITLE`, `..._SUCCESS_DESC`, `..._ERROR_TITLE`, `..._ERROR_DESC`, `..._BUTTON_PREFIX`, `..._BUTTON_EMPTY`
- `NEXT_PUBLIC_UI_VOUCHERS_EMPTY_TITLE`, `..._EMPTY_SUBTITLE`, `..._LOADING_MORE`, `..._RETRY_BUTTON`, `..._SHOWING_COUNT`
- `NEXT_PUBLIC_UI_VOUCHERS_DETAIL_SHEET_TITLE`, `..._DETAIL_SHEET_DESC`
- `NEXT_PUBLIC_UI_VOUCHERS_VIEW_CARDS`, `..._VIEW_TABLE`

Templated values use `{frente}`, `{section}`, `{filename}`, and `{count}` placeholders, substituted at render time (same `.replace("{token}", value)` pattern used throughout the file).

### `ui.trucksFilters`
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_PERIOD_PREFIX`, `..._STATUS_PREFIX`, `..._SEARCH_PREFIX`, `..._ACTIVE_LABEL`, `..._CLEAR_ALL`
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_STATUS_ALL`, `..._STATUS_IN_TRANSIT`, `..._STATUS_ARRIVED`
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_PERIOD_YESTERDAY`, `..._PERIOD_TODAY`, `..._PERIOD_LAST7`, `..._PERIOD_THIS_MONTH`, `..._PERIOD_MONTH_YEAR`, `..._PERIOD_RANGE`, `..._PERIOD_FALLBACK`
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_CANCEL`, `..._APPLY`

### `ui.dashboard` (additional keys)
- `NEXT_PUBLIC_UI_DASHBOARD_STAT_TRIPS`, `..._STAT_M3_HAULED`, `..._STAT_M3_PER_TRIP`, `..._STAT_ARRIVAL_RATE`, `..._STAT_SHIFTS`
- `NEXT_PUBLIC_UI_DASHBOARD_FILTER_WEEK`, `..._FILTER_MONTH`, `..._FILTER_YEAR`

### `ui.trucksTable` (additional keys)
- `NEXT_PUBLIC_UI_TRUCKS_TABLE_SORT_ASC`, `..._SORT_DESC`, `..._HIDE_COLUMN`, `..._COLUMNS_BUTTON`, `..._SHOW_COLUMNS`

### `ui.trucksFilters` (additional keys — aria-labels/tooltips)
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_PREV_YEAR`, `..._NEXT_YEAR` (month/year picker navigation)
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_TODAY_INCOMPLETE` (today's-data tooltip + icon aria-label)
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_CLEAR_SEARCH`
- `NEXT_PUBLIC_UI_TRUCKS_FILTERS_REMOVE_PREFIX` (used as `"{prefix} {chip label}"` on each active-filter chip's remove button)

### `ui.vouchers` (additional key)
- `NEXT_PUBLIC_UI_VOUCHERS_VIEW_GROUP_LABEL` (cards/table toggle group aria-label)

### `ui.general` (additional keys)
- `NEXT_PUBLIC_UI_GENERAL_BACK_TO_SELECTION_PREFIX`, `..._CHANGE_ITEM_PREFIX` (frente header back-navigation)
- `NEXT_PUBLIC_UI_GENERAL_BACK_TO_DASHBOARD`
- `NEXT_PUBLIC_UI_GENERAL_OF_CONNECTOR` — a bare grammatical connector ("del" in Spanish) used to assemble compound aria-labels like `"{actions} {of} {frente}"`. Word-order in the assembled phrase follows Spanish grammar; a locale where that reads awkwardly (English's "{actions} for {frente}" wouldn't use a mid-sentence connector at all) is a known limitation of token-substitution over a proper i18n framework — acceptable here since it only affects a screen-reader label, not visible text.

### Locale-aware date/calendar
- `MonthYearPicker.tsx` derives its month abbreviations from `Intl.DateTimeFormat(NEXT_PUBLIC_LOCALE, { month: "short" })` instead of a hardcoded Spanish array.
- `TrucksDateRangePicker.tsx` picks a `date-fns` locale (`enUS` for `NEXT_PUBLIC_LOCALE=en`, `es` otherwise) for the day-picker calendar. Only `es`/`en` are mapped explicitly; any other locale value falls back to `es`.

All `aria-label`s in the codebase are now config-driven — verified with a full-repo sweep, not just the components listed above.

## Recommended rollout

1. Start with the app name, colors, and login copy.
2. Override the main dashboard and records labels.
3. Tune the administrator/user-management UI copy.
4. Keep the defaults in Spanish as the repository’s baseline.

## Rule of thumb

If the change is only visible in browser copy or branding, it belongs in `white-label.config.ts`.
If it impacts API logic, database structure, or business rules, it stays out of scope for this white-label pass.
