import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { AdminCancellationReview } from "@/components/admin/cancellation-review";
import { getCurrentUser } from "@/lib/auth/session";
import { adminListCancellationRequests } from "@/services/cancellation-service";
import { CANCELLATION_STATUS_LABELS, formatDate } from "@/lib/utils";
import type { CancellationRequestStatus } from "@/types";

export const metadata: Metadata = {
  title: "İptal Talepleri | Admin",
};

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminIptalTalepleriPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const status = (params.status as CancellationRequestStatus | undefined) || "PENDING";
  const page = Math.max(1, Number(params.page) || 1);

  const result = await adminListCancellationRequests(user, { status, page });
  const totalPages = Math.max(1, Math.ceil(result.total / 20));

  const filters: Array<{ value: string; label: string }> = [
    { value: "PENDING", label: "Bekleyen" },
    { value: "APPROVED", label: "Onaylanan" },
    { value: "REJECTED", label: "Reddedilen" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          İptal Talepleri
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Firma iptal taleplerini inceleyin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            asChild
            variant={status === f.value ? "default" : "outline"}
            size="sm"
          >
            <Link href={`/admin/iptal-talepleri?status=${f.value}`}>{f.label}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {result.items.map((req) => (
          <div
            key={req.id}
            className="rounded-lg border border-[var(--border)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/admin/siparisler/${req.orderId}`}
                  className="font-semibold text-[var(--primary)] hover:underline"
                >
                  {req.orderNumber}
                </Link>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {req.companyName} · {req.requestedByName} · {formatDate(req.createdAt)}
                </p>
              </div>
              <Badge variant={req.status === "PENDING" ? "warning" : "secondary"}>
                {CANCELLATION_STATUS_LABELS[req.status]}
              </Badge>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{req.reason}</p>
            {req.status === "PENDING" ? (
              <div className="mt-4">
                <AdminCancellationReview request={req} />
              </div>
            ) : (
              req.adminNote && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Admin notu: {req.adminNote}
                </p>
              )
            )}
          </div>
        ))}
        {result.items.length === 0 && (
          <p className="py-10 text-center text-[var(--muted-foreground)]">
            Kayıt bulunamadı.
          </p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/iptal-talepleri"
        searchParams={{ status }}
      />
    </div>
  );
}
