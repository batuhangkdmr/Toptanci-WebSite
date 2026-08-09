import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyOrders, placeOrder } from "@/services/order-service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const result = await getMyOrders(user, page);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Siparişler alınamadı.";
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
    const result = await placeOrder(user, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Sipariş oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
