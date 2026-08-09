"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HOMEPAGE_CAROUSEL_TIMINGS } from "@/lib/homepage-carousel-timings";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface Props {
  categories: Category[];
  className?: string;
}

function CategoryAvatar({ category }: { category: Category }) {
  const alt = category.imageAltText || category.name;
  if (category.imageSecureUrl) {
    return (
      <Image
        src={category.imageSecureUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 20vw, (max-width: 1024px) 12vw, 96px"
      />
    );
  }

  const initials = category.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");

  return (
    <span
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[var(--teal)] text-lg font-semibold text-white sm:text-xl"
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}

function CategoryItem({
  category,
  duplicate,
}: {
  category: Category;
  duplicate?: boolean;
}) {
  return (
    <Link
      href={`/?kategori=${encodeURIComponent(category.slug)}#urunler`}
      className="group w-[7.25rem] shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 sm:w-[8.5rem]"
      tabIndex={duplicate ? -1 : undefined}
      aria-hidden={duplicate || undefined}
    >
      <div className="flex h-[4.75rem] items-center gap-2.5 rounded-xl border border-[var(--border-soft)] bg-white p-2 shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--teal)]/45 group-hover:shadow-[var(--shadow-card-hover)] group-focus-visible:border-[var(--teal)] sm:h-[5.25rem] sm:p-2.5">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-subtle)] ring-1 ring-[var(--border-soft)] sm:h-14 sm:w-14">
          <CategoryAvatar category={category} />
        </div>
        <span className="line-clamp-2 text-left text-[11px] font-bold leading-snug text-[var(--navy)] transition-colors group-hover:text-[var(--primary)] sm:text-xs">
          {category.name}
        </span>
      </div>
    </Link>
  );
}

export function AutoCategoryCarousel({ categories, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [started, setStarted] = useState(false);

  const timings = HOMEPAGE_CAROUSEL_TIMINGS.autoCategory;
  const shouldAnimate =
    !reducedMotion &&
    categories.length >= timings.minItemsForMotion &&
    started;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (categories.length < timings.minItemsForMotion) return;
    const t = window.setTimeout(() => setStarted(true), timings.startDelayMs);
    return () => window.clearTimeout(t);
  }, [categories.length, timings.minItemsForMotion, timings.startDelayMs]);

  const onInteractStart = useCallback(() => setPaused(true), []);
  const onInteractEnd = useCallback(() => setPaused(false), []);

  const loopItems = useMemo(() => {
    if (!shouldAnimate) return categories;
    return [...categories, ...categories];
  }, [categories, shouldAnimate]);

  if (categories.length === 0) return null;

  return (
    <section
      className={cn(
        "relative overflow-hidden border-y border-[var(--border-soft)] bg-[var(--surface-subtle)] py-5 sm:py-6",
        className,
      )}
      aria-label="Kategoriler"
      onMouseEnter={onInteractStart}
      onMouseLeave={onInteractEnd}
      onFocusCapture={onInteractStart}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onInteractEnd();
        }
      }}
      onTouchStart={onInteractStart}
      onTouchEnd={onInteractEnd}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[var(--surface-subtle)] to-transparent sm:w-14" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[var(--surface-subtle)] to-transparent sm:w-14" />

      <div className="mx-auto mb-4 flex max-w-7xl items-end justify-between px-4 sm:px-6">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--primary)] sm:text-xs">Ürünlere hızlı ulaşın</p>
          <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-lg font-bold tracking-[-0.01em] text-[var(--navy)] sm:text-xl">Kategorilerden alışveriş yapın</h2>
        </div>
        <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">Üzerine gelerek duraklatın</span>
      </div>

      <div className="mx-auto max-w-7xl overflow-hidden px-0 sm:px-2">
        <div
          ref={trackRef}
          className={cn(
            "flex gap-2.5 sm:gap-3",
            shouldAnimate && "w-max",
            shouldAnimate && "animate-auto-category-marquee",
          )}
          style={
            shouldAnimate
              ? ({
                  ["--auto-category-duration" as string]: `${timings.loopDurationMs}ms`,
                  animationPlayState: paused ? "paused" : "running",
                } as React.CSSProperties)
              : undefined
          }
        >
          {loopItems.map((category, index) => {
            const duplicate = shouldAnimate && index >= categories.length;
            return (
              <CategoryItem
                key={duplicate ? `${category.id}-dup-${index}` : category.id}
                category={category}
                duplicate={duplicate}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
