import "server-only";
import {
  assertAdmin,
  assertApprovedCompany,
  canAccessCompanyResource,
} from "@/lib/permissions";
import {
  cancellationRequestSchema,
  reviewCancellationSchema,
} from "@/lib/validation/schemas";
import {
  createCancellationRequest,
  findCancellationById,
  findPendingCancellationByOrderId,
  listCancellationRequests,
  reviewCancellationRequest,
  countPendingCancellations,
} from "@/repositories/cancellation-repository";
import {
  findOrderById,
  getOrderWithDetails,
  updateOrderStatus,
} from "@/repositories/order-repository";
import type { OrderStatus, SessionUser } from "@/types";

const CANCELLABLE_STATUSES: OrderStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PREPARING",
];

export async function requestOrderCancellation(
  user: SessionUser,
  orderId: string,
  input: unknown,
) {
  assertApprovedCompany(user);
  const data = cancellationRequestSchema.parse(input);

  const order = await findOrderById(orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");
  if (!canAccessCompanyResource(user, order.companyId)) {
    throw new Error("Bu siparişe erişim yetkiniz yok.");
  }
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new Error(
      "Bu sipariş durumunda iptal talebi oluşturulamaz. Kargoya verilmiş veya tamamlanmış siparişler iptal edilemez.",
    );
  }

  const existing = await findPendingCancellationByOrderId(orderId);
  if (existing) {
    throw new Error("Bu sipariş için zaten bekleyen bir iptal talebi var.");
  }

  const request = await createCancellationRequest({
    orderId,
    requestedByUserId: user.id,
    reason: data.reason,
  });

  return {
    request,
    message: "İptal talebiniz alındı. Admin onayı beklenmektedir.",
  };
}

export async function getOrderCancellationInfo(orderId: string) {
  return findPendingCancellationByOrderId(orderId);
}

export async function adminListCancellationRequests(
  user: SessionUser,
  options?: { status?: string; page?: number },
) {
  assertAdmin(user);
  return listCancellationRequests({
    status: (options?.status as never) || undefined,
    page: options?.page ?? 1,
    pageSize: 20,
  });
}

export async function adminReviewCancellation(
  user: SessionUser,
  requestId: string,
  input: unknown,
) {
  assertAdmin(user);
  const data = reviewCancellationSchema.parse(input);
  const request = await findCancellationById(requestId);
  if (!request) throw new Error("İptal talebi bulunamadı.");
  if (request.status !== "PENDING") {
    throw new Error("Bu talep zaten incelenmiş.");
  }

  const order = await findOrderById(request.orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");

  await reviewCancellationRequest({
    id: requestId,
    status: data.status,
    reviewedByUserId: user.id,
    adminNote: data.adminNote || null,
  });

  if (data.status === "APPROVED") {
    if (order.status !== "CANCELLED") {
      await updateOrderStatus({
        orderId: order.id,
        oldStatus: order.status,
        newStatus: "CANCELLED",
        changedByUserId: user.id,
        note: data.adminNote || "İptal talebi onaylandı",
        adminNote: data.adminNote || null,
      });
    }
    return { message: "İptal talebi onaylandı. Sipariş iptal edildi." };
  }

  return { message: "İptal talebi reddedildi." };
}

export async function getAdminOrderDetailWithCancellation(
  user: SessionUser,
  orderId: string,
) {
  assertAdmin(user);
  const order = await getOrderWithDetails(orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");
  const pendingCancellation = await findPendingCancellationByOrderId(orderId);
  return { ...order, pendingCancellation };
}

export async function getMyOrderDetailWithCancellation(
  user: SessionUser,
  orderId: string,
) {
  const order = await getOrderWithDetails(orderId);
  if (!order) throw new Error("Sipariş bulunamadı.");
  if (!canAccessCompanyResource(user, order.companyId)) {
    throw new Error("Bu siparişe erişim yetkiniz yok.");
  }
  const pendingCancellation = await findPendingCancellationByOrderId(orderId);
  return { ...order, pendingCancellation };
}

export async function getPendingCancellationCount(user: SessionUser) {
  assertAdmin(user);
  return countPendingCancellations();
}
