"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { ProductImageCarousel } from "@/components/products/product-image-carousel";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithImages } from "@/types";

interface ProductCardProps {
  product: ProductWithImages;
  canOrder: boolean;
}

export function ProductCard({ product, canOrder }: ProductCardProps) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const hasPrice = product.price !== null;

  async function addToCart() {
    if (!hasPrice) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sepete eklenemedi.");
      toast.success(data.message || "Ürün sepete eklendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-white shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--teal)]/25 hover:shadow-[var(--shadow-card-hover)]">
      {/* Carousel kart dışına tıklamadan bağımsız kaydırılır */}
      <ProductImageCarousel images={product.images} productName={product.name} />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="space-y-2">
          {product.categoryName && (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary)]">
              {product.categoryName}
            </p>
          )}
          <Link
            href={`/urunler/${product.slug}`}
            className="line-clamp-2 min-h-12 text-[15px] font-bold leading-6 text-[var(--navy)] transition-colors hover:text-[var(--primary)] sm:text-base"
          >
            {product.name}
          </Link>
          {product.unit && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Satış birimi: <span className="font-semibold text-[var(--foreground)]">{product.unit}</span>
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-xl font-extrabold tracking-[-0.02em] sm:text-2xl ${hasPrice ? "text-[var(--navy)]" : "text-[var(--muted-foreground)]"}`}
            >
              {formatCurrency(product.price)}
            </span>
            {product.stockQuantity !== null && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/10">
                Stok {product.stockQuantity}
              </span>
            )}
          </div>

          {hasPrice && canOrder && (
            <div className="flex flex-col gap-2 min-[360px]:flex-row min-[360px]:items-center">
              <div className="flex h-10 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/70 min-[360px]:justify-start">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-l-xl text-[var(--muted-foreground)] transition hover:bg-white hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Azalt"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-7 text-center text-sm font-bold">{qty}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-r-xl text-[var(--muted-foreground)] transition hover:bg-white hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Artır"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button className="h-10 min-w-0 flex-1 rounded-xl px-3 font-bold shadow-sm" size="sm" onClick={addToCart} disabled={loading}>
                <ShoppingCart className="h-4 w-4" />
                <span className="truncate">{loading ? "Ekleniyor..." : "Sepete Ekle"}</span>
              </Button>
            </div>
          )}

          {hasPrice && !canOrder && (
            <Button asChild className="h-10 w-full rounded-xl border-[var(--teal)]/35 bg-[var(--teal)]/5 font-bold text-[var(--primary)] hover:bg-[var(--teal)]/10" size="sm" variant="outline">
              <Link href={`/giris?callbackUrl=/urunler/${product.slug}`}>
                Giriş Yap / Sepete Ekle
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
