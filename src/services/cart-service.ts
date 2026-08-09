import "server-only";
import {
  addOrUpdateCartItem,
  clearCart,
  getCartItemCount,
  getCartItems,
  getOrCreateCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/repositories/cart-repository";
import { findProductById } from "@/repositories/product-repository";
import { assertApprovedCompany } from "@/lib/permissions";
import { cartAddSchema, cartUpdateSchema } from "@/lib/validation/schemas";
import type { SessionUser } from "@/types";

export async function getMyCart(user: SessionUser) {
  assertApprovedCompany(user);
  const cart = await getOrCreateCart(user.companyId!, user.id);
  const items = await getCartItems(cart.id);

  const subtotal = items.reduce((sum, item) => {
    if (item.price === null) return sum;
    return sum + item.price * item.quantity;
  }, 0);

  return { cart, items, subtotal };
}

export async function getMyCartCount(user: SessionUser): Promise<number> {
  if (!user.companyId || user.companyStatus !== "APPROVED") return 0;
  const cart = await getOrCreateCart(user.companyId, user.id);
  return getCartItemCount(cart.id);
}

export async function addToCart(user: SessionUser, input: unknown) {
  assertApprovedCompany(user);
  const data = cartAddSchema.parse(input);

  const product = await findProductById(data.productId);
  if (!product || !product.isActive) {
    throw new Error("Ürün bulunamadı veya aktif değil.");
  }
  if (product.price === null) {
    throw new Error("Fiyatı belirlenmemiş ürün sepete eklenemez.");
  }
  if (product.stockQuantity !== null && data.quantity > product.stockQuantity) {
    throw new Error("Yeterli stok bulunmamaktadır.");
  }

  const cart = await getOrCreateCart(user.companyId!, user.id);
  await addOrUpdateCartItem(cart.id, data.productId, data.quantity);

  return { message: "Ürün sepete eklendi." };
}

export async function updateCartItem(user: SessionUser, itemId: string, input: unknown) {
  assertApprovedCompany(user);
  const data = cartUpdateSchema.parse(input);
  const cart = await getOrCreateCart(user.companyId!, user.id);

  const items = await getCartItems(cart.id);
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error("Sepet kalemi bulunamadı.");

  if (item.stockQuantity !== null && data.quantity > item.stockQuantity) {
    throw new Error("Yeterli stok bulunmamaktadır.");
  }

  await updateCartItemQuantity(itemId, cart.id, data.quantity);
  return { message: "Miktar güncellendi." };
}

export async function removeFromCart(user: SessionUser, itemId: string) {
  assertApprovedCompany(user);
  const cart = await getOrCreateCart(user.companyId!, user.id);
  await removeCartItem(itemId, cart.id);
  return { message: "Ürün sepetten kaldırıldı." };
}

export async function emptyCart(user: SessionUser) {
  assertApprovedCompany(user);
  const cart = await getOrCreateCart(user.companyId!, user.id);
  await clearCart(cart.id);
  return { message: "Sepet temizlendi." };
}
