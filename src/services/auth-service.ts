import "server-only";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation/register-schema";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validation/schemas";
import { withTransaction } from "@/lib/db/pool";
import { createCompany, updateCompanyProfile } from "@/repositories/company-repository";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  updateUserProfile,
} from "@/repositories/user-repository";
import { insertUserConsent } from "@/repositories/consent-repository";
import { siteConfig } from "@/lib/site-config";
import type { SessionUser } from "@/types";
import { assertApprovedCompany } from "@/lib/permissions";

export async function registerCompany(
  input: unknown,
  meta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const data = registerSchema.parse(input);

  const existing = await findUserByEmail(data.email);
  if (existing) {
    throw new Error("Bu e-posta adresi zaten kayıtlı.");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  await withTransaction(async (_request, transaction) => {
    const company = await createCompany(
      {
        companyName: data.companyName,
        taxNumber: null,
        taxOffice: null,
        email: data.email,
        phone: data.phone,
        city: data.cityName,
        district: data.districtName,
        address: null,
        cityCode: data.cityCode,
        districtCode: data.districtCode,
        country: data.country,
      },
      transaction,
    );

    const user = await createUser(
      {
        companyId: company.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: "COMPANY_USER",
        gender: data.gender,
        cityCode: data.cityCode,
        districtCode: data.districtCode,
        cityName: data.cityName,
        districtName: data.districtName,
      },
      transaction,
    );

    await insertUserConsent(transaction, {
      userId: user.id,
      docType: "MEMBERSHIP_AGREEMENT",
      documentVersion: siteConfig.legalVersions.MEMBERSHIP_AGREEMENT,
      accepted: true,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    await insertUserConsent(transaction, {
      userId: user.id,
      docType: "KVKK_NOTICE",
      documentVersion: siteConfig.legalVersions.KVKK_NOTICE,
      accepted: true,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    await insertUserConsent(transaction, {
      userId: user.id,
      docType: "COMMERCIAL_COMMUNICATION",
      documentVersion: siteConfig.legalVersions.COMMERCIAL_COMMUNICATION,
      accepted: !!data.acceptCommercial,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  });

  return {
    message: "Kaydınız alınmıştır, admin onayı bekleniyor.",
  };
}

export async function updateMyProfile(user: SessionUser, input: unknown) {
  assertApprovedCompany(user);
  const data = updateProfileSchema.parse(input);

  await updateUserProfile(user.id, {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
  });

  if (user.companyId) {
    await updateCompanyProfile(user.companyId, {
      phone: data.companyPhone || null,
      address: data.address || null,
      city: data.city || null,
      district: data.district || null,
    });
  }

  return { message: "Hesap bilgileriniz güncellendi." };
}

export async function changeMyPassword(user: SessionUser, input: unknown) {
  if (!user) throw new Error("Oturum gerekli.");
  const data = changePasswordSchema.parse(input);

  const dbUser = await findUserById(user.id);
  if (!dbUser) throw new Error("Kullanıcı bulunamadı.");

  const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
  if (!valid) throw new Error("Mevcut şifre hatalı.");

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await updateUserPassword(user.id, passwordHash);

  return { message: "Şifreniz güncellendi." };
}
