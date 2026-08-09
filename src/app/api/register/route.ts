import { NextResponse } from "next/server";
import { registerCompany } from "@/services/auth-service";
import { ZodError } from "zod";

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerCompany(body, {
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "_form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return NextResponse.json(
        {
          error: error.issues[0]?.message || "Geçersiz veri.",
          fieldErrors,
        },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
