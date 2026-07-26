function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseBool(value) {
  return value === true || value === "true" || value === "1";
}

function buildApplicationData(body, fileKeys = {}) {
  return {
    firstName: body.firstName || "",
    fatherName: body.fatherName || "",
    grandfatherName: body.grandfatherName || "",
    phone: body.phone || "",
    email: body.email || "",
    dob: body.dob || "",
    age: body.age || "",
    placeOfBirth: body.placeOfBirth || "",
    nationality: body.nationality || "",
    countryOfResidence: body.countryOfResidence || "",
    tinNumber: body.tinNumber || "",

    cityAdministration: body.cityAdministration || "",
    zone: body.zone || "",
    subCity: body.subCity || "",
    woredaKebele: body.woredaKebele || "",
    houseNumber: body.houseNumber || "",
    preferredContact: body.preferredContact || "phone",
    marketingCommunications: parseBool(body.marketingCommunications),

    employmentStatus: body.employmentStatus || "",

    hasBeneficiary: parseBool(body.hasBeneficiary),
    beneficiaryName: body.beneficiaryName || "",
    beneficiaryRelationship: body.beneficiaryRelationship || "",

    bankName: body.bankName || "",
    bankBranch: body.bankBranch || "",
    accountNumber: body.accountNumber || "",
    bankChangeAck: parseBool(body.bankChangeAck),
    settlementOptions: parseJsonField(body.settlementOptions, []),

    investorType: body.investorType || "",
    faydaNumber: body.faydaNumber || "",
    faydaIssueDate: body.faydaIssueDate || "",
    faydaExpiryDate: body.faydaExpiryDate || "",
    faydaFront: fileKeys.faydaFront || null,
    faydaBack: fileKeys.faydaBack || null,
    kebeleId: fileKeys.kebeleId || null,
    drivingLicense: fileKeys.drivingLicense || null,

    publiclyTradedOwner: body.publiclyTradedOwner || "no",
    publiclyTradedDetails: body.publiclyTradedDetails || "",
    brokerageEmployee: body.brokerageEmployee || "no",
    brokerageEmployeeDetails: body.brokerageEmployeeDetails || "",

    sourceOfFunds: body.sourceOfFunds || "",
    sourceOfIncomeDetails: body.sourceOfIncomeDetails || "",
    annualNetIncome: body.annualNetIncome || "",
    netWorth: body.netWorth || "",

    pepStatus: body.pepStatus || "no",
    pepDetails: body.pepDetails || "",

    bankruptcyDisclosure: body.bankruptcyDisclosure || "no",
    bankruptcyDetails: body.bankruptcyDetails || "",

    criminalRecord: body.criminalRecord || "no",
    criminalRecordDetails: body.criminalRecordDetails || "",

    riskTolerance: body.riskTolerance || "",

    stockExperience: body.stockExperience || "",
    bondExperience: body.bondExperience || "",
    stockMonthlyValue: body.stockMonthlyValue || "",
    fixedIncomeMonthlyValue: body.fixedIncomeMonthlyValue || "",

    investmentObjective: parseJsonField(body.investmentObjective, []),

    applicantName: body.applicantName || "",
    dateOfApplication: body.dateOfApplication || "",
    submitConsent: parseBool(body.submitConsent),
  };
}

function validateApplication(data) {
  const errors = [];

  if (!data.firstName?.trim()) errors.push("First name is required");
  if (!data.email?.trim()) errors.push("Email is required");
  if (!data.phone?.trim()) errors.push("Phone is required");
  if (!data.faydaNumber?.trim()) errors.push("Fayda number is required");
  if (!data.faydaFront) errors.push("Fayda front document is required");
  if (!data.faydaBack) errors.push("Fayda back document is required");
  if (!data.kebeleId && !data.drivingLicense) {
    errors.push("Either Kebele ID or Driving License is required");
  }
  if (!data.submitConsent) errors.push("Declaration consent is required");

  return errors;
}

