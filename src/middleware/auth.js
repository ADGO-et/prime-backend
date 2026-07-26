const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";

const ALLOWED_ROLES = ["compliance_officer", "admin", "super_admin"];

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = header.slice(7);
  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Account no longer valid" });
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    req.user = { sub: user.id, email: user.email, name: user.name, role: user.role };
    req.adminUser = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.adminUser || !roles.includes(req.adminUser.role)) {
      return res.status(403).json({ error: "You do not have permission for this action" });
    }
    next();
  };
}

module.exports = { signToken, requireAuth, requireRole, JWT_SECRET };
