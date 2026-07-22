# RedBook

A full-stack company management dashboard built on Laravel 13 and Vue 3 (Inertia v3), featuring a token/session-hybrid REST API, a searchable & sortable data table with bulk actions, and a service-based clean architecture on the backend.

<p>
  <img alt="PHP" src="https://img.shields.io/badge/PHP-8.4-777BB4?logo=php&logoColor=white">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white">
  <img alt="Inertia.js" src="https://img.shields.io/badge/Inertia.js-3.0-9553E9?logo=inertia&logoColor=white">
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Sanctum" src="https://img.shields.io/badge/Laravel_Sanctum-4.0-FF2D20?logo=laravel&logoColor=white">
</p>
<p>
  <img alt="Backend tests" src="https://img.shields.io/badge/backend%20tests-80%20passing-brightgreen?logo=php&logoColor=white">
  <img alt="Frontend tests" src="https://img.shields.io/badge/frontend%20tests-39%20passing-brightgreen?logo=vitest&logoColor=white">
  <img alt="PHPStan" src="https://img.shields.io/badge/PHPStan-level%207-brightgreen">
  <img alt="Code style" src="https://img.shields.io/badge/code%20style-Pint%20%2B%20ESLint%20%2B%20Prettier-blueviolet">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

> Badges reflect the results of the latest local test run (see [Testing](#testing) for the exact commands to reproduce them). No CI pipeline is wired up yet, so these are not live/auto-updating.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Setup (Docker)](#project-setup-docker)
- [Environment Configuration](#environment-configuration)
- [Database & Demo Data](#database--demo-data)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Code Quality Tooling](#code-quality-tooling)
- [License](#license)

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| PHP | 8.4 | Language runtime |
| Laravel Framework | 13 | Application framework |
| Inertia.js (Laravel adapter) | 3.0 | Server-driven SPA bridge |
| Laravel Fortify | 1.37 | Authentication scaffolding (login, registration, 2FA, passkeys) |
| Laravel Sanctum | 4.0 | API authentication (stateful SPA sessions + bearer tokens) |
| Laravel Wayfinder | 0.1 | Type-safe route/controller helpers generated for the frontend |
| PHPUnit | 12 | Test runner |
| Larastan (PHPStan) | 3.9 | Static analysis, level 7 |
| Laravel Pint | 1.27 | Code style / formatting |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| Vue | 3.5 | UI framework (Composition API, `<script setup>`) |
| Inertia.js (Vue adapter) | 3.0 | Page rendering + `useHttp` for standalone API calls |
| TypeScript | 5.2 | Static typing |
| Tailwind CSS | 4.1 | Utility-first styling |
| reka-ui | 2.9 | Headless component primitives (shadcn-vue style) |
| Vite | 8.0 | Build tool / dev server |
| Vitest + Vue Test Utils | 4.1 / 2.4 | Component & composable testing |
| ESLint + Prettier | 9 / 3.4 | Linting / formatting |

### Infrastructure

| Service | Image | Role |
|---|---|---|
| `app` / `queue` | Custom (`php:8.4-fpm` + Node 20) | Application + queue worker |
| `nginx` | `nginx:alpine` | Web server / reverse proxy |
| `mysql` | `mysql:8.0` | Primary database |
| `redis` | `redis:7-alpine` | Cache, session, and queue driver |

## Architecture

### Backend — service-based clean architecture

Requests flow through a strict layering, each layer with a single responsibility:

```
Route → FormRequest (validation) → Controller (HTTP only) → Service (orchestration)
      → Repository (persistence, ownership scoping) → Eloquent Model
                                                     → API Resource (response shaping)
```

```
app/
├── Contracts/Repositories/    # RepositoryInterface (generic CRUD) + CompanyRepositoryInterface
├── Repositories/              # BaseRepository (generic) + CompanyRepository (query building)
├── Services/                  # CompanyService — thin orchestration, no business logic beyond composition
├── Http/
│   ├── Controllers/Api/       # Thin controllers; no query logic, no direct Eloquent access
│   ├── Requests/Api/          # Form requests (validation only, per-endpoint)
│   └── Resources/              # API resources (response shaping, hides internal fields)
├── Concerns/                   # Shared validation-rule traits, reused across FormRequests
└── Models/                     # Eloquent models
```

Key conventions:
- **Repository pattern with a generic base contract.** `RepositoryInterface` defines `all/find/findOrFail/create/update/delete`; `BaseRepository` implements it once, so any future resource can extend it instead of re-implementing CRUD. Resource-specific query logic (sorting, search, filters, ownership scoping) lives only on the specific interface/repository (e.g. `CompanyRepositoryInterface`), keeping the generic contract from bloating.
- **Ownership is always enforced at the query level**, via `$user->companies()->...`, never by fetching then comparing — a mismatched or missing ID and another user's ID are indistinguishable (both 404), so nothing leaks which IDs exist.
- **Dependency inversion via interface binding.** Controllers/Services depend on `CompanyRepositoryInterface`, bound to `CompanyRepository` in `AppServiceProvider`, keeping the persistence layer swappable/mockable.
- **Thin controllers.** All validation lives in `FormRequest` classes (composed from reusable `Concerns` traits where rules are shared), all query/business logic lives in the Service/Repository layers.
- **Hybrid authentication.** Sanctum is configured for both first-party stateful SPA sessions (the Vue dashboard authenticates via the existing Fortify session cookie + CSRF, no token ever touches the browser) and traditional bearer tokens (for external/mobile API consumers) — same `auth:sanctum` middleware serves both.

### Frontend — composables + presentational components

```
resources/js/
├── pages/                      # Inertia page components (route targets)
├── layouts/                    # Shared page chrome (sidebar, header, breadcrumbs)
├── composables/                # Reactive data-fetching logic (useCompanies, useTwoFactorAuth, ...)
├── components/
│   ├── ui/                     # Headless/shadcn-vue-style primitives (Button, Table, Dialog, ...)
│   └── companies/               # Feature components (table, filters, modals, pagination)
├── routes/ & actions/           # Wayfinder-generated, type-safe route & controller helpers
└── types/                       # Shared TypeScript types (mirrors API response shapes)
```

Key conventions:
- **Read-side composables** (`useCompanies`) own fetch state (`data`, `meta`, `loading`) via Inertia's `useHttp` hook, decoupled from any single page.
- **Write-side forms own their own reactive state.** Each mutating component (`CompanyFormModal`, `DeleteCompanyDialog`) instantiates its own `useHttp<TForm>()` — mirroring Inertia's `useForm()` pattern — rather than centralizing mutations in a shared composable, since each form's `errors`/`processing` state is naturally scoped to the component triggering it.
- **One component, multiple modes**, not near-duplicates: `CompanyFormModal` handles create/edit/view via a `mode` prop instead of three separate components; `DeleteCompanyDialog` accepts `companies: Company[]` so the same component drives both single-row and bulk delete.
- **Presentational components stay dumb.** `CompaniesTable`, `TablePagination`, `CompaniesFilters` take plain props and emit plain events — no fetching, no business logic — making them cheap to unit test in isolation.

## Features

- Session/Fortify authentication with two-factor auth and passkey support
- Company CRUD via a REST API (`/api/companies`) usable by both the bundled dashboard (session-authenticated) and external clients (Sanctum bearer tokens)
- Dashboard with live stats (total companies, added this month, oldest company)
- Data table with:
  - Server-side pagination (numbered pages, not just prev/next)
  - Server-side sorting on every column (ID, name, address, email, starting date, created date)
  - Global search across name/address/email
  - Date-range filters on created date and starting date
  - Row selection (single, multiple, or "select all on page") with bulk delete in a single request
  - Create/Edit/View in a single reusable modal

## Project Setup (Docker)

### Prerequisites

- Docker & Docker Compose
- Node.js is **not** required on the host — it runs inside the `app` container

### Steps

```bash
# 1. Clone and enter the project
git clone <repository-url> redbook
cd redbook

# 2. Copy the environment file
cp .env.example .env

# 3. Build and start the stack (app, queue, nginx, mysql, redis)
docker compose -f docker/docker-compose.yml up -d --build

# 4. Install PHP dependencies and generate the app key
docker exec redbook-test_app composer install
docker exec redbook-test_app php artisan key:generate

# 5. Run migrations and seed demo data (creates a demo user + 100 demo companies)
docker exec redbook-test_app php artisan migrate --seed

# 6. Install frontend dependencies and build assets
docker exec redbook-test_app npm install
docker exec redbook-test_app npm run build
```

The app is now available at **http://localhost:7878** (configurable via `APP_PORT` in `.env`).

For active frontend development with hot module reload, run `npm run dev` instead of `npm run build`, and leave it running in a separate terminal:

```bash
docker exec redbook-test_app npm run dev
```

## Environment Configuration

`.env.example` ships pre-configured to match the Docker Compose services out of the box:

| Variable | Value | Notes |
|---|---|---|
| `APP_URL` | `http://localhost:7878` | Must match the port nginx is mapped to (`APP_PORT`) |
| `DB_CONNECTION` | `mysql` (host `mysql`) | Matches the `mysql` service in `docker-compose.yml` |
| `SESSION_DRIVER` / `CACHE_STORE` / `QUEUE_CONNECTION` | `redis` | Matches the `redis` service |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:7878,127.0.0.1:7878,...` | Required for the dashboard to authenticate against `/api/*` via session cookie rather than a bearer token |

> These values are forced at the container level in `docker/docker-compose.yml`'s `environment:` blocks regardless of `.env`, so `.env` is kept in sync purely for accuracy/documentation — don't be surprised that changing `.env` alone won't switch the running containers to a different DB/cache backend.

## Database & Demo Data

Running `php artisan migrate --seed` (or `db:seed` on an already-migrated database) creates:

- A demo user — `test@example.com` / `password`
- 100 demo companies via `CompanySeeder` (uses `CompanyFactory`), attached to a configured user

To re-seed just the companies:

```bash
docker exec redbook-test_app php artisan db:seed --class=CompanySeeder
```

## Testing

### Backend — PHPUnit (80 tests)

```bash
docker exec redbook-test_app php artisan test              # full suite
docker exec redbook-test_app php artisan test --compact     # condensed output
docker exec redbook-test_app php artisan test --filter=CompanyTest
```

| Suite | Tests | Covers |
|---|---|---|
| `Feature/Api/CompanyTest` | 40 | CRUD, ownership scoping, pagination, sorting, search, date-range filters, bulk delete, stats, session vs. token auth |
| `Feature/Auth/AuthenticationTest` | 6 | Login, logout, rate limiting, 2FA redirect |
| `Feature/Auth/EmailVerificationTest` | 6 | Email verification flow |
| `Feature/Auth/PasswordResetTest` | 5 | Password reset flow |
| `Feature/Settings/ProfileUpdateTest` | 5 | Profile update/delete |
| `Feature/Settings/SecurityTest` | 5 | Password/2FA security settings |
| `Feature/Auth/TwoFactorChallengeTest` | 2 | 2FA challenge |
| `Feature/Auth/VerificationNotificationTest` | 2 | Verification email dispatch |
| `Feature/Auth/RegistrationTest` | 2 | User registration |
| `Feature/Auth/PasswordConfirmationTest` | 2 | Password confirmation gate |
| `Feature/DashboardTest` | 2 | Dashboard route access |
| `Feature/ExampleTest` | 2 | Root route redirect behavior |
| `Unit/ExampleTest` | 1 | Baseline unit test |

Static analysis and formatting:

```bash
docker exec redbook-test_app vendor/bin/phpstan analyse       # Larastan, level 7
docker exec redbook-test_app vendor/bin/pint --dirty          # code style
```

### Frontend — Vitest + Vue Test Utils (39 tests)

```bash
docker exec redbook-test_app npm run test          # run once
docker exec redbook-test_app npm run test:watch    # watch mode
```

| Suite | Tests | Covers |
|---|---|---|
| `components/companies/TablePagination.test.ts` | 10 | Numbered pagination built from Laravel's paginator links, prev/next boundaries, active-page state, ellipsis handling |
| `components/companies/CompaniesTable.test.ts` | 8 | Row rendering, sort emits, checkbox selection (single/all/indeterminate) |
| `composables/useCompanies.test.ts` | 5 | Fetch state, query-param construction (only non-empty filters reach the URL) |
| `components/companies/DeleteCompanyDialog.test.ts` | 5 | Single vs. bulk delete routing, confirmation copy, cancel behavior |
| `components/companies/CompanyFormModal.test.ts` | 5 | Create/edit/view modes, validation error rendering |
| `components/companies/CompaniesFilters.test.ts` | 4 | Debounced search, immediate date-filter emits, bulk-delete trigger |
| `components/companies/StatCard.test.ts` | 2 | Stat card rendering |

Type-checking, linting, and formatting:

```bash
docker exec redbook-test_app npx vue-tsc --noEmit
docker exec redbook-test_app npm run lint:check
docker exec redbook-test_app npm run format:check
```

## API Reference

All endpoints are under `/api`, protected by `auth:sanctum` (session cookie **or** bearer token).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/companies` | Paginated, sortable, searchable, filterable list of the authenticated user's companies |
| `GET` | `/api/companies/stats` | Total companies, added this month, oldest company |
| `POST` | `/api/companies` | Create a company |
| `GET` | `/api/companies/{id}` | View a single company |
| `PUT` | `/api/companies/{id}` | Update a company |
| `DELETE` | `/api/companies/{id}` | Delete a single company |
| `DELETE` | `/api/companies` | Bulk delete (`{ "ids": [1, 2, 3] }`) |

`GET /api/companies` query parameters:

| Param | Values | Notes |
|---|---|---|
| `page`, `per_page` | integer | `per_page` clamped to 1–100, default 15 |
| `sort` | `id`, `name`, `address`, `email`, `starting_date`, `created_at` | Whitelisted to prevent arbitrary-column sorting |
| `direction` | `asc`, `desc` | |
| `search` | string | Matches `name`, `address`, or `email` |
| `created_from`, `created_to` | `YYYY-MM-DD` | Inclusive range on `created_at` |
| `starting_from`, `starting_to` | `YYYY-MM-DD` | Inclusive range on `starting_date` |

## Code Quality Tooling

| Tool | Command | Enforces |
|---|---|---|
| Laravel Pint | `vendor/bin/pint --dirty` | PHP code style (Laravel preset) |
| Larastan (PHPStan) | `vendor/bin/phpstan analyse` | Static analysis, level 7 |
| ESLint | `npm run lint:check` | JS/TS/Vue lint rules |
| Prettier | `npm run format:check` | Formatting (JS/TS/Vue) |
| vue-tsc | `npx vue-tsc --noEmit` | TypeScript type-checking across `.vue`/`.ts` |

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
