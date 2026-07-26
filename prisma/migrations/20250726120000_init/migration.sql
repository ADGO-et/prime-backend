-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'revision_requested');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('compliance_officer', 'admin', 'super_admin');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'compliance_officer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycApplication" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "firstName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "grandfatherName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TEXT NOT NULL DEFAULT '',
    "age" TEXT NOT NULL DEFAULT '',
    "placeOfBirth" TEXT NOT NULL DEFAULT '',
    "nationality" TEXT NOT NULL DEFAULT '',
    "countryOfResidence" TEXT NOT NULL DEFAULT '',
    "tinNumber" TEXT NOT NULL DEFAULT '',
    "cityAdministration" TEXT NOT NULL DEFAULT '',
    "zone" TEXT NOT NULL DEFAULT '',
    "subCity" TEXT NOT NULL DEFAULT '',
    "woredaKebele" TEXT NOT NULL DEFAULT '',
    "houseNumber" TEXT NOT NULL DEFAULT '',
    "preferredContact" TEXT NOT NULL DEFAULT 'phone',
    "marketingCommunications" BOOLEAN NOT NULL DEFAULT false,
    "employmentStatus" TEXT NOT NULL DEFAULT '',
    "hasBeneficiary" BOOLEAN NOT NULL DEFAULT false,
    "beneficiaryName" TEXT NOT NULL DEFAULT '',
    "beneficiaryRelationship" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT '',
    "bankBranch" TEXT NOT NULL DEFAULT '',
    "accountNumber" TEXT NOT NULL DEFAULT '',
    "bankChangeAck" BOOLEAN NOT NULL DEFAULT false,
    "settlementOptions" JSONB NOT NULL DEFAULT '[]',
    "investorType" TEXT NOT NULL DEFAULT '',
    "faydaNumber" TEXT NOT NULL DEFAULT '',
    "faydaIssueDate" TEXT NOT NULL DEFAULT '',
    "faydaExpiryDate" TEXT NOT NULL DEFAULT '',
    "faydaFront" TEXT,
    "faydaBack" TEXT,
    "kebeleId" TEXT,
    "drivingLicense" TEXT,
    "publiclyTradedOwner" TEXT NOT NULL DEFAULT 'no',
    "publiclyTradedDetails" TEXT NOT NULL DEFAULT '',
    "brokerageEmployee" TEXT NOT NULL DEFAULT 'no',
    "brokerageEmployeeDetails" TEXT NOT NULL DEFAULT '',
    "sourceOfFunds" TEXT NOT NULL DEFAULT '',
    "sourceOfIncomeDetails" TEXT NOT NULL DEFAULT '',
    "annualNetIncome" TEXT NOT NULL DEFAULT '',
    "netWorth" TEXT NOT NULL DEFAULT '',
    "pepStatus" TEXT NOT NULL DEFAULT 'no',
    "pepDetails" TEXT NOT NULL DEFAULT '',
    "bankruptcyDisclosure" TEXT NOT NULL DEFAULT 'no',
    "bankruptcyDetails" TEXT NOT NULL DEFAULT '',
    "criminalRecord" TEXT NOT NULL DEFAULT 'no',
    "criminalRecordDetails" TEXT NOT NULL DEFAULT '',
    "riskTolerance" TEXT NOT NULL DEFAULT '',
    "stockExperience" TEXT NOT NULL DEFAULT '',
    "bondExperience" TEXT NOT NULL DEFAULT '',
    "stockMonthlyValue" TEXT NOT NULL DEFAULT '',
    "fixedIncomeMonthlyValue" TEXT NOT NULL DEFAULT '',
    "investmentObjective" JSONB NOT NULL DEFAULT '[]',
    "applicantName" TEXT NOT NULL DEFAULT '',
    "dateOfApplication" TEXT NOT NULL DEFAULT '',
    "submitConsent" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT NOT NULL DEFAULT '',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "referenceId" TEXT,
    "applicant" TEXT,
    "email" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "reviewedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycCounter" (
    "id" TEXT NOT NULL DEFAULT 'kyc',
    "value" INTEGER NOT NULL DEFAULT 100000,

    CONSTRAINT "KycCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KycApplication_referenceId_key" ON "KycApplication"("referenceId");

-- CreateIndex
CREATE INDEX "KycApplication_status_idx" ON "KycApplication"("status");

-- CreateIndex
CREATE INDEX "KycApplication_email_idx" ON "KycApplication"("email");

-- CreateIndex
CREATE INDEX "KycApplication_submittedAt_idx" ON "KycApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
