"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız.");
      toast.success(data.message);
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        placeholder="E-posta adresinizi giriniz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 rounded-xl border-white/15 bg-white px-4 text-[var(--foreground)] shadow-sm focus-visible:ring-white/70"
        aria-label="E-bülten e-posta adresi"
      />
      <Button type="submit" disabled={loading} className="h-12 shrink-0 rounded-xl bg-[var(--teal)] px-6 font-bold text-white shadow-sm hover:bg-[var(--primary-hover)]">
        {loading ? "Kaydediliyor..." : "Kayıt Ol"}
      </Button>
    </form>
  );
}
