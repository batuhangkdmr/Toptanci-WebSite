import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import type { Category } from "@/types";

type CategoryRow = {
  Id: string;
  Name: string;
  Slug: string;
  Description: string | null;
  IsActive: boolean;
  ImageCloudinaryPublicId: string | null;
  ImageSecureUrl: string | null;
  ImageAltText: string | null;
  HomepageSortOrder: number;
  ShowOnHomepage: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.Id,
    name: row.Name,
    slug: row.Slug,
    description: row.Description,
    isActive: row.IsActive,
    imageCloudinaryPublicId: row.ImageCloudinaryPublicId ?? null,
    imageSecureUrl: row.ImageSecureUrl ?? null,
    imageAltText: row.ImageAltText ?? null,
    homepageSortOrder: row.HomepageSortOrder ?? 0,
    showOnHomepage: row.ShowOnHomepage ?? true,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

const CATEGORY_COLUMNS = `
  Id, Name, Slug, Description, IsActive,
  ImageCloudinaryPublicId, ImageSecureUrl, ImageAltText,
  HomepageSortOrder, ShowOnHomepage, CreatedAt, UpdatedAt
`;

export async function findCategoryById(id: string): Promise<Category | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS} FROM Categories WHERE Id = @id`,
    );
  return result.recordset[0] ? mapCategory(result.recordset[0]) : null;
}

export async function findCategoryBySlug(slug: string): Promise<Category | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("slug", sql.NVarChar, slug)
    .query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS} FROM Categories WHERE Slug = @slug`,
    );
  return result.recordset[0] ? mapCategory(result.recordset[0]) : null;
}

export async function listCategories(activeOnly = false): Promise<Category[]> {
  const pool = await getPool();
  const result = await pool.request().query<CategoryRow>(
    activeOnly
      ? `SELECT ${CATEGORY_COLUMNS} FROM Categories WHERE IsActive = 1 ORDER BY Name`
      : `SELECT ${CATEGORY_COLUMNS} FROM Categories ORDER BY Name`,
  );
  return result.recordset.map(mapCategory);
}

/** Public otomatik kategori carousel — yalnızca aktif + ShowOnHomepage */
export async function listHomepageCategories(): Promise<Category[]> {
  const pool = await getPool();
  const result = await pool.request().query<CategoryRow>(`
    SELECT ${CATEGORY_COLUMNS}
    FROM Categories
    WHERE IsActive = 1 AND ShowOnHomepage = 1
    ORDER BY HomepageSortOrder ASC, Name ASC
  `);
  return result.recordset.map(mapCategory);
}

export type CategoryWriteData = {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  imageCloudinaryPublicId?: string | null;
  imageSecureUrl?: string | null;
  imageAltText?: string | null;
  homepageSortOrder?: number;
  showOnHomepage?: boolean;
};

export async function createCategory(data: CategoryWriteData): Promise<Category> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("name", sql.NVarChar, data.name)
    .input("slug", sql.NVarChar, data.slug)
    .input("description", sql.NVarChar, data.description ?? null)
    .input("isActive", sql.Bit, data.isActive ?? true)
    .input("imagePublicId", sql.NVarChar, data.imageCloudinaryPublicId ?? null)
    .input("imageUrl", sql.NVarChar, data.imageSecureUrl ?? null)
    .input("imageAlt", sql.NVarChar, data.imageAltText ?? null)
    .input("homepageSortOrder", sql.Int, data.homepageSortOrder ?? 0)
    .input("showOnHomepage", sql.Bit, data.showOnHomepage ?? true)
    .query<CategoryRow>(`
      INSERT INTO Categories (
        Name, Slug, Description, IsActive,
        ImageCloudinaryPublicId, ImageSecureUrl, ImageAltText,
        HomepageSortOrder, ShowOnHomepage
      )
      OUTPUT INSERTED.*
      VALUES (
        @name, @slug, @description, @isActive,
        @imagePublicId, @imageUrl, @imageAlt,
        @homepageSortOrder, @showOnHomepage
      )
    `);
  return mapCategory(result.recordset[0]);
}

export async function updateCategory(
  id: string,
  data: CategoryWriteData,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("name", sql.NVarChar, data.name)
    .input("slug", sql.NVarChar, data.slug)
    .input("description", sql.NVarChar, data.description ?? null)
    .input("isActive", sql.Bit, data.isActive ?? true)
    .input("imagePublicId", sql.NVarChar, data.imageCloudinaryPublicId ?? null)
    .input("imageUrl", sql.NVarChar, data.imageSecureUrl ?? null)
    .input("imageAlt", sql.NVarChar, data.imageAltText ?? null)
    .input("homepageSortOrder", sql.Int, data.homepageSortOrder ?? 0)
    .input("showOnHomepage", sql.Bit, data.showOnHomepage ?? true)
    .query(`
      UPDATE Categories
      SET Name = @name,
          Slug = @slug,
          Description = @description,
          IsActive = @isActive,
          ImageCloudinaryPublicId = @imagePublicId,
          ImageSecureUrl = @imageUrl,
          ImageAltText = @imageAlt,
          HomepageSortOrder = @homepageSortOrder,
          ShowOnHomepage = @showOnHomepage,
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("isActive", sql.Bit, isActive)
    .query(`
      UPDATE Categories
      SET IsActive = @isActive, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}
