import "server-only";
import { assertAdmin } from "@/lib/permissions";
import { categorySchema, productSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import {
  createCategory,
  findCategoryBySlug,
  listCategories,
  setCategoryActive,
  updateCategory,
  findCategoryById,
} from "@/repositories/category-repository";
import {
  addProductImage,
  createProduct,
  deleteAllProductImages,
  deleteProductImage,
  findProductById,
  findProductBySlug,
  findProductImageById,
  findProductWithImages,
  getProductImages,
  listProducts,
  setPrimaryImage,
  setProductActive,
  updateProduct,
} from "@/repositories/product-repository";
import {
  deleteCloudinaryFolder,
  deleteCloudinaryImage,
  isCategoryImagePublicId,
  uploadProductImage,
} from "@/lib/cloudinary";
import type { SessionUser } from "@/types";

export async function adminListCategories(user: SessionUser) {
  assertAdmin(user);
  return listCategories(false);
}

export async function adminCreateCategory(user: SessionUser, input: unknown) {
  assertAdmin(user);
  const data = categorySchema.parse(input);
  let slug = slugify(data.name);
  const existing = await findCategoryBySlug(slug);
  if (existing) slug = `${slug}-${Date.now()}`;

  return createCategory({
    name: data.name,
    slug,
    description: data.description || null,
    isActive: data.isActive ?? true,
    imageCloudinaryPublicId: null,
    imageSecureUrl: null,
    imageAltText: data.imageAltText?.trim() || null,
    homepageSortOrder: data.homepageSortOrder ?? 0,
    showOnHomepage: data.showOnHomepage ?? true,
  });
}

export async function adminUpdateCategory(
  user: SessionUser,
  id: string,
  input: unknown,
) {
  assertAdmin(user);
  const data = categorySchema.parse(input);
  const category = await findCategoryById(id);
  if (!category) throw new Error("Kategori bulunamadı.");

  let slug = slugify(data.name);
  const existing = await findCategoryBySlug(slug);
  if (existing && existing.id !== id) slug = `${slug}-${Date.now()}`;

  const clearImage = data.clearImage === true;
  let nextPublicId = category.imageCloudinaryPublicId;
  let nextSecureUrl = category.imageSecureUrl;
  let nextAlt = data.imageAltText?.trim() || category.imageAltText;

  if (clearImage) {
    nextPublicId = null;
    nextSecureUrl = null;
    nextAlt = data.imageAltText?.trim() || null;
  } else if (data.imageCloudinaryPublicId && data.imageSecureUrl) {
    const publicId = String(data.imageCloudinaryPublicId).trim();
    const secureUrl = String(data.imageSecureUrl).trim();
    if (!isCategoryImagePublicId(publicId, id)) {
      throw new Error("Geçersiz kategori görseli.");
    }
    if (!secureUrl.startsWith("https://res.cloudinary.com/")) {
      throw new Error("Geçersiz görsel URL.");
    }
    nextPublicId = publicId;
    nextSecureUrl = secureUrl;
    nextAlt = data.imageAltText?.trim() || category.name;
  } else if (data.imageAltText !== undefined) {
    nextAlt = data.imageAltText?.trim() || null;
  }

  const oldPublicId = category.imageCloudinaryPublicId;

  await updateCategory(id, {
    name: data.name,
    slug,
    description: data.description || null,
    isActive: data.isActive ?? true,
    imageCloudinaryPublicId: nextPublicId,
    imageSecureUrl: nextSecureUrl,
    imageAltText: nextAlt,
    homepageSortOrder: data.homepageSortOrder ?? 0,
    showOnHomepage: data.showOnHomepage ?? true,
  });

  if (
    oldPublicId &&
    oldPublicId !== nextPublicId
  ) {
    try {
      await deleteCloudinaryImage(oldPublicId);
    } catch {
      // Eski dosya zaten silinmiş olabilir
    }
  }

  const updated = await findCategoryById(id);
  return updated ?? { message: "Kategori güncellendi." };
}

export async function adminToggleCategory(
  user: SessionUser,
  id: string,
  isActive: boolean,
) {
  assertAdmin(user);
  await setCategoryActive(id, isActive);
  return { message: isActive ? "Kategori aktifleştirildi." : "Kategori pasifleştirildi." };
}

export async function adminListProducts(
  user: SessionUser,
  options?: { search?: string; page?: number },
) {
  assertAdmin(user);
  return listProducts({
    search: options?.search,
    page: options?.page ?? 1,
    pageSize: 20,
    activeOnly: false,
  });
}

export async function adminCreateProduct(user: SessionUser, input: unknown) {
  assertAdmin(user);
  const data = productSchema.parse(input);
  let slug = slugify(data.name);
  const existing = await findProductBySlug(slug);
  if (existing) slug = `${slug}-${Date.now()}`;

  const product = await createProduct({
    name: data.name,
    slug,
    categoryId: data.categoryId || null,
    sku: data.sku || null,
    barcode: data.barcode || null,
    description: data.description || null,
    unit: data.unit || null,
    price: data.price,
    stockQuantity: data.stockQuantity,
    isActive: data.isActive ?? true,
  });

  return product;
}

export async function adminUpdateProduct(
  user: SessionUser,
  id: string,
  input: unknown,
) {
  assertAdmin(user);
  const data = productSchema.parse(input);
  const product = await findProductById(id);
  if (!product) throw new Error("Ürün bulunamadı.");

  let slug = slugify(data.name);
  const existing = await findProductBySlug(slug);
  if (existing && existing.id !== id) slug = `${slug}-${Date.now()}`;

  await updateProduct(id, {
    name: data.name,
    slug,
    categoryId: data.categoryId || null,
    sku: data.sku || null,
    barcode: data.barcode || null,
    description: data.description || null,
    unit: data.unit || null,
    price: data.price,
    stockQuantity: data.stockQuantity,
    isActive: data.isActive ?? true,
  });

  const updated = await findProductById(id);
  return updated ?? { message: "Ürün güncellendi." };
}

export async function adminDeactivateProduct(user: SessionUser, id: string) {
  assertAdmin(user);
  await setProductActive(id, false);
  return { message: "Ürün pasifleştirildi." };
}

export async function adminSetProductActive(
  user: SessionUser,
  id: string,
  isActive: boolean,
) {
  assertAdmin(user);
  await setProductActive(id, isActive);
  return {
    message: isActive ? "Ürün aktifleştirildi." : "Ürün pasifleştirildi.",
  };
}

export async function adminGetProduct(user: SessionUser, id: string) {
  assertAdmin(user);
  const product = await findProductWithImages(id);
  if (!product) throw new Error("Ürün bulunamadı.");
  return product;
}

export async function adminUploadProductImage(
  user: SessionUser,
  productId: string,
  file: File,
  isPrimary = false,
) {
  assertAdmin(user);
  const product = await findProductById(productId);
  if (!product) throw new Error("Ürün bulunamadı.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadProductImage(buffer, productId, file.type);

  const image = await addProductImage({
    productId,
    cloudinaryPublicId: uploaded.publicId,
    secureUrl: uploaded.secureUrl,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    isPrimary,
  });

  return image;
}

export async function adminSaveUploadedImages(
  user: SessionUser,
  productId: string,
  input: unknown,
) {
  assertAdmin(user);
  const product = await findProductById(productId);
  if (!product) throw new Error("Ürün bulunamadı.");

  const { cloudinaryUploadResultSchema } = await import(
    "@/lib/validation/image-schemas"
  );
  const data = cloudinaryUploadResultSchema.parse(input);
  const existing = await getProductImages(productId);
  const hadPrimary = existing.some((i) => i.isPrimary);

  const primaryPublicId =
    data.images.find((img) => img.isPrimary)?.cloudinaryPublicId ??
    (!hadPrimary ? data.images[0]?.cloudinaryPublicId : undefined);

  for (let i = 0; i < data.images.length; i++) {
    const img = data.images[i];
    const row = await addProductImage({
      productId,
      cloudinaryPublicId: img.cloudinaryPublicId,
      secureUrl: img.secureUrl,
      width: img.width ?? null,
      height: img.height ?? null,
      format: img.format ?? "webp",
      sortOrder: img.sortOrder ?? i,
      isPrimary: false,
    });

    if (primaryPublicId && img.cloudinaryPublicId === primaryPublicId) {
      await setPrimaryImage(productId, row.id);
    }
  }

  return getProductImages(productId);
}

export async function adminDeleteProductImage(user: SessionUser, imageId: string) {
  assertAdmin(user);
  const image = await findProductImageById(imageId);
  if (!image) throw new Error("Görsel bulunamadı.");

  const wasPrimary = image.isPrimary;
  const productId = image.productId;

  await deleteCloudinaryImage(image.cloudinaryPublicId);
  await deleteProductImage(imageId);

  if (wasPrimary) {
    const remaining = await getProductImages(productId);
    if (remaining.length > 0) {
      await setPrimaryImage(productId, remaining[0].id);
    }
  }

  return { message: "Görsel silindi." };
}

export async function adminSetPrimaryImage(
  user: SessionUser,
  productId: string,
  imageId: string,
) {
  assertAdmin(user);
  await setPrimaryImage(productId, imageId);
  return { message: "Birincil görsel güncellendi." };
}

export async function adminRemoveProductImages(user: SessionUser, productId: string) {
  assertAdmin(user);
  const images = await deleteAllProductImages(productId);
  for (const img of images) {
    try {
      await deleteCloudinaryImage(img.cloudinaryPublicId);
    } catch {
      // continue
    }
  }
  await deleteCloudinaryFolder(productId);
}
