# DevOps Handoff — Prime Capital Backend

## Architecture

```
Public website  →  POST /api/kyc/submit     (public, rate-limited)
Admin portal    →  GET  /api/admin/*        (JWT required)
Admin portal    →  GET  /api/admin/documents/:key  (JWT + linked KYC record)
Backend         →  PostgreSQL (Prisma)
Backend         →  MinIO / S3 (private bucket, kyc/ prefix)
```

Documents are **never** served publicly. The API is the only client that reads/writes the bucket.

---

## What DevOps provisions

### 1. PostgreSQL

- Managed instance or self-hosted
- SSL in production: append `?sslmode=require` to `DATABASE_URL`
- Run migrations: `npm run prisma:deploy`

### 2. MinIO or AWS S3 (private bucket)

| Variable | Example (MinIO) | Example (AWS S3) |
|----------|-----------------|------------------|
| `S3_ENDPOINT` | `http://minio.internal:9000` | omit or `https://s3.amazonaws.com` |
| `S3_BUCKET` | `prime-capital-kyc-prod` | `prime-capital-kyc-prod` |
| `S3_ACCESS_KEY` | service account key | IAM access key |
| `S3_SECRET_KEY` | service account secret | IAM secret |
| `S3_REGION` | `us-east-1` | `eu-west-1` |
| `S3_FORCE_PATH_STYLE` | `true` (MinIO) | `false` |
| `S3_PREFIX` | `kyc` (optional) | `kyc` |

**Bucket policy:** deny all public access. Backend service account needs `PutObject`, `GetObject`, `HeadObject` on `kyc/*` only.

### 3. Backend service secrets

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<min 32 random chars>
CORS_ORIGINS=https://www.primecapital.et,https://admin.primecapital.et
S3_ENDPOINT=...
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

### 4. Network

- MinIO/Postgres on private network — not internet-facing
- Only the API server needs outbound/inbound to MinIO and Postgres
- TLS termination at load balancer / ingress

---

## Local dev stack (docker compose)

```bash
npm run db:up          # Postgres + MinIO
cp .env.example .env   # enable S3_* block for MinIO
npm run storage:init   # create bucket
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

MinIO console: http://localhost:9001 (minioadmin / minioadmin)

---

## Verify deployment

```bash
curl https://api.example.com/health
```

Expected:

```json
{
  "status": "ok",
  "database": "connected",
  "storage": { "mode": "s3", "bucket": "prime-capital-kyc-prod", ... }
}
```

`storage.mode` must be `"s3"` in production (not `"local"`).

---

## Application team responsibilities (done)

- [x] S3-compatible storage abstraction (`src/lib/storage.js`)
- [x] Public KYC submit uploads to bucket
- [x] Admin document route streams from bucket (JWT)
- [x] Local disk fallback when `S3_*` unset (dev only)
- [x] Health endpoint reports storage mode

## DevOps responsibilities

- [ ] Deploy MinIO or provision S3 bucket
- [ ] Create scoped IAM / service account
- [ ] Inject secrets into API deployment
- [ ] Backups & lifecycle for KYC bucket
- [ ] Monitoring & alerts
