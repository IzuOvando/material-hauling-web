# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 white-label web application (multi-tenant) for managing and printing tickets for construction and logistics operations using thermal printers. The system handles multiple ticket types (Gasolina, Acarreos, Concreto, Asfalto, VoucherCamion) and provides both web and mobile API interfaces. Each client/tenant gets its own branding, database, and Vercel deployment via the white-label config system (`white-label.config.ts` + `tenant-assets/<client>/tenant.json`).

> **Architectural note — Frentes vs Projects:**
> The current data model is organized around **Frentes** (work fronts), where each frente is the primary entity for grouping tickets, users, and dashboard data. The concept of "Project" is currently derived by parsing the frente name (e.g. `PROJ-F1` → project `PROJ`). A `displayName` field on `Frente` stores the full human-readable project name and is shared across all frentes with the same prefix.
>
> **Future direction:** the team plans to introduce a first-class `Project` entity that frentes belong to, making the project/frente hierarchy explicit in the schema. Until then, avoid hardcoding project-level logic that assumes frente names will always follow the current naming convention, and prefer the `displayName` field for any user-facing project labels. Any new feature that touches project grouping should be designed to accommodate this future split.

## Common Commands

### Development
```bash
npm run dev           # Start development server (http://localhost:3000)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

### Testing
```bash
npm test              # Run all Jest tests with coverage
```

### Database
```bash
npm run migrate-dev   # Run Prisma migrations in development
npm run migrate-prod  # Deploy Prisma migrations to production
npm run seed          # Seed database with initial data
npm run clear-data    # Clear all data from database
```

### Docker
```bash
docker-compose up     # Start local PostgreSQL and Redis containers
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Session**: Redis via Vercel KV (Upstash)
- **Storage**: Vercel Blob for file uploads (Excel files)
- **Authentication**: NextAuth.js v5 with JWT strategy
- **State Management**: Zustand with persistence
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Testing**: Jest with React Testing Library

### Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (dashboard)/             # Protected dashboard routes
│   │   └── tickets/[frente]/[area]/  # Dynamic ticket viewing by frente and area
│   ├── trucks/                  # Truck voucher management
│   ├── api/                     # API routes
│   │   ├── mobile/              # Mobile app endpoints (JWT auth)
│   │   ├── files/               # File upload/processing endpoints
│   │   ├── frente/              # Frente and ticket management
│   │   └── trucks/              # Truck voucher endpoints
│   └── login/                   # Login page
├── auth/                        # Authentication configuration
│   ├── auth.config.ts           # NextAuth configuration
│   ├── auth.ts                  # Auth handlers
│   └── TokenAuthenticator.ts    # JWT token utilities for mobile API
├── actions/                     # Server actions
├── components/                  # React components
│   ├── ui/                      # Reusable UI components (shadcn/ui)
│   ├── printers/                # Printer management components
│   ├── tickets/                 # Ticket table and display components
│   └── frentes/                 # Frente management components
├── lib/                         # Core libraries
│   ├── printers/                # Printer abstraction layer
│   │   ├── epson.ts             # Low-level Epson printer protocol
│   │   ├── ticketPrinter.ts     # Single printer abstraction
│   │   ├── distributedTicketPrinterV2.ts  # Multi-printer queue management
│   │   └── schemas/             # Ticket formatting schemas
│   ├── db.ts                    # Prisma client singleton
│   └── blobClient.ts            # Vercel Blob client
├── store/                       # Zustand stores
│   ├── printerStore.ts          # Printer state management
│   ├── frenteStore.ts           # Frente selection state
│   └── ticketsSelectionStore.tsx # Ticket selection for printing
├── types/                       # TypeScript type definitions
├── utils/                       # Utility functions
│   ├── validators.ts            # Input validation utilities
│   ├── crypto/                  # Encryption utilities
│   └── qr/                      # QR code generation
├── helpers/                     # Helper functions
│   └── formatters/              # Date, number, and data formatters
└── contexts/                    # React contexts
```

### Database Schema (Prisma)

The database is organized around **Frentes** (construction sites/projects):

- **User**: Users with roles and frente assignments (many-to-many via UserFrente)
- **Frente**: Construction site with Excel file URLs for each ticket type
- **VoucherCamion**: Truck vouchers with odometer, material tracking
- **Acarreos**: Material transport tickets
- **Gasolina**: Fuel purchase tickets
- **Concreto**: Concrete delivery tickets
- **Asfalto**: Asphalt delivery tickets

All ticket models have:
- UUID primary key
- `frenteNombre` foreign key to Frente (cascade delete)
- `createdAt` timestamp for record creation
- Date/time fields for ticket operations
- Database indexes optimized for filtering by frente, date, and common fields

### Authentication & Authorization

**Web App (NextAuth.js):**
- Session-based JWT authentication (24h expiry)
- Middleware protects all routes except `/login` and `/trucks/voucher`
- User roles: `ADMIN`, `USER`, `CHECKER` (defined in `src/types/roles.ts`)
- Role-based access control in components and server actions

**Mobile API:**
- Separate JWT token system using `TokenAuthenticator`
- Endpoints under `/api/mobile/*` use Bearer token authentication
- Access tokens (short-lived) and refresh tokens (long-lived)
- Tokens stored in Redis (Vercel KV) for revocation

### State Management

**Zustand Stores:**
- **printerStore**: Manages connected thermal printers (IP, status, device instances)
  - Persisted to localStorage (excluding device instances)
  - Auto-reconnects printers on page load
- **frenteStore**: Current selected frente
- **ticketsSelectionStore**: Selected tickets for batch printing

### Printer System Architecture

**Three-layer abstraction:**

1. **EpsonPrinter** (`lib/printers/epson.ts`): Low-level ESC/POS protocol over TCP/IP
2. **TicketPrinter** (`lib/printers/ticketPrinter.ts`): Single printer with connection management
   - Handles connection status callbacks
   - Configurable timeout (PRINTERS_TIMEOUT env var)
   - Paper end detection
3. **DistributedTicketPrinter** (`lib/printers/distributedTicketPrinterV2.ts`): Multi-printer job queue
   - Distributes tickets across multiple printers
   - Automatic retry on failures
   - Tracks successful/failed prints
   - Status callbacks for UI updates

**Ticket Schemas** (`lib/printers/schemas/`):
- Define layout and formatting for each ticket type
- Handle QR code generation and encryption
- Different schemas for different areas (Acarreos, Gasolina, etc.)

### File Processing Pipeline

Excel file uploads are processed through:
1. **Upload**: Client uploads Excel via `/api/files/vercel` or `/api/files/local`
2. **Storage**: Saved to Vercel Blob (cloud) or local filesystem (dev)
3. **Processing**: `/api/files/process` parses Excel and inserts records
   - Batch processing (BATCHES_RECORDS and BATCHES_CSV_LINES env vars)
   - Validation before insertion
   - Deduplicate based on business logic per ticket type
4. **Association**: File URL stored in Frente record for future reference

### Mobile API Endpoints

- `POST /api/mobile/auth`: Login, returns access + refresh tokens
- `POST /api/mobile/auth/refresh`: Refresh access token
- `POST /api/mobile/vouchers`: Create truck vouchers (batch)
- `GET /api/mobile/vouchers/latest`: Get recent vouchers for a frente

All mobile endpoints:
- Require Bearer token authentication
- Validate frente existence
- Invalidate Redis facet caches on data changes

### Key Patterns & Conventions

**Path Alias:**
- Use `@/*` to import from `src/*` (configured in tsconfig.json)

**API Routes:**
- Return NextResponse with appropriate HTTP status codes
- Validate inputs using utilities in `utils/validators.ts`
- Handle Prisma errors gracefully
- Invalidate caches (Redis) when data changes

**Component Organization:**
- UI primitives in `components/ui/` (shadcn/ui pattern)
- Feature-specific components in domain folders (printers, tickets, frentes)
- Use TypeScript for all components with proper typing

**Server vs Client:**
- Database queries only in API routes or server actions
- Printer operations are client-side (browser connects to printer IPs)
- State stores are client-side with persistence

**Testing:**
- Test files co-located with source (`.test.ts` suffix)
- API route tests in same directory as routes
- Use Jest with jsdom environment
- Path alias `@/*` configured in jest.config.ts

**Error Handling:**
- Custom error classes in `src/errors/`
- ValidationError for business logic validation
- Proper HTTP status codes in API responses

## Chart Components Pattern

### Technology
- **Library**: `shadcn/ui chart` (`src/components/ui/chart.tsx`) — wrapper over Recharts
- **Install**: `npx shadcn@latest add chart`
- **Key exports**: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartConfig`

### Location & Naming
- Domain folder: `src/components/dashboard/` — same convention as `printers/`, `tickets/`
- File naming: `{Domain}{ChartType}Chart.tsx` (e.g. `AcarreosTripsBarChart.tsx`)
- Shared empty state: `src/components/dashboard/EmptyChart.tsx`
- Barrel export in `index.ts` — only what is used outside the folder

### Color System
`components.json` has `cssVariables: false` — `--chart-1..5` globals **do not exist**.
Colors are declared per-chart inside `chartConfig` using explicit hex. `ChartContainer` injects them as scoped `var(--color-{key})` at runtime; use those vars in Recharts `fill`/`stroke` props — never hardcode hex in Recharts directly.

**Brand base colors (UI chrome, single-series charts):**
- Primary green: `#133223`
- Accent gold: `#bc955c`
- Secondary magenta: `#9d2449`

**Series palette (multi-series — bars, lines, pie slices):** use in order, stop before saturating:
1. `#22543d` — medium green
2. `#bc955c` — gold
3. `#9d2449` — magenta
4. `#4a7c59` — light green
5. `#d4a843` — amber

> `chart.tsx` must carry a comment documenting this constraint (no CSS variable globals, colors via chartConfig only).

### Rules
- All chart components are `"use client"` — Recharts is browser-only
- `chartConfig` is declared per-file with `satisfies ChartConfig` — never `as`, never shared globally
- Props typed from `src/types/dashboard.ts` (`TimeseriesPoint`, `BreakdownItem`, etc.)
- Pure presentational — no `useState`, `useEffect`, or data fetching inside chart components
- Always handle `isLoading` (→ `<Skeleton>`) and empty data (→ `<EmptyChart>`)
- Always accept `className?: string` — parent controls layout and sizing
- Always wrap in `Card` with `CardHeader` (title + description) and `CardContent`
- `accessibilityLayer` prop on every Recharts root element

### Layers

| Layer | Location | Responsibility |
|---|---|---|
| Types | `src/types/dashboard.ts` | `DashboardFilters`, `TimeseriesPoint`, `BreakdownItem`, etc. |
| Validation | `src/actions/dashboard/helpers.ts` | `getDashboardFilters()` |
| API | `src/app/api/dashboard/*` | Endpoints returning typed data |
| Charts | `src/components/dashboard/*Chart.tsx` | Pure visual, receives data as props |
| Pages | `src/app/(dashboard)/trucks/dashboard/` | Composes charts, fetches data |

## Environment Setup

Required environment variables (see `.env.example`):
- PostgreSQL connection (DATABASE_URL, POSTGRES_URL_NON_POOLING)
- Redis/Vercel KV (KV_REST_API_URL, KV_REST_API_TOKEN)
- Vercel Blob (BLOB_READ_WRITE_TOKEN) - required even in local dev
- Auth secrets (AUTH_SECRET, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET)
- Optional: BATCHES_RECORDS, BATCHES_CSV_LINES, PRINTERS_TIMEOUT

For local development with Docker, use the provided `docker-compose.yaml` which sets up PostgreSQL and Redis instances. Note: Vercel Blob is still required for file uploads even in local development.

## Deployment

The application is designed for deployment on Vercel:
- Vercel Postgres for production database
- Vercel KV for Redis
- Vercel Blob for file storage
- Environment variables configured in Vercel dashboard

```bash
vercel --prod         # Deploy directly to Vercel production via CLI
```

> **Important:** The GitHub → Vercel automatic integration is **not connected** for this project. All production deploys must be triggered manually with `vercel --prod` from the project root. Do NOT expect a `git push` to trigger a Vercel deployment.

## Git Workflow

**All changes go through `dev` first. Never commit or push directly to `main`.**

```
feature/fix branch → PR → dev → PR → main (release)
```

- Cut feature/fix branches from `dev`
- Open PRs targeting `dev`
- When ready to release: PR from `dev` → `main`
- `main` is production — only receives merges from `dev` via PR
- Hotfixes follow the same flow, just faster

**PR checklist:**
- [ ] Remove all `console.log` / `console.debug` debug statements
- [ ] No temporary comments or leftover TODO blocks
- [ ] Branch is up to date with `dev`

## Upcoming Work — Planning Context

### tipoProyecto en Frente + Catálogos de Origen y Tiro

This is the next feature to implement. Full design decisions are finalized — implement exactly as described below.

#### 1. tipoProyecto

Add `tipoProyecto` as an enum field on the `Frente` model:

```prisma
enum TipoProyecto {
  LINEAL
  FIJO
}

model Frente {
  // ... existing fields
  tipoProyecto TipoProyecto @default(FIJO)
}
```

- **LINEAL** — obra lineal (carreteras, ferroviario). Destination field in mobile = **"Cadenamiento"**, validated format `XX+XXX` (e.g. `12+450`). No dropdown, no free text — only that format.
- **FIJO** — destino fijo (planta, almacén, edificio). Destination field in mobile = **"Tiro"** (dropdown + free text "Otro").
- This replaces the per-client `enableCadenamiento` boolean in the mobile app. Once this is live, mobile reads `tipoProyecto` from the frente API response and drops the client-level toggle.

#### 2. Catálogos de Origen y Tiro

Same pattern as the existing `Material` / `MaterialFrente` system. Study that implementation and replicate it exactly.

**Prisma models to add:**

```prisma
model OrigenCatalogo {
  id          String        @id @default(uuid())
  nombre      String        @unique
  isActive    Boolean       @default(true)
  frentes     OrigenFrente[]
}

model OrigenFrente {
  frenteNombre  String
  origenId      String
  frente        Frente          @relation(fields: [frenteNombre], references: [nombre], onDelete: Cascade)
  origen        OrigenCatalogo  @relation(fields: [origenId], references: [id], onDelete: Cascade)
  @@id([frenteNombre, origenId])
}

model TiroCatalogo {
  id          String       @id @default(uuid())
  nombre      String       @unique
  isActive    Boolean      @default(true)
  frentes     TiroFrente[]
}

model TiroFrente {
  frenteNombre  String
  tiroId        String
  frente        Frente        @relation(fields: [frenteNombre], references: [nombre], onDelete: Cascade)
  tiro          TiroCatalogo  @relation(fields: [tiroId], references: [id], onDelete: Cascade)
  @@id([frenteNombre, tiroId])
}
```

**Seed — Origen catalog (9 entries):**
1. Banco de Material
2. Banco de Préstamo
3. Préstamo Lateral
4. Cantera
5. Mina
6. Planta
7. Demolición
8. Despalme
9. Otro

**Seed — Tiro catalog (5 entries, only relevant for FIJO projects):**
1. Banco de Tiro
2. Centro de Acopio
3. Centro de Reciclaje
4. Obra
5. Otro

#### 3. Mobile API Endpoints

Add two new endpoints following the same pattern as `/api/mobile/materials/route.ts`:

- `GET /api/mobile/origenes` → returns `{ origenes: Record<string, string[]> }` grouped by `frenteNombre`
- `GET /api/mobile/tiros` → returns `{ tiros: Record<string, string[]> }` grouped by `frenteNombre`

Also expose `tipoProyecto` in any frente-related endpoint the mobile app calls, so the app knows which field to show.

#### 4. Web Admin UI

Add two sections to the frente admin page, following the exact same UI pattern as the existing materials admin:
- **Orígenes del frente** — assign/remove items from `OrigenCatalogo` for this frente
- **Tiros del frente** — assign/remove items from `TiroCatalogo` for this frente (shown/hidden based on `tipoProyecto`)
- Add `tipoProyecto` selector (LINEAL / FIJO) to the frente creation and edit dialogs

#### 5. Dropdown order in mobile app

When the mobile app renders the Origen or Tiro dropdown:
```
── Este frente ──────────────────
  [custom entries added by admin for this frente — shown first]
── General ─────────────────────
  [standard catalog entries]
── ─────────────────────────────
  Otro  ← always last, always visible
```

#### 6. Normalization for open-text entries ("Otro")

When a user selects "Otro" and types a custom value:
1. **Normalize before saving**: trim, NFC unicode, collapse multiple spaces, remove trailing periods, Title Case
2. **Fuzzy match while typing**: compare against catalog using normalized Levenshtein distance. If similarity ≥ 0.75, show inline suggestion "¿Quisiste decir [X]? [Usar] [Continuar]"
3. **Promotion (future)**: repeated "Otro" values in a frente surface in web admin as candidates to add to the catalog

Reuse/extend the existing normalization utility already in the codebase (similar to `normalizeEnterpriseName`). Do not create from scratch.

#### 7. Existing data

Do NOT migrate existing `origen`/`destino` free-text values in `VoucherCamion`. Leave them as-is. The new catalog only applies going forward — when mobile sends a voucher, the origin/destination may now come from the catalog (canonical name) or from a free-text "Otro" entry. Both are strings, backward compatible.

#### 8. Offline caching in mobile (Origen & Tiro)

The mobile app must cache origenes and tiros with the **same stale-while-revalidate strategy already in place for materials** (`useMaterials` hook + Realm cache). Do NOT assume connectivity.

- Cache origenes and tiros in Realm, keyed by `frenteNombre`
- On load: serve from cache immediately (zero latency), then fetch in background if `isInternetReachable`
- TTL and force-refresh triggers: same policy as `useMaterials`
- `tiros` only need to be fetched/cached if `tipoProyecto === 'FIJO'` (no Tiro dropdown on LINEAL projects)
- The Realm models for origen/tiro cache follow the same shape as the existing materials cache

This is a **web-side constraint**: the API endpoints must return data that maps cleanly to per-frente Realm records (same `{ origenes: Record<string, string[]> }` shape as materials).

#### 9. Implementation order

1. Prisma migration — add `tipoProyecto` to `Frente` + new catalog tables + seed
2. Mobile API endpoints — `/api/mobile/origenes`, `/api/mobile/tiros`, expose `tipoProyecto` in frente endpoint
3. Web admin UI — frente dialogs + catalog management pages
4. (Separate session) Mobile app — consume new endpoints, cache in Realm, show correct field per `tipoProyecto`

### Multi-tenant QR Compatibility

The mobile app validates QR codes using a per-tenant `truckIdPrefix` (e.g. `SDN`, `TUR`). The web must generate QR codes with the matching suffix `::${truckIdPrefix}QR`.

**Tenant registry — must stay in sync with mobile `src/utils/deriveTruckIdPrefix.test.ts`:**
| Tenant key | App name | truckIdPrefix |
|---|---|---|
| `sedena` | SDN Transportes | `SDN` |
| `turist-trucks` | Atlas Haul | `TUR` (explicit override in tenant.json) |

The `white-label.config.ts` already has `deriveTruckIdPrefix` wired in. If a tenant sets `truckIdPrefix` explicitly in `tenant.json`, that value is used; otherwise it is auto-derived from `app.name`. Verify the derived value matches what the mobile app expects before deploying a new tenant.
