import Image from "next/image";
import { ImageOff } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

interface ProductPrimaryImageProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

export function ProductPrimaryImage({
  images,
  productName,
  className,
}: ProductPrimaryImageProps) {
  const primaryImage = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0];

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,#f3f7f9_100%)] lg:aspect-[4/3]",
        className,
      )}
    >
      {primaryImage ? (
        <Image
          src={getOptimizedImageUrl(primaryImage.secureUrl, { width: 480 })}
          alt={productName}
          fill
          className="object-contain p-1.5 lg:p-3"
          sizes="(max-width: 374px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 25vw, 20vw"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
          <ImageOff className="h-7 w-7 opacity-35 lg:h-10 lg:w-10" aria-hidden />
          <span className="sr-only">{productName} için görsel bulunmuyor.</span>
        </div>
      )}
    </div>
  );
}
