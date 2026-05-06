import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── Singleton S3 client — created once, reused on all requests ───────────────
let _s3: S3Client | null = null;

function getR2Client(): S3Client {
  if (_s3) return _s3;

  const endpoint = process.env.AWS_ENDPOINT;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage not configured: set AWS_ENDPOINT, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY"
    );
  }

  _s3 = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return _s3;
}

function getBucket(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET is not configured");
  return bucket;
}

function appendHashSuffix(key: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = key.lastIndexOf(".");
  if (lastDot === -1) return `${key}_${hash}`;
  return `${key.slice(0, lastDot)}_${hash}${key.slice(lastDot)}`;
}

// ─── Presigned URL cache — avoids regenerating on every proxy request ─────────
// Keys expire in 7 days; cache evicts 30 min before expiry to stay safe.
const SIGNED_URL_TTL_S = 60 * 60 * 24 * 7; // 7 days in seconds
const CACHE_SAFETY_MARGIN_MS = 30 * 60 * 1000; // 30 min in ms

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(relKey.replace(/^\/+/, ""));
  const s3 = getR2Client();
  const bucket = getBucket();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = relKey.replace(/^\/+/, "");

  // If the bucket has a public domain configured, skip signing entirely.
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/${key}`;
  }

  // Return cached signed URL if still valid.
  const cached = signedUrlCache.get(key);
  if (cached && Date.now() < cached.expiresAt - CACHE_SAFETY_MARGIN_MS) {
    return cached.url;
  }

  const s3 = getR2Client();
  const bucket = getBucket();
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: SIGNED_URL_TTL_S }
  );

  signedUrlCache.set(key, { url, expiresAt: Date.now() + SIGNED_URL_TTL_S * 1000 });
  return url;
}
