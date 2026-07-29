const PREFERRED_CONTACTS = ["phone", "email", "online", "in_person", "all"];
const RISK_LEVELS = ["low", "moderate", "medium", "high"];
const INVESTMENT_TYPES = ["equities", "fixed_income", "both"];
const OWNER_TYPES = ["beneficiary", "legal"];

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

function normalizeRiskTolerance(value) {
  const v = (value || "").toLowerCase().trim();
  if (v === "medium") return "moderate";
  return v;
}

function normalizePreferredContact(value) {
  const v = (value || "phone").toLowerCase().trim().replace(/\s+/g, "_");
  if (v === "in_person" || v === "physical") return "in_person";
  return PREFERRED_CONTACTS.includes(v) ? v : "phone";
}

function resolveApplicantName(data) {
  if (data.fullName?.trim()) return data.fullName.trim();
  return [data.firstName, data.fatherName, data.grandfatherName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function hasPrimaryId(data) {
  const hasFayda =
    data.faydaNumber?.trim() && (data.faydaFront || data.faydaBack);
  const hasPassport = data.passportNumber?.trim();
  const hasKebele =
    data.kebeleIdNumber?.trim() || data.kebeleId;
  const hasDrivingLicense = data.drivingLicense;
  const hasGenericId = data.idNumber?.trim();
  return hasFayda || hasPassport || hasKebele || hasDrivingLicense || hasGenericId;
}

function buildApplicationData(body, fileKeys = {}) {
  const fullName = body.fullName || "";
  let firstName = body.firstName || "";
  let fatherName = body.fatherName || "";
  let grandfatherName = body.grandfatherName || "";

  if (fullName.trim() && !firstName.trim()) {
    firstName = fullName.trim();
  }

  return {
    fullName,
    firstName,
    fatherName,
    grandfatherName,
    phone: body.phone || "",
    email: body.email || "",
    dob: body.dob || "",
    age: body.age || "",
    placeOfBirth: body.placeOfBirth || "",
    gender: body.gender || "",
    maritalStatus: body.maritalStatus || "",
    nationality: body.nationality || "",
    countryOfResidence: body.countryOfResidence || body.residence || "",
    residentialStatus: body.residentialStatus || "",
    tinNumber: body.tinNumber || "",

    cityAdministration: body.cityAdministration || body.region || "",
    zone: body.zone || body.city || "",
    subCity: body.subCity || "",
    woredaKebele: body.woredaKebele || "",
    houseNumber: body.houseNumber || "",
    tel: body.tel || "",
    preferredContact: normalizePreferredContact(body.preferredContact),
    marketingCommunications: parseBool(body.marketingCommunications),

    employmentStatus: body.employmentStatus || "",
    occupation: body.occupation || "",
    employerName: body.employerName || "",
    employerAddress: body.employerAddress || "",
    employerPhone: body.employerPhone || "",
    businessName: body.businessName || "",
    natureOfBusiness: body.natureOfBusiness || "",
    profession: body.profession || "",
    businessPhone: body.businessPhone || "",

    hasBeneficiary: parseBool(body.hasBeneficiary),
    beneficiaryName: body.beneficiaryName || "",
    beneficiaryRelationship: body.beneficiaryRelationship || "",

    bankName: body.bankName || "",
    bankBranch: body.bankBranch || body.branchName || "",
    accountNumber: body.accountNumber || "",
    accountTitle: body.accountTitle || "",
    bankChangeAck: parseBool(body.bankChangeAck),
    settlementOptions: parseJsonField(body.settlementOptions, []),

    investorType: body.investorType || "",
    idType: body.idType || "",
    idNumber: body.idNumber || "",
    idIssueDate: body.idIssueDate || "",
    idExpiryDate: body.idExpiryDate || "",
    faydaNumber: body.faydaNumber || "",
    faydaIssueDate: body.faydaIssueDate || "",
    faydaExpiryDate: body.faydaExpiryDate || "",
    faydaFront: fileKeys.faydaFront || null,
    faydaBack: fileKeys.faydaBack || null,
    passportNumber: body.passportNumber || "",
    passportIssueDate: body.passportIssueDate || "",
    passportExpiryDate: body.passportExpiryDate || "",
    kebeleIdNumber: body.kebeleIdNumber || "",
    kebeleIssueDate: body.kebeleIssueDate || "",
    kebeleExpiryDate: body.kebeleExpiryDate || "",
    kebeleId: fileKeys.kebeleId || null,
    drivingLicense: fileKeys.drivingLicense || null,

    companyName: body.companyName || "",
    investorCategory: body.investorCategory || "",
    economicSector: body.economicSector || "",
    registeredAddress: body.registeredAddress || body.address || "",
    country: body.country || "",
    postalCode: body.postalCode || "",
    registrationNumber: body.registrationNumber || "",
    registrationDate: body.registrationDate || "",
    corporateContacts: parseJsonField(body.corporateContacts, []),
    companyStamp: fileKeys.companyStamp || null,

    jointFullName: body.jointFullName || "",
    jointGender: body.jointGender || "",
    jointMaritalStatus: body.jointMaritalStatus || "",
    jointNationality: body.jointNationality || "",
    jointTin: body.jointTin || "",
    jointDob: body.jointDob || "",
    jointIdType: body.jointIdType || "",
    jointIdNumber: body.jointIdNumber || "",
    jointIdIssueDate: body.jointIdIssueDate || "",
    jointIdExpiryDate: body.jointIdExpiryDate || "",
    jointRegion: body.jointRegion || "",
    jointCity: body.jointCity || "",
    jointSubCity: body.jointSubCity || "",
    jointWoredaKebele: body.jointWoredaKebele || "",
    jointHouseNumber: body.jointHouseNumber || "",
    jointPhone: body.jointPhone || "",
    jointEmail: body.jointEmail || "",
    jointTel: body.jointTel || "",
    jointResidentialStatus: body.jointResidentialStatus || "",
    jointEmploymentStatus: body.jointEmploymentStatus || "",
    jointEmployerName: body.jointEmployerName || "",
    jointProfession: body.jointProfession || "",
    jointEmployerAddress: body.jointEmployerAddress || "",
    jointBusinessAddress: body.jointBusinessAddress || "",
    jointAnnualIncome: body.jointAnnualIncome || "",
    jointSourceOfFunds: body.jointSourceOfFunds || "",
    jointPepStatus: body.jointPepStatus || "no",
    jointPepDetails: body.jointPepDetails || "",

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

    riskTolerance: normalizeRiskTolerance(body.riskTolerance),

    stockExperience: body.stockExperience || "",
    bondExperience: body.bondExperience || "",
    stockMonthlyValue: body.stockMonthlyValue || "",
    fixedIncomeMonthlyValue: body.fixedIncomeMonthlyValue || "",

    investmentObjective: parseJsonField(body.investmentObjective, []),
    investmentType: (body.investmentType || "").toLowerCase(),

    ownerType: (body.ownerType || "").toLowerCase(),
    ownershipCompanies: parseJsonField(body.ownershipCompanies, []),

    applicantName: body.applicantName || "",
    applicantSignature: body.applicantSignature || "",
    jointApplicantSignature: body.jointApplicantSignature || "",
    dateOfApplication: body.dateOfApplication || "",
    submitConsent: parseBool(body.submitConsent),
    riskDisclosureAck: parseBool(body.riskDisclosureAck),
    accountCode: body.accountCode || "",
    officeUse: parseJsonField(body.officeUse, {}),
    authorizedSignatoryName: body.authorizedSignatoryName || "",
    authorizedSignatoryTitle: body.authorizedSignatoryTitle || "",
  };
}

function validateBankDetails(data, errors, prefix = "") {
  if (!data.bankName?.trim()) errors.push(`${prefix}Bank name is required`);
  if (!data.accountNumber?.trim()) errors.push(`${prefix}Account number is required`);
  if (!data.bankBranch?.trim()) errors.push(`${prefix}Branch name is required`);
  if (!data.accountTitle?.trim()) errors.push(`${prefix}Account title is required`);
}

function validateInvestmentProfile(data, errors) {
  if (!data.riskTolerance?.trim()) errors.push("Risk profile is required");
  else if (!RISK_LEVELS.includes(data.riskTolerance)) {
    errors.push("Risk profile must be Low, Moderate, or High");
  }

  const objectives = Array.isArray(data.investmentObjective) ? data.investmentObjective : [];
  if (objectives.length === 0) errors.push("At least one investment objective is required");

  if (data.investmentType && !INVESTMENT_TYPES.includes(data.investmentType)) {
    errors.push("Investment type must be Equities, Fixed Income, or Both");
  }
}

function validatePep(data, errors, prefix = "") {
  const status = (data.pepStatus || "no").toLowerCase();
  if (!["yes", "no"].includes(status)) {
    errors.push(`${prefix}PEP status must be Yes or No`);
  }
  if (status === "yes" && !data.pepDetails?.trim()) {
    errors.push(`${prefix}PEP details are required when PEP status is Yes`);
  }
}

function validateJointPep(data, errors) {
  const status = (data.jointPepStatus || "no").toLowerCase();
  if (status === "yes" && !data.jointPepDetails?.trim()) {
    errors.push("Secondary holder PEP details are required when PEP status is Yes");
  }
}

function validateApplication(data) {
  const errors = [];
  const type = (data.investorType || "individual").toLowerCase();
  const name = resolveApplicantName(data);

  if (type === "corporate") {
    if (!data.companyName?.trim()) errors.push("Company name is required");
    if (!data.tinNumber?.trim()) errors.push("Tax Identification Number (TIN) is required");
    if (!data.registrationNumber?.trim()) errors.push("Registration number is required");
    if (!data.registrationDate?.trim()) errors.push("Registration date is required");
    if (!data.registeredAddress?.trim()) errors.push("Registered address is required");
    if (!data.zone?.trim()) errors.push("City is required");
    if (!data.country?.trim()) errors.push("Country is required");
    if (!data.email?.trim()) errors.push("Email is required");
    if (!data.phone?.trim()) errors.push("Phone is required");

    validateBankDetails(data, errors);
    validateInvestmentProfile(data, errors);
    validatePep(data, errors);

    const contacts = Array.isArray(data.corporateContacts) ? data.corporateContacts : [];
    if (contacts.length < 2) {
      errors.push("Provide at least 2 authorized contacts");
    } else {
      contacts.slice(0, 3).forEach((c, idx) => {
        if (!c.fullName?.trim()) errors.push(`Contact ${idx + 1}: Full name is required`);
        if (!c.phone?.trim()) errors.push(`Contact ${idx + 1}: Phone number is required`);
        if (!c.email?.trim()) errors.push(`Contact ${idx + 1}: Email is required`);
      });
    }

    if (data.ownerType && !OWNER_TYPES.includes(data.ownerType)) {
      errors.push("Owner type must be Beneficiary or Legal");
    }
  } else if (type === "joint") {
    if (!name) errors.push("Primary applicant name is required");
    if (!data.email?.trim()) errors.push("Primary applicant email is required");
    if (!data.phone?.trim()) errors.push("Primary applicant phone is required");
    if (!data.tinNumber?.trim()) errors.push("Primary applicant TIN is required");
    if (!data.dob?.trim()) errors.push("Primary applicant date of birth is required");

    if (!data.idNumber?.trim() && !data.faydaNumber?.trim() && !data.kebeleId && !data.drivingLicense) {
      errors.push("Primary applicant ID is required");
    }

    if (!data.jointFullName?.trim()) errors.push("Secondary applicant name is required");
    if (!data.jointEmail?.trim()) errors.push("Secondary applicant email is required");
    if (!data.jointPhone?.trim()) errors.push("Secondary applicant phone is required");
    if (!data.jointTin?.trim()) errors.push("Secondary applicant TIN is required");
    if (!data.jointDob?.trim()) errors.push("Secondary applicant date of birth is required");
    if (!data.jointIdNumber?.trim()) errors.push("Secondary applicant ID number is required");

    validateBankDetails(data, errors);
    validateInvestmentProfile(data, errors);
    validatePep(data, errors, "Primary holder: ");
    validateJointPep(data, errors);

    if (data.ownerType && !OWNER_TYPES.includes(data.ownerType)) {
      errors.push("Owner type must be Beneficiary or Legal");
    }
  } else {
    if (!name) errors.push("Full name is required");
    if (!data.dob?.trim()) errors.push("Date of birth is required");
    if (!data.tinNumber?.trim()) errors.push("Tax Identification Number (TIN) is required");
    if (!data.email?.trim()) errors.push("Email is required");
    if (!data.phone?.trim()) errors.push("Phone number is required");
    if (!data.cityAdministration?.trim()) errors.push("Region is required");
    if (!data.zone?.trim()) errors.push("City is required");

    if (!hasPrimaryId(data)) {
      errors.push("Provide at least one valid ID (Fayda, Passport, or Kebele)");
    }

    if (data.faydaNumber?.trim() && !data.faydaFront) {
      errors.push("Fayda ID photocopy is required when Fayda number is provided");
    }

    validateBankDetails(data, errors);
    validateInvestmentProfile(data, errors);
    validatePep(data, errors);

    if (data.ownerType && !OWNER_TYPES.includes(data.ownerType)) {
      errors.push("Owner type must be Beneficiary or Legal");
    }
  }

  if (!data.submitConsent) errors.push("Declaration consent is required");

  return errors;
}

function toApiApplication(app) {
  return {
    id: app.id,
    referenceId: app.referenceId,
    status: app.status,
    fullName: app.fullName,
    firstName: app.firstName,
    fatherName: app.fatherName,
    grandfatherName: app.grandfatherName,
    phone: app.phone,
    email: app.email,
    dob: app.dob,
    age: app.age,
    placeOfBirth: app.placeOfBirth,
    gender: app.gender,
    maritalStatus: app.maritalStatus,
    nationality: app.nationality,
    countryOfResidence: app.countryOfResidence,
    residentialStatus: app.residentialStatus,
    tinNumber: app.tinNumber,
    cityAdministration: app.cityAdministration,
    zone: app.zone,
    subCity: app.subCity,
    woredaKebele: app.woredaKebele,
    houseNumber: app.houseNumber,
    tel: app.tel,
    preferredContact: app.preferredContact,
    marketingCommunications: app.marketingCommunications,
    employmentStatus: app.employmentStatus,
    occupation: app.occupation,
    employerName: app.employerName,
    employerAddress: app.employerAddress,
    employerPhone: app.employerPhone,
    businessName: app.businessName,
    natureOfBusiness: app.natureOfBusiness,
    profession: app.profession,
    businessPhone: app.businessPhone,
    hasBeneficiary: app.hasBeneficiary,
    beneficiaryName: app.beneficiaryName,
    beneficiaryRelationship: app.beneficiaryRelationship,
    bankName: app.bankName,
    bankBranch: app.bankBranch,
    accountNumber: app.accountNumber,
    accountTitle: app.accountTitle,
    bankChangeAck: app.bankChangeAck,
    settlementOptions: app.settlementOptions,
    investorType: app.investorType,
    idType: app.idType,
    idNumber: app.idNumber,
    idIssueDate: app.idIssueDate,
    idExpiryDate: app.idExpiryDate,
    faydaNumber: app.faydaNumber,
    faydaIssueDate: app.faydaIssueDate,
    faydaExpiryDate: app.faydaExpiryDate,
    passportNumber: app.passportNumber,
    passportIssueDate: app.passportIssueDate,
    passportExpiryDate: app.passportExpiryDate,
    kebeleIdNumber: app.kebeleIdNumber,
    kebeleIssueDate: app.kebeleIssueDate,
    kebeleExpiryDate: app.kebeleExpiryDate,
    documents: {
      faydaFront: app.faydaFront,
      faydaBack: app.faydaBack,
      kebeleId: app.kebeleId,
      drivingLicense: app.drivingLicense,
      companyStamp: app.companyStamp,
    },
    companyName: app.companyName,
    investorCategory: app.investorCategory,
    economicSector: app.economicSector,
    registeredAddress: app.registeredAddress,
    country: app.country,
    postalCode: app.postalCode,
    registrationNumber: app.registrationNumber,
    registrationDate: app.registrationDate,
    corporateContacts: app.corporateContacts,
    jointFullName: app.jointFullName,
    jointGender: app.jointGender,
    jointMaritalStatus: app.jointMaritalStatus,
    jointNationality: app.jointNationality,
    jointTin: app.jointTin,
    jointDob: app.jointDob,
    jointIdType: app.jointIdType,
    jointIdNumber: app.jointIdNumber,
    jointIdIssueDate: app.jointIdIssueDate,
    jointIdExpiryDate: app.jointIdExpiryDate,
    jointRegion: app.jointRegion,
    jointCity: app.jointCity,
    jointSubCity: app.jointSubCity,
    jointWoredaKebele: app.jointWoredaKebele,
    jointHouseNumber: app.jointHouseNumber,
    jointPhone: app.jointPhone,
    jointEmail: app.jointEmail,
    jointTel: app.jointTel,
    jointResidentialStatus: app.jointResidentialStatus,
    jointEmploymentStatus: app.jointEmploymentStatus,
    jointEmployerName: app.jointEmployerName,
    jointProfession: app.jointProfession,
    jointEmployerAddress: app.jointEmployerAddress,
    jointBusinessAddress: app.jointBusinessAddress,
    jointAnnualIncome: app.jointAnnualIncome,
    jointSourceOfFunds: app.jointSourceOfFunds,
    jointPepStatus: app.jointPepStatus,
    jointPepDetails: app.jointPepDetails,
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
    investmentType: app.investmentType,
    ownerType: app.ownerType,
    ownershipCompanies: app.ownershipCompanies,
    applicantName: app.applicantName,
    applicantSignature: app.applicantSignature,
    jointApplicantSignature: app.jointApplicantSignature,
    dateOfApplication: app.dateOfApplication,
    submitConsent: app.submitConsent,
    riskDisclosureAck: app.riskDisclosureAck,
    accountCode: app.accountCode,
    officeUse: app.officeUse,
    authorizedSignatoryName: app.authorizedSignatoryName,
    authorizedSignatoryTitle: app.authorizedSignatoryTitle,
    reviewNotes: app.reviewNotes,
    reviewedBy: app.reviewedBy,
    reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
    submittedAt: app.submittedAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

function summarizeApplication(app) {
  const type = (app.investorType || "individual").toLowerCase();
  let displayName = app.firstName;
  if (type === "corporate") {
    displayName = app.companyName;
  } else if (type === "joint") {
    displayName = resolveApplicantName(app) || app.firstName;
  } else if (app.fullName?.trim()) {
    displayName = app.fullName;
  }
  return {
    id: app.id,
    referenceId: app.referenceId,
    status: app.status,
    firstName: displayName,
    fatherName: type === "corporate" || type === "joint" ? "" : app.fatherName,
    grandfatherName: type === "corporate" || type === "joint" ? "" : app.grandfatherName,
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

function buildOfficeUseUpdate(body) {
  const data = {};
  if (body.accountCode !== undefined) data.accountCode = body.accountCode || "";

  const officeFields = [
    "preparedBy", "preparedSign", "preparedDate",
    "approvedBy", "approvedSign", "approvedDate",
    "checkedBy", "checkedSign", "checkedDate",
  ];
  const hasOfficeField = officeFields.some((f) => body[f] !== undefined);
  if (hasOfficeField) {
    const officeUse = {};
    officeFields.forEach((f) => {
      if (body[f] !== undefined) officeUse[f] = body[f] || "";
    });
    data.officeUse = officeUse;
  } else if (body.officeUse !== undefined) {
    data.officeUse = parseJsonField(body.officeUse, {});
  }

  return data;
}

module.exports = {
  buildApplicationData,
  validateApplication,
  toApiApplication,
  summarizeApplication,
  generateReferenceId,
  createAuditLog,
  resolveApplicantName,
  buildOfficeUseUpdate,
};