function toApiApplication(app) {
  return {
    id: app.id,
    referenceId: app.referenceId,
    status: app.status,
    firstName: app.firstName,
    fatherName: app.fatherName,
    grandfatherName: app.grandfatherName,
    phone: app.phone,
    email: app.email,
    dob: app.dob,
    age: app.age,
    placeOfBirth: app.placeOfBirth,
    nationality: app.nationality,
    countryOfResidence: app.countryOfResidence,
    tinNumber: app.tinNumber,
    cityAdministration: app.cityAdministration,
    zone: app.zone,
    subCity: app.subCity,
    woredaKebele: app.woredaKebele,
    houseNumber: app.houseNumber,
    preferredContact: app.preferredContact,
    marketingCommunications: app.marketingCommunications,
    employmentStatus: app.employmentStatus,
    hasBeneficiary: app.hasBeneficiary,
    beneficiaryName: app.beneficiaryName,
    beneficiaryRelationship: app.beneficiaryRelationship,
    bankName: app.bankName,
    bankBranch: app.bankBranch,
    accountNumber: app.accountNumber,
    bankChangeAck: app.bankChangeAck,
    settlementOptions: app.settlementOptions,
    investorType: app.investorType,
    faydaNumber: app.faydaNumber,
    faydaIssueDate: app.faydaIssueDate,
    faydaExpiryDate: app.faydaExpiryDate,
    documents: {
      faydaFront: app.faydaFront,
      faydaBack: app.faydaBack,
      kebeleId: app.kebeleId,
      drivingLicense: app.drivingLicense,
    },
    publiclyTradedOwner: app.publiclyTradedOwner,
    publiclyTradedDetails: app.publiclyTradedDetails,
    brokerageEmployee: app.brokerageEmployee,
    brokerageEmployeeDetails: app.brokerageEmployeeDetails,
    sourceOfFunds: app.sourceOfFunds,
    sourceOfIncomeDetails: app.sourceOfIncomeDetails,
    annualNetIncome: app.annualNetIncome,
    netWorth: app.netWorth,
    pepStatus: app.pepStatus,
    pepDetails: app.pepDetails,
    bankruptcyDisclosure: app.bankruptcyDisclosure,
    bankruptcyDetails: app.bankruptcyDetails,
    criminalRecord: app.criminalRecord,
    criminalRecordDetails: app.criminalRecordDetails,
    riskTolerance: app.riskTolerance,
    stockExperience: app.stockExperience,
    bondExperience: app.bondExperience,
    stockMonthlyValue: app.stockMonthlyValue,
    fixedIncomeMonthlyValue: app.fixedIncomeMonthlyValue,
    investmentObjective: app.investmentObjective,
    applicantName: app.applicantName,
    dateOfApplication: app.dateOfApplication,
    submitConsent: app.submitConsent,
    reviewNotes: app.reviewNotes,
    reviewedBy: app.reviewedBy,
    reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
    submittedAt: app.submittedAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function summarizeApplication(app) {
  return {
    id: app.id,
    referenceId: app.referenceId,
    status: app.status,
    firstName: app.firstName,
    fatherName: app.fatherName,
    grandfatherName: app.grandfatherName,
    email: app.email,
    phone: app.phone,
    investorType: app.investorType,
    submittedAt: app.submittedAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
  };
}

async function generateReferenceId(prisma) {
  const counter = await prisma.kycCounter.upsert({
    where: { id: "kyc" },
    create: { id: "kyc", value: 100001 },
    update: { value: { increment: 1 } },
  });
  return `PC-KYC-${counter.value}`;
}

async function createAuditLog(prisma, entry) {
  return prisma.auditLog.create({ data: entry });
}

module.exports = {
  buildApplicationData,
  validateApplication,
  toApiApplication,
  summarizeApplication,
  generateReferenceId,
  createAuditLog,
};
