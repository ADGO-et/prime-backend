const express = require("express");
const path = require("path");
const { prisma } = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { fileExists, streamFileToResponse } = require("../lib/storage");
const {
  toApiApplication,
  summarizeApplication,
  createAuditLog,
  buildOfficeUseUpdate,
} = require("../utils/kycHelpers");

const router = express.Router();

router.use(requireAuth);

const REVIEW_ROLES = ["compliance_officer", "admin", "super_admin"];

function safeFilename(raw) {
  return path.basename(raw || "").replace(/[^a-zA-Z0-9._-]/g, "");
}

/**
 * @swagger
 * /api/admin/documents/{filename}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a KYC document
 *     description: Retrieve a document (Fayda ID, Kebele ID, or driving license) by filename.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: The document filename
 *     responses:
 *       200:
 *         description: Document file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid filename
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/documents/:filename", async (req, res) => {
  try {
    const filename = safeFilename(req.params.filename);
    if (!filename) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const linked = await prisma.kycApplication.findFirst({
      where: {
        OR: [
          { faydaFront: filename },
          { faydaBack: filename },
          { kebeleId: filename },
          { drivingLicense: filename },
          { companyStamp: filename },
        ],
      },
      select: { id: true },
    });

    if (!linked) {
      return res.status(404).json({ error: "Document not found" });
    }

    const exists = await fileExists(filename);
    if (!exists) {
      return res.status(404).json({ error: "File missing in storage" });
    }

    await streamFileToResponse(filename, res);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message });
    }
    console.error("Document serve error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to load document" });
    }
  }
});

const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "revision_requested"];

/**
 * @swagger
 * /api/admin/applications:
 *   get:
 *     tags: [Admin]
 *     summary: List KYC applications
 *     description: Get a paginated list of KYC applications with optional filtering by status and search query.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, revision_requested, all]
 *         description: Filter by application status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by reference ID, name, email, or phone
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApplicationSummary'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch applications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/applications", async (req, res) => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { referenceId: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { fatherName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const [total, apps] = await Promise.all([
      prisma.kycApplication.count({ where }),
      prisma.kycApplication.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      data: apps.map(summarizeApplication),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error("List applications error:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/**
 * @swagger
 * /api/admin/applications/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get application details
 *     description: Get full details of a KYC application by ID or reference ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID or reference ID (e.g., KYC-250701-100001)
 *     responses:
 *       200:
 *         description: Application details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KycApplication'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/applications/:id", async (req, res) => {
  try {
    const app = await prisma.kycApplication.findFirst({
      where: {
        OR: [{ id: req.params.id }, { referenceId: req.params.id }],
      },
    });

    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(toApiApplication(app));
  } catch (err) {
    console.error("Get application error:", err);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

/**
 * @swagger
 * /api/admin/applications/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update application status
 *     description: Update the status of a KYC application. Requires compliance_officer, admin, or super_admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID or reference ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 application:
 *                   $ref: '#/components/schemas/KycApplication'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/applications/:id/status", requireRole(...REVIEW_ROLES), async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const reviewedBy = req.adminUser.name;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const existing = await prisma.kycApplication.findFirst({
      where: {
        OR: [{ id: req.params.id }, { referenceId: req.params.id }],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    const application = await prisma.kycApplication.update({
      where: { id: existing.id },
      data: {
        status,
        reviewNotes: reviewNotes ?? existing.reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    await createAuditLog(prisma, {
      action: "status_updated",
      referenceId: application.referenceId,
      previousStatus: existing.status,
      newStatus: status,
      reviewedBy: req.adminUser.email,
      notes: reviewNotes || "",
    });

    res.json({
      success: true,
      application: toApiApplication(application),
    });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/**
 * @swagger
 * /api/admin/applications/{id}/office:
 *   patch:
 *     tags: [Admin]
 *     summary: Update office-use fields
 *     description: Set account code and officer verification fields (prepared/approved/checked by). Requires compliance_officer, admin, or super_admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID or reference ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OfficeUseUpdateRequest'
 *     responses:
 *       200:
 *         description: Office fields updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 application:
 *                   $ref: '#/components/schemas/KycApplication'
 *       404:
 *         description: Application not found
 */
router.patch("/applications/:id/office", requireRole(...REVIEW_ROLES), async (req, res) => {
  try {
    const existing = await prisma.kycApplication.findFirst({
      where: {
        OR: [{ id: req.params.id }, { referenceId: req.params.id }],
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    const partial = buildOfficeUseUpdate(req.body);
    const data = { ...partial };

    if (partial.officeUse) {
      const current =
        existing.officeUse && typeof existing.officeUse === "object" ? existing.officeUse : {};
      data.officeUse = { ...current, ...partial.officeUse };
    }

    const application = await prisma.kycApplication.update({
      where: { id: existing.id },
      data,
    });

    await createAuditLog(prisma, {
      action: "office_fields_updated",
      referenceId: application.referenceId,
      reviewedBy: req.adminUser.email,
      notes: partial.accountCode ? `Account code: ${partial.accountCode}` : "",
    });

    res.json({
      success: true,
      application: toApiApplication(application),
    });
  } catch (err) {
    console.error("Update office fields error:", err);
    res.status(500).json({ error: "Failed to update office fields" });
  }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics
 *     description: Get aggregated statistics for the admin dashboard including application counts, rejection rate, and monthly volume forecast.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/stats", async (_req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, pending, underReview, approved, rejected, revisionRequested, monthlyApps] =
      await Promise.all([
        prisma.kycApplication.count(),
        prisma.kycApplication.count({ where: { status: "pending" } }),
        prisma.kycApplication.count({ where: { status: "under_review" } }),
        prisma.kycApplication.count({ where: { status: "approved" } }),
        prisma.kycApplication.count({ where: { status: "rejected" } }),
        prisma.kycApplication.count({ where: { status: "revision_requested" } }),
        prisma.kycApplication.findMany({
          where: { submittedAt: { gte: monthStart } },
          select: { stockMonthlyValue: true, fixedIncomeMonthlyValue: true },
        }),
      ]);

    const volumeMap = {
      under_100k: 50000,
      "100k_250k": 175000,
      "250k_500k": 375000,
      "500k_1m": 750000,
      "1m_5m": 3000000,
      "5m_10m": 7500000,
      over_10m: 15000000,
    };

    const monthlyVolume = monthlyApps.reduce((sum, app) => {
      const stock = volumeMap[app.stockMonthlyValue] || 0;
      const bond = volumeMap[app.fixedIncomeMonthlyValue] || 0;
      return sum + stock + bond;
    }, 0);

    res.json({
      total,
      pending,
      underReview,
      approved,
      rejected,
      revisionRequested,
      rejectionRate: total ? Math.round((rejected / total) * 100) : 0,
      monthlyApplications: monthlyApps.length,
      monthlyVolumeForecast: monthlyVolume,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * @swagger
 * /api/admin/audit-log:
 *   get:
 *     tags: [Admin]
 *     summary: Get audit log
 *     description: Retrieve the audit log of all actions performed on KYC applications.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of log entries to return
 *     responses:
 *       200:
 *         description: Audit log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch audit log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/audit-log", async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({
      data: logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        action: log.action,
        referenceId: log.referenceId,
        applicant: log.applicant,
        email: log.email,
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        reviewedBy: log.reviewedBy,
        notes: log.notes,
      })),
    });
  } catch (err) {
    console.error("Audit log error:", err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

module.exports = router;
