"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus } from "@/types";

export function OrderStatusForm({
  orderId,
  currentStatus,
  adminNote: initialAdminNote,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  adminNote: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState(initialAdminNote);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      toast.success(data.message || "Sipariş durumu güncellendi.");
      setNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="h-fit space-y-4 rounded-lg border border-[var(--border)] bg-white p-5"
    >
      <h2 className="font-semibold">Durum Güncelle</h2>
      <div className="space-y-2">
        <Label htmlFor="status">Sipariş durumu</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        >
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Geçmiş notu</Label>
        <Textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Durum değişikliği notu..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminNote">Admin notu</Label>
        <Textarea
          id="adminNote"
          rows={3}
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Dahili not..."
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Güncelle"}
      </Button>
    </form>
  );
}
