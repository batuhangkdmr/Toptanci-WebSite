import type { CompanyStatus, SessionUser, UserRole } from "@/types";
import { siteConfig } from "@/lib/site-config";

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export function isCompanyUser(user: SessionUser | null | undefined): boolean {
  return user?.role === "COMPANY_USER";
}

export function isApprovedCompany(user: SessionUser | null | undefined): boolean {
  return (
    isCompanyUser(user) &&
    user?.companyStatus === "APPROVED" &&
    !!user.companyId
  );
}

/** Ürün görüntüleme: public katalog açıksa herkes; kapalıysa onaylı firma/admin */
export function canViewCatalog(user: SessionUser | null | undefined): boolean {
  if (siteConfig.publicCatalogEnabled) return true;
  return isAdmin(user) || isApprovedCompany(user);
}

export function canAccessProducts(user: SessionUser | null | undefined): boolean {
  return canViewCatalog(user);
}

/** Sepet / sipariş yalnızca onaylı firma kullanıcısı */
export function canPlaceOrders(user: SessionUser | null | undefined): boolean {
  return isApprovedCompany(user);
}

export function canAccessCompanyResource(
  user: SessionUser | null | undefined,
  companyId: string,
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.companyId === companyId;
}

export function assertAdmin(user: SessionUser | null | undefined): asserts user is SessionUser {
  if (!user || user.role !== "ADMIN") {
    throw new Error("Bu işlem için admin yetkisi gereklidir.");
  }
}

export function assertApprovedCompany(
  user: SessionUser | null | undefined,
): asserts user is SessionUser {
  if (!isApprovedCompany(user)) {
    throw new Error("Bu işlem için onaylı firma hesabı gereklidir.");
  }
}

export function assertRole(
  user: SessionUser | null | undefined,
  roles: UserRole[],
): asserts user is SessionUser {
  if (!user || !roles.includes(user.role)) {
    throw new Error("Yetkiniz yok.");
  }
}

export function companyStatusAllowsLogin(status: CompanyStatus | null | undefined): boolean {
  return status === "APPROVED";
}
