import "server-only";
import { getPool, sql, withTransaction } from "@/lib/db/pool";
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusHistory,
  OrderWithDetails,
} from "@/types";

type OrderRow = {
  Id: string;
  OrderNumber: string;
  CompanyId: string;
  CreatedByUserId: string;
  Status: OrderStatus;
  Subtotal: number;
  GrandTotal: number;
  CustomerNote: string | null;
  AdminNote: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  CompanyName?: string;
  CreatedByName?: string;
};

type OrderItemRow = {
  Id: string;
  OrderId: string;
  ProductId: string | null;
  ProductNameSnapshot: string;
  UnitSnapshot: string | null;
  UnitPrice: number;
  Quantity: number;
  LineTotal: number;
  CreatedAt: Date;
};

type HistoryRow = {
  Id: string;
  OrderId: string;
  OldStatus: OrderStatus | null;
  NewStatus: OrderStatus;
  ChangedByUserId: string | null;
  Note: string | null;
  CreatedAt: Date;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.Id,
    orderNumber: row.OrderNumber,
    companyId: row.CompanyId,
    createdByUserId: row.CreatedByUserId,
    status: row.Status,
    subtotal: Number(row.Subtotal),
    grandTotal: Number(row.GrandTotal),
    customerNote: row.CustomerNote,
    adminNote: row.AdminNote,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.Id,
    orderId: row.OrderId,
    productId: row.ProductId,
    productNameSnapshot: row.ProductNameSnapshot,
    unitSnapshot: row.UnitSnapshot,
    unitPrice: Number(row.UnitPrice),
    quantity: Number(row.Quantity),
    lineTotal: Number(row.LineTotal),
    createdAt: row.CreatedAt,
  };
}

function mapHistory(row: HistoryRow): OrderStatusHistory {
  return {
    id: row.Id,
    orderId: row.OrderId,
    oldStatus: row.OldStatus,
    newStatus: row.NewStatus,
    changedByUserId: row.ChangedByUserId,
    note: row.Note,
    createdAt: row.CreatedAt,
  };
}

export async function createOrderFromCart(params: {
  orderNumber: string;
  companyId: string;
  userId: string;
  customerNote?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    unit: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  grandTotal: number;
  cartId: string;
}): Promise<Order> {
  return withTransaction(async (_request, transaction) => {
    const orderRequest = new sql.Request(transaction);
    const orderResult = await orderRequest
      .input("orderNumber", sql.NVarChar, params.orderNumber)
      .input("companyId", sql.UniqueIdentifier, params.companyId)
      .input("userId", sql.UniqueIdentifier, params.userId)
      .input("subtotal", sql.Decimal(18, 2), params.subtotal)
      .input("grandTotal", sql.Decimal(18, 2), params.grandTotal)
      .input("customerNote", sql.NVarChar, params.customerNote ?? null)
      .query<OrderRow>(`
        INSERT INTO Orders (
          OrderNumber, CompanyId, CreatedByUserId, Status, Subtotal, GrandTotal, CustomerNote
        )
        OUTPUT INSERTED.*
        VALUES (
          @orderNumber, @companyId, @userId, 'PENDING_APPROVAL', @subtotal, @grandTotal, @customerNote
        )
      `);

    const order = mapOrder(orderResult.recordset[0]);

    for (const item of params.items) {
      const itemRequest = new sql.Request(transaction);
      await itemRequest
        .input("orderId", sql.UniqueIdentifier, order.id)
        .input("productId", sql.UniqueIdentifier, item.productId)
        .input("productName", sql.NVarChar, item.productName)
        .input("unit", sql.NVarChar, item.unit)
        .input("unitPrice", sql.Decimal(18, 2), item.unitPrice)
        .input("quantity", sql.Decimal(18, 3), item.quantity)
        .input("lineTotal", sql.Decimal(18, 2), item.lineTotal)
        .query(`
          INSERT INTO OrderItems (
            OrderId, ProductId, ProductNameSnapshot, UnitSnapshot, UnitPrice, Quantity, LineTotal
          )
          VALUES (
            @orderId, @productId, @productName, @unit, @unitPrice, @quantity, @lineTotal
          )
        `);
    }

    const historyRequest = new sql.Request(transaction);
    await historyRequest
      .input("orderId", sql.UniqueIdentifier, order.id)
      .input("newStatus", sql.NVarChar, "PENDING_APPROVAL")
      .input("changedBy", sql.UniqueIdentifier, params.userId)
      .input("note", sql.NVarChar, "Sipariş oluşturuldu")
      .query(`
        INSERT INTO OrderStatusHistory (OrderId, OldStatus, NewStatus, ChangedByUserId, Note)
        VALUES (@orderId, NULL, @newStatus, @changedBy, @note)
      `);

    const clearRequest = new sql.Request(transaction);
    await clearRequest
      .input("cartId", sql.UniqueIdentifier, params.cartId)
      .query("DELETE FROM CartItems WHERE CartId = @cartId");

    return order;
  });
}

