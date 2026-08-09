import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminDeleteCarouselItem,
  adminUpdateCarouselItem,
} from "@/services/homepage-service";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id, itemId } = await params;
    const body = await request.json();
    const item = await adminUpdateCarouselItem(user, id, itemId, body);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id, itemId } = await params;
    const result = await adminDeleteCarouselItem(user, id, itemId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Silinemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
