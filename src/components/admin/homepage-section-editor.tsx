"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { getHomepageImageGuide } from "@/lib/homepage-image-guides";
import { compressImageForUpload } from "@/lib/images/client-compress";
import type { Category, ProductWithImages } from "@/types";
import type {
  HomepageCarouselItem,
  HomepageSection,
  HomepageSectionType,
} from "@/types/homepage";

type DateInput = Date | string | null;

interface HomepageSectionEditorProps {
  section: HomepageSection;
  initialItems: HomepageCarouselItem[];
  initialProductIds: string[];
  categories: Category[];
  products: ProductWithImages[];
}

interface SectionFormState {
  title: string;
  description: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  showViewAll: boolean;
  viewAllHref: string;
  sortOrder: string;
}

interface ItemFormState {
  title: string;
  description: string;
  altText: string;
  categoryId: string;
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  mobileCloudinaryPublicId: string;
  mobileSecureUrl: string;
}

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp,image/avif";
const MAX_SIZE = 10 * 1024 * 1024;

function toDatetimeLocal(value: DateInput): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function dateOrNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

/** Bitiş, başlangıçtan sonra değilse null (yanlışlıkla aynı saniye kaydını engelle) */
function normalizeDateRange(startsAt: string, endsAt: string): {
  startsAt: string | null;
  endsAt: string | null;
} {
  const start = dateOrNull(startsAt);
  let end = dateOrNull(endsAt);
  if (start && end) {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!Number.isFinite(endMs) || !Number.isFinite(startMs) || endMs <= startMs) {
      end = null;
    }
  }
  return { startsAt: start, endsAt: end };
}

function emptyItemForm(sortOrder = 0): ItemFormState {
  return {
    title: "",
    description: "",
    altText: "",
    categoryId: "",
    sortOrder: String(sortOrder),
    isActive: true,
    startsAt: "",
    endsAt: "",
    cloudinaryPublicId: "",
    secureUrl: "",
    mobileCloudinaryPublicId: "",
    mobileSecureUrl: "",
  };
}

function itemToForm(item: HomepageCarouselItem): ItemFormState {
  return {
    title: item.title ?? "",
    description: item.description ?? "",
    altText: item.altText ?? "",
    categoryId: item.categoryId ?? "",
    sortOrder: String(item.sortOrder ?? 0),
    isActive: item.isActive,
    startsAt: toDatetimeLocal(item.startsAt),
    endsAt: toDatetimeLocal(item.endsAt),
    cloudinaryPublicId: item.cloudinaryPublicId ?? "",
    secureUrl: item.secureUrl ?? "",
    mobileCloudinaryPublicId: item.mobileCloudinaryPublicId ?? "",
    mobileSecureUrl: item.mobileSecureUrl ?? "",
  };
}

async function uploadHomepageImage(
  sectionId: string,
  file: File,
): Promise<{ publicId: string; secureUrl: string }> {
  if (!ACCEPTED.split(",").includes(file.type) && !file.type.startsWith("image/")) {
    throw new Error("Geçersiz format. JPG, PNG, WEBP veya AVIF kullanın.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Dosya 10 MB'dan büyük olamaz.");
  }

  const compressed = await compressImageForUpload(file);

  const signRes = await fetch("/api/admin/cloudinary/sign-homepage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionId }),
  });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error || "Yükleme imzası alınamadı.");

  const fd = new FormData();
  fd.append("file", compressed);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("signature", sign.signature);
  fd.append("folder", sign.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  const uploaded = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(uploaded.error?.message || "Cloudinary yükleme başarısız.");
  }

  return {
    publicId: uploaded.public_id as string,
    secureUrl: uploaded.secure_url as string,
  };
}

function isCarouselType(type: HomepageSectionType) {
  return (
    type === "CATEGORY_STRIP" ||
    type === "HERO_BANNER" ||
    type === "SIDE_BANNER"
  );
}

