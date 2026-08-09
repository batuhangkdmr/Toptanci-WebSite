import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import type {
  PaginatedResult,
  Product,
  ProductImage,
  ProductWithImages,
} from "@/types";

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
    isActive: row.IsActive,
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
    isPrimary: row.IsPrimary,
    createdAt: row.CreatedAt,
  };
}

export async function findProductById(id: string): Promise<Product | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<ProductRow>("SELECT * FROM Products WHERE Id = @id");
  return result.recordset[0] ? mapProduct(result.recordset[0]) : null;
}

export async function findProductBySlug(slug: string): Promise<Product | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("slug", sql.NVarChar, slug)
    .query<ProductRow>("SELECT * FROM Products WHERE Slug = @slug");
  return result.recordset[0] ? mapProduct(result.recordset[0]) : null;
}

export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("productId", sql.UniqueIdentifier, productId)
    .query<ImageRow>(`
      SELECT * FROM ProductImages
      WHERE ProductId = @productId
      ORDER BY IsPrimary DESC, SortOrder ASC, CreatedAt ASC
    `);
  return result.recordset.map(mapImage);
}

export async function findProductWithImages(
  id: string,
): Promise<ProductWithImages | null> {
  const product = await findProductById(id);
  if (!product) return null;
  const images = await getProductImages(id);
  return { ...product, images };
}

export async function findProductWithImagesBySlug(
  slug: string,
): Promise<ProductWithImages | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("slug", sql.NVarChar, slug)
    .query<ProductRow>(`
      SELECT p.*, c.Name AS CategoryName
      FROM Products p
      LEFT JOIN Categories c ON c.Id = p.CategoryId
      WHERE p.Slug = @slug
    `);
  const row = result.recordset[0];
  if (!row) return null;
  const images = await getProductImages(row.Id);
  return {
    ...mapProduct(row),
    categoryName: row.CategoryName,
    images,
  };
}

