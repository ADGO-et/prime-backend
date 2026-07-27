require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Prime Capital API Documentation",
}));
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

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
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
  }
  if (err.message && err.message.includes("Only PNG")) {
    return res.status(400).json({ error: err.message });
  }
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const server = app.listen(PORT, async () => {
  if (isS3Enabled()) {
    try {
      await ensureBucket();
      console.log(`Object storage: S3/MinIO -> ${process.env.S3_BUCKET}`);
    } catch (err) {
      console.error("S3 bucket check failed:", err.message);
    }
  } else {
    console.log("Object storage: local uploads/ (set S3_* env for MinIO/S3)");
  }
  console.log(`Prime Capital Backend API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    const { prisma } = require("./src/lib/prisma");
    prisma.$disconnect().then(() => {
      console.log("Database connection closed.");
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});
