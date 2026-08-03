import { NextResponse, type NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";
import { queryOne } from "@/lib/db";
import { bucket, s3Public } from "@/lib/s3";

/** Short: the URL is a bearer capability and the browser follows it at once. */
const DOWNLOAD_URL_TTL_SECONDS = 60;

/**
 * Issues a short-lived presigned GET for one exercise.
 *
 * A route handler rather than a server action because the browser needs a URL
 * it can navigate to from an <a href>; an action returns a value to JavaScript
 * and cannot be followed by an anchor.
 *
 * The client supplies only an exercise id — never a storage key. The key is
 * resolved server-side from a join that also proves ownership, so there is no
 * input that could point at another instructor's object.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new NextResponse(null, { status: 401 });

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(params.id)) return new NextResponse(null, { status: 404 });

  // kind = 'file' above: a link has no object to sign, and it is already
  // reachable as an ordinary anchor.
  const row = await queryOne<{ storage_key: string; file_name: string; content_type: string }>(
    `select e.storage_key, e.file_name, e.content_type
       from exercises e
       join blocks b on b.id = e.block_id
       join phases ph on ph.id = b.phase_id
       join training_plans tp on tp.id = ph.plan_id
      where e.id = $1
        and e.status = 'ready'
        and e.kind = 'file'
        and tp.instructor_id = $2`,
    [params.id, userId],
  );

  // 404 rather than 403 for someone else's file: a 403 would confirm that the
  // id exists, which is a membership oracle over other instructors' data.
  if (!row) return new NextResponse(null, { status: 404 });

  const url = await getSignedUrl(
    s3Public(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: row.storage_key,
      // Always attachment. Serving user-uploaded bytes inline would let a file
      // execute as a document on the storage origin.
      ResponseContentDisposition: contentDisposition(row.file_name),
      ResponseContentType: row.content_type,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "private, no-store" },
  });
}

/**
 * RFC 6266 disposition. The ASCII fallback is stripped of quotes, backslashes
 * and control characters so a crafted filename cannot break out of the header,
 * and the UTF-8 form carries the real name.
 */
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
