import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkDatabaseConnection } from "@/lib/db";
import { checkCloudinaryConnection } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "Ayarlar | Admin",
};

export default async function AdminAyarlarPage() {
  const [db, cloudinary] = await Promise.all([
    checkDatabaseConnection(),
    checkCloudinaryConnection().catch((err) => ({
      ok: false,
      message: err instanceof Error ? err.message : "Cloudinary hatası",
    })),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Ayarlar
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Platform yapılandırması ve bağlantı durumu.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Genel</CardTitle>
            <CardDescription>Uygulama bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Platform adı</span>
              <span className="font-medium">Toptancı</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Ödeme</span>
              <span className="font-medium">Kapalı (sipariş only)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Varsayılan dil</span>
              <span className="font-medium">Türkçe</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Uygulama URL</span>
              <span className="font-medium">
                {process.env.NEXT_PUBLIC_APP_URL || "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bağlantı Durumu</CardTitle>
            <CardDescription>Harici servisler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--muted-foreground)]">MSSQL</span>
              <Badge variant={db.ok ? "success" : "danger"}>
                {db.ok ? "Bağlı" : "Hata"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">{db.message}</p>
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[var(--muted-foreground)]">Cloudinary</span>
              <Badge variant={cloudinary.ok ? "success" : "danger"}>
                {cloudinary.ok ? "Bağlı" : "Hata"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">{cloudinary.message}</p>
            <div className="flex justify-between pt-2">
              <span className="text-[var(--muted-foreground)]">Cloudinary klasör</span>
              <span className="font-medium">
                {process.env.CLOUDINARY_FOLDER || "toptanci-projesi"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
