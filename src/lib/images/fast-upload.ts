"use client";

import {
  compressImagesInParallel,
  mapWithConcurrency,
} from "@/lib/images/client-compress";
import type { ProductImage } from "@/types";

interface SignPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

interface PendingUpload {
  file: File;
  isPrimary: boolean;
}

async function getUploadSign(productId: string): Promise<SignPayload> {
  const res = await fetch("/api/admin/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Yükleme imzası alınamadı.");
  return data as SignPayload;
}

async function uploadDirectToCloudinary(
  file: File,
  sign: SignPayload,
): Promise<{
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("signature", sign.signature);
  fd.append("folder", sign.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Cloudinary yükleme başarısız.");
  }
  return data;
}

/**
 * Görselleri tarayıcıda sıkıştırıp Cloudinary’ye paralel yükler,
 * ardından tek istekte veritabanına kaydeder.
 */
export async function uploadProductImagesFast(
  productId: string,
  items: PendingUpload[],
  onProgress?: (phase: string, done: number, total: number) => void,
): Promise<ProductImage[]> {
  if (items.length === 0) return [];

  onProgress?.("Sıkıştırılıyor", 0, items.length);
  const compressed = await compressImagesInParallel(
    items.map((i) => i.file),
    4,
  );
  onProgress?.("Sıkıştırılıyor", items.length, items.length);

  const sign = await getUploadSign(productId);

  onProgress?.("Yükleniyor", 0, items.length);
  const uploaded = await mapWithConcurrency(
    compressed,
    4, // 4 paralel Cloudinary yüklemesi
    async (file, index) => {
      const result = await uploadDirectToCloudinary(file, sign);
      return {
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width ?? null,
        height: result.height ?? null,
        format: result.format ?? "webp",
        isPrimary: items[index].isPrimary,
        sortOrder: items[index].isPrimary ? 0 : index + 1,
      };
    },
    (done, total) => onProgress?.("Yükleniyor", done, total),
  );

  // Birincil yoksa ilk görseli birincil yap
  if (!uploaded.some((u) => u.isPrimary) && uploaded.length > 0) {
    uploaded[0].isPrimary = true;
    uploaded[0].sortOrder = 0;
  }

  onProgress?.("Kaydediliyor", items.length, items.length);
  const res = await fetch(`/api/admin/products/${productId}/images/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: uploaded }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Görseller kaydedilemedi.");

  return data.images as ProductImage[];
}
