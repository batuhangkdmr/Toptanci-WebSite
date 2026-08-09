import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartClient } from "./cart-client";
import { getCurrentUser } from "@/lib/auth/session";
import { isApprovedCompany } from "@/lib/permissions";
import { getMyCart } from "@/services/cart-service";

export const metadata: Metadata = {
  title: "Sepet",
};

export default async function SepetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!isApprovedCompany(user)) {
    if (user.companyStatus === "PENDING") redirect("/onay-bekleniyor");
    redirect("/giris");
  }

  const { items, subtotal } = await getMyCart(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Sepet
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Siparişinizi gözden geçirin ve gönderin. Ödeme alınmaz.
        </p>
      </div>
      <CartClient initialItems={items} initialSubtotal={subtotal} />
    </div>
  );
}
