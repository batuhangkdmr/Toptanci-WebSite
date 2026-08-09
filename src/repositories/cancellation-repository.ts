import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import type {
  CancellationRequestStatus,
  OrderCancellationRequest,
} from "@/types";

type Row = {
  Id: string;
  OrderId: string;
  RequestedByUserId: string;
  Reason: string | null;
  Status: CancellationRequestStatus;
  AdminNote: string | null;
  ReviewedByUserId: string | null;
  ReviewedAt: Date | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  OrderNumber?: string;
  CompanyName?: string;
  RequestedByName?: string;
};

function mapRow(row: Row): OrderCancellationRequest {
  return {
    id: row.Id,
    orderId: row.OrderId,
    requestedByUserId: row.RequestedByUserId,
    reason: row.Reason,
    status: row.Status,
    adminNote: row.AdminNote,
    reviewedByUserId: row.ReviewedByUserId,
    reviewedAt: row.ReviewedAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    orderNumber: row.OrderNumber,
    companyName: row.CompanyName,
    requestedByName: row.RequestedByName,
  };
}

export async function createCancellationRequest(data: {
  orderId: string;
  requestedByUserId: string;
  reason?: string | null;
}): Promise<OrderCancellationRequest> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, data.orderId)
    .input("userId", sql.UniqueIdentifier, data.requestedByUserId)
    .input("reason", sql.NVarChar, data.reason ?? null)
    .query<Row>(`
      INSERT INTO OrderCancellationRequests (OrderId, RequestedByUserId, Reason, Status)
      OUTPUT INSERTED.*
      VALUES (@orderId, @userId, @reason, 'PENDING')
    `);
  return mapRow(result.recordset[0]);
}

export async function findPendingCancellationByOrderId(
  orderId: string,
): Promise<OrderCancellationRequest | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, orderId)
    .query<Row>(`
      SELECT TOP 1 * FROM OrderCancellationRequests
      WHERE OrderId = @orderId AND Status = 'PENDING'
      ORDER BY CreatedAt DESC
    `);
  return result.recordset[0] ? mapRow(result.recordset[0]) : null;
}

export async function findCancellationById(
  id: string,
): Promise<OrderCancellationRequest | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<Row>(`
      SELECT r.*,
             o.OrderNumber,
             c.CompanyName,
             u.FirstName + ' ' + u.LastName AS RequestedByName
      FROM OrderCancellationRequests r
      INNER JOIN Orders o ON o.Id = r.OrderId
      INNER JOIN Companies c ON c.Id = o.CompanyId
      INNER JOIN Users u ON u.Id = r.RequestedByUserId
      WHERE r.Id = @id
    `);
  return result.recordset[0] ? mapRow(result.recordset[0]) : null;
}

export async function listCancellationRequests(options?: {
  status?: CancellationRequestStatus;
  page?: number;
  pageSize?: number;
}): Promise<{ items: OrderCancellationRequest[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const pool = await getPool();

  const where = options?.status ? "WHERE r.Status = @status" : "";

  const countReq = pool.request();
  if (options?.status) countReq.input("status", sql.NVarChar, options.status);
  const countResult = await countReq.query<{ total: number }>(`
    SELECT COUNT(*) AS total
    FROM OrderCancellationRequests r
    ${where}
  `);

  const listReq = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);
  if (options?.status) listReq.input("status", sql.NVarChar, options.status);

  const listResult = await listReq.query<Row>(`
    SELECT r.*,
           o.OrderNumber,
           c.CompanyName,
           u.FirstName + ' ' + u.LastName AS RequestedByName
    FROM OrderCancellationRequests r
    INNER JOIN Orders o ON o.Id = r.OrderId
    INNER JOIN Companies c ON c.Id = o.CompanyId
    INNER JOIN Users u ON u.Id = r.RequestedByUserId
    ${where}
    ORDER BY r.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  return {
    items: listResult.recordset.map(mapRow),
    total: countResult.recordset[0]?.total ?? 0,
  };
}

export async function reviewCancellationRequest(params: {
  id: string;
  status: "APPROVED" | "REJECTED";
  reviewedByUserId: string;
  adminNote?: string | null;
}): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, params.id)
    .input("status", sql.NVarChar, params.status)
    .input("reviewedBy", sql.UniqueIdentifier, params.reviewedByUserId)
    .input("adminNote", sql.NVarChar, params.adminNote ?? null)
    .query(`
      UPDATE OrderCancellationRequests
      SET Status = @status,
          AdminNote = @adminNote,
          ReviewedByUserId = @reviewedBy,
          ReviewedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id AND Status = 'PENDING'
    `);
}

export async function countPendingCancellations(): Promise<number> {
  const pool = await getPool();
  const result = await pool.request().query<{ total: number }>(`
    SELECT COUNT(*) AS total FROM OrderCancellationRequests WHERE Status = 'PENDING'
  `);
  return result.recordset[0]?.total ?? 0;
}
