import "server-only";
import { assertAdmin } from "@/lib/permissions";
import { updateCompanyStatusSchema } from "@/lib/validation/schemas";
import {
  findCompanyById,
  listCompanies,
  setCompanyActive,
  updateCompanyStatus,
} from "@/repositories/company-repository";
import { listUsers, setUserActive } from "@/repositories/user-repository";
import type { SessionUser } from "@/types";

export async function adminListCompanies(
  user: SessionUser,
  options?: { status?: string; search?: string; page?: number },
) {
  assertAdmin(user);
  return listCompanies({
    status: options?.status as never,
    search: options?.search,
    page: options?.page ?? 1,
    pageSize: 20,
  });
}

export async function adminGetCompany(user: SessionUser, id: string) {
  assertAdmin(user);
  const company = await findCompanyById(id);
  if (!company) throw new Error("Firma bulunamadı.");
  return company;
}

export async function adminUpdateCompanyStatus(
  user: SessionUser,
  id: string,
  input: unknown,
) {
  assertAdmin(user);
  const data = updateCompanyStatusSchema.parse(input);
  const company = await findCompanyById(id);
  if (!company) throw new Error("Firma bulunamadı.");

  await updateCompanyStatus(id, data.status);
  return { message: "Firma durumu güncellendi." };
}

export async function adminDeactivateCompany(user: SessionUser, id: string) {
  assertAdmin(user);
  await setCompanyActive(id, false);
  return { message: "Firma pasifleştirildi." };
}

export async function adminListUsers(
  user: SessionUser,
  options?: { search?: string; page?: number },
) {
  assertAdmin(user);
  return listUsers({
    search: options?.search,
    page: options?.page ?? 1,
    pageSize: 20,
  });
}

export async function adminDeactivateUser(user: SessionUser, id: string) {
  assertAdmin(user);
  await setUserActive(id, false);
  return { message: "Kullanıcı pasifleştirildi." };
}

export async function adminSetUserActive(
  user: SessionUser,
  id: string,
  isActive: boolean,
) {
  assertAdmin(user);
  await setUserActive(id, isActive);
  return {
    message: isActive
      ? "Kullanıcı aktifleştirildi."
      : "Kullanıcı pasifleştirildi.",
  };
}

export async function adminSetCompanyActive(
  user: SessionUser,
  id: string,
  isActive: boolean,
) {
  assertAdmin(user);
  await setCompanyActive(id, isActive);
  return {
    message: isActive ? "Firma aktifleştirildi." : "Firma pasifleştirildi.",
  };
}
