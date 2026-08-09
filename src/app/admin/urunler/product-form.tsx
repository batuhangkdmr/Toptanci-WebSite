"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOptimizedImageUrl } from "@/lib/cloudinary/url";
import { uploadProductImagesFast } from "@/lib/images/fast-upload";
import type { Category, ProductImage, ProductWithImages } from "@/types";

interface ProductFormProps {
  categories: Category[];
  product?: ProductWithImages;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
}

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp,image/avif";
const MAX_SIZE = 10 * 1024 * 1024;

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [savedImages, setSavedImages] = useState<ProductImage[]>(product?.images ?? []);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    categoryId: product?.categoryId ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    description: product?.description ?? "",
    unit: product?.unit ?? "",
    price: product?.price != null ? String(product.price) : "",
    stockQuantity: product?.stockQuantity != null ? String(product.stockQuantity) : "",
    isActive: product?.isActive ?? true,
  });

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedSaved = useMemo(
    () =>
      [...savedImages].sort((a, b) => {
        if (a.isPrimary === b.isPrimary) return a.sortOrder - b.sortOrder;
        return a.isPrimary ? -1 : 1;
      }),
    [savedImages],
  );

  function addPendingFiles(files: FileList | null) {
    if (!files?.length) return;

    const next: PendingImage[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED.split(",").includes(file.type) && !file.type.startsWith("image/")) {
        toast.error(`${file.name}: Geçersiz format. JPG, PNG, WEBP veya AVIF kullanın.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: Dosya 10 MB'dan büyük olamaz.`);
        continue;
      }
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: false,
      });
    }

    if (next.length === 0) return;

    setPendingImages((prev) => {
      const merged = [...prev, ...next];
      const hasPrimary =
        merged.some((i) => i.isPrimary) || savedImages.some((i) => i.isPrimary);
      if (!hasPrimary && merged.length > 0) {
        merged[0] = { ...merged[0], isPrimary: true };
      }
      return merged;
    });
  }

  function removePending(id: string) {
    setPendingImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const rest = prev.filter((i) => i.id !== id);
      if (target?.isPrimary && rest.length > 0 && !savedImages.some((i) => i.isPrimary)) {
        rest[0] = { ...rest[0], isPrimary: true };
      }
      return rest;
    });
  }

  function setPendingPrimary(id: string) {
    setPendingImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id })),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setProgressText("Ürün kaydediliyor...");
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        price: form.price.trim() === "" ? null : form.price.trim(),
        stockQuantity:
          form.stockQuantity.trim() === "" ? null : form.stockQuantity.trim(),
      };

      const url = isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");

      const productId = isEdit ? product.id : data.id ?? data.product?.id;
      if (!productId) throw new Error("Ürün kimliği alınamadı.");

      const filesToUpload = [...pendingImages];
      if (filesToUpload.length > 0) {
        setUploading(true);
        await uploadProductImagesFast(
          productId,
          filesToUpload.map((img) => ({
            file: img.file,
            isPrimary: img.isPrimary,
          })),
          (phase, done, total) => {
            setProgressText(`${phase}: ${done}/${total}`);
          },
        );
        filesToUpload.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setPendingImages([]);
        setUploading(false);
      }

      toast.success(
        isEdit
          ? "Ürün güncellendi."
          : filesToUpload.length > 0
            ? "Ürün ve görseller kaydedildi."
            : "Ürün oluşturuldu.",
      );

      router.push(`/admin/urunler/${productId}/duzenle`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setUploading(false);
      setLoading(false);
      setProgressText("");
    }
  }

  async function uploadMore(files: FileList | null) {
    if (!files) return;
    if (!isEdit || !product) {
      addPendingFiles(files);
      return;
    }

    const fileList = Array.from(files).filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: 10 MB limiti aşıldı.`);
        return false;
      }
      return true;
    });
    if (fileList.length === 0) return;

    setUploading(true);
    setProgressText("Görseller hazırlanıyor...");
    try {
      const makeFirstPrimary = savedImages.length === 0;
      const uploaded = await uploadProductImagesFast(
        product.id,
        fileList.map((file, i) => ({
          file,
          isPrimary: makeFirstPrimary && i === 0,
        })),
        (phase, done, total) => {
          setProgressText(`${phase}: ${done}/${total}`);
        },
      );
      setSavedImages((prev) => {
        const cleared =
          makeFirstPrimary && uploaded.some((u) => u.isPrimary)
            ? prev.map((p) => ({ ...p, isPrimary: false }))
            : prev;
        return [...cleared, ...uploaded];
      });
      toast.success("Görsel(ler) yüklendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükleme hatası.");
    } finally {
      setUploading(false);
      setProgressText("");
    }
  }

  async function deleteImage(imageId: string) {
    if (!product) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}/images/${imageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi.");
      setSavedImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Görsel silindi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  async function setPrimary(imageId: string) {
    if (!product) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      setSavedImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === imageId })),
      );
      setPendingImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
      toast.success("Kartta ilk gösterilecek görsel ayarlandı.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="max-w-3xl space-y-4 rounded-lg border border-[var(--border)] bg-white p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Ürün Adı</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Kategori</Label>
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="">Kategori seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Barkod</Label>
            <Input
              id="barcode"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="unit">Birim</Label>
            <Input
              id="unit"
              placeholder="adet, kg, koli..."
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Fiyat (₺)</Label>
            <Input
              id="price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stok</Label>
            <Input
              id="stock"
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Aktif
        </label>

        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          <div>
            <h2 className="font-semibold">Ürün Görselleri</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Birden fazla görsel ekleyebilirsiniz. Görseller tarayıcıda WebP’ye
              sıkıştırılıp Cloudinary’ye paralel yüklenir. “Kartta göster” ile ilk
              sıradaki görseli seçin.
            </p>
          </div>

          {progressText && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2 text-sm">
              {progressText}
            </div>
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/40 px-4 py-8 text-sm transition hover:bg-[var(--muted)]/70">
            <Upload className="h-6 w-6 text-[var(--primary)]" />
            <span className="font-medium">Görsel seçin veya sürükleyin</span>
            <span className="text-xs text-[var(--muted-foreground)]">Çoklu seçim desteklenir</span>
            <Input
              type="file"
              accept={ACCEPTED}
              multiple
              disabled={loading || uploading}
              className="hidden"
              onChange={(e) => {
                if (isEdit) void uploadMore(e.target.files);
                else addPendingFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {(sortedSaved.length > 0 || pendingImages.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedSaved.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-md border border-[var(--border)]"
                >
                  <div className="relative aspect-[4/3] bg-[var(--muted)]">
                    <Image
                      src={getOptimizedImageUrl(img.secureUrl, { width: 400, height: 300 })}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                    {img.isPrimary && (
                      <span className="absolute left-2 top-2 rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-medium text-white">
                        Kartta 1.
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 p-2">
                    {!img.isPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPrimary(img.id)}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Kartta göster
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImage(img.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Sil
                    </Button>
                  </div>
                </div>
              ))}

              {pendingImages.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-md border border-dashed border-[var(--primary)]/40"
                >
                  <div className="relative aspect-[4/3] bg-[var(--muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute left-2 top-2 rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-medium text-white">
                        Kartta 1.
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      Yüklenecek
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 p-2">
                    {!img.isPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingPrimary(img.id)}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Kartta göster
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removePending(img.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Kaldır
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading || uploading}>
          {loading || uploading
            ? progressText || "İşleniyor..."
            : isEdit
              ? "Güncelle"
              : "Ürünü Oluştur"}
        </Button>
      </form>
    </div>
  );
}