export function HomepageSectionEditor({
  section,
  initialItems,
  initialProductIds,
  categories,
  products,
}: HomepageSectionEditorProps) {
  const router = useRouter();
  const [sectionForm, setSectionForm] = useState<SectionFormState>({
    title: section.title ?? "",
    description: section.description ?? "",
    isActive: section.isActive,
    startsAt: toDatetimeLocal(section.startsAt),
    endsAt: toDatetimeLocal(section.endsAt),
    showViewAll: section.showViewAll,
    viewAllHref: section.viewAllHref ?? "",
    sortOrder: String(section.sortOrder ?? 0),
  });
  const [items, setItems] = useState(initialItems);
  const [selectedProductIds, setSelectedProductIds] = useState(initialProductIds);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(() =>
    emptyItemForm(initialItems.length),
  );
  const [sectionLoading, setSectionLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<"desktop" | "mobile" | null>(
    null,
  );
  const [productSearch, setProductSearch] = useState("");
  const imageGuide = getHomepageImageGuide(section.sectionType);
  const supportsMobileImage =
    section.sectionType === "HERO_BANNER" ||
    section.sectionType === "SIDE_BANNER";

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );

  const productMap = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.filter((p) => p.isActive);
    return products.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q)),
    );
  }, [products, productSearch]);

  const selectedProducts = useMemo(
    () =>
      selectedProductIds
        .map((id) => productMap.get(id))
        .filter((p): p is ProductWithImages => !!p),
    [selectedProductIds, productMap],
  );

  function startEditItem(item: HomepageCarouselItem) {
    setEditingId(item.id);
    setItemForm(itemToForm(item));
  }

  function resetItemForm() {
    setEditingId(null);
    setItemForm(emptyItemForm(items.length));
  }

  async function saveSection(e: React.FormEvent) {
    e.preventDefault();
    setSectionLoading(true);
    try {
      const dates = normalizeDateRange(sectionForm.startsAt, sectionForm.endsAt);
      const res = await fetch(`/api/admin/homepage/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: emptyToNull(sectionForm.title),
          description: emptyToNull(sectionForm.description),
          isActive: sectionForm.isActive,
          startsAt: dates.startsAt,
          endsAt: dates.endsAt,
          showViewAll: sectionForm.showViewAll,
          viewAllHref: emptyToNull(sectionForm.viewAllHref),
          sortOrder: Number(sectionForm.sortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");
      toast.success("Bölüm güncellendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSectionLoading(false);
    }
  }

  async function handleImageUpload(
    file: File | undefined,
    field: "desktop" | "mobile",
  ) {
    if (!file) return;
    setUploadingField(field);
    try {
      const uploaded = await uploadHomepageImage(section.id, file);
      if (field === "desktop") {
        setItemForm((prev) => ({
          ...prev,
          cloudinaryPublicId: uploaded.publicId,
          secureUrl: uploaded.secureUrl,
        }));
      } else {
        setItemForm((prev) => ({
          ...prev,
          mobileCloudinaryPublicId: uploaded.publicId,
          mobileSecureUrl: uploaded.secureUrl,
        }));
      }
      toast.success("Görsel yüklendi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükleme başarısız.");
    } finally {
      setUploadingField(null);
    }
  }

  function buildItemPayload() {
    const isCategoryStrip = section.sectionType === "CATEGORY_STRIP";
    const isHero = section.sectionType === "HERO_BANNER";

    if (isCategoryStrip && !itemForm.categoryId) {
      throw new Error("Kategori şeridi için kategori seçimi zorunludur.");
    }

    const dates = normalizeDateRange(itemForm.startsAt, itemForm.endsAt);

    const base = {
      title: emptyToNull(itemForm.title),
      description: emptyToNull(itemForm.description),
      altText: emptyToNull(itemForm.altText),
      sortOrder: Number(itemForm.sortOrder) || 0,
      isActive: itemForm.isActive,
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      cloudinaryPublicId: emptyToNull(itemForm.cloudinaryPublicId),
      secureUrl: emptyToNull(itemForm.secureUrl),
      mobileCloudinaryPublicId: supportsMobileImage
        ? emptyToNull(itemForm.mobileCloudinaryPublicId)
        : null,
      mobileSecureUrl: supportsMobileImage
        ? emptyToNull(itemForm.mobileSecureUrl)
        : null,
    };

    if (isHero) {
      return {
        ...base,
        categoryId: null,
        productId: null,
        targetType: "NONE" as const,
        targetUrl: null,
      };
    }

    if (isCategoryStrip) {
      return {
        ...base,
        categoryId: itemForm.categoryId,
        productId: null,
        targetType: "CATEGORY" as const,
        targetUrl: null,
      };
    }

    // SIDE_BANNER
    return {
      ...base,
      categoryId: emptyToNull(itemForm.categoryId),
      productId: null,
      targetType: itemForm.categoryId ? ("CATEGORY" as const) : ("NONE" as const),
      targetUrl: null,
    };
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    setItemLoading(true);
    try {
      const payload = buildItemPayload();
      const url = editingId
        ? `/api/admin/homepage/sections/${section.id}/items/${editingId}`
        : `/api/admin/homepage/sections/${section.id}/items`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");

      if (editingId) {
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...data } : item)),
        );
        toast.success("Öğe güncellendi.");
      } else {
        setItems((prev) => [...prev, data]);
        toast.success("Öğe eklendi.");
      }
      resetItemForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setItemLoading(false);
    }
  }

  async function deleteItem(item: HomepageCarouselItem) {
    if (!window.confirm(`"${item.title || "Bu öğe"}" silinsin mi?`)) return;
    try {
      const res = await fetch(
        `/api/admin/homepage/sections/${section.id}/items/${item.id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (editingId === item.id) resetItemForm();
      toast.success(data.message || "Öğe silindi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  async function moveItem(item: HomepageCarouselItem, direction: -1 | 1) {
    const ordered = [...sortedItems];
    const index = ordered.findIndex((i) => i.id === item.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;

    const swapWith = ordered[targetIndex];
    const aOrder = item.sortOrder;
    const bOrder = swapWith.sortOrder;

    try {
      const [resA, resB] = await Promise.all([
        fetch(
          `/api/admin/homepage/sections/${section.id}/items/${item.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: bOrder }),
          },
        ),
        fetch(
          `/api/admin/homepage/sections/${section.id}/items/${swapWith.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: aOrder }),
          },
        ),
      ]);
      const dataA = await resA.json();
      const dataB = await resB.json();
      if (!resA.ok) throw new Error(dataA.error || "Sıra güncellenemedi.");
      if (!resB.ok) throw new Error(dataB.error || "Sıra güncellenemedi.");

      setItems((prev) =>
        prev.map((i) => {
          if (i.id === item.id) return { ...i, sortOrder: bOrder };
          if (i.id === swapWith.id) return { ...i, sortOrder: aOrder };
          return i;
        }),
      );
      toast.success("Sıra güncellendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  function toggleProduct(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }

  function moveSelectedProduct(productId: string, direction: -1 | 1) {
    setSelectedProductIds((prev) => {
      const index = prev.indexOf(productId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  async function saveProducts() {
    setProductsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/homepage/sections/${section.id}/products`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: selectedProductIds }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");
      toast.success("Ürün vitrini güncellendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setProductsLoading(false);
    }
  }

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <form
        onSubmit={saveSection}
        className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5"
      >
        <h2 className="font-semibold text-[var(--navy)]">Bölüm Ayarları</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sectionTitle">Başlık</Label>
            <Input
              id="sectionTitle"
              value={sectionForm.title}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, title: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sectionSort">Sıra</Label>
            <Input
              id="sectionSort"
              type="number"
              value={sectionForm.sortOrder}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, sortOrder: e.target.value })
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sectionDescription">Açıklama</Label>
          <Textarea
            id="sectionDescription"
            rows={3}
            value={sectionForm.description}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, description: e.target.value })
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sectionStarts">Başlangıç</Label>
            <Input
              id="sectionStarts"
              type="datetime-local"
              value={sectionForm.startsAt}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, startsAt: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sectionEnds">Bitiş</Label>
            <Input
              id="sectionEnds"
              type="datetime-local"
              value={sectionForm.endsAt}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, endsAt: e.target.value })
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sectionForm.isActive}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, isActive: e.target.checked })
              }
            />
            Aktif
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sectionForm.showViewAll}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, showViewAll: e.target.checked })
              }
            />
            Tümünü Gör göster
          </label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="viewAllHref">Tümünü Gör bağlantısı</Label>
          <Input
            id="viewAllHref"
            value={sectionForm.viewAllHref}
            onChange={(e) =>
              setSectionForm({ ...sectionForm, viewAllHref: e.target.value })
            }
            placeholder="/urunler"
          />
        </div>
        <Button type="submit" disabled={sectionLoading}>
          {sectionLoading ? "Kaydediliyor..." : "Bölümü Kaydet"}
        </Button>
      </form>

      {isCarouselType(section.sectionType) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={saveItem}
            className="h-fit space-y-4 rounded-lg border border-[var(--border)] bg-white p-5"
          >
            <h2 className="font-semibold text-[var(--navy)]">
              {editingId ? "Öğeyi Düzenle" : "Yeni Öğe"}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="itemTitle">Başlık</Label>
              <Input
                id="itemTitle"
                value={itemForm.title}
                onChange={(e) =>
                  setItemForm({ ...itemForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDescription">Açıklama</Label>
              <Textarea
                id="itemDescription"
                rows={2}
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemAlt">Alt metin</Label>
              <Input
                id="itemAlt"
                value={itemForm.altText}
                onChange={(e) =>
                  setItemForm({ ...itemForm, altText: e.target.value })
                }
              />
            </div>

            {section.sectionType !== "HERO_BANNER" && (
              <div className="space-y-2">
                <Label htmlFor="itemCategory">
                  Kategori
                  {section.sectionType === "CATEGORY_STRIP" ? " *" : ""}
                </Label>
                <select
                  id="itemCategory"
                  required={section.sectionType === "CATEGORY_STRIP"}
                  value={itemForm.categoryId}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, categoryId: e.target.value })
                  }
                  className="h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
                >
                  <option value="">Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                      {!cat.isActive ? " (pasif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemSort">Sıra</Label>
                <Input
                  id="itemSort"
                  type="number"
                  value={itemForm.sortOrder}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, sortOrder: e.target.value })
                  }
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={itemForm.isActive}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, isActive: e.target.checked })
                  }
                />
                Aktif
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemStarts">Başlangıç</Label>
                <Input
                  id="itemStarts"
                  type="datetime-local"
                  value={itemForm.startsAt}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, startsAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemEnds">Bitiş</Label>
                <Input
                  id="itemEnds"
                  type="datetime-local"
                  value={itemForm.endsAt}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, endsAt: e.target.value })
                  }
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] sm:col-span-2">
                Bitiş boş bırakılabilir. Doluysa başlangıçtan sonra olmalıdır;
                aynı veya daha erken tarih kaydedilmez.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemImage">
                Masaüstü görseli
                {imageGuide && (
                  <span className="ml-2 font-normal text-[var(--primary)]">
                    {imageGuide.desktop.width} × {imageGuide.desktop.height} px
                  </span>
                )}
              </Label>
              {imageGuide && (
                <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                  Önerilen ölçü: {imageGuide.desktop.label}. Tüm öğeleri aynı
                  ölçü ve oranda hazırlayın.
                </p>
              )}
              <Input
                id="itemImage"
                type="file"
                accept={ACCEPTED}
                disabled={uploadingField !== null}
                onChange={(e) => {
                  void handleImageUpload(e.target.files?.[0], "desktop");
                  e.target.value = "";
                }}
              />
              {uploadingField === "desktop" && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Yükleniyor...
                </p>
              )}
              {itemForm.secureUrl && (
                <div className="relative mt-2 h-28 w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]/30">
                  <Image
                    src={getOptimizedImageUrl(itemForm.secureUrl, { width: 480 })}
                    alt={itemForm.altText || itemForm.title || "Önizleme"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            {supportsMobileImage && (
              <div className="space-y-2">
                <Label htmlFor="itemMobileImage">
                  Mobil görsel (opsiyonel)
                  {imageGuide?.mobile && (
                    <span className="ml-2 font-normal text-[var(--primary)]">
                      {imageGuide.mobile.width} × {imageGuide.mobile.height} px
                    </span>
                  )}
                </Label>
                {imageGuide?.mobile && (
                  <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                    Önerilen ölçü: {imageGuide.mobile.label}. Mobil görsel
                    eklenmezse masaüstü görseli kullanılır.
                  </p>
                )}
                <Input
                  id="itemMobileImage"
                  type="file"
                  accept={ACCEPTED}
                  disabled={uploadingField !== null}
                  onChange={(e) => {
                    void handleImageUpload(e.target.files?.[0], "mobile");
                    e.target.value = "";
                  }}
                />
                {uploadingField === "mobile" && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Yükleniyor...
                  </p>
                )}
                {itemForm.mobileSecureUrl && (
                  <div className="relative mt-2 h-28 w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]/30">
                    <Image
                      src={getOptimizedImageUrl(itemForm.mobileSecureUrl, {
                        width: 480,
                      })}
                      alt={itemForm.altText || "Mobil önizleme"}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={itemLoading || uploadingField !== null}>
                {itemLoading ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetItemForm}>
                  İptal
                </Button>
              )}
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-3">
              <h2 className="font-semibold text-[var(--navy)]">Carousel Öğeleri</h2>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {sortedItems.map((item, index) => (
                <li key={item.id} className="flex gap-3 p-4">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded border border-[var(--border)] bg-[var(--muted)]/30">
                    {item.secureUrl ? (
                      <Image
                        src={getOptimizedImageUrl(item.secureUrl, { width: 160 })}
                        alt={item.altText || item.title || "Öğe"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                        Yok
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title || "Başlıksız"}</p>
                      <Badge variant={item.isActive ? "success" : "secondary"}>
                        {item.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    {section.sectionType !== "HERO_BANNER" && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Kategori: {categoryName(item.categoryId)}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-sm text-[var(--primary)] hover:underline"
                        onClick={() => startEditItem(item)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:underline"
                        onClick={() => moveItem(item, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                        Yukarı
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:underline"
                        onClick={() => moveItem(item, 1)}
                        disabled={index === sortedItems.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        Aşağı
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
                        onClick={() => deleteItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Sil
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {sortedItems.length === 0 && (
              <p className="py-10 text-center text-[var(--muted-foreground)]">
                Henüz öğe yok.
              </p>
            )}
          </div>
        </div>
      )}

      {section.sectionType === "PRODUCT_RAIL" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[var(--navy)]">Ürün Seç</h2>
              <Button
                type="button"
                onClick={saveProducts}
                disabled={productsLoading}
              >
                {productsLoading ? "Kaydediliyor..." : "Vitrini Kaydet"}
              </Button>
            </div>
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Ürün ara..."
            />
            <div className="max-h-[28rem] space-y-2 overflow-y-auto">
              {filteredProducts.map((product) => {
                const checked = selectedProductIds.includes(product.id);
                const thumb =
                  product.images.find((img) => img.isPrimary)?.secureUrl ??
                  product.images[0]?.secureUrl;
                return (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--border)] px-3 py-2 hover:bg-[var(--muted)]/40"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[var(--border)] bg-[var(--muted)]/30">
                      {thumb ? (
                        <Image
                          src={getOptimizedImageUrl(thumb, { width: 80 })}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {product.sku || product.categoryName || "—"}
                      </p>
                    </div>
                  </label>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
                  Aktif ürün bulunamadı.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
            <h2 className="font-semibold text-[var(--navy)]">
              Seçili Sıra ({selectedProducts.length})
            </h2>
            <ul className="space-y-2">
              {selectedProducts.map((product, index) => {
                const thumb =
                  product.images.find((img) => img.isPrimary)?.secureUrl ??
                  product.images[0]?.secureUrl;
                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-md border border-[var(--border)] px-3 py-2"
                  >
                    <span className="w-6 text-xs text-[var(--muted-foreground)]">
                      {index + 1}
                    </span>
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[var(--border)] bg-[var(--muted)]/30">
                      {thumb ? (
                        <Image
                          src={getOptimizedImageUrl(thumb, { width: 80 })}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <button
                      type="button"
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      onClick={() => moveSelectedProduct(product.id, -1)}
                      disabled={index === 0}
                      aria-label="Yukarı"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      onClick={() => moveSelectedProduct(product.id, 1)}
                      disabled={index === selectedProducts.length - 1}
                      aria-label="Aşağı"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => toggleProduct(product.id)}
                      aria-label="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                Henüz ürün seçilmedi.
              </p>
            )}
            <Button
              type="button"
              className="w-full"
              onClick={saveProducts}
              disabled={productsLoading}
            >
              <Upload className="h-4 w-4" />
              {productsLoading ? "Kaydediliyor..." : "Vitrini Kaydet"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
