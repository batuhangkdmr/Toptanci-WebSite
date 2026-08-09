import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { HomepageCreateRailForm } from "@/components/admin/homepage-create-rail-form";
import { getCurrentUser } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/permissions";
import { adminListHomepageSections } from "@/services/homepage-service";
import { Layers, Image as ImageIcon, LayoutGrid, PackageOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Ana Sayfa Yönetimi | Admin",
};

export default async function AdminAnasayfaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  assertAdmin(user);

  const sections = await adminListHomepageSections(user);

  const autoCategory = sections.find((s) => s.sectionType === "AUTO_CATEGORY_CAROUSEL");
  const heroBanner = sections.find((s) => s.sectionType === "HERO_BANNER");
  const categoryStrip = sections.find((s) => s.sectionType === "CATEGORY_STRIP");
  const sideBanner = sections.find((s) => s.sectionType === "SIDE_BANNER");
  const productRails = sections.filter((s) => s.sectionType === "PRODUCT_RAIL");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Ana Sayfa Yönetimi
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Ana sayfanın görünüm yerleşimine birebir uygun olarak carousel ve vitrin alanlarını yönetin.
        </p>
      </div>

      {/* 1. Otomatik Kategori Carousel'i */}
      {autoCategory && (
        <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-[var(--teal)]/10 p-2.5 text-[var(--teal)]">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--teal)]">
                  Üst Kısım
                </span>
                <h2 className="font-semibold text-[var(--navy)]">
                  {autoCategory.title || "Otomatik Kategori Carousel’i"}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  Aktif ve ana sayfada gösterilen kategorilerden otomatik oluşturulur.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={autoCategory.isActive ? "success" : "secondary"}>
                {autoCategory.isActive ? "Aktif" : "Pasif"}
              </Badge>
              <Link
                href="/admin/kategoriler"
                className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Kategorileri Yönet →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero, Category Strip & Side Banner (Ana Sayfa Üst Yerleşim Izgarası) */}
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-[var(--navy)]">Ana Banner ve Yan Şerit Alanı (Üst Yerleşim)</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Ana sayfanın üst kısmındaki büyük banner, kategori şeridi ve yan banner yerleşimini aşağıdan yönetebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {/* Sol / Ana Banner (Hero Banner - 2 Sütun) */}
          <div className="lg:col-span-2">
            {heroBanner ? (
              <Link
                href={`/admin/anasayfa/${heroBanner.id}`}
                className="group flex h-full flex-col justify-between rounded-lg border-2 border-dashed border-[var(--border)] bg-white p-6 transition hover:border-[var(--teal)] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-blue-50 p-2.5 text-blue-600">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Carousel 2 — Sol Büyük Ana Banner (Hero)
                      </span>
                      <h3 className="mt-1 text-lg font-semibold text-[var(--navy)]">
                        {heroBanner.title || "Ana Banner"}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {heroBanner.description || "Ana sayfanın en dikkat çekici büyük kayan banner alanı."}
                      </p>
                    </div>
                  </div>
                  <Badge variant={heroBanner.isActive ? "success" : "secondary"}>
                    {heroBanner.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-medium text-[var(--primary)] group-hover:underline">
                  <span>Banner Görsellerini Yönet</span>
                  <span>Düzenle →</span>
                </div>
              </Link>
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-[var(--muted-foreground)]">
                Ana Banner (Hero) bölümü bulunamadı.
              </div>
            )}
          </div>

          {/* Sağ (Üstte Kategori Şeridi, Altta Yan Banner) */}
          <div className="flex flex-col gap-4">
            {/* Kategori Şeridi (Category Strip) */}
            {categoryStrip ? (
              <Link
                href={`/admin/anasayfa/${categoryStrip.id}`}
                className="group flex flex-1 flex-col justify-between rounded-lg border-2 border-dashed border-[var(--border)] bg-white p-5 transition hover:border-[var(--teal)] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="rounded-md bg-amber-50 p-2 text-amber-600">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Carousel 1 — Sağ Üst Kategori Şeridi
                      </span>
                      <h3 className="mt-0.5 font-semibold text-[var(--navy)]">
                        {categoryStrip.title || "Kategori Şeridi"}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Sağ sütunun üst kısmındaki hızlı kategori carousel’i.
                      </p>
                    </div>
                  </div>
                  <Badge variant={categoryStrip.isActive ? "success" : "secondary"}>
                    {categoryStrip.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs font-medium text-[var(--primary)] group-hover:underline">
                  <span>Şerit Öğelerini Yönet</span>
                  <span>Düzenle →</span>
                </div>
              </Link>
            ) : null}

            {/* Yan Banner (Side Banner) */}
            {sideBanner ? (
              <Link
                href={`/admin/anasayfa/${sideBanner.id}`}
                className="group flex flex-1 flex-col justify-between rounded-lg border-2 border-dashed border-[var(--border)] bg-white p-5 transition hover:border-[var(--teal)] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="rounded-md bg-purple-50 p-2 text-purple-600">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                        Carousel 3 — Sağ Alt Yan Banner
                      </span>
                      <h3 className="mt-0.5 font-semibold text-[var(--navy)]">
                        {sideBanner.title || "Yan Banner"}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Sağ sütunun alt kısmındaki kampanya/duyuru alanı.
                      </p>
                    </div>
                  </div>
                  <Badge variant={sideBanner.isActive ? "success" : "secondary"}>
                    {sideBanner.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs font-medium text-[var(--primary)] group-hover:underline">
                  <span>Yan Banner Görsellerini Yönet</span>
                  <span>Düzenle →</span>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* 3. Ürün Vitrinleri (Product Rails) */}
      <div className="space-y-4 pt-4 border-t border-[var(--border)]">
        <div>
          <h2 className="font-semibold text-[var(--navy)]">Ürün Vitrinleri (Carousel 4 / Ürün Rail Alanları)</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Ana sayfada banner alanlarının altında listelenen yatay ürün kaydırma vitrinlerini buradan oluşturun ve yönetin.
          </p>
        </div>

        <HomepageCreateRailForm />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {productRails.map((rail) => (
            <Link
              key={rail.id}
              href={`/admin/anasayfa/${rail.id}`}
              className="group flex flex-col justify-between rounded-lg border border-[var(--border)] bg-white p-5 transition hover:border-[var(--teal)] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-md bg-teal-50 p-2 text-[var(--teal)]">
                    <PackageOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">
                      Ürün Vitrini (Rail)
                    </span>
                    <h3 className="mt-0.5 font-semibold text-[var(--navy)]">
                      {rail.title || "Vitrin"}
                    </h3>
                    {rail.description && (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                        {rail.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={rail.isActive ? "success" : "secondary"}>
                  {rail.isActive ? "Aktif" : "Pasif"}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-sm font-medium text-[var(--primary)] group-hover:underline">
                <span>Vitrin Ürünlerini Yönet</span>
                <span>Düzenle →</span>
              </div>
            </Link>
          ))}
        </div>

        {productRails.length === 0 && (
          <p className="rounded-lg border border-[var(--border)] bg-white py-8 text-center text-sm text-[var(--muted-foreground)]">
            Henüz eklenmiş ürün vitrini bulunmuyor. Yukarıdan yeni vitrin oluşturabilirsiniz.
          </p>
        )}
      </div>
    </div>
  );
}
