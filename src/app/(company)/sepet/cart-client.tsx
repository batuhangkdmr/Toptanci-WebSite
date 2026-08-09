"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { CartItemWithProduct } from "@/types";

interface CartClientProps {
  initialItems: CartItemWithProduct[];
  initialSubtotal: number;
}

export function CartClient({ initialItems, initialSubtotal }: CartClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [note, setNote] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);

  function recalc(next: CartItemWithProduct[]) {
    setItems(next);
    setSubtotal(
      next.reduce((sum, item) => {
        if (item.price === null) return sum;
        return sum + item.price * item.quantity;
      }, 0),
    );
  }

  async function updateQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setLoadingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      recalc(items.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
      toast.success(data.message || "Miktar güncellendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  }

  async function removeItem(itemId: string) {
    setLoadingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi.");
      recalc(items.filter((i) => i.id !== itemId));
      toast.success(data.message || "Ürün sepetten kaldırıldı.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  }

  async function placeOrder() {
    setOrdering(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerNote: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sipariş gönderilemedi.");
      toast.success(data.message || "Siparişiniz alındı.");
      router.push(data.order?.id ? `/siparisler/${data.order.id}` : "/siparisler");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setOrdering(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-white py-16 text-center">
        <p className="text-[var(--muted-foreground)]">Sepetiniz boş.</p>
        <Button asChild className="mt-4">
          <Link href="/urunler">Ürünlere git</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-lg border border-[var(--border)] bg-white p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[var(--muted)]">
              {item.primaryImageUrl ? (
                <Image
                  src={item.primaryImageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/urunler/${item.productSlug}`}
                    className="font-medium hover:text-[var(--primary)]"
                  >
                    {item.productName}
                  </Link>
                  {item.unit && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Birim: {item.unit}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-[var(--primary)]">
                  {formatCurrency(item.price)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-md border border-[var(--border)]">
                  <button
                    type="button"
                    className="px-2 py-1.5 disabled:opacity-40"
                    disabled={loadingId === item.id}
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    aria-label="Azalt"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-2 py-1.5 disabled:opacity-40"
                    disabled={loadingId === item.id}
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    aria-label="Artır"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <ConfirmButton
                  variant="ghost"
                  size="sm"
                  title="Ürünü kaldır"
                  description="Bu ürün sepetten silinecek. Emin misiniz?"
                  confirmLabel="Kaldır"
                  onConfirm={() => removeItem(item.id)}
                  disabled={loadingId === item.id}
                >
                  <Trash2 className="h-4 w-4" />
                  Kaldır
                </ConfirmButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-fit space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="font-semibold">Sipariş Özeti</h2>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">Ara toplam</span>
          <span className="font-semibold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Sipariş notu (isteğe bağlı)</Label>
          <Textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Teslimat veya özel notlarınız..."
          />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          Bu platformda ödeme alınmaz. Sipariş admin onayına gönderilir.
        </p>
        <Button className="w-full" size="lg" onClick={placeOrder} disabled={ordering}>
          {ordering ? "Gönderiliyor..." : "Siparişi Gönder"}
        </Button>
      </div>
    </div>
  );
}
