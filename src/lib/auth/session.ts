import "server-only";
import { auth } from "@/lib/auth";
import { findUserById } from "@/repositories/user-repository";
import { findCompanyById } from "@/repositories/company-repository";
import type { SessionUser } from "@/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await findUserById(session.user.id);
  if (!dbUser || !dbUser.isActive) return null;

  let companyStatus = session.user.companyStatus;
  let companyName = session.user.companyName;
  let companyId = dbUser.companyId;

  if (dbUser.role === "COMPANY_USER") {
    if (!dbUser.companyId) return null;
    const company = await findCompanyById(dbUser.companyId);
    if (!company || !company.isActive) return null;
    companyStatus = company.status;
    companyName = company.companyName;
    companyId = company.id;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    role: dbUser.role,
    companyId,
    companyStatus: dbUser.role === "ADMIN" ? null : companyStatus,
    companyName: dbUser.role === "ADMIN" ? null : companyName,
  };
}
