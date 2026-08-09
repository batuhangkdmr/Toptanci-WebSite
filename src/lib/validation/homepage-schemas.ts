import { z } from "zod";
import { guidSchema, optionalGuidSchema } from "@/lib/validation/schemas";

export const homepageSectionTypeSchema = z.enum([
  "CATEGORY_STRIP",
  "HERO_BANNER",
  "SIDE_BANNER",
  "PRODUCT_RAIL",
  "AUTO_CATEGORY_CAROUSEL",
]);

export const homepageTargetTypeSchema = z.enum([
  "NONE",
  "CATEGORY",
  "PRODUCT",
  "URL",
]);

const optionalDate = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  return val;
}, z.coerce.date().nullable());

const optionalString = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null || val === "") return null;
  return val;
}, z.string().nullable().optional());

export const createHomepageSectionSchema = z.object({
  sectionType: homepageSectionTypeSchema,
  title: optionalString,
  description: optionalString,
  showViewAll: z.boolean().optional(),
  viewAllHref: optionalString,
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  startsAt: optionalDate.optional(),
  endsAt: optionalDate.optional(),
});

export const updateHomepageSectionSchema = z.object({
  sectionType: homepageSectionTypeSchema.optional(),
  title: optionalString,
  description: optionalString,
  showViewAll: z.boolean().optional(),
  viewAllHref: optionalString,
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  startsAt: optionalDate.optional(),
  endsAt: optionalDate.optional(),
});

export const createHomepageCarouselItemSchema = z.object({
  title: optionalString,
  description: optionalString,
  altText: optionalString,
  cloudinaryPublicId: optionalString,
  secureUrl: optionalString,
  mobileCloudinaryPublicId: optionalString,
  mobileSecureUrl: optionalString,
  categoryId: optionalGuidSchema.optional(),
  productId: optionalGuidSchema.optional(),
  targetType: homepageTargetTypeSchema.nullable().optional(),
  targetUrl: optionalString,
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: optionalDate.optional(),
  endsAt: optionalDate.optional(),
});

export const updateHomepageCarouselItemSchema =
  createHomepageCarouselItemSchema.partial();

export const setHomepageProductItemsSchema = z.object({
  productIds: z.array(guidSchema),
});

export const reorderHomepageSchema = z.object({
  orderedIds: z.array(guidSchema).min(1, "En az bir kimlik gerekli."),
});
