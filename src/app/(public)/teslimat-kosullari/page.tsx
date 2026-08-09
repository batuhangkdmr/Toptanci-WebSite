import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "teslimat-kosullari" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Teslimat Koşulları" };
  return {
    title: doc.title,
    description:
      "B2B toptan siparişlerde sevkiyat, teslim süreleri ve teslim alma koşullarına ilişkin bilgilendirme (taslak).",
  };
}

export default function TeslimatKosullariPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
