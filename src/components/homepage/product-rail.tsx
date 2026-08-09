"use client";

import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { HOMEPAGE_CAROUSEL_TIMINGS } from "@/lib/homepage-carousel-timings";
import type { ProductWithImages } from "@/types";

interface Props {
  title: string | null;
  description: string | null;
  showViewAll: boolean;
  viewAllHref: string | null;
  products: ProductWithImages[];
  canOrder: boolean;
}

export function ProductRailCarousel({
  title,
  description,
  showViewAll,
  viewAllHref,
  products,
  canOrder,
}: Props) {
  const timings = HOMEPAGE_CAROUSEL_TIMINGS.productRail;
  const enableAutoplay = products.length > 2;
  const plugin = useMemo(
    () =>
      Autoplay({
        delay: timings.autoplayDelayMs,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    [timings.autoplayDelayMs],
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enableAutoplay) return;
    const t = window.setTimeout(() => setReady(true), timings.startDelayMs);
    return () => window.clearTimeout(t);
  }, [enableAutoplay, timings.startDelayMs]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      loop: enableAutoplay,
    },
    ready && enableAutoplay ? [plugin] : [],
  );

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    plugin.reset();
  }, [emblaApi, plugin]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    plugin.reset();
  }, [emblaApi, plugin]);

  if (products.length === 0) return null;

  return (
    <section className="space-y-4" aria-label={title || "Ürün vitrini"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {title && (
            <>
              <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-bold tracking-[-0.02em] text-[var(--navy)] sm:text-2xl">{title}</h2>
              <span className="mt-2 block h-1 w-12 rounded-full bg-[var(--teal)]" aria-hidden />
            </>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          {showViewAll && (
            <Link
              href={viewAllHref || "/#urunler"}
              className="mr-1 inline-flex h-9 items-center rounded-full bg-[var(--surface-subtle)] px-4 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--muted)]"
            >
              Tümünü Gör
            </Link>
          )}
          {products.length > 1 && <button
            type="button"
            onClick={scrollPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--navy)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Önceki ürünler"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>}
          {products.length > 1 && <button
            type="button"
            onClick={scrollNext}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--navy)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Sonraki ürünler"
          >
            <ChevronRight className="h-4 w-4" />
          </button>}
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 sm:gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-0 flex-[0_0_84%] min-[420px]:flex-[0_0_72%] sm:flex-[0_0_46%] md:flex-[0_0_31%] lg:flex-[0_0_24%]"
            >
              <ProductCard product={product} canOrder={canOrder} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
