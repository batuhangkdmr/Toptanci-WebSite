/** Tarayıcıda görseli küçültüp WebP’ye çevir — sunucuya gitmeden önce */

const MAX_EDGE = 1000;
const WEBP_QUALITY = 0.72;

export async function compressImageForUpload(file: File): Promise<File> {
  // Zaten küçük webp ise ekstra işlem yapma
  if (file.type === "image/webp" && file.size < 120_000) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );

    if (!blob) return file;

    // Sıkıştırma büyüttüyse orijinali kullan
    if (blob.size >= file.size && file.type === "image/webp") {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}

export async function compressImagesInParallel(
  files: File[],
  concurrency = 4,
): Promise<File[]> {
  const results: File[] = new Array(files.length);
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const current = index++;
      results[current] = await compressImageForUpload(files[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, () => worker()),
  );
  return results;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let done = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
      done += 1;
      onProgress?.(done, items.length);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length || 1) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
