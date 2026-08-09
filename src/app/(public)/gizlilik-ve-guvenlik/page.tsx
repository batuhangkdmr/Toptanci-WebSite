import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "gizlilik-ve-guvenlik" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Gizlilik ve Güvenlik" };
  return {
    title: doc.title,
    description:
      "Platform gizliliği, hesap güvenliği ve veri koruma yaklaşımlarına ilişkin bilgilendirme (taslak).",
  };
}

export default function GizlilikVeGuvenlikPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
