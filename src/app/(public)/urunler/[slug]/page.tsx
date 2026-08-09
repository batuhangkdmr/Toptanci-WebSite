import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImageCarousel } from "@/components/products/product-image-carousel";
import { AddToCartForm } from "@/components/products/add-to-cart-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { canPlaceOrders, canViewCatalog } from "@/lib/permissions";
import { siteConfig } from "@/lib/site-config";
import { findProductWithImagesBySlug } from "@/repositories/product-repository";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductWithImagesBySlug(slug);
  return { title: product?.name ?? "Ürün" };
}

export default async function UrunDetayPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!siteConfig.publicCatalogEnabled && !canViewCatalog(user)) {
    notFound();
  }

  const { slug } = await params;
  const product = await findProductWithImagesBySlug(slug);
  if (!product || !product.isActive) notFound();

  const canOrder = canPlaceOrders(user);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
      <Link href="/#urunler" className="text-sm text-[var(--primary)] hover:underline">
        ← Ürünlere dön
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductImageCarousel
          images={product.images}
          productName={product.name}
          size="detail"
          className="overflow-hidden rounded-xl border border-[var(--border)]"
        />

        <div className="space-y-5">
          {product.categoryName && (
            <Badge variant="secondary">{product.categoryName}</Badge>
          )}
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[var(--navy)]">
            {product.name}
          </h1>

          <p className="text-2xl font-semibold text-[var(--primary)]">
            {formatCurrency(product.price)}
          </p>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {product.unit && (
              <div>
                <dt className="text-[var(--muted-foreground)]">Birim</dt>
                <dd className="font-medium">{product.unit}</dd>
              </div>
            )}
            {product.sku && (
              <div>
                <dt className="text-[var(--muted-foreground)]">SKU</dt>
                <dd className="font-medium">{product.sku}</dd>
              </div>
            )}
            {product.barcode && (
              <div>
                <dt className="text-[var(--muted-foreground)]">Barkod</dt>
                <dd className="font-medium">{product.barcode}</dd>
              </div>
            )}
            {product.stockQuantity !== null && (
              <div>
                <dt className="text-[var(--muted-foreground)]">Stok</dt>
                <dd className="font-medium">{product.stockQuantity}</dd>
              </div>
            )}
          </dl>

          {product.description && (
            <div className="prose prose-sm max-w-none text-[var(--foreground)]">
              <h2 className="text-base font-semibold">Açıklama</h2>
              <p className="whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">
                {product.description}
              </p>
            </div>
          )}

          {product.price !== null && (
            <AddToCartForm productId={product.id} canOrder={canOrder} />
          )}

          {product.price === null && (
            <p className="rounded-md bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
              Fiyat için iletişime geçiniz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
