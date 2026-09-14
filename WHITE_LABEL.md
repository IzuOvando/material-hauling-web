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

## Recommended rollout

1. Start with the app name, colors, and login copy.
2. Override the main dashboard and records labels.
3. Tune the administrator/user-management UI copy.
4. Keep the defaults in Spanish as the repository’s baseline.

## Rule of thumb

If the change is only visible in browser copy or branding, it belongs in `white-label.config.ts`.
If it impacts API logic, database structure, or business rules, it stays out of scope for this white-label pass.
