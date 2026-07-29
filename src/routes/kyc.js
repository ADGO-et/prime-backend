const express = require("express");
const { kycUploadFields } = require("../middleware/upload");
const { kycSubmitLimiter } = require("../middleware/rateLimit");
const { prisma } = require("../lib/prisma");
const { persistUploads } = require("../lib/storage");
const {
  buildApplicationData,
  validateApplication,
  generateReferenceId,
  createAuditLog,
  resolveApplicantName,
} = require("../utils/kycHelpers");

const router = express.Router();

/**
 * @swagger
 * /api/kyc/submit:
 *   post:
 *     tags: [KYC]
 *     summary: Submit a KYC application
 *     description: |
 *       Submit Individual, Corporate, or Joint account opening forms.
 *       Set `investorType` to `individual` (default), `corporate`, or `joint`.
 *       Send JSON/array fields (`investmentObjective`, `corporateContacts`, etc.) as JSON strings in multipart form data.
 *       File uploads: `faydaFront`, `faydaBack`, `kebeleId`, `drivingLicense`, `companyStamp`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/KycSubmitRequest'
 *     responses:
 *       201:
 *         description: KYC application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 referenceId:
 *                   type: string
 *                   example: "PC-KYC-100001"
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation errors
 *       500:
 *         description: Submission failed
 */
router.post("/submit", kycSubmitLimiter, kycUploadFields, async (req, res) => {
  try {
    const fileKeys = await persistUploads(req.files || {});
    const applicationData = buildApplicationData(req.body, fileKeys);
    const errors = validateApplication(applicationData);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const referenceId = await generateReferenceId(prisma);

    const application = await prisma.kycApplication.create({
      data: {
        referenceId,
        ...applicationData,
      },
    });

    await createAuditLog(prisma, {
      action: "kyc_submitted",
      referenceId,
      applicant: resolveApplicantName(application) || application.companyName,
      email: application.email,
    });

    res.status(201).json({
      success: true,
      referenceId,
      message: "KYC application submitted successfully",
    });
  } catch (err) {
    console.error("KYC submit error:", err);
    res.status(500).json({ success: false, error: err.message || "Submission failed" });
  }
});

module.exports = router;
