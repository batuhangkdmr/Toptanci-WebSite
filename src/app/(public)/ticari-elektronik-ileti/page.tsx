import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "ticari-elektronik-ileti" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Ticari Elektronik İleti" };
  return {
    title: doc.title,
    description:
      "Ticari elektronik ileti onayı, içerik türleri ve ret haklarına ilişkin bilgilendirme (taslak).",
  };
}

export default function TicariElektronikIletiPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
