import "server-only";
import { assertApprovedCompany, assertAdmin, canAccessCompanyResource } from "@/lib/permissions";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validation/schemas";
import { getCartItems, getOrCreateCart } from "@/repositories/cart-repository";
import {
  createOrderFromCart,
  getOrderWithDetails,
  listOrders,
  updateOrderStatus,
} from "@/repositories/order-repository";
import { generateOrderNumber } from "@/lib/utils";
import type { SessionUser } from "@/types";

export async function placeOrder(user: SessionUser, input: unknown) {
  assertApprovedCompany(user);
  const data = createOrderSchema.parse(input);

  const cart = await getOrCreateCart(user.companyId!, user.id);
  const items = await getCartItems(cart.id);

  if (items.length === 0) {
    throw new Error("Sepetiniz boş.");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    if (!item.isActive) {
      throw new Error(`"${item.productName}" artık aktif değil.`);
    }
    if (item.price === null) {
      throw new Error(`"${item.productName}" için fiyat belirlenmemiş.`);
    }
    if (item.stockQuantity !== null && item.quantity > item.stockQuantity) {
      throw new Error(`"${item.productName}" için yeterli stok yok.`);
    }

    const lineTotal = Number((item.price * item.quantity).toFixed(2));
    subtotal += lineTotal;
    orderItems.push({
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      unitPrice: item.price,
      quantity: item.quantity,
      lineTotal,
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const grandTotal = subtotal;

  const order = await createOrderFromCart({
    orderNumber: generateOrderNumber(),
    companyId: user.companyId!,
    userId: user.id,
    customerNote: data.customerNote || null,
    items: orderItems,
    subtotal,
    grandTotal,
    cartId: cart.id,
  });

  return {
    order,
    message: "Siparişiniz alınmıştır ve admin onayı beklenmektedir.",
  };
}

export async function getMyOrders(user: SessionUser, page = 1) {
  assertApprovedCompany(user);
  return listOrders({ companyId: user.companyId!, page, pageSize: 20 });
}

export async function getMyOrderDetail(user: SessionUser, orderId: string) {
  const order = await getOrderWithDetails(orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");

  if (!canAccessCompanyResource(user, order.companyId)) {
    throw new Error("Bu siparişe erişim yetkiniz yok.");
  }

  return order;
}

export async function getAdminOrders(user: SessionUser, options?: {
  status?: string;
  page?: number;
}) {
  assertAdmin(user);
  return listOrders({
    status: options?.status as never,
    page: options?.page ?? 1,
    pageSize: 20,
  });
}

export async function getAdminOrderDetail(user: SessionUser, orderId: string) {
  assertAdmin(user);
  const order = await getOrderWithDetails(orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");
  return order;
}

export async function changeOrderStatus(
  user: SessionUser,
  orderId: string,
  input: unknown,
) {
  assertAdmin(user);
  const data = updateOrderStatusSchema.parse(input);
  const order = await getOrderWithDetails(orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");

  await updateOrderStatus({
    orderId,
    oldStatus: order.status,
    newStatus: data.status,
    changedByUserId: user.id,
    note: data.note || null,
    adminNote: data.adminNote || null,
  });

  return { message: "Sipariş durumu güncellendi." };
}
