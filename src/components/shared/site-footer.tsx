import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, Send } from "lucide-react";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { siteConfig } from "@/lib/site-config";
import type { Category } from "@/types";

const LEGAL_LINKS = [
  { href: "/teslimat-kosullari", label: "Teslimat Koşulları" },
  { href: "/uyelik-sozlesmesi", label: "Üyelik Sözleşmesi" },
  { href: "/satis-sozlesmesi", label: "Satış Sözleşmesi" },
  { href: "/garanti-ve-iade-kosullari", label: "Garanti ve İade Koşulları" },
  { href: "/gizlilik-ve-guvenlik", label: "Gizlilik ve Güvenlik" },
  { href: "/kisisel-verilerin-korunmasi", label: "Kişisel Verilerin Korunması" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
] as const;

interface SiteFooterProps {
  categories: Category[];
  isLoggedIn: boolean;
  isApproved: boolean;
}

export function SiteFooter({ categories, isLoggedIn, isApproved }: SiteFooterProps) {
  const social = [
    { href: siteConfig.social.facebook, label: "Facebook" },
    { href: siteConfig.social.instagram, label: "Instagram" },
    { href: siteConfig.social.whatsapp, label: "WhatsApp" },
  ].filter((s) => !!s.href);

  const quickLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/#urunler", label: "Ürünler" },
    ...(isLoggedIn
      ? [
          { href: isApproved ? "/hesabim" : "/onay-bekleniyor", label: "Hesabım" },
          ...(isApproved
            ? [
                { href: "/sepet", label: "Sepet" },
                { href: "/siparisler", label: "Siparişlerim" },
              ]
            : []),
        ]
      : [
          { href: "/giris", label: "Giriş" },
          { href: "/kayit", label: "Kayıt Ol" },
        ]),
    {
      href: `mailto:${siteConfig.contact.email}`,
      label: "İletişim",
    },
  ];

  return (
    <footer className="mt-auto bg-[var(--navy-deep)] text-white">
      <div className="border-b border-white/10 bg-[var(--navy)]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-11">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--teal)] text-white shadow-lg sm:flex">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--teal)]">Fırsatları kaçırmayın</p>
              <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-xl font-bold sm:text-2xl">E-Bülten Aboneliği</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Kampanya ve yeniliklerden haberdar olmak için e-posta adresinizi bırakın.</p>
            </div>
          </div>
          <div>
            <NewsletterForm />
            <p className="mt-2.5 text-[11px] leading-5 text-white/50">
              Kayıt ile{" "}
              <Link href="/ticari-elektronik-ileti" className="text-white/75 underline underline-offset-2 hover:text-white">
                ticari elektronik ileti
              </Link>{" "}
              bilgilendirmesini kabul etmiş olursunuz.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="font-[family-name:var(--font-fraunces)] text-2xl font-bold tracking-[-0.02em]">Toptancı<span className="text-[var(--teal)]">.</span></Link>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/55">{siteConfig.description}</p>
          </div>
          {social.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/70 transition hover:border-[var(--teal)] hover:text-white" aria-label={s.label}>
                  {s.label} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div>
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.15em] text-white">Kategoriler</h2>
          <ul className="space-y-2.5 text-sm text-white/55">
            {categories.length === 0 ? (
              <li>Henüz kategori yok</li>
            ) : (
              categories.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/?kategori=${encodeURIComponent(c.slug)}#urunler`}
                    className="transition hover:text-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
                  >
                    {c.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.15em] text-white">Önemli Bilgiler</h2>
          <ul className="space-y-2.5 text-sm text-white/55">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.15em] text-white">Hızlı Erişim</h2>
          <ul className="space-y-2.5 text-sm text-white/55">
            {quickLinks.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="transition hover:text-[var(--teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.15em] text-white">Adres & İletişim</h2>
          <ul className="space-y-4 text-sm leading-6 text-white/55">
            <li className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--teal)]"><MapPin className="h-4 w-4" /></span>
              <span>{siteConfig.contact.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--teal)]"><Phone className="h-4 w-4" /></span>
              <span>{siteConfig.contact.phone}</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--teal)]"><Mail className="h-4 w-4" /></span>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="transition hover:text-[var(--teal)]"
              >
                {siteConfig.contact.email}
              </a>
            </li>
          </ul>
        </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {siteConfig.name} · {siteConfig.tagline}
      </div>
    </footer>
  );
}
