import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  addToCart,
  getMyCart,
  removeFromCart,
  updateCartItem,
} from "@/services/cart-service";
import { ZodError } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const cart = await getMyCart(user);
    return NextResponse.json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sepet alınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const body = await request.json();
    const result = await addToCart(user, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Sepete eklenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const body = await request.json();
    const { itemId, quantity } = body;
    const result = await updateCartItem(user, itemId, { quantity });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "itemId gerekli." }, { status: 400 });
    }
    const result = await removeFromCart(user, itemId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Silinemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
