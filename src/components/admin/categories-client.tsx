"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageForUpload } from "@/lib/images/client-compress";
import type { Category } from "@/types";

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp,image/avif";
const MAX_SIZE = 10 * 1024 * 1024;

type FormState = {
  name: string;
  description: string;
  isActive: boolean;
  showOnHomepage: boolean;
  homepageSortOrder: string;
  imageAltText: string;
  imageCloudinaryPublicId: string;
  imageSecureUrl: string;
  clearImage: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  isActive: true,
  showOnHomepage: true,
  homepageSortOrder: "0",
  imageAltText: "",
  imageCloudinaryPublicId: "",
  imageSecureUrl: "",
  clearImage: false,
});

async function uploadCategoryImage(categoryId: string, file: File) {
  if (!ACCEPTED.split(",").includes(file.type) && !file.type.startsWith("image/")) {
    throw new Error("Geçersiz görsel formatı.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Görsel 10 MB'dan büyük olamaz.");
  }

  const compressed = await compressImageForUpload(file);
  const signRes = await fetch("/api/admin/cloudinary/sign-category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId }),
  });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error || "İmza alınamadı.");

  const fd = new FormData();
  fd.append("file", compressed);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("signature", sign.signature);
  fd.append("folder", sign.folder);

  const up = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  const data = await up.json();
  if (!up.ok) throw new Error(data.error?.message || "Yükleme başarısız.");
  return {
    publicId: data.public_id as string,
    secureUrl: data.secure_url as string,
  };
}

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setPendingFile(null);
    setPreviewUrl(null);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      isActive: cat.isActive,
      showOnHomepage: cat.showOnHomepage,
      homepageSortOrder: String(cat.homepageSortOrder ?? 0),
      imageAltText: cat.imageAltText ?? "",
      imageCloudinaryPublicId: cat.imageCloudinaryPublicId ?? "",
      imageSecureUrl: cat.imageSecureUrl ?? "",
      clearImage: false,
    });
  }

  function resetForm() {
    setEditingId(null);
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setForm(emptyForm());
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, clearImage: false }));
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setForm((prev) => ({
      ...prev,
      clearImage: true,
      imageCloudinaryPublicId: "",
      imageSecureUrl: "",
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const currentEditingId = editingId;

    try {
      const basePayload = {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        showOnHomepage: form.showOnHomepage,
        homepageSortOrder: Number(form.homepageSortOrder) || 0,
        imageAltText: form.imageAltText,
        clearImage: form.clearImage,
      };

      if (!currentEditingId) {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Oluşturulamadı.");

        let created = data as Category;
        if (pendingFile && created.id) {
          setUploading(true);
          try {
            const uploaded = await uploadCategoryImage(created.id, pendingFile);
            const patchRes = await fetch(`/api/admin/categories/${created.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...basePayload,
                imageCloudinaryPublicId: uploaded.publicId,
                imageSecureUrl: uploaded.secureUrl,
                imageAltText: form.imageAltText || form.name,
                clearImage: false,
              }),
            });
            const patched = await patchRes.json();
            if (!patchRes.ok) throw new Error(patched.error || "Görsel kaydedilemedi.");
            created = patched;
          } finally {
            setUploading(false);
          }
        }

        setCategories((prev) => [created, ...prev]);
        toast.success("Kategori oluşturuldu.");
      } else {
        let imagePayload: Record<string, unknown> = {
          clearImage: form.clearImage,
        };

        if (pendingFile) {
          setUploading(true);
          try {
            const uploaded = await uploadCategoryImage(currentEditingId, pendingFile);
            imagePayload = {
              imageCloudinaryPublicId: uploaded.publicId,
              imageSecureUrl: uploaded.secureUrl,
              imageAltText: form.imageAltText || form.name,
              clearImage: false,
            };
          } finally {
            setUploading(false);
          }
        } else if (!form.clearImage) {
          imagePayload = {
            imageAltText: form.imageAltText,
          };
        }

        const res = await fetch(`/api/admin/categories/${currentEditingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, ...imagePayload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");

        setCategories((prev) =>
          prev.map((c) => (c.id === currentEditingId ? { ...c, ...data } : c)),
        );
        toast.success("Kategori güncellendi.");
      }

      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  async function toggleActive(cat: Category) {
    const nextActive = !cat.isActive;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi.");
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextActive } : c)),
      );
      toast.success(data.message || "Güncellendi.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  }

  const displayPreview =
    previewUrl ||
    (!form.clearImage && form.imageSecureUrl ? form.imageSecureUrl : null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={onSubmit}
        className="h-fit space-y-4 rounded-lg border border-[var(--border)] bg-white p-5"
      >
        <h2 className="font-semibold">
          {editingId ? "Kategori Düzenle" : "Yeni Kategori"}
        </h2>
        <div className="space-y-2">
          <Label htmlFor="name">Ad</Label>
          <Input
            id="name"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Örn. Gıda"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="İsteğe bağlı açıklama"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="homepageSortOrder">Ana sayfa sırası</Label>
            <Input
              id="homepageSortOrder"
              type="number"
              min={0}
              value={form.homepageSortOrder}
              onChange={(e) =>
                setForm({ ...form, homepageSortOrder: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageAltText">Görsel alt metni</Label>
            <Input
              id="imageAltText"
              value={form.imageAltText}
              onChange={(e) => setForm({ ...form, imageAltText: e.target.value })}
              placeholder="Kategori adı"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryImage">Kategori görseli</Label>
          <Input
            id="categoryImage"
            type="file"
            accept={ACCEPTED}
            disabled={loading || uploading}
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          {displayPreview && (
            <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-full border border-[var(--border)]">
              <Image
                src={displayPreview}
                alt={form.imageAltText || form.name || "Önizleme"}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          )}
          {(displayPreview || form.imageSecureUrl) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearImage}
              disabled={loading || uploading}
            >
              Görseli kaldır
            </Button>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">
            Yeni kategoride önce kayıt oluşturulur, ardından görsel yüklenir.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.showOnHomepage}
            onChange={(e) =>
              setForm({ ...form, showOnHomepage: e.target.checked })
            }
          />
          Ana sayfa kategori carousel&apos;inde göster
        </label>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading || uploading || form.name.trim().length < 2}
          >
            {uploading
              ? "Görsel yükleniyor..."
              : loading
                ? "Kaydediliyor..."
                : editingId
                  ? "Güncelle"
                  : "Ekle"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              İptal
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Görsel</th>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[var(--muted)]">
                    {cat.imageSecureUrl ? (
                      <Image
                        src={cat.imageSecureUrl}
                        alt={cat.imageAltText || cat.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--muted-foreground)]">
                        {cat.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{cat.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Sıra: {cat.homepageSortOrder}
                    {cat.showOnHomepage ? " · Ana sayfa" : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={cat.isActive ? "success" : "secondary"}>
                    {cat.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-[var(--primary)] hover:underline"
                    onClick={() => startEdit(cat)}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    className="text-[var(--muted-foreground)] hover:underline"
                    onClick={() => toggleActive(cat)}
                  >
                    {cat.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="py-10 text-center text-[var(--muted-foreground)]">
            Kategori yok.
          </p>
        )}
      </div>
    </div>
  );
}
