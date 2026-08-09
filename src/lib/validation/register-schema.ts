import { z } from "zod";
import { isValidCityDistrict, getCityByCode, findDistrict } from "@/data/turkey-locations";
import { normalizeTurkishPhone } from "@/lib/phone";
import { siteConfig } from "@/lib/site-config";

export const genderSchema = z.enum(["MALE", "FEMALE", "UNSPECIFIED"], {
  message: "Geçerli bir cinsiyet seçiniz.",
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Ad en az 2 karakter olmalıdır."),
    lastName: z
      .string()
      .trim()
      .min(2, "Soyad en az 2 karakter olmalıdır."),
    gender: genderSchema,
    phone: z.string().min(10, "Geçerli bir cep telefonu giriniz."),
    email: z
      .string()
      .trim()
      .email("Geçerli bir e-posta giriniz.")
      .transform((v) => v.toLowerCase()),
    companyName: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    country: z.literal("TR").or(z.literal("Türkiye")).default("TR"),
    cityCode: z.string().min(1, "İl seçiniz."),
    districtCode: z.string().min(1, "İlçe seçiniz."),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
    passwordConfirm: z.string().min(8, "Şifre tekrarı zorunludur."),
    acceptMembership: z.boolean(),
    acceptKvkk: z.boolean(),
    acceptCommercial: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const phone = normalizeTurkishPhone(data.phone);
    if (!phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefon Türkiye cep formatında olmalıdır (05xx...).",
        path: ["phone"],
      });
    }

    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Şifreler eşleşmiyor.",
        path: ["passwordConfirm"],
      });
    }

    if (!getCityByCode(data.cityCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Geçersiz il seçimi.",
        path: ["cityCode"],
      });
    }

    if (!isValidCityDistrict(data.cityCode, data.districtCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seçilen ilçe ile il eşleşmiyor.",
        path: ["districtCode"],
      });
    }

    if (!data.acceptMembership) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Üyelik Sözleşmesi onayı zorunludur.",
        path: ["acceptMembership"],
      });
    }

    if (!data.acceptKvkk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "KVKK Aydınlatma Metni onayı zorunludur.",
        path: ["acceptKvkk"],
      });
    }

    if (siteConfig.requireCommercialConsent && !data.acceptCommercial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ticari elektronik ileti izni zorunludur.",
        path: ["acceptCommercial"],
      });
    }
  })
  .transform((data) => {
    const city = getCityByCode(data.cityCode)!;
    const district = findDistrict(data.cityCode, data.districtCode)!;
    const phone = normalizeTurkishPhone(data.phone)!;
    const companyName =
      data.companyName?.trim() ||
      `${data.firstName} ${data.lastName}`.trim() ||
      "Bireysel Üye";

    return {
      ...data,
      phone,
      companyName,
      cityName: city.name,
      districtName: district.name,
      country: "Türkiye" as const,
    };
  });

export type RegisterInput = z.infer<typeof registerSchema>;
