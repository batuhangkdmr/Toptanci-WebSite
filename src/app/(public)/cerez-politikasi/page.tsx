import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "cerez-politikasi" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Çerez Politikası" };
  return {
    title: doc.title,
    description:
      "Sitede kullanılan çerez türleri, amaçları ve yönetim seçeneklerine ilişkin bilgilendirme (taslak).",
  };
}

export default function CerezPolitikasiPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
