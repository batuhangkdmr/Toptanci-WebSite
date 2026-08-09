import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminSaveUploadedImages } from "@/services/product-service";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const images = await adminSaveUploadedImages(user, id, body);
    return NextResponse.json({ images }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Görseller kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
