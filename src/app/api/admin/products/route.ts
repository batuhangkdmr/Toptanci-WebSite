import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminCreateProduct, adminListProducts } from "@/services/product-service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const result = await adminListProducts(user, {
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page") || "1"),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürünler alınamadı.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const body = await request.json();
    const product = await adminCreateProduct(user, body);
    return NextResponse.json({ ...product, product }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || "Geçersiz veri.",
          issues: error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }
    console.error("POST /api/admin/products", error);
    const message = error instanceof Error ? error.message : "Ürün oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
