import "server-only";
import { getPool, sql, withTransaction } from "@/lib/db/pool";
import type { Product, ProductImage, ProductWithImages } from "@/types";
import type {
  HomepageCarouselItem,
  HomepageCarouselItemWithCategory,
  HomepageProductItem,
  HomepageSection,
  HomepageSectionType,
  HomepageTargetType,
  PublicHomepageSection,
} from "@/types/homepage";

type SectionRow = {
  Id: string;
  SectionType: HomepageSectionType;
  Title: string | null;
  Description: string | null;
  ShowViewAll: boolean;
  ViewAllHref: string | null;
  IsActive: boolean;
  SortOrder: number;
  StartsAt: Date | null;
  EndsAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
};

type CarouselItemRow = {
  Id: string;
  SectionId: string;
  Title: string | null;
  Description: string | null;
  AltText: string | null;
  CloudinaryPublicId: string | null;
  SecureUrl: string | null;
  MobileCloudinaryPublicId: string | null;
  MobileSecureUrl: string | null;
  CategoryId: string | null;
  ProductId: string | null;
  TargetType: HomepageTargetType | null;
  TargetUrl: string | null;
  SortOrder: number;
  IsActive: boolean;
  StartsAt: Date | null;
  EndsAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  CategoryName?: string | null;
  CategorySlug?: string | null;
  CategoryDescription?: string | null;
  CategoryIsActive?: boolean | null;
};

type ProductItemRow = {
  Id: string;
  SectionId: string;
  ProductId: string;
  SortOrder: number;
  IsActive: boolean;
  CreatedAt: Date;
};

type ProductRow = {
  Id: string;
  CategoryId: string | null;
  Name: string;
  Slug: string;
  SKU: string | null;
  Barcode: string | null;
  Description: string | null;
  Unit: string | null;
  Price: number | null;
  StockQuantity: number | null;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
  CategoryName?: string | null;
};

type ImageRow = {
  Id: string;
  ProductId: string;
  CloudinaryPublicId: string;
  SecureUrl: string;
  Width: number | null;
  Height: number | null;
  Format: string | null;
  SortOrder: number;
  IsPrimary: boolean;
  CreatedAt: Date;
};

const DEFAULT_SECTIONS: Array<{
  sectionType: HomepageSectionType;
  title: string;
  sortOrder: number;
  description?: string;
}> = [
  {
    sectionType: "AUTO_CATEGORY_CAROUSEL",
    title: "Otomatik Kategori Carousel",
    description: "Aktif ve ana sayfada gösterilen kategorilerden otomatik oluşturulur.",
    sortOrder: -10,
  },
  { sectionType: "CATEGORY_STRIP", title: "Kategoriler", sortOrder: 0 },
  { sectionType: "HERO_BANNER", title: "Ana Banner", sortOrder: 1 },
  { sectionType: "SIDE_BANNER", title: "Yan Banner", sortOrder: 2 },
  { sectionType: "PRODUCT_RAIL", title: "Öne Çıkan Ürünler", sortOrder: 3 },
];

