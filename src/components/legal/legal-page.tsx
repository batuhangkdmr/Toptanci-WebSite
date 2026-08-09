import Link from "next/link";
import type { LegalDocument } from "@/content/legal/documents";

type LegalPageProps = {
  document: LegalDocument;
};

export function LegalPage({ document }: LegalPageProps) {
  return (
    <>
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[var(--navy)]"
          >
            Toptancı
          </Link>
          <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
            Ana Sayfa
          </Link>
        </div>
      </header>
      <main className="flex-1 bg-[var(--background)] px-4 py-10 sm:px-6 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <header className="mb-8 space-y-3">
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-tight text-[var(--navy)] sm:text-4xl">
              {document.title}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Sürüm {document.version} · Son güncelleme {document.lastUpdated}
            </p>
            <div
              role="status"
              className="rounded-md border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              <p className="font-medium">Taslak metin — avukat incelemesi gereklidir</p>
              <p className="mt-1 text-amber-900/90">
                Bu belge hukuki tavsiye niteliği taşımaz. Şirket kimlik bilgileri
                ([Vergi No], [MERSİS No] vb.) ve nihai hükümler profesyonel inceleme
                sonrası güncellenmelidir.
              </p>
            </div>
          </header>

          <div className="space-y-8 text-[var(--foreground)]">
            {document.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="text-xl font-semibold text-[var(--navy)]">
                  {section.heading}
                </h2>
                <div className="space-y-3 text-base leading-relaxed text-[var(--foreground)]/90">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={`${section.heading}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
