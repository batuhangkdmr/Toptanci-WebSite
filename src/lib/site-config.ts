/**
 * Merkezi site ayarları — gerçek şirket bilgileri sonradan doldurulur.
 * Uydurma unvan/adres/MERSİS yazılmaz.
 */
export const siteConfig = {
  name: "Toptancı",
  tagline: "B2B Toptan Satış Platformu",
  description: "Firmalar için B2B toptan ürün sipariş platformu.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  /** Public katalog: misafir ürünleri görebilir */
  publicCatalogEnabled:
    (process.env.PUBLIC_CATALOG_ENABLED ?? "true").toLowerCase() !== "false",

  /** Pazarlama izni üyelik şartı mı? Varsayılan: hayır */
  requireCommercialConsent:
    (process.env.REQUIRE_COMMERCIAL_CONSENT ?? "false").toLowerCase() === "true",

  contact: {
    address: process.env.SITE_ADDRESS || "[Şirket adresi buraya eklenecek]",
    phone: process.env.SITE_PHONE || "[Telefon buraya eklenecek]",
    email: process.env.SITE_EMAIL || "info@ornek.com",
  },

  social: {
    facebook: process.env.SITE_FACEBOOK || "",
    instagram: process.env.SITE_INSTAGRAM || "",
    whatsapp: process.env.SITE_WHATSAPP || "",
  },

  legalVersions: {
    MEMBERSHIP_AGREEMENT: "1.0",
    KVKK_NOTICE: "1.0",
    COMMERCIAL_COMMUNICATION: "1.0",
  } as const,
} as const;

export type LegalDocType = keyof typeof siteConfig.legalVersions;
