import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PendingApprovalCard } from "./pending-card";
import { getCurrentUser } from "@/lib/auth/session";
import { isApprovedCompany } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Onay Bekleniyor",
};

export default async function OnayBekleniyorPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  if (isApprovedCompany(user)) {
    redirect("/");
  }

  if (user.companyStatus === "REJECTED" || user.companyStatus === "SUSPENDED") {
    redirect("/giris");
  }

  return <PendingApprovalCard companyName={user.companyName} />;
}
