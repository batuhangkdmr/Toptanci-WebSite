"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, LockKeyhole, Minus, Plus, ShoppingCart } from "lucide-react";
import { ProductPrimaryImage } from "@/components/products/product-primary-image";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProductWithImages } from "@/types";

interface ProductCardProps {
  product: ProductWithImages;
  canOrder: boolean;
  variant?: "catalog" | "featured";
}

export function ProductCard({
  product,
  canOrder,
  variant = "catalog",
}: ProductCardProps) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const hasPrice = product.price !== null;

  async function addToCart(quantity = qty) {
    if (!hasPrice) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
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
    <article
      className={cn(
        "group/card flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white shadow-sm lg:rounded-2xl lg:shadow-[var(--shadow-card)] lg:transition-[transform,box-shadow,border-color] lg:duration-300 lg:hover:-translate-y-1 lg:hover:border-[var(--teal)]/25 lg:hover:shadow-[var(--shadow-card-hover)]",
        variant === "featured" && "border-[var(--teal)]/15",
      )}
    >
      <Link
        href={`/urunler/${product.slug}`}
        aria-label={`${product.name} ürününü görüntüle`}
        tabIndex={-1}
      >
        <ProductPrimaryImage images={product.images} productName={product.name} />
      </Link>

      <div className="flex flex-1 flex-col p-2 lg:p-5">
        <div className="space-y-1 lg:space-y-2">
          {product.categoryName && (
            <p className="hidden text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--primary)] lg:block">
              {product.categoryName}
            </p>
          )}
          <Link
            href={`/urunler/${product.slug}`}
            title={product.name}
            className="line-clamp-2 min-h-8 break-words text-[11px] font-bold leading-4 text-[var(--navy)] transition-colors hover:text-[var(--primary)] lg:min-h-12 lg:text-base lg:leading-6"
          >
            {product.name}
          </Link>
          {product.unit && (
            <p className="truncate text-[9px] text-[var(--muted-foreground)] lg:text-xs">
              <span className="lg:hidden">{product.unit}</span>
              <span className="hidden lg:inline">Satış birimi: </span>
              <span className="hidden font-semibold text-[var(--foreground)] lg:inline">{product.unit}</span>
            </p>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-2 lg:space-y-3 lg:pt-5">
          <div className="flex min-w-0 items-center justify-between gap-1 lg:flex-wrap lg:gap-2">
            <span
              className={cn(
                "min-w-0 truncate whitespace-nowrap text-xs font-extrabold tracking-[-0.02em] lg:text-2xl",
                hasPrice ? "text-[var(--navy)]" : "text-[var(--muted-foreground)]",
              )}
            >
              {formatCurrency(product.price)}
            </span>
            {product.stockQuantity !== null && (
              <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/10 lg:inline-flex">
                Stok {product.stockQuantity}
              </span>
            )}

            {hasPrice && canOrder && (
              <button
                type="button"
                onClick={() => addToCart(1)}
                disabled={loading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 disabled:cursor-wait disabled:opacity-60 lg:hidden"
                aria-label={`${product.name} ürününü sepete ekle`}
              >
                {loading ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            )}

            {hasPrice && !canOrder && (
              <Link
                href={`/giris?callbackUrl=/urunler/${product.slug}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--teal)]/30 bg-[var(--teal)]/5 text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:hidden"
                aria-label={`${product.name} ürününü sepete eklemek için giriş yap`}
              >
                <LockKeyhole className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>

          {hasPrice && canOrder && (
            <div className="hidden items-center gap-2 lg:flex">
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
              <Button className="h-10 min-w-0 flex-1 rounded-xl px-3 font-bold shadow-sm" size="sm" onClick={() => addToCart()} disabled={loading}>
                <ShoppingCart className="h-4 w-4" />
                <span className="truncate">{loading ? "Ekleniyor..." : "Sepete Ekle"}</span>
              </Button>
            </div>
          )}

          {hasPrice && !canOrder && (
            <Button asChild className="hidden h-10 w-full rounded-xl border-[var(--teal)]/35 bg-[var(--teal)]/5 font-bold text-[var(--primary)] hover:bg-[var(--teal)]/10 lg:inline-flex" size="sm" variant="outline">
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
