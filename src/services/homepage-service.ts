import "server-only";
import { assertAdmin } from "@/lib/permissions";
import { deleteCloudinaryImage } from "@/lib/cloudinary";
import {
  createHomepageCarouselItemSchema,
  createHomepageSectionSchema,
  setHomepageProductItemsSchema,
  updateHomepageCarouselItemSchema,
  updateHomepageSectionSchema,
} from "@/lib/validation/homepage-schemas";
import { guidSchema } from "@/lib/validation/schemas";
import {
  createCarouselItem,
  createSection,
  deleteCarouselItem,
  deleteProductItem,
  deleteSection,
  ensureDefaultSections,
  getCarouselItemById,
  getPublicHomepageData,
  getSectionById,
  listCarouselItems,
  listProductItems,
  listSections,
  setProductItems,
  updateCarouselItem,
  updateSection,
} from "@/repositories/homepage-repository";
import type { SessionUser } from "@/types";

async function deleteCarouselCloudinaryAssets(item: {
  cloudinaryPublicId: string | null;
  mobileCloudinaryPublicId: string | null;
}): Promise<void> {
  if (item.cloudinaryPublicId) {
    try {
      await deleteCloudinaryImage(item.cloudinaryPublicId);
    } catch {
      // Cloudinary resource may already be gone
    }
  }
  if (
    item.mobileCloudinaryPublicId &&
    item.mobileCloudinaryPublicId !== item.cloudinaryPublicId
  ) {
    try {
      await deleteCloudinaryImage(item.mobileCloudinaryPublicId);
    } catch {
      // Cloudinary resource may already be gone
    }
  }
}

export async function getHomepageForPublic() {
  return getPublicHomepageData();
}

export async function adminListHomepageSections(
  user: SessionUser,
  includeInactive = true,
) {
  assertAdmin(user);
  await ensureDefaultSections();
  return listSections(includeInactive);
}

export async function adminGetHomepageSection(user: SessionUser, id: string) {
  assertAdmin(user);
  const sectionId = guidSchema.parse(id);
  const section = await getSectionById(sectionId);
  if (!section) throw new Error("Bölüm bulunamadı.");
  return section;
}

export async function adminCreateHomepageSection(
  user: SessionUser,
  input: unknown,
) {
  assertAdmin(user);
  const data = createHomepageSectionSchema.parse(input);
  if (data.sectionType === "AUTO_CATEGORY_CAROUSEL") {
    throw new Error(
      "Otomatik kategori carousel’i yalnızca sistem tarafından oluşturulur.",
    );
  }
  return createSection({
    sectionType: data.sectionType,
    title: data.title ?? null,
    description: data.description ?? null,
    showViewAll: data.showViewAll,
    viewAllHref: data.viewAllHref ?? null,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
  });
}

export async function adminUpdateHomepageSection(
  user: SessionUser,
  id: string,
  input: unknown,
) {
  assertAdmin(user);
  const sectionId = guidSchema.parse(id);
  const data = updateHomepageSectionSchema.parse(input);
  const updated = await updateSection(sectionId, {
    sectionType: data.sectionType,
    title: data.title,
    description: data.description,
    showViewAll: data.showViewAll,
    viewAllHref: data.viewAllHref,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
  });
  if (!updated) throw new Error("Bölüm bulunamadı.");
  return updated;
}

export async function adminDeleteHomepageSection(user: SessionUser, id: string) {
  assertAdmin(user);
  const sectionId = guidSchema.parse(id);
  const section = await getSectionById(sectionId);
  if (!section) throw new Error("Bölüm bulunamadı.");

  const items = await listCarouselItems(sectionId);
  for (const item of items) {
    await deleteCarouselCloudinaryAssets(item);
  }

  const deleted = await deleteSection(sectionId);
  if (!deleted) throw new Error("Bölüm silinemedi.");
  return { message: "Bölüm silindi." };
}

export async function adminListCarouselItems(
  user: SessionUser,
  sectionId: string,
) {
  assertAdmin(user);
  const id = guidSchema.parse(sectionId);
  const section = await getSectionById(id);
  if (!section) throw new Error("Bölüm bulunamadı.");
  return listCarouselItems(id);
}

