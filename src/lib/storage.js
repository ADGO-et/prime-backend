const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const mime = require("mime-types");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} = require("@aws-sdk/client-s3");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const S3_PREFIX = process.env.S3_PREFIX || "kyc";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function isS3Enabled() {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
}

function getStorageInfo() {
  if (isS3Enabled()) {
    return {
      mode: "s3",
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
      prefix: S3_PREFIX,
    };
  }
  return { mode: "local", directory: UPLOAD_DIR };
}

let s3Client;

function getS3Client() {
  if (!s3Client) {
    let endpoint = process.env.S3_ENDPOINT;
    if (process.env.S3_SSL === "true" && endpoint && !endpoint.startsWith("http")) {
      endpoint = `https://${endpoint}`;
    } else if (process.env.S3_SSL === "false" && endpoint && !endpoint.startsWith("http")) {
      endpoint = `http://${endpoint}`;
    }

    s3Client = new S3Client({
      endpoint,
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    });
  }
  return s3Client;
}

function objectKey(filename) {
  return `${S3_PREFIX}/${filename}`;
}

function generateFilename(originalName) {
  const ext = path.extname(originalName || "") || "";
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

async function ensureBucket() {
  if (!isS3Enabled()) return;

  const client = getS3Client();
  const bucket = process.env.S3_BUCKET;

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Created S3 bucket: ${bucket}`);
  }
}

async function persistUploads(files = {}) {
  const fields = ["faydaFront", "faydaBack", "kebeleId", "drivingLicense"];
  const keys = {};

  for (const field of fields) {
    const file = files[field]?.[0];
    if (file) {
      keys[field] = await saveFile(file);
    }
  }

  return keys;
}

async function saveFile(file) {
  const filename = generateFilename(file.originalname);
  const contentType = file.mimetype || mime.lookup(filename) || "application/octet-stream";

  if (isS3Enabled()) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: objectKey(filename),
        Body: file.buffer,
        ContentType: contentType,
      })
    );
  } else {
    await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  }

  return filename;
}

async function fileExists(filename) {
  if (isS3Enabled()) {
    try {
      await getS3Client().send(
        new HeadObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: objectKey(filename),
        })
      );
      return true;
    } catch {
      return false;
    }
  }
  return fs.existsSync(path.join(UPLOAD_DIR, filename));
}

async function streamFileToResponse(filename, res) {
  const contentType = mime.lookup(filename) || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "private, no-store");

  if (isS3Enabled()) {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: objectKey(filename),
      })
    );

    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader("Content-Length", response.ContentLength);
    }

    await pipeline(response.Body, res);
    return;
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    const err = new Error("File missing on server");
    err.status = 404;
    throw err;
  }

  await pipeline(fs.createReadStream(filePath), res);
}

module.exports = {
  UPLOAD_DIR,
  isS3Enabled,
  getStorageInfo,
  ensureBucket,
  persistUploads,
  fileExists,
  streamFileToResponse,
};
