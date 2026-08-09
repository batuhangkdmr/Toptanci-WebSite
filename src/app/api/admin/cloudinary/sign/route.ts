import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/permissions";
import { getProductFolder } from "@/lib/cloudinary";
import { findProductById } from "@/repositories/product-repository";
import { guidSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    assertAdmin(user);

    const body = z.object({ productId: guidSchema }).parse(await request.json());
    const product = await findProductById(body.productId);
    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary yapılandırması eksik." },
        { status: 500 },
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const timestamp = Math.round(Date.now() / 1000);
    const folder = getProductFolder(body.productId);

    // İstemci zaten WebP sıkıştırdığı için ekstra transformation imzalamıyoruz (daha hızlı)
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "İmza oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
