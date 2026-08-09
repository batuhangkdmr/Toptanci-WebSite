import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
  hash?: string;
}

function buildHref(
  basePath: string,
  page: number,
  searchParams?: Record<string, string | undefined>,
  hash?: string,
) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (value) params.set(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  const base = qs ? `${basePath}?${qs}` : basePath;
  return hash ? `${base}#${hash}` : base;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
  className,
  hash,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn(
        "flex items-center justify-center gap-1.5 sm:gap-2",
        className,
      )}
      aria-label="Sayfalama"
    >
      <Link
        href={buildHref(basePath, Math.max(1, page - 1), searchParams, hash)}
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 text-xs font-semibold sm:px-3 sm:text-sm",
          page <= 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden min-[360px]:inline">Önceki</span>
      </Link>

      <span className="min-w-20 px-2 text-center text-xs font-semibold text-[var(--muted-foreground)] sm:px-3 sm:text-sm">
        {page} / {totalPages}
      </span>

      <Link
        href={buildHref(basePath, Math.min(totalPages, page + 1), searchParams, hash)}
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 text-xs font-semibold sm:px-3 sm:text-sm",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        <span className="hidden min-[360px]:inline">Sonraki</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
