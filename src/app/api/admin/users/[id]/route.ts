import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminSetUserActive } from "@/services/company-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    const result = await adminSetUserActive(user, id, body.isActive);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
