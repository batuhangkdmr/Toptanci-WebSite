import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForms } from "./profile-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { isApprovedCompany } from "@/lib/permissions";
import { findCompanyById } from "@/repositories/company-repository";
import { findUserById } from "@/repositories/user-repository";

export const metadata: Metadata = {
  title: "Hesabım",
};

export default async function HesabimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!isApprovedCompany(user)) {
    if (user.companyStatus === "PENDING") redirect("/onay-bekleniyor");
    redirect("/giris");
  }

  const [dbUser, company] = await Promise.all([
    findUserById(user.id),
    user.companyId ? findCompanyById(user.companyId) : null,
  ]);

  if (!dbUser) redirect("/giris");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Hesabım
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Profil ve şifre bilgilerinizi güncelleyin.
        </p>
      </div>

      <ProfileForms
        profile={{
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          email: dbUser.email,
          phone: dbUser.phone ?? "",
          companyName: company?.companyName ?? "",
          companyPhone: company?.phone ?? "",
          address: company?.address ?? "",
          city: company?.city ?? "",
          district: company?.district ?? "",
        }}
      />
    </div>
  );
}
