import type { HomepageSectionType } from "@/types/homepage";

export interface HomepageImageGuide {
  desktop: { width: number; height: number; label: string };
  mobile?: { width: number; height: number; label: string };
}

const HOMEPAGE_IMAGE_GUIDES: Partial<
  Record<HomepageSectionType, HomepageImageGuide>
> = {
  CATEGORY_STRIP: {
    desktop: { width: 800, height: 800, label: "Kare kategori görseli" },
  },
  HERO_BANNER: {
    desktop: { width: 1680, height: 720, label: "Masaüstü ana banner" },
    mobile: { width: 1200, height: 514, label: "Mobil ana banner" },
  },
  SIDE_BANNER: {
    desktop: { width: 1000, height: 430, label: "Masaüstü yan banner" },
    mobile: { width: 1200, height: 600, label: "Mobil yan banner" },
  },
};

export function getHomepageImageGuide(
  sectionType: HomepageSectionType,
): HomepageImageGuide | null {
  return HOMEPAGE_IMAGE_GUIDES[sectionType] ?? null;
}