export async function findOrderById(id: string): Promise<Order | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<OrderRow>("SELECT * FROM Orders WHERE Id = @id");
  return result.recordset[0] ? mapOrder(result.recordset[0]) : null;
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, orderId)
    .query<OrderItemRow>(
      "SELECT * FROM OrderItems WHERE OrderId = @orderId ORDER BY CreatedAt",
    );
  return result.recordset.map(mapOrderItem);
}

export async function getOrderHistory(orderId: string): Promise<OrderStatusHistory[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, orderId)
    .query<HistoryRow>(
      "SELECT * FROM OrderStatusHistory WHERE OrderId = @orderId ORDER BY CreatedAt",
    );
  return result.recordset.map(mapHistory);
}

export async function getOrderWithDetails(
  id: string,
): Promise<OrderWithDetails | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query<OrderRow>(`
      SELECT o.*,
             c.CompanyName,
             u.FirstName + ' ' + u.LastName AS CreatedByName
      FROM Orders o
      INNER JOIN Companies c ON c.Id = o.CompanyId
      INNER JOIN Users u ON u.Id = o.CreatedByUserId
      WHERE o.Id = @id
    `);
  const row = result.recordset[0];
  if (!row) return null;

  const items = await getOrderItems(id);
  const history = await getOrderHistory(id);

  return {
    ...mapOrder(row),
    companyName: row.CompanyName,
    createdByName: row.CreatedByName,
    items,
    history,
  };
}

export async function listOrders(options?: {
  companyId?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Array<Order & { companyName?: string }>; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const pool = await getPool();

  const where: string[] = [];
  if (options?.companyId) where.push("o.CompanyId = @companyId");
  if (options?.status) where.push("o.Status = @status");
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countReq = pool.request();
  if (options?.companyId) countReq.input("companyId", sql.UniqueIdentifier, options.companyId);
  if (options?.status) countReq.input("status", sql.NVarChar, options.status);

  const countResult = await countReq.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM Orders o ${whereSql}`,
  );

  const listReq = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);
  if (options?.companyId) listReq.input("companyId", sql.UniqueIdentifier, options.companyId);
  if (options?.status) listReq.input("status", sql.NVarChar, options.status);

  const listResult = await listReq.query<OrderRow>(`
    SELECT o.*, c.CompanyName
    FROM Orders o
    INNER JOIN Companies c ON c.Id = o.CompanyId
    ${whereSql}
    ORDER BY o.CreatedAt DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `);

  return {
    items: listResult.recordset.map((row) => ({
      ...mapOrder(row),
      companyName: row.CompanyName,
    })),
    total: countResult.recordset[0]?.total ?? 0,
  };
}

export async function updateOrderStatus(params: {
  orderId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  changedByUserId: string;
  note?: string | null;
  adminNote?: string | null;
}): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, params.orderId)
    .input("status", sql.NVarChar, params.newStatus)
    .input("adminNote", sql.NVarChar, params.adminNote ?? null)
    .query(`
      UPDATE Orders
      SET Status = @status,
          AdminNote = COALESCE(@adminNote, AdminNote),
          UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `);

  await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, params.orderId)
    .input("oldStatus", sql.NVarChar, params.oldStatus)
    .input("newStatus", sql.NVarChar, params.newStatus)
    .input("changedBy", sql.UniqueIdentifier, params.changedByUserId)
    .input("note", sql.NVarChar, params.note ?? null)
    .query(`
      INSERT INTO OrderStatusHistory (OrderId, OldStatus, NewStatus, ChangedByUserId, Note)
      VALUES (@orderId, @oldStatus, @newStatus, @changedBy, @note)
    `);
}

export async function countOrdersByStatus(): Promise<Record<string, number>> {
  const pool = await getPool();
  const result = await pool.request().query<{ Status: string; Cnt: number }>(`
    SELECT Status, COUNT(*) AS Cnt FROM Orders GROUP BY Status
  `);
  const counts: Record<string, number> = {};
  for (const row of result.recordset) {
    counts[row.Status] = row.Cnt;
  }
  return counts;
}
