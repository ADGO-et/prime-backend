const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Prime Capital Backend API",
      version: "1.0.0",
      description: "KYC Processing and Brokerage Backend API for Prime Capital",
      contact: {
        name: "Prime Capital Support",
        email: "compliance@primecapital.et",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://dev-api.primecapitalsc.com/",
        description: "Deployed server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "compliance@primecapital.et",
            },
            password: {
              type: "string",
              example: "Admin@12345",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT authentication token",
            },
            user: {
              $ref: "#/components/schemas/AdminUser",
            },
          },
        },
        AdminUser: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            name: {
              type: "string",
            },
            role: {
              type: "string",
              enum: ["compliance_officer", "admin", "super_admin"],
            },
          },
        },
        KycApplication: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            referenceId: {
              type: "string",
              description: "Unique reference ID (e.g., KYC-250701-100001)",
            },
            status: {
              type: "string",
              enum: ["pending", "under_review", "approved", "rejected", "revision_requested"],
            },
            firstName: { type: "string" },
            fatherName: { type: "string" },
            grandfatherName: { type: "string" },
            phone: { type: "string" },
            email: { type: "string", format: "email" },
            dob: { type: "string" },
            age: { type: "string" },
            placeOfBirth: { type: "string" },
            nationality: { type: "string" },
            countryOfResidence: { type: "string" },
            tinNumber: { type: "string" },
            cityAdministration: { type: "string" },
            zone: { type: "string" },
            subCity: { type: "string" },
            woredaKebele: { type: "string" },
            houseNumber: { type: "string" },
            preferredContact: { type: "string" },
            marketingCommunications: { type: "boolean" },
            employmentStatus: { type: "string" },
            hasBeneficiary: { type: "boolean" },
            beneficiaryName: { type: "string" },
            beneficiaryRelationship: { type: "string" },
            bankName: { type: "string" },
            bankBranch: { type: "string" },
            accountNumber: { type: "string" },
            bankChangeAck: { type: "boolean" },
            settlementOptions: { type: "array", items: { type: "string" } },
            investorType: { type: "string" },
            faydaNumber: { type: "string" },
            faydaIssueDate: { type: "string" },
            faydaExpiryDate: { type: "string" },
            faydaFront: { type: "string", nullable: true },
            faydaBack: { type: "string", nullable: true },
            kebeleId: { type: "string", nullable: true },
            drivingLicense: { type: "string", nullable: true },
            publiclyTradedOwner: { type: "string" },
            publiclyTradedDetails: { type: "string" },
            brokerageEmployee: { type: "string" },
            brokerageEmployeeDetails: { type: "string" },
            sourceOfFunds: { type: "string" },
            sourceOfIncomeDetails: { type: "string" },
            annualNetIncome: { type: "string" },
            netWorth: { type: "string" },
            pepStatus: { type: "string" },
            pepDetails: { type: "string" },
            bankruptcyDisclosure: { type: "string" },
            bankruptcyDetails: { type: "string" },
            criminalRecord: { type: "string" },
            criminalRecordDetails: { type: "string" },
            riskTolerance: { type: "string" },
            stockExperience: { type: "string" },
            bondExperience: { type: "string" },
            stockMonthlyValue: { type: "string" },
            fixedIncomeMonthlyValue: { type: "string" },
            investmentObjective: { type: "array", items: { type: "string" } },
            applicantName: { type: "string" },
            dateOfApplication: { type: "string" },
            submitConsent: { type: "boolean" },
            reviewNotes: { type: "string" },
            reviewedBy: { type: "string", nullable: true },
            reviewedAt: { type: "string", format: "date-time", nullable: true },
            submittedAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ApplicationSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            referenceId: { type: "string" },
            status: { type: "string" },
            firstName: { type: "string" },
            fatherName: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            submittedAt: { type: "string", format: "date-time" },
          },
        },
        UpdateStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["pending", "under_review", "approved", "rejected", "revision_requested"],
            },
            reviewNotes: {
              type: "string",
              description: "Optional review notes",
            },
          },
        },
        Stats: {
          type: "object",
          properties: {
            total: { type: "integer" },
            pending: { type: "integer" },
            underReview: { type: "integer" },
            approved: { type: "integer" },
            rejected: { type: "integer" },
            revisionRequested: { type: "integer" },
            rejectionRate: { type: "integer", description: "Rejection rate percentage" },
            monthlyApplications: { type: "integer" },
            monthlyVolumeForecast: { type: "number" },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            action: { type: "string" },
            referenceId: { type: "string", nullable: true },
            applicant: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            previousStatus: { type: "string", nullable: true },
            newStatus: { type: "string", nullable: true },
            reviewedBy: { type: "string", nullable: true },
            notes: { type: "string", nullable: true },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string" },
            service: { type: "string" },
            database: { type: "string" },
            storage: { type: "object" },
            port: { type: "integer" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "KYC", description: "KYC application submission" },
      { name: "Admin", description: "Admin management endpoints" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
