"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddToCartForm({
  productId,
  canOrder,
}: {
  productId: string;
  canOrder: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!canOrder) {
    return (
      <div className="flex flex-wrap gap-2 pt-2">
        <Button asChild size="lg">
          <Link href={`/giris?callbackUrl=/urunler`}>Giriş Yap / Sepete Ekle</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/kayit">Kayıt Ol</Link>
        </Button>
      </div>
    );
  }

  async function addToCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
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
    <div className="flex items-center gap-3 pt-2">
      <div className="flex items-center rounded-md border border-[var(--border)]">
        <button
          type="button"
          className="px-3 py-2"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-10 text-center font-medium">{qty}</span>
        <button
          type="button"
          className="px-3 py-2"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Artır"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button onClick={addToCart} disabled={loading} size="lg">
        <ShoppingCart className="h-4 w-4" />
        {loading ? "Ekleniyor..." : "Sepete Ekle"}
      </Button>
    </div>
  );
}
