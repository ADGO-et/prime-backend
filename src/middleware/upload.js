const multer = require("multer");
const path = require("path");

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|webp/i;
  const ext = path.extname(file.originalname).slice(1);
  if (allowed.test(ext) || file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, PDF, and WEBP files are allowed"));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const kycUploadFields = upload.fields([
  { name: "faydaFront", maxCount: 1 },
  { name: "faydaBack", maxCount: 1 },
  { name: "kebeleId", maxCount: 1 },
  { name: "drivingLicense", maxCount: 1 },
  { name: "companyStamp", maxCount: 1 },
]);

module.exports = { kycUploadFields };
