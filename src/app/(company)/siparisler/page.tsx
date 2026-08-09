import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/pagination";
import { getCurrentUser } from "@/lib/auth/session";
import { isApprovedCompany } from "@/lib/permissions";
import { getMyOrders } from "@/services/order-service";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = {
  title: "Siparişlerim",
};

function statusVariant(status: OrderStatus) {
  if (status === "DELIVERED" || status === "APPROVED") return "success" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "danger" as const;
  if (status === "PENDING_APPROVAL") return "warning" as const;
  return "secondary" as const;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SiparislerPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!isApprovedCompany(user)) {
    if (user.companyStatus === "PENDING") redirect("/onay-bekleniyor");
    redirect("/giris");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await getMyOrders(user, page);
  const totalPages = Math.max(1, Math.ceil(result.total / 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Siparişlerim
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Geçmiş siparişlerinizi ve durumlarını görüntüleyin.
        </p>
      </div>

      {result.items.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-white py-16 text-center">
          <p className="text-[var(--muted-foreground)]">Henüz siparişiniz yok.</p>
          <Link href="/urunler" className="mt-2 inline-block text-sm text-[var(--primary)] hover:underline">
            Ürünlere göz atın
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              <tr>
                <th className="px-4 py-3 font-medium">Sipariş No</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Tarih</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/siparisler/${order.id}`}
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-[var(--muted-foreground)] sm:table-cell">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(order.status)}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(order.grandTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} basePath="/siparisler" />
    </div>
  );
}
