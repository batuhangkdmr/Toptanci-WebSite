import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminOrders } from "@/services/order-service";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = {
  title: "Siparişler | Admin",
};

function statusVariant(status: OrderStatus) {
  if (status === "DELIVERED" || status === "APPROVED") return "success" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "danger" as const;
  if (status === "PENDING_APPROVAL") return "warning" as const;
  return "secondary" as const;
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminSiparislerPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status || undefined;

  const result = await getAdminOrders(user, { status, page });
  const totalPages = Math.max(1, Math.ceil(result.total / 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Siparişler
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Gelen siparişleri inceleyin ve durumlarını güncelleyin.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        >
          <option value="">Tüm durumlar</option>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Sipariş No</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Firma</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Tarih</th>
              <th className="px-4 py-3 text-right font-medium">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((order) => (
              <tr key={order.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/siparisler/${order.id}`}
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{order.companyName}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(order.status)}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-[var(--muted-foreground)] lg:table-cell">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(order.grandTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.items.length === 0 && (
          <p className="py-10 text-center text-[var(--muted-foreground)]">Sipariş yok.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/siparisler"
        searchParams={{ status }}
      />
    </div>
  );
}
