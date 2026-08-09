import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "../../product-form";
import { getCurrentUser } from "@/lib/auth/session";
import { listCategories } from "@/repositories/category-repository";
import { adminGetProduct } from "@/services/product-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return { title: "Ürün Düzenle" };
    const product = await adminGetProduct(user, id);
    return { title: `${product.name} | Düzenle` };
  } catch {
    return { title: "Ürün Düzenle" };
  }
}

export default async function UrunDuzenlePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  let product;
  try {
    product = await adminGetProduct(user, id);
  } catch {
    notFound();
  }

  const categories = await listCategories(false);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/urunler" className="text-sm text-[var(--primary)] hover:underline">
          ← Ürünlere dön
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          {product.name}
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">Ürünü düzenle</p>
      </div>
      <ProductForm key={product.id} categories={categories} product={product} />
    </div>
  );
}
