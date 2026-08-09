import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    page?: string;
  }>;
}

/** Eski /urunler bağlantıları ana sayfa ürün alanına yönlendirilir */
export default async function UrunlerRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.kategori) qs.set("kategori", params.kategori);
  if (params.page) qs.set("page", params.page);
  const query = qs.toString();
  redirect(query ? `/?${query}#urunler` : "/#urunler");
}
