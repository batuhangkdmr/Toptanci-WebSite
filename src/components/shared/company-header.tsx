"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Ürünler" },
  { href: "/sepet", label: "Sepet" },
  { href: "/siparisler", label: "Siparişler" },
  { href: "/hesabim", label: "Hesabım" },
];

interface CompanyHeaderProps {
  companyName?: string | null;
  cartCount?: number;
}

export function CompanyHeader({ companyName, cartCount = 0 }: CompanyHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[var(--navy)]">
            Toptancı
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href === "/" ? "/#urunler" : link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                    ? "bg-[var(--muted)] text-[var(--navy)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                )}
              >
                {link.label}
                {link.href === "/sepet" && cartCount > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {companyName && (
            <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">
              {companyName}
            </span>
          )}
          <Link href="/sepet" className="relative md:hidden" aria-label="Sepet">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/giris" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href === "/" ? "/#urunler" : link.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
              (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                ? "bg-[var(--muted)] font-medium"
                : "text-[var(--muted-foreground)]",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
