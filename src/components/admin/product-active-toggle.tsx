"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { Button } from "@/components/ui/button";

export function ProductActiveToggle({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız.");
      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  if (isActive) {
    return (
      <ConfirmButton
        variant="ghost"
        size="sm"
        title="Ürünü pasifleştir"
        description="Ürün katalogda görünmez. Sipariş geçmişi korunur."
        confirmLabel="Pasifleştir"
        onConfirm={toggle}
      >
        Pasifleştir
      </ConfirmButton>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle}>
      Aktifleştir
    </Button>
  );
}
