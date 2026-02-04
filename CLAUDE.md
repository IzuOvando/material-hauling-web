# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 web application for SEDENA that manages and prints tickets for various construction and logistics operations using thermal printers. The system handles multiple ticket types (Gasolina, Acarreos, Concreto, Asfalto, VoucherCamion) and provides both web and mobile API interfaces.

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
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
