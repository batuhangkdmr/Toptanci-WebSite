"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PendingApprovalCard({ companyName }: { companyName?: string | null }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16">
      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="h-7 w-7" />
          </div>
          <CardTitle>Onay Bekleniyor</CardTitle>
          <CardDescription>
            {companyName
              ? `"${companyName}" firması için kaydınız alınmıştır.`
              : "Kaydınız alınmıştır."}{" "}
            Hesabınız admin onayından sonra ürün kataloğuna ve sipariş
            işlemlerine erişebileceksiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Onaylandıktan sonra sayfayı yenileyin veya yeniden giriş yapın.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Durumu yenile
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => signOut({ callbackUrl: "/giris" })}
            >
              Çıkış yap
            </Button>
          </div>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Ana sayfa</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
