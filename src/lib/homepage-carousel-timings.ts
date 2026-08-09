/**
 * Ana sayfa carousel animasyon zamanlamaları (ms).
 * Sayfa açılışında tüm bölümler aynı anda hareket etmesin diye startDelay farklıdır.
 */
export const HOMEPAGE_CAROUSEL_TIMINGS = {
  /** Sürekli kategori şeridi — bir tam tur */
  autoCategory: {
    loopDurationMs: 32_000,
    startDelayMs: 500,
    /** Ekranı doldurmayan az öğede animasyon kapalı */
    minItemsForMotion: 6,
  },
  /** Mevcut CATEGORY_STRIP (sağ üst küçük) */
  categoryStrip: {
    autoplayDelayMs: 4_000,
    startDelayMs: 1_200,
  },
  /** Ana banner */
  heroBanner: {
    autoplayDelayMs: 5_800,
    startDelayMs: 800,
  },
  /** Yan banner */
  sideBanner: {
    autoplayDelayMs: 4_500,
    startDelayMs: 2_000,
  },
  /** Ürün vitrini */
  productRail: {
    autoplayDelayMs: 7_000,
    startDelayMs: 2_500,
  },
} as const;
