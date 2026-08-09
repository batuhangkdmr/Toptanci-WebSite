import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminCreateCategory,
  adminListCategories,
} from "@/services/product-service";
import { ZodError } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const categories = await adminListCategories(user);
    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kategoriler alınamadı.";
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
    const category = await adminCreateCategory(user, body);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
