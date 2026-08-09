import "server-only";
import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary ortam değişkenleri eksik. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET gerekli.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export function getCloudinaryFolder(): string {
  return process.env.CLOUDINARY_FOLDER || "toptanci-projesi";
}

export function getProductFolder(productId: string): string {
  return `${getCloudinaryFolder()}/products/${productId}`;
}

export function getHomepageFolder(sectionId: string): string {
  return `${getCloudinaryFolder()}/homepage/${sectionId}`;
}

export function getCategoryFolder(categoryId: string): string {
  return `${getCloudinaryFolder()}/categories/${categoryId}`;
}

export function isCategoryImagePublicId(
  publicId: string,
  categoryId: string,
): boolean {
  const prefix = getCategoryFolder(categoryId);
  return publicId === prefix || publicId.startsWith(`${prefix}/`);
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB (yükleme üst sınırı; saklanan dosya çok daha küçük olur)

/** Depolanan görsel için max kenar (px) — kart/detay için yeterli */
const STORE_MAX_EDGE = 1000;
/** Cloudinary quality: düşük = daha az yer. auto:eco agresif ama okunabilir */
const STORE_QUALITY = "auto:eco";

export async function uploadProductImage(
  buffer: Buffer,
  productId: string,
  mimeType: string,
): Promise<{
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes?: number;
}> {
  ensureConfigured();

  if (!ALLOWED_IMAGE_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Geçersiz görsel formatı. JPG, JPEG, PNG, WEBP veya AVIF olmalı.");
  }

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Görsel boyutu 10 MB'dan büyük olamaz.");
  }

  const folder = getProductFolder(productId);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: false,
        // Kaydı doğrudan WebP olarak sakla
        format: "webp",
        // Gelen dönüşüm: boyut küçült + sıkıştır + webp — orijinal yerine bu saklanır
        transformation: [
          {
            width: STORE_MAX_EDGE,
            height: STORE_MAX_EDGE,
            crop: "limit",
          },
          {
            fetch_format: "webp",
            quality: STORE_QUALITY,
            flags: "lossy",
          },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary yükleme başarısız."));
          return;
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width ?? 0,
          height: result.height ?? 0,
          format: result.format ?? "webp",
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export async function deleteCloudinaryFolder(productId: string): Promise<void> {
  ensureConfigured();
  const folder = getProductFolder(productId);
  try {
    await cloudinary.api.delete_resources_by_prefix(folder);
    await cloudinary.api.delete_folder(folder);
  } catch {
    // Folder may already be empty or not exist
  }
}

export async function checkCloudinaryConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    ensureConfigured();
    await cloudinary.api.ping();
    return { ok: true, message: "Cloudinary bağlantısı başarılı." };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen Cloudinary hatası";
    return { ok: false, message };
  }
}

export { cloudinary };
