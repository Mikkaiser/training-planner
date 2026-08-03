import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3/MinIO clients. `server-only` is imported first so that if a client
 * component ever pulls this in — directly or through a barrel file — the build
 * fails instead of shipping S3_SECRET_KEY to the browser.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Reused across hot reloads, same as the pg Pool in src/lib/db.ts.
const globalForS3 = globalThis as unknown as { _tpS3?: S3Client; _tpS3Public?: S3Client };

function build(endpoint: string): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: required("S3_ACCESS_KEY"),
      secretAccessKey: required("S3_SECRET_KEY"),
    },
    // Both of these matter, and the first one is not optional.
    //
    // Since SDK v3.729 the flexible-checksums middleware defaults to
    // WHEN_SUPPORTED, which adds ChecksumAlgorithm=CRC32 to PutObject. On a
    // presigned request there is no body to hash, so it computes the CRC32 of
    // an empty payload and hoists x-amz-checksum-crc32 into the query string.
    // MinIO then validates the real upload against the checksum of nothing and
    // rejects it — with an error that looks like a signature problem, not a
    // checksum one. WHEN_REQUIRED makes it emit no checksum headers at all.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

/** For server-side calls: HeadObject, DeleteObject, CopyObject. */
export function s3Internal(): S3Client {
  globalForS3._tpS3 ??= build(required("S3_ENDPOINT"));
  return globalForS3._tpS3;
}

/**
 * For presigning only. A SigV4 signature is bound to the host it was signed
 * for, so a URL handed to a browser must be signed against the endpoint the
 * browser will actually call. Today both env vars point at the same host, but
 * signing the internal one would break silently the day they diverge.
 */
export function s3Public(): S3Client {
  globalForS3._tpS3Public ??= build(process.env.S3_PUBLIC_ENDPOINT ?? required("S3_ENDPOINT"));
  return globalForS3._tpS3Public;
}

export function bucket(): string {
  return required("S3_BUCKET");
}
