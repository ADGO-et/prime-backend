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
} = require("../utils/kycHelpers");

const router = express.Router();

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
      applicant: `${application.firstName} ${application.fatherName}`,
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
