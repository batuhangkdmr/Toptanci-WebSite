import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { getLegalDocument } from "@/content/legal/documents";

const SLUG = "kisisel-verilerin-korunmasi" as const;

export function generateMetadata(): Metadata {
  const doc = getLegalDocument(SLUG);
  if (!doc) return { title: "Kişisel Verilerin Korunması" };
  return {
    title: doc.title,
    description:
      "KVKK kapsamında kişisel verilerin işlenmesi, aktarımı ve haklarınıza ilişkin aydınlatma metni taslağı.",
  };
}

export default function KisiselVerilerinKorunmasiPage() {
  const document = getLegalDocument(SLUG);
  if (!document) notFound();
  return <LegalPage document={document} />;
}
