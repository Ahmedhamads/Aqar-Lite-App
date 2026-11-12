# Aqar Lite

### Modern Real Estate Management Platform

Aqar Lite is a full-stack real estate management platform designed to help real estate companies manage their operations through a centralized, secure, and user-friendly application.

The platform provides tools for managing property units, clients, reservations, contracts, installments, payments, users, and audit logs.

It follows a modular architecture with a Next.js frontend, an Express REST API, and a PostgreSQL database powered by Prisma ORM.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Getting Started](#5-getting-started)
6. [Environment Configuration](#6-environment-configuration)
7. [Demo Accounts](#7-demo-accounts)
8. [Application Modules](#8-application-modules)
9. [Technical Decisions](#9-technical-decisions)
10. [Business Assumptions](#10-business-assumptions)
11. [Security Considerations](#11-security-considerations)
12. [Database and Migrations](#12-database-and-migrations)
13. [Testing and Quality](#13-testing-and-quality)
14. [Known Limitations and Future Improvements](#14-known-limitations-and-future-improvements)
15. [AI Tools Disclosure](#15-ai-tools-disclosure)
16. [Troubleshooting](#16-troubleshooting)
17. [License](#17-license)

---

## 1. Project Overview

Aqar Lite aims to simplify real estate business operations by bringing essential management workflows into one application.

The system is designed around company-scoped data access, allowing business data to remain isolated between companies.

The application uses three primary layers:

- **Frontend:** A responsive web application built with Next.js and React.
- **Backend:** A RESTful API built with Node.js, Express, and TypeScript.
- **Database:** PostgreSQL with Prisma ORM.

Docker Compose is used to simplify application setup and provide a consistent development environment.

---

## 2. Features

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
- Financial workflow management.

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

## 3. Technology Stack

| Layer              | Technology                    |
| ------------------ | ----------------------------- |
| Frontend Framework | Next.js                       |
| UI Library         | React                         |
| Frontend Language  | TypeScript                    |
| Styling            | Tailwind CSS                  |
| Backend Runtime    | Node.js                       |
| Backend Framework  | Express.js                    |
| Backend Language   | TypeScript                    |
| Database           | PostgreSQL                    |
| ORM                | Prisma                        |
| Validation         | Zod                           |
| Authentication     | Session-based authentication  |
| Security           | Helmet, CORS, CSRF protection |
| Containerization   | Docker                        |
| Orchestration      | Docker Compose                |
| Package Manager    | npm                           |

---

## 4. Architecture

The repository follows a separated frontend/backend architecture.

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
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### Request Flow

```text
User Browser
     |
     v
Next.js Frontend
     |
     v
Express REST API
     |
     v
Authentication / Authorization
     |
     v
Business Logic Modules
     |
     v
Prisma ORM
     |
     v
PostgreSQL Database
```

The backend is organized into modules to separate business responsibilities and make the application easier to maintain and extend.

---

## 5. Getting Started

### Prerequisites

For Docker-based execution:

- Git
- Docker Desktop
- Docker Compose

Docker Desktop includes Docker Compose.

No local Node.js or PostgreSQL installation is required when using the Docker setup.

### 5.1 Clone the Repository

```bash
git clone <YOUR_PRIVATE_REPOSITORY_URL>
cd Aqar-Lite-App
```

### 5.2 Configure Environment Variables

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

Generate a strong random session secret and use a unique database password.

Do not commit real environment variables or credentials to the repository.

### 5.3 Start the Application

Run the following command from the repository root:

```bash
docker compose up --build -d
```

Docker Compose will:

1. Build the backend image.
2. Build the frontend image.
3. Start PostgreSQL.
4. Wait until PostgreSQL becomes healthy.
5. Execute pending Prisma migrations.
6. Start the backend after successful migrations.
7. Start the frontend after the backend becomes healthy.

### 5.4 Verify the Containers

```bash
docker compose ps
```

Check the application logs:

```bash
docker compose logs -f
```

For individual services:

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f migrate
```

### 5.5 Access the Application

| Service      | URL                                 |
| ------------ | ----------------------------------- |
| Frontend     | http://localhost:3000               |
| Backend API  | http://localhost:4000               |
| Health Check | http://localhost:4000/api/v1/health |
| PostgreSQL   | localhost:5434                      |

### 5.6 Stop the Application

```bash
docker compose down
```

This stops and removes the containers while preserving the database volume.

To remove the database volume as well:

```bash
docker compose down -v
```

**Warning:** This deletes the persistent PostgreSQL data.

---

## 6. Environment Configuration

The root `.env` file is used by Docker Compose.

| Variable            | Description                 | Default      |
| ------------------- | --------------------------- | ------------ |
| `NODE_ENV`          | Application environment     | development  |
| `FRONTEND_PORT`     | Frontend host port          | 3000         |
| `BACKEND_PORT`      | Backend host port           | 4000         |
| `API_PREFIX`        | Backend API prefix          | /api/v1      |
| `POSTGRES_DB`       | Database name               | Required     |
| `POSTGRES_USER`     | Database username           | Required     |
| `POSTGRES_PASSWORD` | Database password           | Required     |
| `POSTGRES_PORT`     | PostgreSQL host port        | 5434         |
| `SESSION_SECRET`    | Session signing secret      | Required     |
| `SESSION_TTL_HOURS` | Session lifetime            | 24           |
| `COOKIE_NAME`       | Session cookie name         | aqar_session |
| `COOKIE_SECURE`     | Secure cookie configuration | false        |
| `COOKIE_SAME_SITE`  | SameSite cookie policy      | lax          |

### Database Connection

Inside Docker, the backend connects to PostgreSQL using the Compose service hostname:

```text
postgresql://USER:PASSWORD@db:5432/DATABASE
```

The frontend browser communicates with the backend using:

```text
http://localhost:4000/api/v1
```

These addresses are intentionally different because containers communicate through the Docker network, while the browser communicates through published host ports.

---

## 7. Demo Accounts

Demo accounts should be created through the project's seed process.

The application defines the following roles:

| Role       | Intended Responsibility               | Demo Account  |
| ---------- | ------------------------------------- | ------------- |
| MANAGER    | Company management and administration | [VERIFY SEED] |
| ACCOUNTANT | Financial and accounting operations   | [VERIFY SEED] |
| SALES      | Sales and customer-related operations | [VERIFY SEED] |

**Important:** Actual usernames, passwords, and seed instructions must be taken from `backend/prisma/seed.ts`.

Do not use production credentials as demo credentials.

If seed accounts are not automatically created during Docker startup, document the exact seed command and add the required seed execution step before submission.

---

## 8. Application Modules

### Dashboard

Provides an overview of important business information and operational activity.

### Units

Handles real estate unit records and their availability/status information.

### Clients

Manages client information and related business records.

### Reservations

Handles reservation workflows and their associated unit and client information.

### Contracts

Manages contract records and their relationships with reservations and clients.

### Installments

Tracks installment records and payment status.

### Payments

Manages payment records and their allocations to financial obligations.

### Users

Provides company user management and role-based access control.

### Audit Logs

Records important application activities to support accountability and operational tracking.

---

## 9. Technical Decisions

This section documents the main architectural and implementation decisions.

### 9.1 Next.js for the Frontend

**Decision:** Use Next.js with React and TypeScript.

**Reason:**

- Provides a structured application architecture.
- Supports file-based routing.
- Integrates well with React.
- Supports production builds and optimized rendering.
- TypeScript improves maintainability and catches many errors during development.

**Alternative considered:** A standalone React application using Vite.

**Why it was not selected:** Next.js provides an integrated application framework and routing system that fits the project's frontend requirements.

### 9.2 Express.js for the Backend

**Decision:** Use Express.js with TypeScript.

**Reason:**

- Lightweight and flexible.
- Supports modular API development.
- Provides middleware-based request processing.
- Allows clear separation between routes, controllers, services, and repositories.

**Alternative considered:** NestJS.

**Why it was not selected:** Express provides a simpler foundation without introducing additional framework conventions for the current project scope.

### 9.3 PostgreSQL and Prisma

**Decision:** Use PostgreSQL with Prisma ORM.

**Reason:**

- PostgreSQL provides relational data integrity.
- Foreign keys support relationships between business entities.
- Transactions help protect multi-step financial operations.
- Prisma provides type-safe database access and migration management.

**Alternative considered:** MongoDB.

**Why it was not selected:** The application's business data is highly relational, particularly contracts, payments, installments, users, and reservations.

### 9.4 Modular Backend Architecture

**Decision:** Organize the backend into business modules.

**Reason:**

- Separates responsibilities.
- Reduces unnecessary coupling.
- Makes the code easier to test and maintain.
- Supports future feature expansion.

**Alternative considered:** A single large controller/service structure.

**Why it was not selected:** A modular structure provides better maintainability as the number of business features grows.

### 9.5 Docker Compose

**Decision:** Use Docker Compose to orchestrate PostgreSQL, backend, frontend, and database migrations.

**Reason:**

- Simplifies onboarding.
- Provides a consistent development environment.
- Reduces machine-specific configuration problems.
- Makes the application easier to reproduce on a clean machine.

**Alternative considered:** Manual installation and startup of each dependency.

**Why it was not selected:** Manual setup introduces more steps and increases the possibility of environment inconsistencies.

---

## 10. Business Assumptions

The following assumptions guide the implementation of business workflows.

These assumptions should be reviewed against the final business requirements.

### 10.1 Company Data Isolation

Each company owns its business records.

Users should only access records belonging to their authorized company.

**Reason:** Prevents one company from accessing another company's business information.

### 10.2 User Roles

The application defines three primary roles:

- `MANAGER`
- `ACCOUNTANT`
- `SALES`

Permissions are enforced by backend authorization logic rather than relying only on frontend visibility.

### 10.3 Unit Availability

Unit status is used to represent its current business availability.

Reservation and contract workflows must respect valid unit status transitions.

**[VERIFY]** Document the exact allowed status transitions implemented in the backend.

### 10.4 Reservations and Contracts

Reservations and contracts represent different stages of the real estate sales process.

A reservation is not automatically considered a completed contract.

**[VERIFY]** Document the exact conditions under which a reservation can be converted into a contract.

### 10.5 Installments and Payments

Installments represent financial obligations, while payments represent received amounts.

Payment allocations associate received payments with their relevant financial obligations.

**[VERIFY]** Document the exact rules for partial payments, overpayments, refunds, and installment status updates.

### 10.6 Audit Logging

Important business operations should produce audit records.

Audit logs support accountability and help administrators investigate changes.

**[VERIFY]** Document which operations currently create audit records.

---

## 11. Security Considerations

Security is important because the platform manages company data, user accounts, contracts, and financial records.

The following are three important risks and their mitigations.

### Risk 1: Unauthorized Access to Company Data

**Threat:** A user may attempt to access records belonging to another company.

**Mitigation:**

- Company-scoped backend data access.
- Authentication middleware.
- Role-based authorization.
- Server-side ownership and permission checks.

**Remaining consideration:** All endpoints must be reviewed to ensure tenant isolation is consistently applied.

### Risk 2: Session and Request Forgery Attacks

**Threat:** Unauthorized requests may attempt to use an authenticated session.

**Mitigation:**

- Session-based authentication.
- CSRF protection.
- Cookie configuration.
- CORS origin restrictions.
- HTTP security headers through Helmet.

**Production consideration:** HTTPS and secure cookie settings must be enabled in production.

### Risk 3: Exposure of Credentials and Sensitive Configuration

**Threat:** Database passwords, session secrets, or other sensitive configuration may be exposed.

**Mitigation:**

- Environment-based configuration.
- Keeping `.env` files out of version control.
- Using strong random secrets.
- Avoiding hardcoded credentials in source code.

**Production consideration:** Use a dedicated secret-management solution and rotate credentials when necessary.

---

## 12. Database and Migrations

The application uses PostgreSQL and Prisma ORM.

### Prisma Schema

```text
backend/prisma/schema.prisma
```

### Migration Directory

```text
backend/prisma/migrations/
```

### Generate Prisma Client

From the backend directory:

```bash
npx prisma generate
```

### Create a Development Migration

```bash
npx prisma migrate dev --name migration_name
```

### Deploy Existing Migrations

```bash
npm run db:migrate:deploy
```

When using Docker Compose, the migration service applies pending migrations before the backend starts.

---

## 13. Testing and Quality

The project uses TypeScript for static type checking and Vitest for backend testing.

### Backend Type Checking

```bash
cd backend
npm run typecheck
```

### Backend Tests

```bash
npm test
```

### Frontend Linting

```bash
cd frontend
npm run lint
```

### Production Build

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

### Docker Verification

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

**Submission requirement:** Verify that a fresh clone can start successfully using the documented Docker command before submitting the repository.

---

## 14. Known Limitations and Future Improvements

The following items should be treated as future work unless already implemented and tested.

| Area                | Potential Improvement                                            |
| ------------------- | ---------------------------------------------------------------- |
| Automated Testing   | Expand unit, integration, and end-to-end test coverage           |
| Authorization       | Perform a comprehensive permission review for every API endpoint |
| Financial Workflows | Add more comprehensive validation and edge-case testing          |
| Reporting           | Introduce advanced financial and operational reports             |
| Notifications       | Add email and in-app notifications                               |
| File Management     | Add secure document and attachment storage                       |
| Deployment          | Add a production deployment pipeline                             |
| Monitoring          | Add centralized logging and application monitoring               |
| Backups             | Automate database backups and recovery testing                   |
| API Documentation   | Publish complete API documentation                               |

This list is not a claim that every item is missing. The final submission should distinguish implemented features from genuinely unfinished work.

---

## 15. AI Tools Disclosure

AI-assisted development tools were used as supporting tools during development.

### Usage Areas

AI assistance was used for:

- Discussing application architecture and implementation approaches.
- Reviewing TypeScript errors and troubleshooting.
- Improving code structure and maintainability.
- Reviewing Docker and Docker Compose configuration.
- Drafting and organizing technical documentation.
- Explaining implementation details and suggesting possible improvements.

### Developer Responsibility

AI-generated suggestions were reviewed and adapted during implementation.

The developer remains responsible for:

- Understanding the submitted code.
- Verifying application behavior.
- Testing the implementation.
- Reviewing security decisions.
- Maintaining and extending the application.

AI tools were used as development assistance, not as a replacement for understanding or validating the system.

---

## 16. Troubleshooting

### Containers Are Not Starting

```bash
docker compose ps
docker compose logs -f
```

### Database Connection Problems

Verify:

- PostgreSQL is healthy.
- Database credentials are correct.
- The internal hostname is `db`.
- The internal PostgreSQL port is `5432`.
- The database name matches `POSTGRES_DB`.

### Migration Errors

```bash
docker compose logs migrate
```

Verify that migration files exist and the database connection is configured correctly.

### Port Conflicts

If ports `3000`, `4000`, or `5434` are occupied, change the corresponding values in the root `.env` file.

### Rebuild the Application

```bash
docker compose up --build -d
```

---

## 17. License

No license has been specified yet.

A suitable license should be added before public distribution.

---

**Aqar Lite — Real Estate Management Made Simpler.**
