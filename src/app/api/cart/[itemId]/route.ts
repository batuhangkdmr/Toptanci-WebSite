import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateCartItem, removeFromCart } from "@/services/cart-service";
import { ZodError } from "zod";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { itemId } = await params;
    const body = await request.json();
    const result = await updateCartItem(user, itemId, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { itemId } = await params;
    const result = await removeFromCart(user, itemId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Silinemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
