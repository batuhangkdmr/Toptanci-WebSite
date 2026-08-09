"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("E-posta veya şifre hatalı.");
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        if (session?.user?.companyStatus === "PENDING") {
          toast.info("Hesabınız admin onayı bekliyor.");
          router.push("/onay-bekleniyor");
        } else if (session?.user?.role === "ADMIN") {
          toast.success("Giriş başarılı.");
          router.push("/admin");
        } else {
          toast.success("Giriş başarılı.");
          router.push("/");
        }
        router.refresh();
      }
    } catch {
      toast.error("Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giriş Yap</CardTitle>
        <CardDescription>Firma hesabınızla platforma giriş yapın.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="firma@ornek.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="font-medium text-[var(--primary)] hover:underline">
            Kayıt olun
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
