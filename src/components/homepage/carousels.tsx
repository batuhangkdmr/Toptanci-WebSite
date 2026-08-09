"use client";

import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOMEPAGE_CAROUSEL_TIMINGS } from "@/lib/homepage-carousel-timings";
import { cn } from "@/lib/utils";
import type { HomepageCarouselItemWithCategory } from "@/types/homepage";

interface Props {
  items: HomepageCarouselItemWithCategory[];
  variant?: "strip" | "compact";
  className?: string;
}

function useDelayedAutoplay(
  delayMs: number,
  startDelayMs: number,
  enabled: boolean,
) {
  const plugin = useMemo(
    () =>
      Autoplay({
        delay: delayMs,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    [delayMs],
  );

  const [ready, setReady] = useState(() => !enabled || startDelayMs <= 0);

  useEffect(() => {
    if (!enabled || startDelayMs <= 0) return;
    const t = window.setTimeout(() => setReady(true), startDelayMs);
    return () => window.clearTimeout(t);
  }, [enabled, startDelayMs]);

  return { plugin, ready: enabled ? ready : false };
}

export function CategoryStripCarousel({
  items,
  variant = "strip",
  className,
}: Props) {
  const timings = HOMEPAGE_CAROUSEL_TIMINGS.categoryStrip;
  const enableAutoplay = items.length > 1;
  const { plugin, ready } = useDelayedAutoplay(
    timings.autoplayDelayMs,
    timings.startDelayMs,
    enableAutoplay,
  );

  const [emblaRef] = useEmblaCarousel(
    { loop: enableAutoplay, align: "start", dragFree: variant === "strip" },
    ready && enableAutoplay ? [plugin] : [],
  );

  if (items.length === 0) return null;

  if (variant === "compact") {
    return (
      <section
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-[var(--surface-subtle)]",
          className,
        )}
        aria-label="Kategori öne çıkanlar"
      >
        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4" ref={emblaRef}>
          <div className="flex h-full gap-3">
            {items.map((item) => {
              const slug = item.category?.slug;
              const href = slug
                ? `/?kategori=${encodeURIComponent(slug)}#urunler`
                : "/#urunler";
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group flex h-full min-w-0 flex-[0_0_100%] flex-col items-center justify-center gap-2.5 rounded-xl text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <div className="relative aspect-square w-[48%] max-w-[6.5rem] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--border-soft)] transition-transform duration-200 group-hover:-translate-y-0.5">
                    {item.secureUrl ? (
                      <Image
                        src={item.secureUrl}
                        alt={item.altText || item.title || "Kategori"}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    ) : null}
                  </div>
                  <span className="line-clamp-2 px-2 text-xs font-bold text-[var(--navy)] sm:text-sm">
                    {item.title || item.category?.name || "Kategori"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("border-b border-[var(--border)] bg-white py-4", className)}
      aria-label="Kategori öne çıkanlar"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {items.map((item) => {
              const slug = item.category?.slug;
              const href = slug
                ? `/?kategori=${encodeURIComponent(slug)}#urunler`
                : "/#urunler";
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="flex w-24 shrink-0 flex-col items-center gap-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:w-28"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--muted)] sm:h-24 sm:w-24">
                    {item.secureUrl ? (
                      <Image
                        src={item.secureUrl}
                        alt={item.altText || item.title || "Kategori"}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : null}
                  </div>
                  <span className="line-clamp-2 text-xs font-medium">
                    {item.title || item.category?.name || "Kategori"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

interface BannerProps {
  items: HomepageCarouselItemWithCategory[];
  aspectClass?: string;
  linked?: boolean;
  className?: string;
  fillHeight?: boolean;
  autoplayDelayMs?: number;
  autoplayStartDelayMs?: number;
}

export function BannerCarousel({
  items,
  aspectClass = "aspect-[21/9]",
  linked = false,
  className,
  fillHeight = false,
  autoplayDelayMs = HOMEPAGE_CAROUSEL_TIMINGS.heroBanner.autoplayDelayMs,
  autoplayStartDelayMs = HOMEPAGE_CAROUSEL_TIMINGS.heroBanner.startDelayMs,
}: BannerProps) {
  const enableAutoplay = items.length > 1;
  const { plugin, ready } = useDelayedAutoplay(
    autoplayDelayMs,
    autoplayStartDelayMs,
    enableAutoplay,
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: enableAutoplay },
    ready && enableAutoplay ? [plugin] : [],
  );
  const [selected, setSelected] = useState(0);
  const userInteracted = useRef(false);

  const scrollPrev = useCallback(() => {
    userInteracted.current = true;
    emblaApi?.scrollPrev();
    plugin.reset();
  }, [emblaApi, plugin]);

  const scrollNext = useCallback(() => {
    userInteracted.current = true;
    emblaApi?.scrollNext();
    plugin.reset();
  }, [emblaApi, plugin]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[var(--surface-subtle)] shadow-sm ring-1 ring-black/[0.03]",
        fillHeight && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div
        className={cn("overflow-hidden", fillHeight && "min-h-0 flex-1")}
        ref={emblaRef}
      >
        <div className={cn("flex", fillHeight && "h-full")}>
          {items.map((item) => {
            const content = (
              <div
                className={cn(
                  "relative w-full",
                  fillHeight ? "h-full min-h-[9rem]" : aspectClass,
                )}
              >
                {item.secureUrl && (
                  <>
                    <Image
                      src={item.secureUrl}
                      alt={item.altText || item.title || "Banner"}
                      fill
                      className="hidden object-cover sm:block"
                      sizes={
                        fillHeight
                          ? "(max-width: 1024px) 100vw, 33vw"
                          : "(max-width: 1024px) 100vw, 66vw"
                      }
                      priority={selected === 0 && !fillHeight}
                    />
                    <Image
                      src={item.mobileSecureUrl || item.secureUrl}
                      alt={item.altText || item.title || "Banner"}
                      fill
                      className="object-cover sm:hidden"
                      sizes="100vw"
                    />
                  </>
                )}
              </div>
            );
            return (
              <div
                key={item.id}
                className={cn(
                  "min-w-0 flex-[0_0_100%]",
                  fillHeight && "h-full",
                )}
              >
                {linked && item.category?.slug ? (
                  <Link
                    href={`/?kategori=${encodeURIComponent(item.category.slug)}#urunler`}
                    className={fillHeight ? "block h-full" : undefined}
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[var(--navy)] shadow-md backdrop-blur-md transition hover:border-[var(--teal)] hover:bg-[var(--teal)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-1 sm:left-3"
            aria-label="Önceki banner"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/75 text-[var(--navy)] shadow-md backdrop-blur-md transition hover:border-[var(--teal)] hover:bg-[var(--teal)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-1 sm:right-3"
            aria-label="Sonraki banner"
          >
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-[var(--navy)]/55 px-2.5 py-2 shadow-sm backdrop-blur-sm sm:bottom-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-white shadow" : "w-3 bg-white/60 hover:bg-white/80"}`}
                onClick={() => {
                  emblaApi?.scrollTo(i);
                  plugin.reset();
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
