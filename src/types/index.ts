export type UserRole = "ADMIN" | "COMPANY_USER";

export type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type OrderStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type CancellationRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED_BY_USER";

export interface OrderCancellationRequest {
  id: string;
  orderId: string;
  requestedByUserId: string;
  reason: string | null;
  status: CancellationRequestStatus;
  adminNote: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  orderNumber?: string;
  companyName?: string;
  requestedByName?: string;
}

export interface Company {
  id: string;
  companyName: string;
  taxNumber: string | null;
  taxOffice: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  status: CompanyStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  imageCloudinaryPublicId: string | null;
  imageSecureUrl: string | null;
  imageAltText: string | null;
  homepageSortOrder: number;
  showOnHomepage: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  unit: string | null;
  price: number | null;
  stockQuantity: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  format: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
  categoryName?: string | null;
}

export interface Cart {
  id: string;
  companyId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemWithProduct extends CartItem {
  productName: string;
  productSlug: string;
  unit: string | null;
  price: number | null;
  stockQuantity: number | null;
  isActive: boolean;
  primaryImageUrl: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  companyId: string;
  createdByUserId: string;
  status: OrderStatus;
  subtotal: number;
  grandTotal: number;
  customerNote: string | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productNameSnapshot: string;
  unitSnapshot: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  oldStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedByUserId: string | null;
  note: string | null;
  createdAt: Date;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  history: OrderStatusHistory[];
  companyName?: string;
  createdByName?: string;
  pendingCancellation?: OrderCancellationRequest | null;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string | null;
  companyStatus: CompanyStatus | null;
  companyName: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
