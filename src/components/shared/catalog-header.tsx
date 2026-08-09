"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  Menu,
  PackageCheck,
  RotateCcw,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CatalogHeaderProps {
  categories: Category[];
  user: {
    firstName: string;
    role: string;
    companyStatus: string | null;
    companyName: string | null;
  } | null;
  cartCount: number;
  canOrder: boolean;
}

export function CatalogHeader({
  categories,
  user,
  cartCount,
  canOrder,
}: CatalogHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCategory = searchParams.get("kategori") || "";

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (activeCategory) params.set("kategori", activeCategory);
    const qs = params.toString();
    router.push(qs ? `/?${qs}#urunler` : "/#urunler");
    setMobileOpen(false);
  }

  const isGuest = !user;
  const isAdmin = user?.role === "ADMIN";
  const isPending = user?.role === "COMPANY_USER" && user.companyStatus === "PENDING";

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-white/95 shadow-[0_1px_0_var(--border-soft)] backdrop-blur-md">
      <div className="bg-[var(--navy-deep)] text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 text-[11px] sm:px-6 sm:text-xs">
          <p className="flex min-w-0 items-center gap-2 truncate text-white/85">
            <PackageCheck className="h-3.5 w-3.5 shrink-0 text-[var(--teal)]" />
            <span className="truncate">B2B toptan sipariş platformu</span>
            <span className="hidden text-white/45 sm:inline">•</span>
            <span className="hidden text-white/65 sm:inline">Ödeme site dışında gerçekleşir</span>
          </p>
          <div className="hidden shrink-0 items-center gap-5 sm:flex">
            <Link href="/teslimat-kosullari" className="inline-flex items-center gap-1.5 text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]">
              <PackageCheck className="h-3.5 w-3.5" /> Teslimat
            </Link>
            <Link href="/garanti-ve-iade-kosullari" className="inline-flex items-center gap-1.5 text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]">
              <RotateCcw className="h-3.5 w-3.5" /> İade
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:gap-6 lg:py-4">
        <Link
          href="/"
          className="group shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <span className="block font-[family-name:var(--font-fraunces)] text-xl font-bold leading-none tracking-[-0.02em] text-[var(--navy)] sm:text-2xl">
            Toptancı<span className="text-[var(--teal)]">.</span>
          </span>
          <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)] lg:block">
            B2B Toptan Satış
          </span>
        </Link>

        <form onSubmit={onSearch} className="relative mx-auto hidden min-w-0 max-w-2xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Marka, ürün veya kategori ara"
            className="h-12 rounded-xl border-[var(--border-soft)] bg-[var(--surface-subtle)]/70 pl-12 pr-28 shadow-inner shadow-[var(--navy)]/[0.02] transition focus-visible:border-[var(--teal)] focus-visible:bg-white focus-visible:ring-2"
            aria-label="Ürün ara"
          />
          <button
            type="submit"
            className="absolute bottom-1.5 right-1.5 top-1.5 flex items-center rounded-lg bg-[var(--navy)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            aria-label="Ara"
          >
            Ara
          </button>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {canOrder && (
            <Link
              href="/sepet"
              className="relative inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[var(--navy)] transition hover:bg-[var(--surface-subtle)] sm:px-3"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Sepetim</span>
              <span className="absolute -right-0.5 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--accent-warm)] px-1 text-[10px] font-bold text-white sm:static sm:h-auto sm:min-w-0 sm:border-0 sm:bg-[var(--primary)] sm:px-1.5 sm:py-0.5 sm:text-xs">
                {cartCount}
              </span>
            </Link>
          )}

          {isGuest && (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden font-semibold sm:inline-flex">
                <Link href="/giris">Giriş</Link>
              </Button>
              <Button asChild size="sm" className="hidden rounded-lg px-3 shadow-sm min-[360px]:inline-flex sm:px-4">
                <Link href="/kayit"><span className="sm:hidden">Kayıt</span><span className="hidden sm:inline">Kayıt Ol</span></Link>
              </Button>
            </>
          )}

          {isAdmin && (
              <Button asChild size="sm" className="hidden rounded-lg sm:inline-flex">
              <Link href="/admin">Yönetim Paneli</Link>
            </Button>
          )}

          {user && !isAdmin && (
            <div className="relative group">
              <button
                type="button"
                className="inline-flex h-10 max-w-36 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold hover:bg-[var(--surface-subtle)] sm:px-3"
                aria-haspopup="menu"
              >
                <User className="h-5 w-5" />
                <span className="hidden max-w-[8rem] truncate sm:inline">
                  {user.companyName || user.firstName}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--muted-foreground)] sm:block" />
              </button>
              <div className="invisible absolute right-0 z-50 mt-2 w-52 rounded-xl border border-[var(--border-soft)] bg-white p-1.5 opacity-0 shadow-[var(--shadow-floating)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {isPending ? (
                  <Link
                    href="/onay-bekleniyor"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-subtle)]"
                  >
                    Onay Bekleniyor
                  </Link>
                ) : (
                  <>
                    <Link href="/hesabim" className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-subtle)]">
                      Hesabım
                    </Link>
                    <Link
                      href="/siparisler"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-subtle)]"
                    >
                      Siparişlerim
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-subtle)]"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Çıkış
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--navy)] transition hover:bg-[var(--surface-subtle)] md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-category-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-full px-4 pb-3 md:hidden">
        <form onSubmit={onSearch} className="relative flex min-w-0 w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün, SKU veya kategori ara"
            aria-label="Ürün ara"
            className="h-11 rounded-xl border-[var(--border-soft)] bg-[var(--surface-subtle)]/70 pl-10 pr-12"
          />
          <button type="submit" className="absolute bottom-1 right-1 top-1 flex w-10 items-center justify-center rounded-lg bg-[var(--primary)] text-white" aria-label="Ara">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <nav
        className="hidden border-t border-[var(--border-soft)] bg-white md:block"
        aria-label="Kategoriler"
      >
        <div className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
          <Link
            href="/#urunler"
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition",
              !activeCategory || pathname !== "/"
                ? "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--navy)]"
                : "",
              !activeCategory && pathname === "/"
                ? "bg-[var(--navy)] text-white"
                : "",
            )}
          >
            Tümü
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?kategori=${encodeURIComponent(c.slug)}#urunler`}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition",
                activeCategory === c.slug
                  ? "bg-[var(--surface-subtle)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--navy)]",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-category-menu" className="border-t border-[var(--border-soft)] bg-white px-4 pb-5 pt-3 shadow-[var(--shadow-floating)] md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Kategoriler</p>
            {isGuest && <Link href="/giris" className="text-xs font-semibold text-[var(--primary)]" onClick={() => setMobileOpen(false)}>Giriş Yap</Link>}
          </div>
          <div className="scrollbar-none grid max-h-[52vh] grid-cols-2 gap-1 overflow-y-auto overscroll-contain">
            <Link href="/#urunler" className="col-span-2 rounded-lg bg-[var(--navy)] px-3 py-2.5 text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>Tüm Ürünler</Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/?kategori=${encodeURIComponent(c.slug)}#urunler`}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                onClick={() => setMobileOpen(false)}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
