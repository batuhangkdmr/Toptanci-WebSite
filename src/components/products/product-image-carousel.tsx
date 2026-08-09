"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

interface ProductImageCarouselProps {
  images: ProductImage[];
  productName: string;
  className?: string;
  size?: "card" | "detail";
}

export function ProductImageCarousel({
  images,
  productName,
  className,
  size = "card",
}: ProductImageCarouselProps) {
  const orderedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        if (a.isPrimary === b.isPrimary) return a.sortOrder - b.sortOrder;
        return a.isPrimary ? -1 : 1;
      }),
    [images],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: orderedImages.length > 1,
    dragFree: false,
  });

  const width = size === "card" ? 480 : 960;

  if (orderedImages.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center bg-[var(--surface-subtle)] text-[var(--muted-foreground)] lg:aspect-[4/3]",
          className,
        )}
      >
        <ImageOff className="h-10 w-10 opacity-40" />
      </div>
    );
  }

  function goPrev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollPrev();
  }

  function goNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollNext();
  }

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="overflow-hidden touch-pan-y" ref={emblaRef}>
        <div className="flex">
          {orderedImages.map((image) => (
            <div key={image.id} className="min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-square w-full bg-[linear-gradient(145deg,#ffffff_0%,#f3f7f9_100%)] lg:aspect-[4/3]">
                <Image
                  src={getOptimizedImageUrl(image.secureUrl, { width })}
                  alt={productName}
                  fill
                  className="pointer-events-none object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.025] lg:p-3"
                  sizes={size === "card" ? "(max-width: 374px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 25vw, 20vw" : "(max-width: 1023px) 100vw, 50vw"}
                  loading="lazy"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {orderedImages.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Önceki görsel"
            onClick={goPrev}
            className="absolute left-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-white/70 bg-[var(--navy)]/70 text-white opacity-90 shadow-md backdrop-blur-sm transition hover:bg-[var(--navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:left-2 lg:h-9 lg:w-9 lg:rounded-lg"
          >
            <ChevronLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </button>
          <button
            type="button"
            aria-label="Sonraki görsel"
            onClick={goNext}
            className="absolute right-1 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-white/70 bg-[var(--navy)]/70 text-white opacity-90 shadow-md backdrop-blur-sm transition hover:bg-[var(--navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:right-2 lg:h-9 lg:w-9 lg:rounded-lg"
          >
            <ChevronRight className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-1.5 left-0 right-0 z-10 flex justify-center gap-1 lg:bottom-2">
            {orderedImages.map((image) => (
              <span
                key={image.id}
                className="h-1.5 w-1.5 rounded-full bg-white/80 shadow"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
