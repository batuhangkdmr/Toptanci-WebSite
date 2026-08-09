"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderCancellationRequest } from "@/types";

export function AdminCancellationReview({
  request,
}: {
  request: OrderCancellationRequest;
}) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function review(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cancellation-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız.");
      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="font-semibold text-amber-900">Bekleyen iptal talebi</h2>
      <p className="text-sm text-amber-800 whitespace-pre-wrap">{request.reason}</p>
      <div className="space-y-2">
        <Label htmlFor="adminCancelNote">Admin notu (opsiyonel)</Label>
        <Textarea
          id="adminCancelNote"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Onay veya red notu..."
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={loading}
          onClick={() => review("APPROVED")}
        >
          İptali onayla
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => review("REJECTED")}
        >
          Talebi reddet
        </Button>
      </div>
    </div>
  );
}
