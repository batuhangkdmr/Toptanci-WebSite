"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderCancellationRequest, OrderStatus } from "@/types";

const CANCELLABLE: OrderStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PREPARING",
];

export function CancellationRequestForm({
  orderId,
  orderStatus,
  pendingRequest,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  pendingRequest?: OrderCancellationRequest | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (pendingRequest) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-900">İptal talebi bekleniyor</h2>
        <p className="mt-1 text-sm text-amber-800 whitespace-pre-wrap">
          {pendingRequest.reason}
        </p>
        <p className="mt-2 text-xs text-amber-700">
          Talebiniz admin onayına gönderildi.
        </p>
      </div>
    );
  }

  if (!CANCELLABLE.includes(orderStatus)) {
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancellation-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Talep gönderilemedi.");
      toast.success(data.message || "İptal talebi gönderildi.");
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-4"
    >
      <h2 className="text-sm font-semibold">İptal talebi oluştur</h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Siparişinizi iptal etmek istiyorsanız nedeninizi yazın. Talep admin
        onayından sonra işleme alınır.
      </p>
      <div className="space-y-2">
        <Label htmlFor="cancelReason">İptal nedeni</Label>
        <Textarea
          id="cancelReason"
          required
          minLength={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="İptal nedeninizi yazın..."
        />
      </div>
      <Button type="submit" variant="destructive" disabled={loading}>
        {loading ? "Gönderiliyor..." : "İptal Talebi Gönder"}
      </Button>
    </form>
  );
}
