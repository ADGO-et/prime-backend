function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";

  if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is required");
    process.exit(1);
  }

  if (isProd) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      console.error("FATAL: JWT_SECRET must be set and at least 32 characters in production");
      process.exit(1);
    }

    if (secret === "change-this-to-a-long-random-secret-in-production" || secret.includes("dev-jwt")) {
      console.error("FATAL: JWT_SECRET must not use a default/dev value in production");
      process.exit(1);
    }
  }
}

module.exports = { validateEnv };
