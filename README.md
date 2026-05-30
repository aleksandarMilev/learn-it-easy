# LearnItEasy

A full-stack tutoring platform connecting students with tutors.

## Tech Stack

### Backend

- **NestJS** — modular REST API with TypeScript
- **PostgreSQL 17** + **Prisma 6** — relational database with type-safe ORM
- **Redis** + **BullMQ** — async job queues for notifications
- **Socket.io** — real-time messaging with WebSocket gateway
- **JWT** — access + refresh token authentication with token rotation
- **multer** + **@nestjs/serve-static** — file uploads and static asset serving
- **@nestjs/terminus** — health check endpoint
- **Docker** — containerized development and production

### Frontend

- **React 19** + **Vite** — SPA with React Compiler for auto-memoization
- **TanStack Query** — server state management with cursor-based pagination
- **Zustand** — client state (auth, toasts, confirm dialogs)
- **React Hook Form** + **Zod** — type-safe form validation
- **Tailwind CSS v4** — utility-first styling (CSS-only config, no `tailwind.config.js`)
- **Socket.io Client** — real-time chat with optimistic message updates
- **i18next** + **react-i18next** — English / Bulgarian internationalisation
- **lucide-react** — icon library

### Infrastructure

- **Turborepo** + **pnpm** — monorepo with build caching
- **GitHub Actions** — CI pipeline (build, lint, unit tests, e2e tests)
- **Docker Compose** — dev stack (hot-reload) and prod stack (Nginx + SSL)

## Features

- **Auth** — register, login, JWT access + refresh tokens, automatic token rotation on refresh, role-based access (Student, Tutor, Admin)
- **Tutor profiles** — subjects, hourly rate, bio, weekly availability slots; requires admin approval before appearing in listings
- **Booking system** — conflict detection prevents double-booking, status workflow (pending → confirmed → cancelled → completed), cursor-based pagination
- **Real-time messaging** — WebSocket chat between students and tutors; messages appear instantly with a pending indicator and retry on failure
- **Notifications** — async in-app notifications via BullMQ queue for booking events, new messages, and new reviews; unread badge count
- **Reviews** — students leave 1–5 star ratings with comments after completed sessions; tutors display their average rating and review count
- **Avatar upload** — users upload, preview, and remove profile photos (JPEG, PNG, WebP, AVIF, max 2 MB); files are validated by magic bytes, stored on a named Docker volume
- **Admin panel** — approve or remove tutor profiles, view all registered users, browse all bookings with status filtering
- **i18n** — all UI text in English and Bulgarian; language choice persisted to localStorage; toggle in the navbar
- **Soft delete** — data is never hard-deleted; deleted records are hidden from queries but preserved in the database
- **Swagger UI** — interactive API documentation at `/api`

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 20+
- pnpm

### Run with Docker

```bash
# Clone the repo
git clone https://github.com/aleksandarMilev/learn-it-easy.git
cd learn-it-easy

# Copy env file and fill in your values
cp .env.example .env.dev

# Start all services
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger UI: http://localhost:3000/api

### Seed development data (optional)

Run once after the containers are healthy to load realistic Bulgarian dev data:

```bash
cd apps/server
pnpm db:seed
```

Default credentials after seeding:

| Role    | Email                          | Password    |
| ------- | ------------------------------ | ----------- |
| Admin   | admin@learniteasy.com          | Password123! |
| Student | ivan.petrov@student.com        | Password123! |
| Tutor   | elena.todorova@tutor.com       | Password123! |

### Run locally (without Docker)

```bash
pnpm install

# Start Postgres and Redis via Docker
docker compose -f docker-compose.dev.yml --env-file .env.dev up postgres redis -d

# Run migrations
cd apps/server
pnpm prisma:migrate

# Seed data (optional)
pnpm db:seed

# Start server
pnpm run start:dev

