"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HomepageCreateRailForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("Başlık en az 2 karakter olmalı.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: "PRODUCT_RAIL",
          title: trimmed,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Oluşturulamadı.");

      toast.success("Ürün vitrini oluşturuldu.");
      setTitle("");
      router.refresh();
      if (data.id) {
        router.push(`/admin/anasayfa/${data.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-white p-4"
    >
      <div className="min-w-[220px] flex-1 space-y-2">
        <Label htmlFor="railTitle">Yeni Ürün Vitrini</Label>
        <Input
          id="railTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Öne Çıkan Ürünler"
          minLength={2}
          required
        />
      </div>
      <Button type="submit" disabled={loading || title.trim().length < 2}>
        {loading ? "Oluşturuluyor..." : "Ekle"}
      </Button>
    </form>
  );
}
