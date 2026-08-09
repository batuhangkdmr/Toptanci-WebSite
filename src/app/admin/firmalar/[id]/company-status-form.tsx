"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { COMPANY_STATUS_LABELS } from "@/lib/utils";
import type { CompanyStatus } from "@/types";

export function CompanyStatusForm({
  companyId,
  currentStatus,
  isActive,
}: {
  companyId: string;
  currentStatus: CompanyStatus;
  isActive: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<CompanyStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      toast.success(data.message || "Firma durumu güncellendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  return (
    <div className="h-fit space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="font-semibold">Durum Güncelle</h2>
        <div className="space-y-2">
          <Label htmlFor="status">Firma durumu</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CompanyStatus)}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
          >
            {(Object.keys(COMPANY_STATUS_LABELS) as CompanyStatus[]).map((s) => (
              <option key={s} value={s}>
                {COMPANY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={loading || status === currentStatus}>
          {loading ? "Kaydediliyor..." : "Durumu Kaydet"}
        </Button>
      </form>

      <div className="border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-sm text-[var(--muted-foreground)]">
          Hesap: {isActive ? "Aktif" : "Pasif"}
        </p>
        {isActive ? (
          <ConfirmButton
            variant="outline"
            title="Firmayı pasifleştir"
            description="Firma kullanıcıları giriş yapamaz. Devam?"
            confirmLabel="Pasifleştir"
            onConfirm={toggleActive}
          >
            Firmayı pasifleştir
          </ConfirmButton>
        ) : (
          <Button variant="outline" onClick={toggleActive}>
            Firmayı aktifleştir
          </Button>
        )}
      </div>
    </div>
  );
}
