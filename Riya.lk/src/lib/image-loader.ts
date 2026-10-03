"use client";

/**
 * Custom next/image loader.
 *
 * Cloudinary images are resized & converted on Cloudinary's CDN (f_auto,q_auto),
 * so our server never has to optimise them. Other images (local uploads, Google
 * avatars) are served as-is.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.includes("res.cloudinary.com") && src.includes("/image/upload/")) {
    const params = ["f_auto", quality ? `q_${quality}` : "q_auto", `w_${width}`, "c_limit"].join(",");
    return src.replace("/image/upload/", `/image/upload/${params}/`);
  }
  // Include the width so each srcset entry is distinct (the file server ignores it).
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
