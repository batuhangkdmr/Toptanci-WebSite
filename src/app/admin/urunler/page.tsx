import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { ProductActiveToggle } from "@/components/admin/product-active-toggle";
import { getCurrentUser } from "@/lib/auth/session";
import { adminListProducts } from "@/services/product-service";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ürünler | Admin",
};

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

function formatStock(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 3,
  }).format(value);
}

export default async function AdminUrunlerPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q?.trim() || undefined;

  const result = await adminListProducts(user, { search, page });
  const totalPages = Math.max(1, Math.ceil(result.total / 20));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
            Ürünler
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Ürün kataloğunu yönetin.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/urunler/yeni">
            <Plus className="h-4 w-4" />
            Yeni Ürün
          </Link>
        </Button>
      </div>

      <form method="get" className="flex gap-2">
        <Input
          name="q"
          placeholder="Ürün, SKU veya barkod ara..."
          defaultValue={search ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Ara
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Barkod</th>
              <th className="px-4 py-3 font-medium">Birim</th>
              <th className="px-4 py-3 font-medium">Fiyat</th>
              <th className="px-4 py-3 font-medium">Stok</th>
              <th className="px-4 py-3 font-medium">Görsel</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((product) => (
              <tr key={product.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="mt-0.5 line-clamp-1 max-w-[220px] text-xs text-[var(--muted-foreground)]">
                      {product.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {product.categoryName ?? "—"}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {product.sku ?? "—"}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {product.barcode ?? "—"}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {product.unit ?? "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatStock(product.stockQuantity)}
                </td>
                <td className="px-4 py-3">
                  {product.images.length > 0 ? (
                    <Badge variant="secondary">{product.images.length}</Badge>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={product.isActive ? "success" : "secondary"}>
                    {product.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/urunler/${product.id}/duzenle`}
                      className="text-[var(--primary)] hover:underline"
                    >
                      Düzenle
                    </Link>
                    <ProductActiveToggle
                      productId={product.id}
                      isActive={product.isActive}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.items.length === 0 && (
          <p className="py-10 text-center text-[var(--muted-foreground)]">Ürün yok.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/urunler"
        searchParams={{ q: search }}
      />
    </div>
  );
}
