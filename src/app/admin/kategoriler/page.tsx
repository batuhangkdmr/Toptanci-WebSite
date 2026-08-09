import type { Metadata } from "next";
import { CategoriesClient } from "@/components/admin/categories-client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminListCategories } from "@/services/product-service";

export const metadata: Metadata = {
  title: "Kategoriler | Admin",
};

export default async function AdminKategorilerPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const categories = await adminListCategories(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Kategoriler
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Ürün kategorilerini yönetin.
        </p>
      </div>
      <CategoriesClient key={categories.map((c) => c.id).join(",")} initialCategories={categories} />
    </div>
  );
}
