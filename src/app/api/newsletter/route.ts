import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { subscribeNewsletter } from "@/services/newsletter-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forwarded = request.headers.get("x-forwarded-for");
    const result = await subscribeNewsletter(body, {
      ipAddress: forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz e-posta." },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