# Start client (new terminal)
cd apps/client
pnpm run dev
```

## Project Structure

```
learn-it-easy/
├── apps/
│   ├── server/                  # NestJS API
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── common/          # Shared DTOs and types (pagination)
│   │   │   ├── config/          # Zod env validation
│   │   │   ├── health/
│   │   │   ├── messaging/
│   │   │   ├── notifications/
│   │   │   ├── reviews/
│   │   │   ├── tutors/
│   │   │   └── users/
│   │   │       └── services/    # ImageValidatorService
│   │   ├── prisma/
│   │   │   └── seed.ts          # Dev seed with Bulgarian test data
│   │   ├── test/                # E2E test suite
│   │   └── uploads/
│   │       └── avatars/         # Avatar files (Docker volume in prod)
│   └── client/                  # React SPA
│       └── src/
│           ├── api/
│           ├── components/
│           │   ├── layout/      # Layout, Navbar, ProtectedRoute
│           │   └── ui/          # Toast, Avatar, StarRating, LanguageSwitcher, ConfirmDialog, ErrorBoundary
│           ├── hooks/
│           ├── i18n/            # en.ts, bg.ts translation files
│           ├── pages/
│           ├── store/           # Zustand slices (auth, toast, confirm-dialog)
│           └── types/
├── packages/
│   ├── eslint-config/
│   └── typescript-config/
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

## API Overview

All endpoints are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

| Module        | Endpoints |
| ------------- | --------- |
| Auth          | POST /auth/register, /auth/login, /auth/refresh, /auth/logout |
| Users         | GET /users/me, PATCH /users/me, GET /users/:id, GET /users (admin), POST /users/me/avatar, DELETE /users/me/avatar |
| Tutors        | GET /tutors, GET /tutors/:id, POST /tutors/profile, PATCH /tutors/profile, DELETE /tutors/:id, POST /tutors/availability, GET /tutors/:id/availability, POST /tutors/:id/approve (admin) |
| Bookings      | GET /bookings, POST /bookings, GET /bookings/:id, PATCH /bookings/:id/status, DELETE /bookings/:id |
| Messages      | GET /messages/conversations, POST /messages/conversation, GET /messages/conversations/:id, DELETE /messages/messages/:id |
| Reviews       | POST /reviews, GET /reviews/tutor/:tutorId, PATCH /reviews/:id, DELETE /reviews/:id |
| Notifications | GET /notifications, GET /notifications/unread-count, PATCH /notifications/:id/read, DELETE /notifications/:id |
| Health        | GET /health |

## Testing

```bash
# Server — unit tests
pnpm --filter server test

# Server — e2e tests (requires running Postgres + Redis)
pnpm --filter server test:e2e

# Client — unit tests
pnpm --filter @learn-it-easy/client test:run
```

Current coverage: **119 server unit tests** + **59 client tests**

## Architecture

The backend follows a **modular monolith** pattern — each feature is a self-contained NestJS module with its own controller, service, and DTOs. Modules communicate only through injected services, never through direct database access. This makes each module independently extractable into a microservice if needed.

**Pagination** uses a cursor-based strategy on high-traffic list endpoints (`GET /bookings`, `GET /messages/conversations`). Clients pass `cursor` (last seen id) and `take` (page size, max 50) query params; responses include `{ data, nextCursor }`. The frontend uses TanStack Query's `useInfiniteQuery` with a Load More button.

**File upload security** validates every uploaded image by reading its magic bytes before accepting the file — MIME type from the HTTP request is never trusted. Accepted formats are JPEG, PNG, WebP, and AVIF up to 2 MB. In production, avatar files live on a named Docker volume (`uploads_data`) shared between deployments.

**Internationalisation** is client-only and uses a single i18next namespace. All static UI strings and dynamic messages (toasts, error responses, validation) are translated into English and Bulgarian. The user's language choice is stored in `localStorage` and restored on load.

**Optimistic chat** displays sent messages immediately with a pending indicator. On server echo the pending state is replaced with the confirmed message. On timeout or error the message is marked failed with a retry button.

**Booking conflict detection** runs inside a PostgreSQL serializable transaction — the overlap check and the insert are atomic, so concurrent requests for the same tutor slot are safely serialized without race conditions.