function mapSection(row: SectionRow): HomepageSection {
  return {
    id: row.Id,
    sectionType: row.SectionType,
    title: row.Title,
    description: row.Description,
    showViewAll: !!row.ShowViewAll,
    viewAllHref: row.ViewAllHref,
    isActive: !!row.IsActive,
    sortOrder: row.SortOrder,
    startsAt: row.StartsAt,
    endsAt: row.EndsAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapCarouselItem(row: CarouselItemRow): HomepageCarouselItem {
  return {
    id: row.Id,
    sectionId: row.SectionId,
    title: row.Title,
    description: row.Description,
    altText: row.AltText,
    cloudinaryPublicId: row.CloudinaryPublicId,
    secureUrl: row.SecureUrl,
    mobileCloudinaryPublicId: row.MobileCloudinaryPublicId,
    mobileSecureUrl: row.MobileSecureUrl,
    categoryId: row.CategoryId,
    productId: row.ProductId,
    targetType: row.TargetType,
    targetUrl: row.TargetUrl,
    sortOrder: row.SortOrder,
    isActive: !!row.IsActive,
    startsAt: row.StartsAt,
    endsAt: row.EndsAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapCarouselItemWithCategory(
  row: CarouselItemRow,
): HomepageCarouselItemWithCategory {
  const item = mapCarouselItem(row);
  if (!row.CategoryId || row.CategoryName == null) {
    return { ...item, category: null };
  }
  return {
    ...item,
    category: {
      id: row.CategoryId,
      name: row.CategoryName,
      slug: row.CategorySlug ?? "",
      description: row.CategoryDescription ?? null,
      isActive: !!row.CategoryIsActive,
    },
  };
}

function mapProductItem(row: ProductItemRow): HomepageProductItem {
  return {
    id: row.Id,
    sectionId: row.SectionId,
    productId: row.ProductId,
    sortOrder: row.SortOrder,
    isActive: !!row.IsActive,
    createdAt: row.CreatedAt,
  };
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.Id,
    categoryId: row.CategoryId,
    name: row.Name,
    slug: row.Slug,
    sku: row.SKU,
    barcode: row.Barcode,
    description: row.Description,
    unit: row.Unit,
    price: row.Price !== null ? Number(row.Price) : null,
    stockQuantity: row.StockQuantity !== null ? Number(row.StockQuantity) : null,
    isActive: !!row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapImage(row: ImageRow): ProductImage {
  return {
    id: row.Id,
    productId: row.ProductId,
    cloudinaryPublicId: row.CloudinaryPublicId,
    secureUrl: row.SecureUrl,
    width: row.Width,
    height: row.Height,
    format: row.Format,
    sortOrder: row.SortOrder,
    isPrimary: !!row.IsPrimary,
    createdAt: row.CreatedAt,
  };
}

async function attachImages(products: Product[]): Promise<ProductWithImages[]> {
  if (products.length === 0) return [];
  const pool = await getPool();
  const request = pool.request();
  const placeholders = products.map((p, i) => {
    request.input(`id${i}`, sql.UniqueIdentifier, p.id);
    return `@id${i}`;
  });

  const result = await request.query<ImageRow>(`
    SELECT * FROM ProductImages
    WHERE ProductId IN (${placeholders.join(",")})
    ORDER BY ProductId ASC, IsPrimary DESC, SortOrder ASC, CreatedAt ASC, Id ASC
  `);

  const byProduct = new Map<string, ProductImage[]>();
  for (const row of result.recordset) {
    const img = mapImage(row);
    const list = byProduct.get(img.productId) ?? [];
    list.push(img);
    byProduct.set(img.productId, list);
  }

  return products.map((p) => ({
    ...p,
    images: byProduct.get(p.id) ?? [],
  }));
}

export async function ensureDefaultSections(): Promise<void> {
  const pool = await getPool();

  for (const section of DEFAULT_SECTIONS) {
    const existing = await pool
      .request()
      .input("sectionType", sql.NVarChar, section.sectionType)
      .query<{ Id: string }>(
        "SELECT TOP 1 Id FROM HomepageSections WHERE SectionType = @sectionType",
      );
    if (existing.recordset.length > 0) continue;

    await pool
      .request()
      .input("sectionType", sql.NVarChar, section.sectionType)
      .input("title", sql.NVarChar, section.title)
      .input("description", sql.NVarChar, section.description ?? null)
      .input("sortOrder", sql.Int, section.sortOrder)
      .query(`
        INSERT INTO HomepageSections (
          SectionType, Title, Description, SortOrder, IsActive, ShowViewAll
        )
        VALUES (@sectionType, @title, @description, @sortOrder, 1, 0)
      `);
  }
}

export async function listSections(
  includeInactive = true,
): Promise<HomepageSection[]> {
  const pool = await getPool();
  const result = await pool.request().query<SectionRow>(
    includeInactive
      ? `
        SELECT * FROM HomepageSections
        ORDER BY SortOrder ASC, CreatedAt ASC
      `
      : `
        SELECT * FROM HomepageSections
        WHERE IsActive = 1
        ORDER BY SortOrder ASC, CreatedAt ASC
      `,
  );
  return result.recordset.map(mapSection);
}

export async function getSectionById(
  id: string,
): Promise<HomepageSection | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<SectionRow>("SELECT * FROM HomepageSections WHERE Id = @id");
  return result.recordset[0] ? mapSection(result.recordset[0]) : null;
}

export async function createSection(data: {
  sectionType: HomepageSectionType;
  title?: string | null;
  description?: string | null;
  showViewAll?: boolean;
  viewAllHref?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
}): Promise<HomepageSection> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("sectionType", sql.NVarChar, data.sectionType)
    .input("title", sql.NVarChar, data.title ?? null)
    .input("description", sql.NVarChar, data.description ?? null)
    .input("showViewAll", sql.Bit, data.showViewAll ?? false)
    .input("viewAllHref", sql.NVarChar, data.viewAllHref ?? null)
    .input("isActive", sql.Bit, data.isActive ?? true)
    .input("sortOrder", sql.Int, data.sortOrder ?? 0)
    .input("startsAt", sql.DateTime2, data.startsAt ?? null)
    .input("endsAt", sql.DateTime2, data.endsAt ?? null)
    .query<SectionRow>(`
      INSERT INTO HomepageSections (
        SectionType, Title, Description, ShowViewAll, ViewAllHref,
        IsActive, SortOrder, StartsAt, EndsAt
      )
      OUTPUT INSERTED.*
      VALUES (
        @sectionType, @title, @description, @showViewAll, @viewAllHref,
        @isActive, @sortOrder, @startsAt, @endsAt
      )
    `);
  return mapSection(result.recordset[0]);
}

export async function updateSection(
  id: string,
  data: {
    sectionType?: HomepageSectionType;
    title?: string | null;
    description?: string | null;
    showViewAll?: boolean;
    viewAllHref?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
): Promise<HomepageSection | null> {
  const existing = await getSectionById(id);
  if (!existing) return null;

  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input(
      "sectionType",
      sql.NVarChar,
      data.sectionType ?? existing.sectionType,
    )
    .input(
      "title",
      sql.NVarChar,
      data.title !== undefined ? data.title : existing.title,
    )
    .input(
      "description",
      sql.NVarChar,
      data.description !== undefined ? data.description : existing.description,
    )
    .input(
      "showViewAll",
      sql.Bit,
      data.showViewAll !== undefined ? data.showViewAll : existing.showViewAll,
    )
    .input(
      "viewAllHref",
      sql.NVarChar,
      data.viewAllHref !== undefined ? data.viewAllHref : existing.viewAllHref,
    )
    .input(
      "isActive",
      sql.Bit,
      data.isActive !== undefined ? data.isActive : existing.isActive,
    )
    .input(
      "sortOrder",
      sql.Int,
      data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
    )
    .input(
      "startsAt",
      sql.DateTime2,
      data.startsAt !== undefined ? data.startsAt : existing.startsAt,
    )
    .input(
      "endsAt",
      sql.DateTime2,
      data.endsAt !== undefined ? data.endsAt : existing.endsAt,
    )
    .query<SectionRow>(`
      UPDATE HomepageSections
      SET SectionType = @sectionType,
          Title = @title,
          Description = @description,
          ShowViewAll = @showViewAll,
          ViewAllHref = @viewAllHref,
          IsActive = @isActive,
          SortOrder = @sortOrder,
          StartsAt = @startsAt,
          EndsAt = @endsAt,
          UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE Id = @id
    `);
  return result.recordset[0] ? mapSection(result.recordset[0]) : null;
}

export async function deleteSection(id: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query("DELETE FROM HomepageSections WHERE Id = @id");
  return (result.rowsAffected[0] ?? 0) > 0;
}

export async function listCarouselItems(
  sectionId: string,
): Promise<HomepageCarouselItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("sectionId", sql.UniqueIdentifier, sectionId)
    .query<CarouselItemRow>(`
      SELECT * FROM HomepageCarouselItems
      WHERE SectionId = @sectionId
      ORDER BY SortOrder ASC, CreatedAt ASC
    `);
  return result.recordset.map(mapCarouselItem);
}

export async function getCarouselItemById(
  id: string,
): Promise<HomepageCarouselItem | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<CarouselItemRow>("SELECT * FROM HomepageCarouselItems WHERE Id = @id");
  return result.recordset[0] ? mapCarouselItem(result.recordset[0]) : null;
}

export async function createCarouselItem(
  sectionId: string,
  data: {
    title?: string | null;
    description?: string | null;
    altText?: string | null;
    cloudinaryPublicId?: string | null;
    secureUrl?: string | null;
    mobileCloudinaryPublicId?: string | null;
    mobileSecureUrl?: string | null;
    categoryId?: string | null;
    productId?: string | null;
    targetType?: HomepageTargetType | null;
    targetUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
): Promise<HomepageCarouselItem> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("sectionId", sql.UniqueIdentifier, sectionId)
    .input("title", sql.NVarChar, data.title ?? null)
    .input("description", sql.NVarChar, data.description ?? null)
    .input("altText", sql.NVarChar, data.altText ?? null)
    .input("cloudinaryPublicId", sql.NVarChar, data.cloudinaryPublicId ?? null)
    .input("secureUrl", sql.NVarChar, data.secureUrl ?? null)
    .input(
      "mobileCloudinaryPublicId",
      sql.NVarChar,
      data.mobileCloudinaryPublicId ?? null,
    )
    .input("mobileSecureUrl", sql.NVarChar, data.mobileSecureUrl ?? null)
    .input("categoryId", sql.UniqueIdentifier, data.categoryId ?? null)
    .input("productId", sql.UniqueIdentifier, data.productId ?? null)
    .input("targetType", sql.NVarChar, data.targetType ?? null)
    .input("targetUrl", sql.NVarChar, data.targetUrl ?? null)
    .input("sortOrder", sql.Int, data.sortOrder ?? 0)
    .input("isActive", sql.Bit, data.isActive ?? true)
    .input("startsAt", sql.DateTime2, data.startsAt ?? null)
    .input("endsAt", sql.DateTime2, data.endsAt ?? null)
    .query<CarouselItemRow>(`
      INSERT INTO HomepageCarouselItems (
        SectionId, Title, Description, AltText,
        CloudinaryPublicId, SecureUrl, MobileCloudinaryPublicId, MobileSecureUrl,
        CategoryId, ProductId, TargetType, TargetUrl,
        SortOrder, IsActive, StartsAt, EndsAt
      )
      OUTPUT INSERTED.*
      VALUES (
        @sectionId, @title, @description, @altText,
        @cloudinaryPublicId, @secureUrl, @mobileCloudinaryPublicId, @mobileSecureUrl,
        @categoryId, @productId, @targetType, @targetUrl,
        @sortOrder, @isActive, @startsAt, @endsAt
      )
    `);
  return mapCarouselItem(result.recordset[0]);
}

export async function updateCarouselItem(
  id: string,
  data: {
    title?: string | null;
    description?: string | null;
    altText?: string | null;
    cloudinaryPublicId?: string | null;
    secureUrl?: string | null;
    mobileCloudinaryPublicId?: string | null;
    mobileSecureUrl?: string | null;
    categoryId?: string | null;
    productId?: string | null;
    targetType?: HomepageTargetType | null;
    targetUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
  },
): Promise<HomepageCarouselItem | null> {
  const existing = await getCarouselItemById(id);
  if (!existing) return null;

  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input(
      "title",
      sql.NVarChar,
      data.title !== undefined ? data.title : existing.title,
    )
    .input(
      "description",
      sql.NVarChar,
      data.description !== undefined ? data.description : existing.description,
    )
    .input(
      "altText",
      sql.NVarChar,
      data.altText !== undefined ? data.altText : existing.altText,
    )
    .input(
      "cloudinaryPublicId",
      sql.NVarChar,
      data.cloudinaryPublicId !== undefined
        ? data.cloudinaryPublicId
        : existing.cloudinaryPublicId,
    )
    .input(
      "secureUrl",
      sql.NVarChar,
      data.secureUrl !== undefined ? data.secureUrl : existing.secureUrl,
    )
    .input(
      "mobileCloudinaryPublicId",
      sql.NVarChar,
      data.mobileCloudinaryPublicId !== undefined
        ? data.mobileCloudinaryPublicId
        : existing.mobileCloudinaryPublicId,
    )
    .input(
      "mobileSecureUrl",
      sql.NVarChar,
      data.mobileSecureUrl !== undefined
        ? data.mobileSecureUrl
        : existing.mobileSecureUrl,
    )
    .input(
      "categoryId",
      sql.UniqueIdentifier,
      data.categoryId !== undefined ? data.categoryId : existing.categoryId,
    )
    .input(
      "productId",
      sql.UniqueIdentifier,
      data.productId !== undefined ? data.productId : existing.productId,
    )
    .input(
      "targetType",
      sql.NVarChar,
      data.targetType !== undefined ? data.targetType : existing.targetType,
    )
    .input(
      "targetUrl",
      sql.NVarChar,
      data.targetUrl !== undefined ? data.targetUrl : existing.targetUrl,
    )
    .input(
      "sortOrder",
      sql.Int,
      data.sortOrder !== undefined ? data.sortOrder : existing.sortOrder,
    )
    .input(
      "isActive",
      sql.Bit,
      data.isActive !== undefined ? data.isActive : existing.isActive,
    )
    .input(
      "startsAt",
      sql.DateTime2,
      data.startsAt !== undefined ? data.startsAt : existing.startsAt,
    )
    .input(
      "endsAt",
      sql.DateTime2,
      data.endsAt !== undefined ? data.endsAt : existing.endsAt,
    )
    .query<CarouselItemRow>(`
      UPDATE HomepageCarouselItems
      SET Title = @title,
          Description = @description,
          AltText = @altText,
          CloudinaryPublicId = @cloudinaryPublicId,
          SecureUrl = @secureUrl,
          MobileCloudinaryPublicId = @mobileCloudinaryPublicId,
          MobileSecureUrl = @mobileSecureUrl,
          CategoryId = @categoryId,
          ProductId = @productId,
          TargetType = @targetType,
          TargetUrl = @targetUrl,
          SortOrder = @sortOrder,
          IsActive = @isActive,
          StartsAt = @startsAt,
          EndsAt = @endsAt,
          UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE Id = @id
    `);
  return result.recordset[0] ? mapCarouselItem(result.recordset[0]) : null;
}

export async function deleteCarouselItem(id: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query("DELETE FROM HomepageCarouselItems WHERE Id = @id");
  return (result.rowsAffected[0] ?? 0) > 0;
}

export async function listProductItems(
  sectionId: string,
): Promise<HomepageProductItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("sectionId", sql.UniqueIdentifier, sectionId)
    .query<ProductItemRow>(`
      SELECT * FROM HomepageProductItems
      WHERE SectionId = @sectionId
      ORDER BY SortOrder ASC, CreatedAt ASC
    `);
  return result.recordset.map(mapProductItem);
}

export async function setProductItems(
  sectionId: string,
  productIds: string[],
): Promise<HomepageProductItem[]> {
  await withTransaction(async (_request, transaction) => {
    const deleteReq = new sql.Request(transaction);
    await deleteReq
      .input("sectionId", sql.UniqueIdentifier, sectionId)
      .query("DELETE FROM HomepageProductItems WHERE SectionId = @sectionId");

    for (let i = 0; i < productIds.length; i++) {
      const insertReq = new sql.Request(transaction);
      await insertReq
        .input("sectionId", sql.UniqueIdentifier, sectionId)
        .input("productId", sql.UniqueIdentifier, productIds[i])
        .input("sortOrder", sql.Int, i)
        .query(`
          INSERT INTO HomepageProductItems (SectionId, ProductId, SortOrder, IsActive)
          VALUES (@sectionId, @productId, @sortOrder, 1)
        `);
    }
  });

  return listProductItems(sectionId);
}

export async function deleteProductItem(id: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query("DELETE FROM HomepageProductItems WHERE Id = @id");
  return (result.rowsAffected[0] ?? 0) > 0;
}

async function listActiveCarouselItemsForPublic(
  sectionId: string,
  options?: { requireActiveCategory?: boolean },
): Promise<HomepageCarouselItemWithCategory[]> {
  const pool = await getPool();
  const requireActiveCategory = options?.requireActiveCategory ?? false;

  const result = await pool
    .request()
    .input("sectionId", sql.UniqueIdentifier, sectionId)
    .query<CarouselItemRow>(`
      SELECT
        i.*,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug,
        c.Description AS CategoryDescription,
        c.IsActive AS CategoryIsActive
      FROM HomepageCarouselItems i
      ${requireActiveCategory ? "INNER" : "LEFT"} JOIN Categories c ON c.Id = i.CategoryId
      WHERE i.SectionId = @sectionId
        AND i.IsActive = 1
        AND (i.StartsAt IS NULL OR i.StartsAt <= SYSUTCDATETIME())
        AND (
          i.EndsAt IS NULL
          OR i.EndsAt <= i.StartsAt  -- hatalı eşit/ters tarih: süre sınırı yok say
          OR i.EndsAt >= SYSUTCDATETIME()
        )
        ${requireActiveCategory ? "AND c.IsActive = 1" : ""}
      ORDER BY i.SortOrder ASC, i.CreatedAt ASC
    `);

  return result.recordset.map(mapCarouselItemWithCategory);
}

async function listActiveProductsForPublic(
  sectionId: string,
): Promise<ProductWithImages[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("sectionId", sql.UniqueIdentifier, sectionId)
    .query<ProductRow>(`
      SELECT
        p.*,
        c.Name AS CategoryName
      FROM HomepageProductItems hpi
      INNER JOIN Products p ON p.Id = hpi.ProductId
      LEFT JOIN Categories c ON c.Id = p.CategoryId
      WHERE hpi.SectionId = @sectionId
        AND hpi.IsActive = 1
        AND p.IsActive = 1
      ORDER BY hpi.SortOrder ASC, hpi.CreatedAt ASC
    `);

  const products = result.recordset.map((row) => ({
    ...mapProduct(row),
    categoryName: row.CategoryName,
  }));

  const withImages = await attachImages(products);
  return withImages.map((p, i) => ({
    ...p,
    categoryName: products[i].categoryName,
  }));
}

export async function getPublicHomepageData(): Promise<PublicHomepageSection[]> {
  const pool = await getPool();
  const sectionsResult = await pool.request().query<SectionRow>(`
    SELECT * FROM HomepageSections
    WHERE IsActive = 1
      AND (StartsAt IS NULL OR StartsAt <= SYSUTCDATETIME())
      AND (EndsAt IS NULL OR EndsAt >= SYSUTCDATETIME())
    ORDER BY SortOrder ASC, CreatedAt ASC
  `);

  const publicSections: PublicHomepageSection[] = [];

  for (const row of sectionsResult.recordset) {
    const section = mapSection(row);

    // Otomatik kategori carousel Categories tablosundan beslenir
    if (section.sectionType === "AUTO_CATEGORY_CAROUSEL") {
      publicSections.push({
        ...section,
        carouselItems: [],
        products: [],
      });
      continue;
    }

    if (section.sectionType === "PRODUCT_RAIL") {
      const products = await listActiveProductsForPublic(section.id);
      if (products.length === 0) continue;
      publicSections.push({
        ...section,
        carouselItems: [],
        products,
      });
      continue;
    }

    if (section.sectionType === "CATEGORY_STRIP") {
      // Kategori silinmiş/pasif olsa bile görseli olan öğeleri göster; link güvenli fallback
      const carouselItems = (
        await listActiveCarouselItemsForPublic(section.id, {
          requireActiveCategory: false,
        })
      ).filter(
        (item) =>
          !!item.secureUrl ||
          !!item.title ||
          (item.category?.isActive === true),
      );
      if (carouselItems.length === 0) continue;
      publicSections.push({
        ...section,
        carouselItems: carouselItems.map((item) =>
          item.category && !item.category.isActive
            ? { ...item, category: null }
            : item,
        ),
        products: [],
      });
      continue;
    }

    const carouselItems = await listActiveCarouselItemsForPublic(section.id);
    if (carouselItems.length === 0) continue;
    publicSections.push({
      ...section,
      carouselItems,
      products: [],
    });
  }

  return publicSections;
}
