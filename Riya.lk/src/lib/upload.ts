/**
 * Image upload & storage.
 *
 * Images are compressed in the browser first (browser-image-compression), then
 * posted to /api/upload which stores them:
 *   • on Cloudinary when CLOUDINARY_* env vars are set (recommended, required
 *     in production) — with an incoming transformation that caps the size at
 *     1600px and applies automatic quality, so originals stay small;
 *   • otherwise, in development only, under /public/uploads.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { ApiError } from "./api";
import { MAX_UPLOAD_BYTES } from "./constants";

export interface StoredImage {
  url: string;
  publicId: string | null;
  width: number | null;
  height: number | null;
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

export const cloudinaryEnabled = Boolean(
  cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Detects the real image type from the file's first bytes (don't trust the extension). */
function sniffImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

/** Validates and stores an uploaded image. `folder` is e.g. "ads" or "banners". */
export async function storeImage(file: File, folder: "ads" | "banners" | "branding"): Promise<StoredImage> {
  if (file.size === 0) throw new ApiError(400, "invalidImage");
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "imageTooLarge");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = sniffImageType(buffer);
  if (!ext) throw new ApiError(415, "invalidImage");

  if (cloudinaryEnabled) {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `riya/${folder}`,
            resource_type: "image",
            // Incoming transformation: cap dimensions & compress before storing.
            transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good" }],
          },
          (error, res) => (error || !res ? reject(error ?? new Error("Upload failed")) : resolve(res)),
        )
        .end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[upload] Cloudinary is not configured — uploads are disabled in production.");
    throw new ApiError(503, "uploadsNotConfigured");
  }

  // Development fallback: save into /public/uploads/<folder>/
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${folder}/${name}`, publicId: null, width: null, height: null };
}

/** Deletes a stored image (best effort — failures are logged, not thrown). */
export async function deleteImage(image: { url: string; publicId?: string | null }) {
  try {
    if (image.publicId && cloudinaryEnabled) {
      await cloudinary.uploader.destroy(image.publicId);
    } else if (image.url.startsWith("/uploads/")) {
      const file = path.join(process.cwd(), "public", path.normalize(image.url).replace(/^([/\\])+/, ""));
      if (file.startsWith(path.join(process.cwd(), "public", "uploads"))) await unlink(file);
    }
  } catch (err) {
    console.warn("[upload] Could not delete image", image.url, err);
  }
}

/** Only accept image URLs that we produced (our Cloudinary account or local uploads). */
export function isAllowedImageUrl(url: string): boolean {
  if (cloudName && url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`)) return true;
  return /^\/uploads\/(ads|banners|branding)\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(url);
}
