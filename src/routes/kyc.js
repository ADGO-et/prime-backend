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

/**
 * @swagger
 * /api/kyc/submit:
 *   post:
 *     tags: [KYC]
 *     summary: Submit a KYC application
 *     description: Submit a new Know Your Customer application with personal, financial, and identity document information.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - fatherName
 *               - phone
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the applicant
 *               fatherName:
 *                 type: string
 *                 description: Father's name
 *               grandfatherName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 description: Phone number
 *               email:
 *                 type: string
 *                 format: email
 *               dob:
 *                 type: string
 *                 description: Date of birth
 *               age:
 *                 type: string
 *               placeOfBirth:
 *                 type: string
 *               nationality:
 *                 type: string
 *               countryOfResidence:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               cityAdministration:
 *                 type: string
 *               zone:
 *                 type: string
 *               subCity:
 *                 type: string
 *               woredaKebele:
 *                 type: string
 *               houseNumber:
 *                 type: string
 *               preferredContact:
 *                 type: string
 *                 enum: [phone, email]
 *               employmentStatus:
 *                 type: string
 *               hasBeneficiary:
 *                 type: string
 *                 enum: [true, false]
 *               beneficiaryName:
 *                 type: string
 *               beneficiaryRelationship:
 *                 type: string
 *               bankName:
 *                 type: string
 *               bankBranch:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               investorType:
 *                 type: string
 *               faydaNumber:
 *                 type: string
 *               faydaIssueDate:
 *                 type: string
 *               faydaExpiryDate:
 *                 type: string
 *               sourceOfFunds:
 *                 type: string
 *               annualNetIncome:
 *                 type: string
 *               netWorth:
 *                 type: string
 *               riskTolerance:
 *                 type: string
 *               stockExperience:
 *                 type: string
 *               bondExperience:
 *                 type: string
 *               stockMonthlyValue:
 *                 type: string
 *               fixedIncomeMonthlyValue:
 *                 type: string
 *               pepStatus:
 *                 type: string
 *                 enum: [yes, no]
 *               bankruptcyDisclosure:
 *                 type: string
 *                 enum: [yes, no]
 *               criminalRecord:
 *                 type: string
 *                 enum: [yes, no]
 *               faydaFront:
 *                 type: string
 *                 format: binary
 *                 description: Fayda ID front image
 *               faydaBack:
 *                 type: string
 *                 format: binary
 *                 description: Fayda ID back image
 *               kebeleId:
 *                 type: string
 *                 format: binary
 *                 description: Kebele ID image
 *               drivingLicense:
 *                 type: string
 *                 format: binary
 *                 description: Driving license image
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
 *                   example: "KYC-250701-100001"
 *                 message:
 *                   type: string
 *                   example: "KYC application submitted successfully"
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Submission failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
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
