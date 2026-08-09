"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { Button } from "@/components/ui/button";

export function UserActions({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();

  async function setActive(next: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
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
        title="Kullanıcıyı pasifleştir"
        description="Bu kullanıcı giriş yapamayacak. Devam etmek istiyor musunuz?"
        confirmLabel="Pasifleştir"
        onConfirm={() => setActive(false)}
      >
        Pasifleştir
      </ConfirmButton>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setActive(true)}>
      Aktifleştir
    </Button>
  );
}
