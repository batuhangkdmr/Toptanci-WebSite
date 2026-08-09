import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AdminCancellationReview } from "@/components/admin/cancellation-review";
import { OrderStatusForm } from "./order-status-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getAdminOrderDetailWithCancellation } from "@/services/cancellation-service";
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
    const order = await getAdminOrderDetailWithCancellation(user, id);
    return { title: `${order.orderNumber} | Admin` };
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

export default async function AdminSiparisDetayPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  let order;
  try {
    order = await getAdminOrderDetailWithCancellation(user, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/siparisler" className="text-sm text-[var(--primary)] hover:underline">
          ← Siparişlere dön
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
            {order.orderNumber}
          </h1>
          <Badge variant={statusVariant(order.status)}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {order.companyName} · {order.createdByName} · {formatDate(order.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {order.pendingCancellation && (
            <AdminCancellationReview request={order.pendingCancellation} />
          )}

          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Ürün</th>
                  <th className="px-4 py-3 text-right font-medium">Fiyat</th>
                  <th className="px-4 py-3 text-right font-medium">Adet</th>
                  <th className="px-4 py-3 text-right font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.productNameSnapshot}</div>
                      {item.unitSnapshot && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {item.unitSnapshot}
                        </div>
                      )}
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
            <div className="flex justify-end border-t border-[var(--border)] px-4 py-3 text-sm">
              Genel toplam:{" "}
              <span className="ml-2 text-lg font-semibold text-[var(--primary)]">
                {formatCurrency(order.grandTotal)}
              </span>
            </div>
          </div>

          {order.customerNote && (
            <div className="rounded-lg border border-[var(--border)] bg-white p-4">
              <h2 className="text-sm font-semibold">Müşteri notu</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">
                {order.customerNote}
              </p>
            </div>
          )}

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

        <OrderStatusForm
          orderId={order.id}
          currentStatus={order.status}
          adminNote={order.adminNote ?? ""}
        />
      </div>
    </div>
  );
}
