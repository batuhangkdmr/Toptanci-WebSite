import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminListCancellationRequests } from "@/services/cancellation-service";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const result = await adminListCancellationRequests(user, {
      status: searchParams.get("status") || "PENDING",
      page: Number(searchParams.get("page") || "1"),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Talepler alınamadı.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
