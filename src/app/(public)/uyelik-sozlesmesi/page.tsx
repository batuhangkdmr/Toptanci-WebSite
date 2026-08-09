import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "uyelik-sozlesmesi" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Üyelik Sözleşmesi" };
  return {
    title: doc.title,
    description:
      "B2B platform üyeliği, hesap kullanımı ve tarafların hak ile yükümlülüklerine ilişkin sözleşme taslağı.",
  };
}

export default function UyelikSozlesmesiPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
