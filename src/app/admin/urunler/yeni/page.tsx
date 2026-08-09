import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "../product-form";
import { getCurrentUser } from "@/lib/auth/session";
import { listCategories } from "@/repositories/category-repository";

export const metadata: Metadata = {
  title: "Yeni Ürün | Admin",
};

export default async function YeniUrunPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const categories = await listCategories(false);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/urunler" className="text-sm text-[var(--primary)] hover:underline">
          ← Ürünlere dön
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Yeni Ürün
        </h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
