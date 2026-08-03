/**
 * Proves the presigned upload mechanism works against the real MinIO bucket,
 * using the same client configuration the app ships.
 *
 *   pnpm verify:s3
 *
 * This exists because the failure modes here are silent and misleading: a
 * checksum header hoisted into the query string surfaces as a signature error,
 * and an unsigned Content-Type simply lets the wrong type through without
 * complaint. Both are asserted below rather than assumed.
 */
import { config as loadEnv } from "dotenv";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { bucket, s3Internal, s3Public } from "../../src/lib/s3";

const BODY = Buffer.from("%PDF-1.4\nverification fixture\n".repeat(40), "utf8");
const CONTENT_TYPE = "application/pdf";
const KEY = `plans/_verify/roundtrip-${process.pid}.pdf`;

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main(): Promise<void> {
  console.log(`[s3] bucket=${bucket()} key=${KEY}`);

  const uploadUrl = await getSignedUrl(
    s3Public(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: KEY,
      ContentType: CONTENT_TYPE,
      ContentLength: BODY.byteLength,
    }),
    { expiresIn: 300, signableHeaders: new Set(["content-type"]) },
  );

  const signed = new URL(uploadUrl);
  const signedHeaders = signed.searchParams.get("X-Amz-SignedHeaders") ?? "";

  check(
    "no checksum header hoisted into the URL",
    ![...signed.searchParams.keys()].some((key) => key.toLowerCase().includes("checksum")),
    [...signed.searchParams.keys()].join(","),
  );
  check("content-type is signed", signedHeaders.includes("content-type"), signedHeaders);
  check("content-length is signed", signedHeaders.includes("content-length"), signedHeaders);

  // 1. The happy path.
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": CONTENT_TYPE },
    body: new Uint8Array(BODY),
  });
  check("presigned PUT succeeds", put.ok, `status ${put.status} ${(await put.text()).slice(0, 160)}`);

  // 2. Signature binds the content type.
  const wrongType = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/html" },
    body: new Uint8Array(BODY),
  });
  check("PUT with a different Content-Type is rejected", !wrongType.ok, `status ${wrongType.status}`);

  // 3. Signature binds the declared length, which is what stops a client from
  //    under-reporting its size to get past the 25 mb limit.
  const biggerUrl = await getSignedUrl(
    s3Public(),
    new PutObjectCommand({ Bucket: bucket(), Key: KEY, ContentType: CONTENT_TYPE, ContentLength: 10 }),
    { expiresIn: 300, signableHeaders: new Set(["content-type"]) },
  );
  const wrongLength = await fetch(biggerUrl, {
    method: "PUT",
    headers: { "Content-Type": CONTENT_TYPE },
    body: new Uint8Array(BODY),
  });
  check("PUT larger than the signed ContentLength is rejected", !wrongLength.ok, `status ${wrongLength.status}`);

  // 4. Server-side confirmation sees the real object.
  const head = await s3Internal().send(new HeadObjectCommand({ Bucket: bucket(), Key: KEY }));
  check("HeadObject reports the uploaded size", head.ContentLength === BODY.byteLength, String(head.ContentLength));
  check("HeadObject reports the signed content type", head.ContentType === CONTENT_TYPE, String(head.ContentType));

  // 5. Download path.
  const downloadUrl = await getSignedUrl(
    s3Public(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: KEY,
      ResponseContentDisposition: 'attachment; filename="fixture.pdf"',
      ResponseContentType: CONTENT_TYPE,
    }),
    { expiresIn: 60 },
  );
  const got = await fetch(downloadUrl);
  const bytes = Buffer.from(await got.arrayBuffer());
  check("presigned GET returns the same bytes", got.ok && bytes.equals(BODY));
  check(
    "download forces attachment",
    (got.headers.get("content-disposition") ?? "").startsWith("attachment"),
    String(got.headers.get("content-disposition")),
  );

  // 6. The bucket must not be publicly readable.
  const unsigned = await fetch(`${process.env.S3_PUBLIC_ENDPOINT}/${bucket()}/${KEY}`);
  check("unsigned GET is denied (bucket is private)", !unsigned.ok, `status ${unsigned.status}`);

  await s3Internal().send(new DeleteObjectCommand({ Bucket: bucket(), Key: KEY }));
  const afterDelete = await s3Internal()
    .send(new HeadObjectCommand({ Bucket: bucket(), Key: KEY }))
    .then(() => true)
    .catch(() => false);
  check("object is gone after delete", !afterDelete);

  console.log(`\n[s3] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(`[s3] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
