require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { validateEnv } = require("./src/config/env");
const { getStorageInfo, ensureBucket, isS3Enabled } = require("./src/lib/storage");
const kycRoutes = require("./src/routes/kyc");
const adminRoutes = require("./src/routes/admin");
const authRoutes = require("./src/routes/auth");
const { loginLimiter, adminLimiter } = require("./src/middleware/rateLimit");

validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
).split(",");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: allowedOrigins.map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", async (_req, res) => {
  try {
    const { prisma } = require("./src/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "prime-capital-backend",
      database: "connected",
      storage: getStorageInfo(),
      port: PORT,
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      service: "prime-capital-backend",
      database: "disconnected",
      storage: getStorageInfo(),
    });
  }
});

app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, async () => {
  if (isS3Enabled()) {
    try {
      await ensureBucket();
      console.log(`Object storage: S3/MinIO → ${process.env.S3_BUCKET}`);
    } catch (err) {
      console.error("S3 bucket check failed:", err.message);
    }
  } else {
    console.log("Object storage: local uploads/ (set S3_* env for MinIO/S3)");
  }
  console.log(`Prime Capital Backend API running on http://localhost:${PORT}`);
});
