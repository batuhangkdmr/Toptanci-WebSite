import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CancellationRequestForm } from "@/components/orders/cancellation-request-form";
import { getCurrentUser } from "@/lib/auth/session";
import { isApprovedCompany } from "@/lib/permissions";
import { getMyOrderDetailWithCancellation } from "@/services/cancellation-service";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return { title: "Sipariş" };
    const order = await getMyOrderDetailWithCancellation(user, id);
    return { title: `Sipariş ${order.orderNumber}` };
  } catch {
    return { title: "Sipariş" };
  }
}

function statusVariant(status: OrderStatus) {
  if (status === "DELIVERED" || status === "APPROVED") return "success" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "danger" as const;
  if (status === "PENDING_APPROVAL") return "warning" as const;
  return "secondary" as const;
}

export default async function SiparisDetayPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!isApprovedCompany(user)) {
    if (user.companyStatus === "PENDING") redirect("/onay-bekleniyor");
    redirect("/giris");
  }

  const { id } = await params;
  let order;
  try {
    order = await getMyOrderDetailWithCancellation(user, id);
  } catch {
    redirect("/siparisler");
  }

  return (
    <div className="space-y-6">
      <Link href="/siparisler" className="text-sm text-[var(--primary)] hover:underline">
        ← Siparişlere dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge variant={statusVariant(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Birim</th>
              <th className="px-4 py-3 text-right font-medium">Fiyat</th>
              <th className="px-4 py-3 text-right font-medium">Adet</th>
              <th className="px-4 py-3 text-right font-medium">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{item.productNameSnapshot}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {item.unitSnapshot ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-[var(--border)] px-4 py-3">
          <p className="text-sm">
            Genel toplam:{" "}
            <span className="text-lg font-semibold text-[var(--primary)]">
              {formatCurrency(order.grandTotal)}
            </span>
          </p>
        </div>
      </div>

      {order.customerNote && (
        <div className="rounded-lg border border-[var(--border)] bg-white p-4">
          <h2 className="text-sm font-semibold">Sipariş notunuz</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
            {order.customerNote}
          </p>
        </div>
      )}

      <CancellationRequestForm
        orderId={order.id}
        orderStatus={order.status}
        pendingRequest={order.pendingCancellation}
      />

      {order.history.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Durum geçmişi</h2>
          <ol className="space-y-3">
            {order.history.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm">
                <span className="shrink-0 text-[var(--muted-foreground)]">
                  {formatDate(h.createdAt)}
                </span>
                <span>
                  {h.oldStatus
                    ? `${ORDER_STATUS_LABELS[h.oldStatus]} → ${ORDER_STATUS_LABELS[h.newStatus]}`
                    : ORDER_STATUS_LABELS[h.newStatus]}
                  {h.note && (
                    <span className="block text-[var(--muted-foreground)]">{h.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
