# Aqar Lite

**A Modern Real Estate Management Platform**

Aqar Lite is a full-stack real estate management application designed to help real estate companies manage their daily operations through a centralized platform.

It provides tools for managing properties, clients, reservations, contracts, installments, payments, users, and audit logs, with a tenant-aware backend architecture.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Getting Started with Docker](#getting-started-with-docker)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Available Scripts](#available-scripts)
- [Application URLs](#application-urls)
- [User Roles](#user-roles)
- [Database and Migrations](#database-and-migrations)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [License](#license)

---

## Overview

Aqar Lite aims to simplify real estate business operations by bringing essential management workflows into one application.

The system follows a separated frontend/backend architecture:

- **Frontend:** A responsive web application built with Next.js and React.
- **Backend:** A RESTful API built with Node.js, Express, and TypeScript.
- **Database:** PostgreSQL with Prisma ORM.
- **Infrastructure:** Docker and Docker Compose for containerized development and deployment.

The backend uses company-scoped data access to support a multi-tenant architecture.

---

## Features

### Real Estate Management

- Property unit management.
- Unit status tracking.
- Client management.
- Reservation management.
- Contract management.

### Financial Management

- Installment management.
- Payment tracking.
- Payment allocations.
- Financial workflow support.

### User and Access Management

- User management.
- Role-based access control.
- Session-based authentication.
- CSRF protection.
- Company-scoped data access.

### Monitoring and Administration

- Dashboard overview.
- Audit logs.
- Application health endpoint.

### Internationalization

- Language management and localization support.

---

## Technology Stack

| Layer            | Technologies                    |
| ---------------- | ------------------------------- |
| Frontend         | Next.js, React, TypeScript      |
| Styling          | Tailwind CSS                    |
| Backend          | Node.js, Express.js, TypeScript |
| Database         | PostgreSQL                      |
| ORM              | Prisma                          |
| Validation       | Zod                             |
| Authentication   | Session-based authentication    |
| Security         | Helmet, CORS, CSRF protection   |
| Containerization | Docker, Docker Compose          |
| Package Manager  | npm                             |

---

## Project Architecture

The repository is organized into separate frontend and backend applications.

```text
Aqar-Lite-App/
│
├── frontend/
│   ├── app/
│   ├── features/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── modules/
│   │   ├── shared/
│   │   ├── generated/
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── prisma.config.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

## Prerequisites

### Docker Setup

To run the complete application using Docker, install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Docker Compose (included with Docker Desktop)

### Local Development Setup

For running services individually, install:

- Node.js 24 or compatible version.
- npm.
- PostgreSQL 17.

---

## Getting Started with Docker

Docker Compose is the recommended way to start the complete application.

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Aqar-Lite-App
```

### 2. Configure environment variables

Create a `.env` file in the project root.

Use the following template:

```env
# Application
NODE_ENV=development

# Frontend
FRONTEND_PORT=3000

# Backend
BACKEND_PORT=4000
API_PREFIX=/api/v1

# PostgreSQL
POSTGRES_DB=aqar_lite
POSTGRES_USER=aqar_admin
POSTGRES_PASSWORD=YOUR_DATABASE_PASSWORD
POSTGRES_PORT=5434

# Authentication
SESSION_SECRET=YOUR_LONG_RANDOM_SECRET

# Session Configuration
SESSION_TTL_HOURS=24
COOKIE_NAME=aqar_session
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

Use your own strong credentials. Do not commit real secrets to Git.

### 3. Start the complete application

Run this single command from the project root:

```bash
docker compose up --build -d
```

Docker Compose will:

1. Build the backend image.
2. Build the frontend image.
3. Start PostgreSQL.
4. Wait for the database health check.
5. Execute pending Prisma migrations.
6. Start the backend after successful migrations.
7. Start the frontend after the backend becomes healthy.

### 4. Verify running containers

```bash
docker compose ps
```

### 5. View application logs

```bash
docker compose logs -f
```

To view logs for a specific service:

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f migrate
```

### 6. Stop the application

```bash
docker compose down
```

This stops and removes the containers while preserving the PostgreSQL volume.

To remove the database volume as well, use:

```bash
docker compose down -v
```

**Warning:** This permanently deletes the database data stored in that Docker volume.

---

## Environment Configuration

The application uses environment variables to configure its services.

### Root `.env`

The root `.env` file is used by Docker Compose.

| Variable            | Description               | Default        |
| ------------------- | ------------------------- | -------------- |
| `NODE_ENV`          | Application environment   | `development`  |
| `FRONTEND_PORT`     | Frontend host port        | `3000`         |
| `BACKEND_PORT`      | Backend host port         | `4000`         |
| `API_PREFIX`        | Backend API prefix        | `/api/v1`      |
| `POSTGRES_DB`       | PostgreSQL database name  | Required       |
| `POSTGRES_USER`     | PostgreSQL username       | Required       |
| `POSTGRES_PASSWORD` | PostgreSQL password       | Required       |
| `POSTGRES_PORT`     | PostgreSQL host port      | `5434`         |
| `SESSION_SECRET`    | Session signing secret    | Required       |
| `SESSION_TTL_HOURS` | Session lifetime in hours | `24`           |
| `COOKIE_NAME`       | Session cookie name       | `aqar_session` |
| `COOKIE_SECURE`     | Secure cookie setting     | `false`        |
| `COOKIE_SAME_SITE`  | SameSite cookie policy    | `lax`          |

The Docker Compose configuration constructs the internal database connection using the PostgreSQL service hostname:

```text
postgresql://USER:PASSWORD@db:5432/DATABASE
```

The frontend browser communicates with the backend through the host address:

```text
http://localhost:4000/api/v1
```

---

## Local Development

You can also run the frontend and backend independently without Docker.

### Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a local `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=4000
API_PREFIX=/api/v1

DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5434/aqar_lite

SESSION_SECRET=YOUR_LONG_RANDOM_SECRET
SESSION_TTL_HOURS=24

COOKIE_NAME=aqar_session
CSRF_COOKIE_NAME=aqar_csrf
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

CORS_ORIGIN=http://localhost:3000
```

Make sure PostgreSQL is running and the database exists.

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Start the backend development server:

```bash
npm run dev
```

The backend will be available at:

```text
http://localhost:4000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

## Available Scripts

### Backend

| Command                     | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `npm run dev`               | Start the development server with file watching |
| `npm run build`             | Generate Prisma Client and compile TypeScript   |
| `npm start`                 | Start the compiled production server            |
| `npm run typecheck`         | Run TypeScript type checking                    |
| `npm test`                  | Execute the Vitest test suite                   |
| `npm run db:migrate:deploy` | Apply pending production migrations             |

### Frontend

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Next.js development server |
| `npm run build` | Build the production application     |
| `npm run start` | Start the Next.js production server  |
| `npm run lint`  | Run ESLint                           |

---

## Application URLs

When running with the default Docker configuration:

| Service              | URL                                 |
| -------------------- | ----------------------------------- |
| Frontend             | http://localhost:3000               |
| Backend API          | http://localhost:4000               |
| Backend Health Check | http://localhost:4000/api/v1/health |
| PostgreSQL           | `localhost:5434`                    |

The PostgreSQL service is bound to localhost and is not exposed publicly by the default Compose configuration.

---

## User Roles

The backend defines the following application roles:

| Role         | Description                                      |
| ------------ | ------------------------------------------------ |
| `MANAGER`    | Company management and administrative operations |
| `ACCOUNTANT` | Financial and accounting workflows               |
| `SALES`      | Sales and customer-related workflows             |

Actual permissions are enforced by the backend authorization logic.

---

## Database and Migrations

Aqar Lite uses PostgreSQL with Prisma ORM.

The Prisma schema is located at:

```text
backend/prisma/schema.prisma
```

Migration files are stored in:

```text
backend/prisma/migrations/
```

### Create a development migration

From the backend directory:

```bash
npx prisma migrate dev --name migration_name
```

### Apply production migrations

```bash
npm run db:migrate:deploy
```

### Generate Prisma Client

```bash
npx prisma generate
```

When using Docker Compose, the `migrate` service applies pending migrations before the backend starts.

---

## Troubleshooting

### Containers are not starting

Check their status:

```bash
docker compose ps
```

Inspect the logs:

```bash
docker compose logs -f
```

### Database connection errors

Verify that:

- The PostgreSQL container is healthy.
- The database credentials are correct.
- The backend uses `db:5432` as its database host inside Docker.
- The database name matches `POSTGRES_DB`.

### Port already in use

If ports `3000`, `4000`, or `5434` are already occupied, update the corresponding port variables in the root `.env` file.

### Prisma migration errors

Inspect migration logs:

```bash
docker compose logs migrate
```

Verify that migration files exist under `backend/prisma/migrations/` and that the database connection is configured correctly.

### Rebuild containers

To rebuild images after changing application code or Docker configuration:

```bash
docker compose up --build -d
```

---

## Security Notes

- Never commit `.env`, `.env.local`, or other files containing real credentials.
- Use strong, randomly generated session secrets.
- Use HTTPS and secure cookies in production.
- Configure CORS with trusted origins only.
- Do not expose PostgreSQL publicly unless there is a specific operational requirement.
- Review authorization rules before deploying to production.
- Back up PostgreSQL data regularly.
- Use production-specific environment variables and deployment settings.

---

## License

No license has been specified yet.

If you intend to distribute this project publicly, add an appropriate `LICENSE` file to the repository.

---

**Aqar Lite — Real Estate Management Made Simpler.**
