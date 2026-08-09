import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { changeMyPassword } from "@/services/auth-service";
import { ZodError } from "zod";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const body = await request.json();
    const result = await changeMyPassword(user, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Şifre güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
