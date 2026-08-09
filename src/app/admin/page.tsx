import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Package, ShoppingBag, Clock, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countActiveProducts } from "@/repositories/product-repository";
import { countCompaniesByStatus } from "@/repositories/company-repository";
import { countOrdersByStatus } from "@/repositories/order-repository";
import { listUsers } from "@/repositories/user-repository";
import { countPendingCancellations } from "@/repositories/cancellation-repository";
import { ORDER_STATUS_LABELS, COMPANY_STATUS_LABELS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const [productCount, companyCounts, orderCounts, users, pendingCancellations] =
    await Promise.all([
      countActiveProducts(),
      countCompaniesByStatus(),
      countOrdersByStatus(),
      listUsers({ page: 1, pageSize: 1 }),
      countPendingCancellations(),
    ]);

  const pendingOrders = orderCounts.PENDING_APPROVAL ?? 0;
  const pendingCompanies = companyCounts.PENDING ?? 0;
  const totalOrders = Object.values(orderCounts).reduce((a, b) => a + b, 0);

  const cards = [
    {
      title: "Aktif Ürünler",
      value: productCount,
      href: "/admin/urunler",
      icon: Package,
    },
    {
      title: "Onay Bekleyen Firmalar",
      value: pendingCompanies,
      href: "/admin/firmalar?status=PENDING",
      icon: Building2,
    },
    {
      title: "Onay Bekleyen Siparişler",
      value: pendingOrders,
      href: "/admin/siparisler?status=PENDING_APPROVAL",
      icon: Clock,
    },
    {
      title: "İptal Talepleri",
      value: pendingCancellations,
      href: "/admin/iptal-talepleri",
      icon: Ban,
    },
    {
      title: "Toplam Sipariş",
      value: totalOrders,
      href: "/admin/siparisler",
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Platform özeti ve hızlı erişim.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="transition hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-[var(--primary)]" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-[var(--navy)]">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Firma Durumları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(COMPANY_STATUS_LABELS) as Array<keyof typeof COMPANY_STATUS_LABELS>).map(
              (key) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    {COMPANY_STATUS_LABELS[key]}
                  </span>
                  <span className="font-medium">{companyCounts[key]}</span>
                </div>
              ),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sipariş Durumları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(ORDER_STATUS_LABELS) as Array<keyof typeof ORDER_STATUS_LABELS>).map(
              (key) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    {ORDER_STATUS_LABELS[key]}
                  </span>
                  <span className="font-medium">{orderCounts[key] ?? 0}</span>
                </div>
              ),
            )}
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Toplam kullanıcı</span>
              <span className="font-medium">{users.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
