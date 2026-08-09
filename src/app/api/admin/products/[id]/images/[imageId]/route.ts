import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminDeleteProductImage,
  adminSetPrimaryImage,
} from "@/services/product-service";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { imageId } = await params;
    const result = await adminDeleteProductImage(user, imageId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Silinemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id, imageId } = await params;
    const result = await adminSetPrimaryImage(user, id, imageId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
