import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import type { Company, CompanyStatus } from "@/types";

type CompanyRow = {
  Id: string;
  CompanyName: string;
  TaxNumber: string | null;
  TaxOffice: string | null;
  Email: string | null;
  Phone: string | null;
  City: string | null;
  District: string | null;
  Address: string | null;
  Status: CompanyStatus;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
};

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.Id,
    companyName: row.CompanyName,
    taxNumber: row.TaxNumber,
    taxOffice: row.TaxOffice,
    email: row.Email,
    phone: row.Phone,
    city: row.City,
    district: row.District,
    address: row.Address,
    status: row.Status,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export async function findCompanyById(id: string): Promise<Company | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<CompanyRow>("SELECT * FROM Companies WHERE Id = @id");
  const row = result.recordset[0];
  return row ? mapCompany(row) : null;
}

export async function findCompanyByEmail(email: string): Promise<Company | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query<CompanyRow>("SELECT * FROM Companies WHERE Email = @email");
  const row = result.recordset[0];
  return row ? mapCompany(row) : null;
}

export async function createCompany(
  data: {
    companyName: string;
    taxNumber?: string | null;
    taxOffice?: string | null;
    email: string;
    phone: string;
    city: string;
    district: string;
    address?: string | null;
    cityCode?: string | null;
    districtCode?: string | null;
    country?: string | null;
  },
  transaction?: sql.Transaction,
): Promise<Company> {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getPool()).request();

  const result = await request
    .input("companyName", sql.NVarChar, data.companyName)
    .input("taxNumber", sql.NVarChar, data.taxNumber ?? null)
    .input("taxOffice", sql.NVarChar, data.taxOffice ?? null)
    .input("email", sql.NVarChar, data.email)
    .input("phone", sql.NVarChar, data.phone)
    .input("city", sql.NVarChar, data.city)
    .input("district", sql.NVarChar, data.district)
    .input("address", sql.NVarChar, data.address ?? null)
    .input("cityCode", sql.NVarChar, data.cityCode ?? null)
    .input("districtCode", sql.NVarChar, data.districtCode ?? null)
    .input("country", sql.NVarChar, data.country ?? "Türkiye")
    .query<CompanyRow>(`
      INSERT INTO Companies (
        CompanyName, TaxNumber, TaxOffice, Email, Phone, City, District, Address,
        CityCode, DistrictCode, Country, Status, IsActive
      )
      OUTPUT INSERTED.*
      VALUES (
        @companyName, @taxNumber, @taxOffice, @email, @phone, @city, @district, @address,
        @cityCode, @districtCode, @country, 'PENDING', 1
      )
    `);
  return mapCompany(result.recordset[0]);
}

export async function updateCompanyProfile(
  id: string,
  data: {
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
  },
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("phone", sql.NVarChar, data.phone ?? null)
    .input("address", sql.NVarChar, data.address ?? null)
    .input("city", sql.NVarChar, data.city ?? null)
    .input("district", sql.NVarChar, data.district ?? null)
    .query(`
      UPDATE Companies
      SET Phone = @phone,
          Address = @address,
          City = @city,
          District = @district,
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function updateCompanyStatus(
  id: string,
  status: CompanyStatus,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE Companies
      SET Status = @status, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function setCompanyActive(id: string, isActive: boolean): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("isActive", sql.Bit, isActive)
    .query(`
      UPDATE Companies
      SET IsActive = @isActive, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function listCompanies(options?: {
  status?: CompanyStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Company[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const pool = await getPool();

  const request = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);

  const where: string[] = [];
  if (options?.status) {
    request.input("status", sql.NVarChar, options.status);
    where.push("Status = @status");
  }
  if (options?.search) {
    request.input("search", sql.NVarChar, `%${options.search}%`);
    where.push("(CompanyName LIKE @search OR Email LIKE @search OR TaxNumber LIKE @search)");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await request.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Companies ${whereSql}`,
  );

  const listRequest = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);

  if (options?.status) listRequest.input("status", sql.NVarChar, options.status);
  if (options?.search) listRequest.input("search", sql.NVarChar, `%${options.search}%`);

  const listResult = await listRequest.query<CompanyRow>(`
    SELECT * FROM Companies
    ${whereSql}
    ORDER BY CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  return {
    items: listResult.recordset.map(mapCompany),
    total: countResult.recordset[0]?.total ?? 0,
  };
}

export async function countCompaniesByStatus(): Promise<Record<CompanyStatus, number>> {
  const pool = await getPool();
  const result = await pool.request().query<{ Status: CompanyStatus; Cnt: number }>(`
    SELECT Status, COUNT(*) AS Cnt FROM Companies GROUP BY Status
  `);
  const counts: Record<CompanyStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    SUSPENDED: 0,
  };
  for (const row of result.recordset) {
    counts[row.Status] = row.Cnt;
  }
  return counts;
}