async function attachPrimaryImages(
  products: Product[],
): Promise<ProductWithImages[]> {
  if (products.length === 0) return [];
  const pool = await getPool();
  const ids = products.map((p) => p.id);

  // Parameterized IN clause
  const request = pool.request();
  const placeholders = ids.map((_, i) => {
    request.input(`id${i}`, sql.UniqueIdentifier, ids[i]);
    return `@id${i}`;
  });

  const result = await request.query<ImageRow>(`
    SELECT
      Id, ProductId, CloudinaryPublicId, SecureUrl,
      Width, Height, Format, SortOrder, IsPrimary, CreatedAt
    FROM (
      SELECT
        pi.*,
        ROW_NUMBER() OVER (
          PARTITION BY pi.ProductId
          ORDER BY pi.IsPrimary DESC, pi.SortOrder ASC, pi.CreatedAt ASC, pi.Id ASC
        ) AS ImageRank
      FROM ProductImages pi
      WHERE pi.ProductId IN (${placeholders.join(",")})
    ) ranked
    WHERE ImageRank = 1
    ORDER BY ProductId ASC
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

export async function listProducts(options?: {
  search?: string;
  categoryId?: string;
  activeOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ProductWithImages>> {
  const requestedPage =
    typeof options?.page === "number" && Number.isFinite(options.page)
      ? Math.max(1, Math.floor(options.page))
      : 1;
  const pageSize =
    typeof options?.pageSize === "number" && Number.isFinite(options.pageSize)
      ? Math.min(100, Math.max(1, Math.floor(options.pageSize)))
      : 24;
  const pool = await getPool();

  const where: string[] = [];
  if (options?.activeOnly) where.push("p.IsActive = 1");
  if (options?.categoryId) where.push("p.CategoryId = @categoryId");
  if (options?.search) where.push("(p.Name LIKE @search OR p.SKU LIKE @search OR p.Barcode LIKE @search)");

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countReq = pool.request();
  if (options?.categoryId) countReq.input("categoryId", sql.UniqueIdentifier, options.categoryId);
  if (options?.search) countReq.input("search", sql.NVarChar, `%${options.search}%`);

  const countResult = await countReq.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Products p ${whereSql}`,
  );
  const total = countResult.recordset[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const listReq = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);
  if (options?.categoryId) listReq.input("categoryId", sql.UniqueIdentifier, options.categoryId);
  if (options?.search) listReq.input("search", sql.NVarChar, `%${options.search}%`);

  const listResult = await listReq.query<ProductRow>(`
    SELECT p.*, c.Name AS CategoryName
    FROM Products p
    LEFT JOIN Categories c ON c.Id = p.CategoryId
    ${whereSql}
    ORDER BY p.Name ASC, p.Id ASC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  const products = listResult.recordset.map((row) => ({
    ...mapProduct(row),
    categoryName: row.CategoryName,
  }));

  const withImages = await attachPrimaryImages(products);

  return {
    items: withImages.map((p, i) => ({
      ...p,
      categoryName: products[i].categoryName,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function createProduct(data: {
  name: string;
  slug: string;
  categoryId?: string | null;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  unit?: string | null;
  price?: number | null;
  stockQuantity?: number | null;
  isActive?: boolean;
}): Promise<Product> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("name", sql.NVarChar, data.name)
    .input("slug", sql.NVarChar, data.slug)
    .input("categoryId", sql.UniqueIdentifier, data.categoryId || null)
    .input("sku", sql.NVarChar, data.sku || null)
    .input("barcode", sql.NVarChar, data.barcode || null)
    .input("description", sql.NVarChar, data.description || null)
    .input("unit", sql.NVarChar, data.unit || null)
    .input("price", sql.Decimal(18, 2), data.price ?? null)
    .input("stockQuantity", sql.Decimal(18, 3), data.stockQuantity ?? null)
    .input("isActive", sql.Bit, data.isActive ?? true)
    .query<ProductRow>(`
      INSERT INTO Products (
        Name, Slug, CategoryId, SKU, Barcode, Description, Unit, Price, StockQuantity, IsActive
      )
      OUTPUT INSERTED.*
      VALUES (
        @name, @slug, @categoryId, @sku, @barcode, @description, @unit, @price, @stockQuantity, @isActive
      )
    `);
  return mapProduct(result.recordset[0]);
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    slug: string;
    categoryId?: string | null;
    sku?: string | null;
    barcode?: string | null;
    description?: string | null;
    unit?: string | null;
    price?: number | null;
    stockQuantity?: number | null;
    isActive?: boolean;
  },
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("name", sql.NVarChar, data.name)
    .input("slug", sql.NVarChar, data.slug)
    .input("categoryId", sql.UniqueIdentifier, data.categoryId || null)
    .input("sku", sql.NVarChar, data.sku || null)
    .input("barcode", sql.NVarChar, data.barcode || null)
    .input("description", sql.NVarChar, data.description || null)
    .input("unit", sql.NVarChar, data.unit || null)
    .input("price", sql.Decimal(18, 2), data.price ?? null)
    .input("stockQuantity", sql.Decimal(18, 3), data.stockQuantity ?? null)
    .input("isActive", sql.Bit, data.isActive ?? true)
    .query(`
      UPDATE Products
      SET Name = @name,
          Slug = @slug,
          CategoryId = @categoryId,
          SKU = @sku,
          Barcode = @barcode,
          Description = @description,
          Unit = @unit,
          Price = @price,
          StockQuantity = @stockQuantity,
          IsActive = @isActive,
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("isActive", sql.Bit, isActive)
    .query(`
      UPDATE Products
      SET IsActive = @isActive, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function addProductImage(data: {
  productId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}): Promise<ProductImage> {
  const pool = await getPool();

  if (data.isPrimary) {
    await pool
      .request()
      .input("productId", sql.UniqueIdentifier, data.productId)
      .query("UPDATE ProductImages SET IsPrimary = 0 WHERE ProductId = @productId");
  }

  const result = await pool
    .request()
    .input("productId", sql.UniqueIdentifier, data.productId)
    .input("publicId", sql.NVarChar, data.cloudinaryPublicId)
    .input("secureUrl", sql.NVarChar, data.secureUrl)
    .input("width", sql.Int, data.width ?? null)
    .input("height", sql.Int, data.height ?? null)
    .input("format", sql.NVarChar, data.format ?? null)
    .input("sortOrder", sql.Int, data.sortOrder ?? 0)
    .input("isPrimary", sql.Bit, data.isPrimary ?? false)
    .query<ImageRow>(`
      INSERT INTO ProductImages (
        ProductId, CloudinaryPublicId, SecureUrl, Width, Height, Format, SortOrder, IsPrimary
      )
      OUTPUT INSERTED.*
      VALUES (
        @productId, @publicId, @secureUrl, @width, @height, @format, @sortOrder, @isPrimary
      )
    `);
  return mapImage(result.recordset[0]);
}

export async function findProductImageById(id: string): Promise<ProductImage | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<ImageRow>("SELECT * FROM ProductImages WHERE Id = @id");
  return result.recordset[0] ? mapImage(result.recordset[0]) : null;
}

export async function deleteProductImage(id: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query("DELETE FROM ProductImages WHERE Id = @id");
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("productId", sql.UniqueIdentifier, productId)
    .query(`
      UPDATE ProductImages
      SET IsPrimary = 0,
          SortOrder = CASE WHEN SortOrder = 0 THEN 1 ELSE SortOrder END
      WHERE ProductId = @productId
    `);
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, imageId)
    .input("productId", sql.UniqueIdentifier, productId)
    .query(`
      UPDATE ProductImages
      SET IsPrimary = 1, SortOrder = 0
      WHERE Id = @id AND ProductId = @productId
    `);
}

export async function deleteAllProductImages(productId: string): Promise<ProductImage[]> {
  const images = await getProductImages(productId);
  const pool = await getPool();
  await pool
    .request()
    .input("productId", sql.UniqueIdentifier, productId)
    .query("DELETE FROM ProductImages WHERE ProductId = @productId");
  return images;
}

export async function countActiveProducts(): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query<{ total: number }>("SELECT COUNT(*) AS total FROM Products WHERE IsActive = 1");
  return result.recordset[0]?.total ?? 0;
}
