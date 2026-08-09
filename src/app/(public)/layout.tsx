import { listCategories } from "@/repositories/category-repository";
import { getCurrentUser } from "@/lib/auth/session";
import { isApprovedCompany } from "@/lib/permissions";
import { SiteFooter } from "@/components/shared/site-footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const categories = await listCategories(true).catch(() => []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--background)]">
      {children}
      <SiteFooter
        categories={categories}
        isLoggedIn={!!user}
        isApproved={isApprovedCompany(user)}
      />
    </div>
  );
}
