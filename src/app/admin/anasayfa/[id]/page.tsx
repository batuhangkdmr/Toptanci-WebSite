import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HomepageSectionEditor } from "@/components/admin/homepage-section-editor";
import { getCurrentUser } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/permissions";
import { listCategories } from "@/repositories/category-repository";
import { listProducts } from "@/repositories/product-repository";
import {
  adminGetHomepageSection,
  adminListCarouselItems,
  adminListProductItems,
} from "@/services/homepage-service";
import type { HomepageSectionType } from "@/types/homepage";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SECTION_TYPE_LABELS: Record<HomepageSectionType, string> = {
  AUTO_CATEGORY_CAROUSEL: "Otomatik Kategori Carousel’i",
  CATEGORY_STRIP: "Kategori Şeridi (Carousel 1)",
  HERO_BANNER: "Ana Banner (Carousel 2)",
  SIDE_BANNER: "Yan Banner (Carousel 3)",
  PRODUCT_RAIL: "Ürün Vitrini (Carousel 4)",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return { title: "Bölüm Düzenle | Admin" };
    const section = await adminGetHomepageSection(user, id);
    const label = SECTION_TYPE_LABELS[section.sectionType];
    return { title: `${section.title || label} | Admin` };
  } catch {
    return { title: "Bölüm Düzenle | Admin" };
  }
}

export default async function AdminAnasayfaDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  assertAdmin(user);

  const { id } = await params;

  let section;
  try {
    section = await adminGetHomepageSection(user, id);
  } catch {
    notFound();
  }

  if (section.sectionType === "AUTO_CATEGORY_CAROUSEL") {
    redirect("/admin/kategoriler");
  }

  const isProductRail = section.sectionType === "PRODUCT_RAIL";

  const [items, productItems, categories, productsResult] = await Promise.all([
    isProductRail ? Promise.resolve([]) : adminListCarouselItems(user, id),
    isProductRail ? adminListProductItems(user, id) : Promise.resolve([]),
    isProductRail
      ? Promise.resolve([])
      : listCategories(false),
    isProductRail
      ? listProducts({ activeOnly: true, page: 1, pageSize: 500 })
      : Promise.resolve({ items: [], total: 0 }),
  ]);

  const typeLabel = SECTION_TYPE_LABELS[section.sectionType];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/anasayfa"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          ← Ana sayfa yönetimine dön
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          {section.title || typeLabel}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">{typeLabel}</p>
      </div>

      <HomepageSectionEditor
        key={section.id}
        section={section}
        initialItems={items}
        initialProductIds={productItems.map((p) => p.productId)}
        categories={categories}
        products={productsResult.items}
      />
    </div>
  );
}
