"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type StorageBucket = "exercises" | "gate-assessments" | "gate-attempts";

export type AllowedFileType = "pdf" | "docx" | "zip";

export type UploadResult = {
  path: string;
  url: string;
  fileName: string;
  fileType: AllowedFileType;
};

export const DEFAULT_ALLOWED: AllowedFileType[] = ["pdf", "docx", "zip"];
export const MAX_BYTES = 20 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 60;

const MIME_MAP: Record<AllowedFileType, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  zip: ["application/zip", "application/x-zip-compressed"],
};

/** Build a comma-separated accept="..." string for a file input. */
export function buildAcceptAttribute(allowed: AllowedFileType[] = DEFAULT_ALLOWED) {
  const exts = allowed.map((t) => `.${t}`);
  const mimes = allowed.flatMap((t) => MIME_MAP[t]);
  return [...exts, ...mimes].join(",");
}

/** Human-readable list used in validation errors ("PDF, DOCX, or ZIP"). */
export function describeAllowed(allowed: AllowedFileType[] = DEFAULT_ALLOWED) {
  const upper = allowed.map((t) => t.toUpperCase());
  if (upper.length === 1) return upper[0];
  if (upper.length === 2) return `${upper[0]} or ${upper[1]}`;
  return `${upper.slice(0, -1).join(", ")}, or ${upper[upper.length - 1]}`;
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildObjectPath(folder: string, fileName: string) {
  return `${folder}/${Date.now()}_${sanitizeFileName(fileName)}`;
}

export function getFileType(file: File): AllowedFileType | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "docx" || ext === "zip") {
    return ext;
  }
  return null;
}

export type ValidationError = {
  code: "type" | "size";
  message: string;
};

export function validateFile(
  file: File,
  allowed: AllowedFileType[] = DEFAULT_ALLOWED
): ValidationError | null {
  const type = getFileType(file);
  if (!type || !allowed.includes(type)) {
    return {
      code: "type",
      message: `Only ${describeAllowed(allowed)} files are allowed.`,
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      code: "size",
      message: "File too large. Maximum size is 20MB.",
    };
  }
  return null;
}

type UploadOptions = {
  allowed?: AllowedFileType[];
  onProgress?: (percent: number) => void;
};

/**
 * Upload a file to a private bucket and return its object path + a fresh
 * short-lived signed URL. Validates extension + size client-side. Throws a
 * friendly Error on any failure (raw Supabase messages are console-logged).
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: File,
  folder: string,
  opts: UploadOptions = {}
): Promise<UploadResult> {
  const allowed = opts.allowed ?? DEFAULT_ALLOWED;

  const invalid = validateFile(file, allowed);
  if (invalid) {
    throw new Error(invalid.message);
  }

  const type = getFileType(file) as AllowedFileType;
  const path = buildObjectPath(folder, file.name);
  const supabase = getSupabaseBrowserClient();

  const { data: authData } = await supabase.auth.getSession();
  const accessToken = authData.session?.access_token;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (opts.onProgress && accessToken && supabaseUrl) {
    // XHR path → real upload progress.
    await xhrUpload({
      url: `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`,
      accessToken,
      file,
      onProgress: opts.onProgress,
    });
  } else {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || MIME_MAP[type][0],
      });

    if (error) {
      console.error("[Storage error]", error.message);
      throw new Error(translateUploadError(error.message));
    }
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (signedError || !signed?.signedUrl) {
    console.error("[Storage error]", signedError?.message);
    throw new Error("Upload succeeded but could not create download link.");
  }

  return {
    path,
    url: signed.signedUrl,
    fileName: file.name,
    fileType: type,
  };
}

/** Fresh signed URL for an existing object path (1h TTL). */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    console.error("[Storage error]", error?.message);
    throw new Error("Download failed. Please try again.");
  }
  return data.signedUrl;
}

/** Remove a file from storage. */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[Storage error]", error.message);
    throw new Error("Could not delete file. Please try again.");
  }
}

function translateUploadError(raw: string) {
  const msg = raw.toLowerCase();
  if (msg.includes("exceeded the maximum") || msg.includes("payload too large")) {
    return "File too large. Maximum size is 20MB.";
  }
  if (msg.includes("mime") || msg.includes("not supported")) {
    return "Only PDF, DOCX, or ZIP files are allowed.";
  }
  if (msg.includes("duplicate") || msg.includes("already exists")) {
    return "A file with that name already exists. Try again.";
  }
  return "Upload failed. Please check your connection.";
}

type XhrUploadArgs = {
  url: string;
  accessToken: string;
  file: File;
  onProgress: (percent: number) => void;
};

function xhrUpload({ url, accessToken, file, onProgress }: XhrUploadArgs) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    if (file.type) {
      xhr.setRequestHeader("content-type", file.type);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        let msg = xhr.responseText;
        try {
          const parsed = JSON.parse(xhr.responseText) as { message?: string };
          msg = parsed.message ?? msg;
        } catch {
          // ignore parse errors; fallback to raw response
        }
        console.error("[Storage error]", msg);
        reject(new Error(translateUploadError(msg)));
      }
    };

    xhr.onerror = () => {
      console.error("[Storage error] network error");
      reject(new Error("Upload failed. Please check your connection."));
    };

    xhr.send(file);
  });
}
