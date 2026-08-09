import type { Category, ProductWithImages } from "@/types";

export type HomepageSectionType =
  | "CATEGORY_STRIP"
  | "HERO_BANNER"
  | "SIDE_BANNER"
  | "PRODUCT_RAIL"
  | "AUTO_CATEGORY_CAROUSEL";

export type HomepageTargetType = "NONE" | "CATEGORY" | "PRODUCT" | "URL";

export interface HomepageSection {
  id: string;
  sectionType: HomepageSectionType;
  title: string | null;
  description: string | null;
  showViewAll: boolean;
  viewAllHref: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomepageCarouselItem {
  id: string;
  sectionId: string;
  title: string | null;
  description: string | null;
  altText: string | null;
  cloudinaryPublicId: string | null;
  secureUrl: string | null;
  mobileCloudinaryPublicId: string | null;
  mobileSecureUrl: string | null;
  categoryId: string | null;
  productId: string | null;
  targetType: HomepageTargetType | null;
  targetUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HomepageProductItem {
  id: string;
  sectionId: string;
  productId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface HomepageCarouselItemWithCategory extends HomepageCarouselItem {
  category: Pick<Category, "id" | "name" | "slug" | "description" | "isActive"> | null;
}

export interface HomepageProductItemWithProduct extends HomepageProductItem {
  product: ProductWithImages;
}

export interface PublicHomepageSection extends HomepageSection {
  carouselItems: HomepageCarouselItemWithCategory[];
  products: ProductWithImages[];
}
