import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminGetCompany,
  adminSetCompanyActive,
  adminUpdateCompanyStatus,
} from "@/services/company-service";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id } = await params;
    const company = await adminGetCompany(user, id);
    return NextResponse.json(company);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firma alınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive === "boolean") {
      const result = await adminSetCompanyActive(user, id, body.isActive);
      return NextResponse.json(result);
    }

    const result = await adminUpdateCompanyStatus(user, id, body);
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
