import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import type { User, UserRole } from "@/types";

type UserRow = {
  Id: string;
  CompanyId: string | null;
  FirstName: string;
  LastName: string;
  Email: string;
  PasswordHash: string;
  Phone: string | null;
  Role: UserRole;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
};

function mapUser(row: UserRow): User {
  return {
    id: row.Id,
    companyId: row.CompanyId,
    firstName: row.FirstName,
    lastName: row.LastName,
    email: row.Email,
    passwordHash: row.PasswordHash,
    phone: row.Phone,
    role: row.Role,
    isActive: row.IsActive,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", sql.NVarChar, email.toLowerCase())
    .query<UserRow>("SELECT * FROM Users WHERE Email = @email");
  const row = result.recordset[0];
  return row ? mapUser(row) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<UserRow>("SELECT * FROM Users WHERE Id = @id");
  const row = result.recordset[0];
  return row ? mapUser(row) : null;
}

export async function createUser(
  data: {
    companyId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
    role: UserRole;
    gender?: "MALE" | "FEMALE" | "UNSPECIFIED" | null;
    cityCode?: string | null;
    districtCode?: string | null;
    cityName?: string | null;
    districtName?: string | null;
  },
  transaction?: sql.Transaction,
): Promise<User> {
  const request = transaction
    ? new sql.Request(transaction)
    : (await getPool()).request();

  const result = await request
    .input("companyId", sql.UniqueIdentifier, data.companyId)
    .input("firstName", sql.NVarChar, data.firstName)
    .input("lastName", sql.NVarChar, data.lastName)
    .input("email", sql.NVarChar, data.email.toLowerCase())
    .input("passwordHash", sql.NVarChar, data.passwordHash)
    .input("phone", sql.NVarChar, data.phone ?? null)
    .input("role", sql.NVarChar, data.role)
    .input("gender", sql.NVarChar, data.gender ?? null)
    .input("cityCode", sql.NVarChar, data.cityCode ?? null)
    .input("districtCode", sql.NVarChar, data.districtCode ?? null)
    .input("cityName", sql.NVarChar, data.cityName ?? null)
    .input("districtName", sql.NVarChar, data.districtName ?? null)
    .query<UserRow>(`
      INSERT INTO Users (
        CompanyId, FirstName, LastName, Email, PasswordHash, Phone, Role, IsActive,
        Gender, CityCode, DistrictCode, CityName, DistrictName
      )
      OUTPUT INSERTED.*
      VALUES (
        @companyId, @firstName, @lastName, @email, @passwordHash, @phone, @role, 1,
        @gender, @cityCode, @districtCode, @cityName, @districtName
      )
    `);
  return mapUser(result.recordset[0]);
}

export async function updateUserProfile(
  id: string,
  data: { firstName: string; lastName: string; phone?: string | null },
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("firstName", sql.NVarChar, data.firstName)
    .input("lastName", sql.NVarChar, data.lastName)
    .input("phone", sql.NVarChar, data.phone ?? null)
    .query(`
      UPDATE Users
      SET FirstName = @firstName,
          LastName = @lastName,
          Phone = @phone,
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("passwordHash", sql.NVarChar, passwordHash)
    .query(`
      UPDATE Users
      SET PasswordHash = @passwordHash, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export async function setUserActive(id: string, isActive: boolean): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("isActive", sql.Bit, isActive)
    .query(`
      UPDATE Users
      SET IsActive = @isActive, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);
}

export type UserListItem = User & { companyName: string | null };

export async function listUsers(options?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: UserListItem[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const pool = await getPool();

  const where: string[] = [];
  if (options?.search) {
    where.push(
      "(u.FirstName LIKE @search OR u.LastName LIKE @search OR u.Email LIKE @search)",
    );
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countReq = pool.request();
  if (options?.search) countReq.input("search", sql.NVarChar, `%${options.search}%`);
  const countResult = await countReq.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Users u ${whereSql}`,
  );

  const listReq = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);
  if (options?.search) listReq.input("search", sql.NVarChar, `%${options.search}%`);

  const listResult = await listReq.query<UserRow & { CompanyName: string | null }>(`
    SELECT u.*, c.CompanyName
    FROM Users u
    LEFT JOIN Companies c ON c.Id = u.CompanyId
    ${whereSql}
    ORDER BY u.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  return {
    items: listResult.recordset.map((row) => ({
      ...mapUser(row),
      companyName: row.CompanyName,
    })),
    total: countResult.recordset[0]?.total ?? 0,
  };
}
