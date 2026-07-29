# Prime Capital Backend API

Node.js + Express + **PostgreSQL** + **Prisma** + JWT auth.

Supports **Individual**, **Corporate**, and **Joint** KYC account opening forms, plus **Trade Order** receiving.

## Quick Start

### 1. Start PostgreSQL

```bash
npm run db:up
```

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Install & migrate

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
```

### 4. Run API

```bash
npm run dev
```

Server: **http://localhost:5000**  
Swagger: **http://localhost:5000/api-docs**

## Default admin login

| Field | Value |
|-------|-------|
| Email | `compliance@primecapital.et` |
| Password | `Admin@12345` |

Change via `ADMIN_SEED_*` in `.env` before seeding.

## Stack

| Layer | Technology |
|-------|------------|
| API | Express 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + bcrypt (admin routes protected) |
| Uploads | Multer → **MinIO/S3** (or local `uploads/` in dev) |

## Object storage

- **Dev (no S3 env):** files in `uploads/`
- **Prod / MinIO:** set `S3_*` in `.env` — see **[docs/DEVOPS.md](docs/DEVOPS.md)**

```bash
npm run db:up          # Postgres + MinIO
# Uncomment S3_* in .env, then:
npm run storage:init
curl http://localhost:5000/health   # storage.mode: "s3"
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Admin login |
| GET | `/api/auth/me` | JWT | Current admin user |
| POST | `/api/kyc/submit` | Public | Submit KYC (Individual / Corporate / Joint) |
| POST | `/api/orders/submit` | Public | Submit trade order |
| GET | `/api/admin/orders` | JWT | List trade orders |
| GET | `/api/admin/orders/:id` | JWT | Get trade order |
| PATCH | `/api/admin/orders/:id/status` | JWT | Accept / reject order |
| GET | `/api/admin/applications` | JWT | List KYC applications |
| GET | `/api/admin/applications/:id` | JWT | Get KYC application |
| GET | `/api/admin/applications/:id/email-link` | JWT | Get a mailto link for the applicant |
| PATCH | `/api/admin/applications/:id/status` | JWT | Update KYC status |
| PATCH | `/api/admin/applications/:id/office` | JWT | Set account code & officer fields |
| GET | `/api/admin/documents/:filename` | JWT | Download KYC document |
| GET | `/api/admin/stats` | JWT | Dashboard stats |
| GET | `/api/admin/audit-log` | JWT | Audit log |
| GET | `/health` | Public | Health check |
| GET | `/api-docs` | Public | Swagger UI |

## KYC form types

Set `investorType` on submit:

- `individual` — personal account opening form (default)
- `corporate` — company account opening form
- `joint` — joint account opening form (two holders)

Full field mapping: **[docs/KYC_FIELDS.md](docs/KYC_FIELDS.md)**

## Security (production)

- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET` (32+ chars, random)
- Lock `CORS_ORIGINS` to your real domains
- Run Postgres with SSL (`?sslmode=require` on DATABASE_URL)
- Change seed admin password; do not re-run seed in prod

## Protected documents

KYC files are **not** publicly served. Admins fetch via:

`GET /api/admin/documents/:filename` (JWT required)

Supported document types: Fayda front/back, Kebele ID, driving license, company stamp.
