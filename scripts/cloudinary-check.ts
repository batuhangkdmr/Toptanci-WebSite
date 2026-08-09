import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

async function main() {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocal)) {
    const dotenv = await import("dotenv");
    dotenv.config({ path: envLocal, override: true });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "HATA: Cloudinary ortam değişkenleri eksik (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
    );
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log("Cloudinary bağlantısı kontrol ediliyor...");
  try {
    await cloudinary.api.ping();
    console.log("Cloudinary bağlantısı başarılı.");
  } catch (error) {
    console.error(
      "HATA:",
      error instanceof Error ? error.message : "Bilinmeyen hata",
    );
    process.exit(1);
  }
}

main();
