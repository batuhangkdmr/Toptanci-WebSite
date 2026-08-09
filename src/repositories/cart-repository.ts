import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import type { Cart, CartItemWithProduct } from "@/types";

type CartRow = {
  Id: string;
  CompanyId: string;
  UserId: string;
  CreatedAt: Date;
  UpdatedAt: Date;
};

function mapCart(row: CartRow): Cart {
  return {
    id: row.Id,
    companyId: row.CompanyId,
    userId: row.UserId,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export async function getOrCreateCart(
  companyId: string,
  userId: string,
): Promise<Cart> {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input("companyId", sql.UniqueIdentifier, companyId)
    .input("userId", sql.UniqueIdentifier, userId)
    .query<CartRow>(
      "SELECT * FROM Carts WHERE CompanyId = @companyId AND UserId = @userId",
    );

  if (existing.recordset[0]) {
    return mapCart(existing.recordset[0]);
  }

  const created = await pool
    .request()
    .input("companyId", sql.UniqueIdentifier, companyId)
    .input("userId", sql.UniqueIdentifier, userId)
    .query<CartRow>(`
      INSERT INTO Carts (CompanyId, UserId)
      OUTPUT INSERTED.*
      VALUES (@companyId, @userId)
    `);
  return mapCart(created.recordset[0]);
}

export async function getCartItems(cartId: string): Promise<CartItemWithProduct[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, cartId)
    .query<{
      Id: string;
      CartId: string;
      ProductId: string;
      Quantity: number;
      CreatedAt: Date;
      UpdatedAt: Date;
      ProductName: string;
      ProductSlug: string;
      Unit: string | null;
      Price: number | null;
      StockQuantity: number | null;
      IsActive: boolean;
      PrimaryImageUrl: string | null;
    }>(`
      SELECT
        ci.Id, ci.CartId, ci.ProductId, ci.Quantity, ci.CreatedAt, ci.UpdatedAt,
        p.Name AS ProductName, p.Slug AS ProductSlug, p.Unit, p.Price,
        p.StockQuantity, p.IsActive,
        (
          SELECT TOP 1 pi.SecureUrl
          FROM ProductImages pi
          WHERE pi.ProductId = p.Id
          ORDER BY pi.IsPrimary DESC, pi.SortOrder ASC
        ) AS PrimaryImageUrl
      FROM CartItems ci
      INNER JOIN Products p ON p.Id = ci.ProductId
      WHERE ci.CartId = @cartId
      ORDER BY ci.CreatedAt ASC
    `);

  return result.recordset.map((row) => ({
    id: row.Id,
    cartId: row.CartId,
    productId: row.ProductId,
    quantity: Number(row.Quantity),
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    productName: row.ProductName,
    productSlug: row.ProductSlug,
    unit: row.Unit,
    price: row.Price !== null ? Number(row.Price) : null,
    stockQuantity: row.StockQuantity !== null ? Number(row.StockQuantity) : null,
    isActive: row.IsActive,
    primaryImageUrl: row.PrimaryImageUrl,
  }));
}

export async function addOrUpdateCartItem(
  cartId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, cartId)
    .input("productId", sql.UniqueIdentifier, productId)
    .query<{ Id: string; Quantity: number }>(
      "SELECT Id, Quantity FROM CartItems WHERE CartId = @cartId AND ProductId = @productId",
    );

  if (existing.recordset[0]) {
    const newQty = Number(existing.recordset[0].Quantity) + quantity;
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, existing.recordset[0].Id)
      .input("quantity", sql.Decimal(18, 3), newQty)
      .query(`
        UPDATE CartItems
        SET Quantity = @quantity, UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
      `);
  } else {
    await pool
      .request()
      .input("cartId", sql.UniqueIdentifier, cartId)
      .input("productId", sql.UniqueIdentifier, productId)
      .input("quantity", sql.Decimal(18, 3), quantity)
      .query(`
        INSERT INTO CartItems (CartId, ProductId, Quantity)
        VALUES (@cartId, @productId, @quantity)
      `);
  }

  await touchCart(cartId);
}

export async function updateCartItemQuantity(
  itemId: string,
  cartId: string,
  quantity: number,
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, itemId)
    .input("cartId", sql.UniqueIdentifier, cartId)
    .input("quantity", sql.Decimal(18, 3), quantity)
    .query(`
      UPDATE CartItems
      SET Quantity = @quantity, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id AND CartId = @cartId
    `);
  await touchCart(cartId);
}

export async function removeCartItem(itemId: string, cartId: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, itemId)
    .input("cartId", sql.UniqueIdentifier, cartId)
    .query("DELETE FROM CartItems WHERE Id = @id AND CartId = @cartId");
  await touchCart(cartId);
}

export async function clearCart(cartId: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, cartId)
    .query("DELETE FROM CartItems WHERE CartId = @cartId");
  await touchCart(cartId);
}

export async function getCartItemCount(cartId: string): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, cartId)
    .query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM CartItems WHERE CartId = @cartId",
    );
  return result.recordset[0]?.total ?? 0;
}

async function touchCart(cartId: string): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, cartId)
    .query("UPDATE Carts SET UpdatedAt = SYSUTCDATETIME() WHERE Id = @cartId");
}
