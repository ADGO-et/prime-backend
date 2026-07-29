# KYC & Trade Order Field Reference

API base: `http://localhost:5000` (dev)

All KYC submissions use **`POST /api/kyc/submit`** (`multipart/form-data`).

Set **`investorType`**: `individual` | `corporate` | `joint`

---

## Individual Account Form

| Form field | API field | Required |
|------------|-----------|----------|
| Full Name | `fullName` (or `firstName` + `fatherName`) | Yes |
| Date of Birth | `dob` | Yes |
| Place of Birth | `placeOfBirth` | |
| Gender | `gender` | |
| Marital Status | `maritalStatus` | |
| Nationality | `nationality` | |
| Residence | `countryOfResidence` | |
| TIN | `tinNumber` | Yes |
| Fayda ID | `faydaNumber`, `faydaIssueDate`, `faydaExpiryDate`, `faydaFront` file | At least one ID |
| Passport | `passportNumber`, `passportIssueDate`, `passportExpiryDate` | At least one ID |
| Kebele ID | `kebeleIdNumber`, `kebeleIssueDate`, `kebeleExpiryDate`, `kebeleId` file | At least one ID |
| Region | `cityAdministration` | Yes |
| City | `zone` | Yes |
| Sub-City | `subCity` | |
| Woreda/Kebele | `woredaKebele` | |
| House Number | `houseNumber` | |
| Phone | `phone` | Yes |
| Email | `email` | Yes |
| Preferred Channel | `preferredContact` | `phone`, `email`, `online`, `in_person`, `all` |
| Employment Status | `employmentStatus` | |
| Occupation / Employer | `occupation`, `employerName`, `employerAddress`, `employerPhone` | |
| Self-employed | `businessName`, `natureOfBusiness`, `profession`, `businessPhone` | |
| Corporate Action Payment | `settlementOptions` (JSON) | |
| Bank Name / Account / Branch / Title | `bankName`, `accountNumber`, `bankBranch`, `accountTitle` | Yes |
| Source of Funds | `sourceOfFunds` | |
| Average Annual Income | `annualNetIncome` | |
| Investment Objective | `investmentObjective` (JSON array) | Yes |
| Investment Type | `investmentType` | `equities`, `fixed_income`, `both` |
| Risk Profile | `riskTolerance` | Yes |
| PEP | `pepStatus`, `pepDetails` | |
| Owner type | `ownerType` | `beneficiary`, `legal` |
| Ownership companies | `ownershipCompanies` (JSON array) | |
| Declaration | `submitConsent` | Yes |
| Risk disclosure | `riskDisclosureAck` | |
| Signature | `applicantSignature` | |

---

## Corporate Account Form

| Form field | API field | Required |
|------------|-----------|----------|
| Company Name | `companyName` | Yes |
| Investor Category | `investorCategory` | |
| Economic Sector | `economicSector` | |
| TIN | `tinNumber` | Yes |
| Registration No/Date | `registrationNumber`, `registrationDate` | Yes |
| Address | `registeredAddress` | Yes |
| City | `zone` | Yes |
| Country | `country` | Yes |
| Postal Code | `postalCode` | |
| Phone / Email | `phone`, `email` | Yes |
| Contacts (min 2) | `corporateContacts` (JSON) | Yes |
| Bank details | `bankName`, `accountNumber`, `bankBranch`, `accountTitle` | Yes |
| Investment profile | `investmentObjective`, `investmentType`, `riskTolerance` | Yes |
| PEP | `pepStatus`, `pepDetails` | |
| Company stamp | `companyStamp` file | |
| Authorized signatory | `authorizedSignatoryName`, `authorizedSignatoryTitle`, `applicantSignature` | |
| Declaration | `submitConsent` | Yes |

**Corporate contact object:**
```json
{
  "fullName": "...",
  "faydaId": "...",
  "department": "...",
  "position": "...",
  "email": "...",
  "phone": "..."
}
```

---

## Joint Account Form

Person 1 uses primary fields; Person 2 uses `joint*` fields.

| Person 1 | API field | Required |
|----------|-----------|----------|
| Full Name | `fullName` | Yes |
| Gender / Marital / Nationality | `gender`, `maritalStatus`, `nationality` | |
| TIN / DOB | `tinNumber`, `dob` | Yes |
| ID | `idType`, `idNumber`, `idIssueDate`, `idExpiryDate` | Yes |
| Address | `cityAdministration`, `zone`, `subCity`, `woredaKebele`, `houseNumber` | |
| Mobile / Email / Tel | `phone`, `email`, `tel` | Yes (phone/email) |
| Residential Status | `residentialStatus` | |
| Employment | `employmentStatus`, `employerName`, `profession`, etc. | |
| Source of funds | `sourceOfFunds` | |
| PEP | `pepStatus`, `pepDetails` | |

| Person 2 | API field | Required |
|----------|-----------|----------|
| Full Name | `jointFullName` | Yes |
| TIN / DOB / ID | `jointTin`, `jointDob`, `jointIdNumber` | Yes |
| Address | `jointRegion`, `jointCity`, `jointSubCity`, etc. | |
| Phone / Email | `jointPhone`, `jointEmail` | Yes |
| Employment / Income / Funds | `jointEmploymentStatus`, `jointAnnualIncome`, `jointSourceOfFunds` | |
| PEP | `jointPepStatus`, `jointPepDetails` | |
| Signature | `jointApplicantSignature` | |

Shared: bank, investment profile, `preferredContact`, `submitConsent`.

---

## Trade Order Form

**`POST /api/orders/submit`** (JSON)

| Form field | API field |
|------------|-----------|
| Client Name | `clientName` |
| Fayda/ID/Passport | `idNumber` |
| CSD Account Number | `csdAccountNumber` |
| Symbol | `symbol` |
| Side | `side` (`BUY` / `SELL`) |
| Order Type | `type` (`MARKET`, `LIMIT`, `STOP`, `STOP_LIMIT`) |
| Limit / Stop prices | `limitPrice`, `stopPrice` |
| Quantity | `quantity` |
| Time in Force | `timeInForce` (`DAY`, `GTC`, `GTD`) |
| GTD Date | `goodTillDate` |
| Client Signature | `clientSignature` |
| Received Via | `receivedVia` (`In Person`, `Neway App`) |

Admin updates status via **`PATCH /api/orders/:id/status`** (JWT).

---

## Office Use (Admin Only)

**`PATCH /api/admin/applications/:id/office`** (JWT)

| Form field | API field |
|------------|-----------|
| Account Code | `accountCode` |
| Prepared by / Sign / Date | `preparedBy`, `preparedSign`, `preparedDate` |
| Approved by / Sign / Date | `approvedBy`, `approvedSign`, `approvedDate` |
| Checked by / Sign / Date | `checkedBy`, `checkedSign`, `checkedDate` |

Or send full object: `officeUse` (JSON).

---

## File uploads

| Field | Used for |
|-------|----------|
| `faydaFront` | Fayda ID front |
| `faydaBack` | Fayda ID back |
| `kebeleId` | Kebele ID copy |
| `drivingLicense` | Driving license copy |
| `companyStamp` | Corporate stamp |

Documents retrieved by admins: **`GET /api/admin/documents/:filename`**
