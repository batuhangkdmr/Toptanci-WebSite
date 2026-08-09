import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "satis-sozlesmesi" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Satış Sözleşmesi" };
  return {
    title: doc.title,
    description:
      "Platform üzerinden verilen B2B toptan siparişlerde satış koşullarına ilişkin sözleşme taslağı.",
  };
}

export default function SatisSozlesmesiPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
