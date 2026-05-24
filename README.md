# LearnItEasy

A full-stack tutoring platform connecting students with tutors.

## Tech Stack

### Backend

- **NestJS** — modular REST API with TypeScript
- **PostgreSQL** + **Prisma** — relational database with type-safe ORM
- **Redis** + **BullMQ** — async job queues for notifications
- **Socket.io** — real-time messaging
- **JWT** — access + refresh token authentication
- **Docker** — containerized development and production

### Frontend

- **React 19** + **Vite** — SPA with React Compiler for auto-memoization
- **TanStack Query** — server state management
- **Zustand** — client state (auth)
- **React Hook Form** + **Zod** — type-safe form validation
- **Tailwind CSS v4** — utility-first styling
- **Socket.io Client** — real-time chat

### Infrastructure

- **Turborepo** + **pnpm** — monorepo with caching
- **GitHub Actions** — CI pipeline (build, lint, test)
- **Docker Compose** — dev and prod stacks

## Features

- **Auth** — register, login, JWT refresh tokens, role-based access (Student, Tutor, Admin)
- **Tutor profiles** — subjects, hourly rate, weekly availability
- **Booking system** — conflict detection, status workflow (pending → confirmed → completed)
- **Real-time messaging** — WebSocket chat between students and tutors
- **Notifications** — async in-app notifications via BullMQ queue
- **Reviews** — post-session ratings
- **Soft delete** — data preservation across all entities
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

# Copy env file
cp .env.example .env.dev
# Fill in your values in .env.dev

# Start all services
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

Services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Swagger UI: http://localhost:3000/api

### Run locally (without Docker)

```bash
pnpm install

# Start Postgres and Redis (Docker)
docker compose -f docker-compose.dev.yml --env-file .env.dev up postgres redis -d

# Run migrations
cd apps/server
pnpm prisma:migrate

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
│   ├── server/          # NestJS API
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── messaging/
│   │   │   ├── notifications/
│   │   │   ├── reviews/
│   │   │   ├── tutors/
│   │   │   └── users/
│   │   └── prisma/
│   └── client/          # React SPA
│       └── src/
│           ├── api/
│           ├── components/
│           ├── hooks/
│           ├── pages/
│           ├── store/
│           └── types/
├── packages/
│   ├── eslint-config/
│   └── typescript-config/
└── docker-compose.dev.yml
```

## API Overview

| Module        | Endpoints                                                     |
| ------------- | ------------------------------------------------------------- |
| Auth          | POST /auth/register, /auth/login, /auth/refresh, /auth/logout |
| Users         | GET/PATCH /users/me, GET /users/:id                           |
| Tutors        | GET /tutors, POST /tutors/profile, POST /tutors/:id/approve   |
| Bookings      | GET/POST /bookings, PATCH /bookings/:id/status                |
| Messages      | GET /messages/conversations, POST /messages/conversation      |
| Reviews       | POST /reviews, GET /reviews/tutor/:tutorId                    |
| Notifications | GET /notifications, PATCH /notifications/:id/read             |

## Testing

```bash
# Server — unit tests
cd apps/server
pnpm run test

# Server — e2e tests
pnpm run test:e2e

# Client — unit tests
cd apps/client
pnpm run test:run
```

Current coverage: **117 server tests** + **20 client tests**

## Architecture

The backend follows a **modular monolith** pattern — each feature is a self-contained NestJS module with its own controller, service, and DTOs. Modules communicate only through injected services, never through direct database access. This makes each module independently extractable into a microservice if needed.
