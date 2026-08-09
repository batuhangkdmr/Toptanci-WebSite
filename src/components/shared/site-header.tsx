import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-xl font-semibold text-white"
        >
          Toptancı
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/giris" className="text-white/85 transition hover:text-white">
            Giriş
          </Link>
          <Link
            href="/kayit"
            className="rounded-md bg-white px-3 py-2 font-medium text-[var(--navy)] transition hover:bg-white/90"
          >
            Kayıt Ol
          </Link>
        </nav>
      </div>
    </header>
  );
}
