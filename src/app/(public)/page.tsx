import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CatalogHeader } from "@/components/shared/catalog-header";
import { BannerCarousel } from "@/components/homepage/carousels";
import { ProductRailCarousel } from "@/components/homepage/product-rail";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth/session";
import { canPlaceOrders, isApprovedCompany } from "@/lib/permissions";
import { siteConfig } from "@/lib/site-config";
import { listCategories, findCategoryBySlug, listHomepageCategories } from "@/repositories/category-repository";
import { listProducts } from "@/repositories/product-repository";
import { getHomepageForPublic } from "@/services/homepage-service";
import { getMyCartCount } from "@/services/cart-service";
import { AutoCategoryCarousel } from "@/components/homepage/auto-category-carousel";
import type { PublicHomepageSection } from "@/types/homepage";
import { HOMEPAGE_CAROUSEL_TIMINGS } from "@/lib/homepage-carousel-timings";
import { PackageSearch, Search, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;
  const search = params.q?.trim() || undefined;
  const kategoriParam = params.kategori?.trim() || undefined;

  let categoryId: string | undefined;
  if (kategoriParam) {
    const bySlug = await findCategoryBySlug(kategoriParam);
    categoryId = bySlug?.id || (kategoriParam.match(/^[0-9a-f-]{36}$/i) ? kategoriParam : undefined);
  }

  const canOrder = canPlaceOrders(user);
  const approved = isApprovedCompany(user);

  const [categories, result, sections, cartCount, homepageCategories] =
    await Promise.all([
      listCategories(true),
      listProducts({
        search,
        categoryId,
        activeOnly: true,
        page,
        pageSize: 24,
      }),
      getHomepageForPublic().catch(() => [] as PublicHomepageSection[]),
      approved && user ? getMyCartCount(user) : Promise.resolve(0),
      listHomepageCategories().catch(() => []),
    ]);

  const totalPages = result.totalPages;

  const autoCategorySection = sections.find(
    (s) => s.sectionType === "AUTO_CATEGORY_CAROUSEL",
  );
  const showAutoCategories =
    autoCategorySection?.isActive !== false && homepageCategories.length > 0;
  const strip = sections.find((s) => s.sectionType === "CATEGORY_STRIP");
  const hero = sections.find((s) => s.sectionType === "HERO_BANNER");
  const side = sections.find((s) => s.sectionType === "SIDE_BANNER");
  const rails = sections.filter((s) => s.sectionType === "PRODUCT_RAIL");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--background)]">
      <Suspense fallback={<div className="h-28 border-b bg-white" />}>
        <CatalogHeader
          categories={categories}
          user={
            user
              ? {
                  firstName: user.firstName,
                  role: user.role,
                  companyStatus: user.companyStatus,
                  companyName: user.companyName,
                }
              : null
          }
          cartCount={cartCount}
          canOrder={canOrder}
        />
      </Suspense>

      <main className="flex-1 overflow-hidden">
        {showAutoCategories && (
          <AutoCategoryCarousel categories={homepageCategories} />
        )}

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:space-y-14 lg:py-10">
          {(hero?.carouselItems.length ||
            strip?.carouselItems.length ||
            side?.carouselItems.length) ? (
            <section className="rounded-[1.35rem] bg-white p-2.5 shadow-[var(--shadow-card)] sm:p-3 lg:p-4" aria-label="Öne çıkan kampanyalar">
            <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3 lg:gap-4">
              {/* Carousel 2 — ana banner */}
              <div className="lg:col-span-2">
                {hero && hero.carouselItems.length > 0 ? (
                  <BannerCarousel
                    items={hero.carouselItems}
                    aspectClass="aspect-[21/9]"
                    autoplayDelayMs={HOMEPAGE_CAROUSEL_TIMINGS.heroBanner.autoplayDelayMs}
                    autoplayStartDelayMs={
                      HOMEPAGE_CAROUSEL_TIMINGS.heroBanner.startDelayMs
                    }
                  />
                ) : (
                  <div className="aspect-[21/9] rounded-2xl bg-[var(--surface-subtle)]" aria-hidden />
                )}
              </div>

              {/* Carousel 1 (üst) + Carousel 3 (alt) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:h-full lg:flex-col lg:gap-4">
                {strip && strip.carouselItems.length > 0 ? (
                  <div className="min-h-[11rem] flex-1 sm:min-h-[12rem] lg:min-h-0">
                    <BannerCarousel
                      items={strip.carouselItems}
                      linked
                      fillHeight
                      className="h-full"
                      autoplayDelayMs={
                        HOMEPAGE_CAROUSEL_TIMINGS.categoryStrip.autoplayDelayMs
                      }
                      autoplayStartDelayMs={
                        HOMEPAGE_CAROUSEL_TIMINGS.categoryStrip.startDelayMs
                      }
                    />
                  </div>
                ) : null}
                {side && side.carouselItems.length > 0 ? (
                  <div className="min-h-[11rem] flex-1 sm:min-h-[12rem] lg:min-h-0">
                    <BannerCarousel
                      items={side.carouselItems}
                      fillHeight
                      className="h-full"
                      autoplayDelayMs={
                        HOMEPAGE_CAROUSEL_TIMINGS.sideBanner.autoplayDelayMs
                      }
                      autoplayStartDelayMs={
                        HOMEPAGE_CAROUSEL_TIMINGS.sideBanner.startDelayMs
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>
            </section>
          ) : null}


          {rails.map((rail, index) => (
            <div
              key={rail.id}
              className={index % 2 === 0 ? "rounded-[1.5rem] bg-white px-4 py-6 shadow-[var(--shadow-card)] sm:px-6 sm:py-7" : "py-1"}
            >
              <ProductRailCarousel
                title={rail.title}
                description={rail.description}
                showViewAll={rail.showViewAll}
                viewAllHref={rail.viewAllHref}
                products={rail.products}
                canOrder={canOrder}
              />
            </div>
          ))}

          <section id="urunler" className="scroll-mt-32 space-y-6 pb-6 lg:space-y-8 lg:pb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--primary)]">
                  <PackageSearch className="h-3.5 w-3.5" /> Ürün kataloğu
                </p>
                <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold tracking-[-0.02em] text-[var(--navy)] sm:text-3xl">
                  Tüm Ürünler
                </h2>
                <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
                {siteConfig.publicCatalogEnabled
                  ? "Aktif ürün kataloğu — sepete eklemek için giriş yapın."
                  : "Ürün kataloğu"}
                </p>
              </div>
              <p className="text-sm font-semibold text-[var(--muted-foreground)]">{result.total} ürün</p>
            </div>

            <form
              className="grid gap-3 rounded-2xl bg-[var(--navy)] p-3 shadow-[var(--shadow-floating)] sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end sm:p-4"
              method="get"
              action="/#urunler"
            >
              <div className="flex-1 space-y-1.5">
                <label htmlFor="q" className="text-xs font-semibold text-white/75">
                  Ara
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    id="q"
                    name="q"
                    placeholder="Ürün, SKU veya barkod ara..."
                    defaultValue={search ?? ""}
                    className="h-11 rounded-xl border-white/10 pl-10 shadow-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="kategori" className="text-xs font-semibold text-white/75">
                  Kategori
                </label>
                <select
                  id="kategori"
                  name="kategori"
                  defaultValue={
                    kategoriParam && categories.some((c) => c.slug === kategoriParam)
                      ? kategoriParam
                      : categories.find((c) => c.id === categoryId)?.slug || ""
                  }
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--teal)]"
                >
                  <option value="">Tüm kategoriler</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="h-11 rounded-xl bg-[var(--teal)] px-5 shadow-sm hover:bg-[var(--primary-hover)]">
                <SlidersHorizontal className="h-4 w-4" /> Filtrele
              </Button>
            </form>

            {result.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white py-16 text-center">
                <PackageSearch className="mx-auto h-9 w-9 text-[var(--muted-foreground)]/60" />
                <p className="mt-3 font-semibold text-[var(--navy)]">Ürün bulunamadı</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Arama veya kategori seçiminizi değiştirmeyi deneyin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 min-[375px]:grid-cols-3 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                {result.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    canOrder={canOrder}
                    variant="catalog"
                  />
                ))}
              </div>
            )}

            <Pagination
              page={result.page}
              totalPages={totalPages}
              basePath="/"
              searchParams={{ q: search, kategori: kategoriParam }}
              hash="urunler"
            />

            {!canOrder && (
              <p className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3 text-center text-sm text-[var(--muted-foreground)]">
                Sepete eklemek ve sipariş vermek için{" "}
                <Link href="/giris" className="font-medium text-[var(--primary)] underline">
                  giriş yapın
                </Link>{" "}
                veya{" "}
                <Link href="/kayit" className="font-medium text-[var(--primary)] underline">
                  kayıt olun
                </Link>
                .
              </p>
            )}
          </section>
        </div>
      </main>

    </div>
  );
}
