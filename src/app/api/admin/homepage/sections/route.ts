import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminCreateHomepageSection,
  adminListHomepageSections,
} from "@/services/homepage-service";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") !== "false";
    const sections = await adminListHomepageSections(user, includeInactive);
    return NextResponse.json(sections);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bölümler alınamadı.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const body = await request.json();
    const section = await adminCreateHomepageSection(user, body);
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
