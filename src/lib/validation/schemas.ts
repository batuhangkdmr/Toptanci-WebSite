import { z } from "zod";

/** SQL Server UNIQUEIDENTIFIER (NEWSEQUENTIALID) RFC UUID versiyonu taşımayabilir */
const GUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const guidSchema = z
  .string()
  .regex(GUID_REGEX, "Geçersiz kimlik değeri.");

export const optionalGuidSchema = z.preprocess(
  (val) => {
    if (val === "" || val === undefined) return null;
    return val;
  },
  guidSchema.nullable(),
);

function optionalNumber() {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === "number") return Number.isFinite(val) ? val : null;
    if (typeof val === "string") {
      const normalized = val.trim().replace(",", ".");
      if (!normalized) return null;
      const n = Number(normalized);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, z.number().nullable());
}

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz."),
  password: z.string().min(1, "Şifre zorunludur."),
});

/** @deprecated Use registerSchema from register-schema.ts */
export { registerSchema } from "@/lib/validation/register-schema";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Geçerli bir e-posta giriniz.")
    .transform((v) => v.toLowerCase()),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
  phone: z.string().min(10, "Geçerli bir telefon giriniz.").optional().or(z.literal("")),
  companyPhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre zorunludur."),
    newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır."),
    newPasswordConfirm: z.string().min(8, "Yeni şifre tekrarı zorunludur."),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: "Yeni şifreler eşleşmiyor.",
    path: ["newPasswordConfirm"],
  });

export const categorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır."),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  imageCloudinaryPublicId: z
    .string()
    .max(500, "Cloudinary kimliği çok uzun.")
    .optional()
    .nullable()
    .or(z.literal("")),
  imageSecureUrl: z
    .string()
    .max(1000, "Görsel URL çok uzun.")
    .optional()
    .nullable()
    .or(z.literal("")),
  imageAltText: z
    .string()
    .max(250, "Alternatif metin en fazla 250 karakter olabilir.")
    .optional()
    .nullable()
    .or(z.literal("")),
  homepageSortOrder: z.coerce
    .number()
    .int("Sıra tam sayı olmalıdır.")
    .min(0, "Sıra negatif olamaz.")
    .optional()
    .default(0),
  showOnHomepage: z.boolean().optional().default(true),
  clearImage: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır."),
  categoryId: optionalGuidSchema,
  sku: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  price: optionalNumber(),
  stockQuantity: optionalNumber(),
  isActive: z.boolean().optional(),
});

export const cartAddSchema = z.object({
  productId: guidSchema,
  quantity: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır."),
});

export const cartUpdateSchema = z.object({
  quantity: z.coerce.number().positive("Miktar 0'dan büyük olmalıdır."),
});

export const createOrderSchema = z.object({
  customerNote: z.string().max(1000).optional().or(z.literal("")),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING_APPROVAL",
    "APPROVED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "REJECTED",
    "CANCELLED",
  ]),
  note: z.string().max(1000).optional().or(z.literal("")),
  adminNote: z.string().max(1000).optional().or(z.literal("")),
});

export const cancellationRequestSchema = z.object({
  reason: z.string().min(5, "İptal nedeni en az 5 karakter olmalıdır.").max(1000),
});

export const reviewCancellationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().max(1000).optional().or(z.literal("")),
});

export const updateCompanyStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]),
});
