import { redirect } from "next/navigation";
import { CompanyHeader } from "@/components/shared/company-header";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin, isApprovedCompany } from "@/lib/permissions";
import { getMyCartCount } from "@/services/cart-service";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  if (isAdmin(user)) {
    redirect("/admin");
  }

  if (user.role === "COMPANY_USER") {
    if (user.companyStatus === "REJECTED" || user.companyStatus === "SUSPENDED") {
      redirect("/giris");
    }
  }

  const approved = isApprovedCompany(user);
  const pending = user.role === "COMPANY_USER" && user.companyStatus === "PENDING";
  const cartCount = approved ? await getMyCartCount(user) : 0;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--background)]">
      {approved && (
        <CompanyHeader companyName={user.companyName} cartCount={cartCount} />
      )}
      {pending && (
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
            <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[var(--navy)]">
              Toptancı
            </span>
          </div>
        </header>
      )}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