export async function adminCreateCarouselItem(
  user: SessionUser,
  sectionId: string,
  input: unknown,
) {
  assertAdmin(user);
  const id = guidSchema.parse(sectionId);
  const section = await getSectionById(id);
  if (!section) throw new Error("Bölüm bulunamadı.");

  const data = createHomepageCarouselItemSchema.parse(input);
  return createCarouselItem(id, {
    title: data.title ?? null,
    description: data.description ?? null,
    altText: data.altText ?? null,
    cloudinaryPublicId: data.cloudinaryPublicId ?? null,
    secureUrl: data.secureUrl ?? null,
    mobileCloudinaryPublicId: data.mobileCloudinaryPublicId ?? null,
    mobileSecureUrl: data.mobileSecureUrl ?? null,
    categoryId: data.categoryId ?? null,
    productId: data.productId ?? null,
    targetType: data.targetType ?? null,
    targetUrl: data.targetUrl ?? null,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
  });
}

export async function adminUpdateCarouselItem(
  user: SessionUser,
  sectionId: string,
  itemId: string,
  input: unknown,
) {
  assertAdmin(user);
  const sid = guidSchema.parse(sectionId);
  const iid = guidSchema.parse(itemId);
  const section = await getSectionById(sid);
  if (!section) throw new Error("Bölüm bulunamadı.");

  const existing = await getCarouselItemById(iid);
  if (!existing || existing.sectionId !== sid) {
    throw new Error("Öğe bulunamadı.");
  }

  const data = updateHomepageCarouselItemSchema.parse(input);
  const updated = await updateCarouselItem(iid, {
    title: data.title,
    description: data.description,
    altText: data.altText,
    cloudinaryPublicId: data.cloudinaryPublicId,
    secureUrl: data.secureUrl,
    mobileCloudinaryPublicId: data.mobileCloudinaryPublicId,
    mobileSecureUrl: data.mobileSecureUrl,
    categoryId: data.categoryId,
    productId: data.productId,
    targetType: data.targetType,
    targetUrl: data.targetUrl,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
  });
  if (!updated) throw new Error("Öğe bulunamadı.");
  return updated;
}

export async function adminDeleteCarouselItem(
  user: SessionUser,
  sectionId: string,
  itemId: string,
) {
  assertAdmin(user);
  const sid = guidSchema.parse(sectionId);
  const iid = guidSchema.parse(itemId);
  const section = await getSectionById(sid);
  if (!section) throw new Error("Bölüm bulunamadı.");

  const existing = await getCarouselItemById(iid);
  if (!existing || existing.sectionId !== sid) {
    throw new Error("Öğe bulunamadı.");
  }

  await deleteCarouselCloudinaryAssets(existing);
  const deleted = await deleteCarouselItem(iid);
  if (!deleted) throw new Error("Öğe silinemedi.");
  return { message: "Öğe silindi." };
}

export async function adminListProductItems(
  user: SessionUser,
  sectionId: string,
) {
  assertAdmin(user);
  const id = guidSchema.parse(sectionId);
  const section = await getSectionById(id);
  if (!section) throw new Error("Bölüm bulunamadı.");
  return listProductItems(id);
}

export async function adminSetProductItems(
  user: SessionUser,
  sectionId: string,
  input: unknown,
) {
  assertAdmin(user);
  const id = guidSchema.parse(sectionId);
  const section = await getSectionById(id);
  if (!section) throw new Error("Bölüm bulunamadı.");

  const data = setHomepageProductItemsSchema.parse(input);
  return setProductItems(id, data.productIds);
}

export async function adminDeleteProductItem(
  user: SessionUser,
  sectionId: string,
  itemId: string,
) {
  assertAdmin(user);
  const sid = guidSchema.parse(sectionId);
  const iid = guidSchema.parse(itemId);
  const section = await getSectionById(sid);
  if (!section) throw new Error("Bölüm bulunamadı.");

  const items = await listProductItems(sid);
  const existing = items.find((item) => item.id === iid);
  if (!existing) throw new Error("Ürün öğesi bulunamadı.");

  const deleted = await deleteProductItem(iid);
  if (!deleted) throw new Error("Ürün öğesi silinemedi.");
  return { message: "Ürün öğesi silindi." };
}
