require("dotenv").config();
const { ensureBucket, getStorageInfo, isS3Enabled } = require("../src/lib/storage");

async function main() {
  if (!isS3Enabled()) {
    console.log("S3 not configured — using local uploads/ folder.");
    console.log("Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY to enable MinIO/S3.");
    console.log(getStorageInfo());
    return;
  }

  await ensureBucket();
  console.log("Storage ready:", getStorageInfo());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
