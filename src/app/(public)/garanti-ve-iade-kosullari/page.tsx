import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "garanti-ve-iade-kosullari" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Garanti ve İade Koşulları" };
  return {
    title: doc.title,
    description:
      "B2B toptan satışlarda ayıp bildirimi, garanti ve iade süreçlerine ilişkin koşullar (taslak).",
  };
}

export default function GarantiVeIadeKosullariPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
