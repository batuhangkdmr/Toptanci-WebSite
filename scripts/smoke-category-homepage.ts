/**
 * Kategori homepage filtre / şema duman testi
 * npx tsx scripts/smoke-category-homepage.ts
 */
import { categorySchema } from "../src/lib/validation/schemas";
import { HOMEPAGE_CAROUSEL_TIMINGS } from "../src/lib/homepage-carousel-timings";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const parsed = categorySchema.parse({
  name: "İçecekler",
  description: "",
  isActive: true,
  showOnHomepage: true,
  homepageSortOrder: 2,
  imageAltText: "İçecekler",
});
assert(parsed.homepageSortOrder === 2, "sort order");
assert(parsed.showOnHomepage === true, "show on homepage");

let threw = false;
try {
  categorySchema.parse({ name: "X", homepageSortOrder: -1 });
} catch {
  threw = true;
}
assert(threw, "negative sort rejected");

assert(
  Number(HOMEPAGE_CAROUSEL_TIMINGS.heroBanner.autoplayDelayMs) !==
    Number(HOMEPAGE_CAROUSEL_TIMINGS.sideBanner.autoplayDelayMs),
  "hero/side delays differ",
);
assert(
  HOMEPAGE_CAROUSEL_TIMINGS.autoCategory.loopDurationMs >= 25_000,
  "auto category slow loop",
);

console.log("smoke-category-homepage: OK");
