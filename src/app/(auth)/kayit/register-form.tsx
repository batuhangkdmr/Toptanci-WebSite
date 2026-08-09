"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TURKEY_CITIES, getDistrictsForCity } from "@/data/turkey-locations";
import { siteConfig } from "@/lib/site-config";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Erkek" },
  { value: "FEMALE", label: "Kadın" },
  { value: "UNSPECIFIED", label: "Belirtmek istemiyorum" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
    companyName: "",
    cityCode: "",
    districtCode: "",
    password: "",
    passwordConfirm: "",
    acceptMembership: false,
    acceptKvkk: false,
    acceptCommercial: false,
  });

  const districts = useMemo(
    () => (form.cityCode ? getDistrictsForCity(form.cityCode) : []),
    [form.cityCode],
  );

  const canSubmit =
    form.acceptMembership &&
    form.acceptKvkk &&
    (!siteConfig.requireCommercialConsent || form.acceptCommercial);

  function update<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "cityCode") next.districtCode = "";
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Zorunlu sözleşme onaylarını işaretleyiniz.");
      return;
    }
    setLoading(true);
    setFieldErrors({});
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          country: "TR",
          companyName: form.companyName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        throw new Error(data.error || "Kayıt başarısız.");
      }
      toast.success(
        data.message || "Kaydınız alındı. Giriş yaparak onay durumunu takip edebilirsiniz.",
      );
      router.push("/giris");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function fieldError(name: string) {
    return fieldErrors[name] ? (
      <p className="text-xs text-red-600" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex border-b border-[var(--border)]">
        <span className="border-b-2 border-[var(--primary)] px-3 pb-3 text-sm font-bold uppercase tracking-wide text-[var(--foreground)]">
          Üye Kayıt
        </span>
        <Link
          href="/giris"
          className="px-3 pb-3 text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Üye Girişi
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="firstName">
            Ad <span className="text-red-600">*</span>
          </Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            aria-invalid={!!fieldErrors.firstName}
          />
          {fieldError("firstName")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Soyad <span className="text-red-600">*</span>
          </Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            aria-invalid={!!fieldErrors.lastName}
          />
          {fieldError("lastName")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">
            Cinsiyet <span className="text-red-600">*</span>
          </Label>
          <select
            id="gender"
            required
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
            aria-invalid={!!fieldErrors.gender}
          >
            <option value="">Seçiniz</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {fieldError("gender")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Cep Telefonu <span className="text-red-600">*</span>
          </Label>
          <div className="flex gap-2">
            <span
              className="flex h-10 shrink-0 items-center rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 text-sm"
              aria-hidden
            >
              🇹🇷 +90
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="5XXXXXXXXX"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              aria-invalid={!!fieldErrors.phone}
            />
          </div>
          {fieldError("phone")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            E-posta Adresi <span className="text-red-600">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldError("email")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Firma Adı</Label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="İsteğe bağlı"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Ülke</Label>
          <Input id="country" value="Türkiye" readOnly disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cityCode">
            İl <span className="text-red-600">*</span>
          </Label>
          <select
            id="cityCode"
            required
            value={form.cityCode}
            onChange={(e) => update("cityCode", e.target.value)}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
            aria-invalid={!!fieldErrors.cityCode}
          >
            <option value="">İl Seçiniz</option>
            {TURKEY_CITIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldError("cityCode")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="districtCode">
            İlçe <span className="text-red-600">*</span>
          </Label>
          <select
            id="districtCode"
            required
            disabled={!form.cityCode}
            value={form.districtCode}
            onChange={(e) => update("districtCode", e.target.value)}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm disabled:opacity-50"
            aria-invalid={!!fieldErrors.districtCode}
          >
            <option value="">
              {form.cityCode ? "İlçe Seçiniz" : "Önce il seçiniz"}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
          {fieldError("districtCode")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Şifre <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="pr-10"
              aria-invalid={!!fieldErrors.password}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldError("password")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">
            Şifre Tekrar <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Input
              id="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
              className="pr-10"
              aria-invalid={!!fieldErrors.passwordConfirm}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted-foreground)]"
              onClick={() => setShowPasswordConfirm((v) => !v)}
              aria-label={
                showPasswordConfirm ? "Şifre tekrarını gizle" : "Şifre tekrarını göster"
              }
            >
              {showPasswordConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {fieldError("passwordConfirm")}
        </div>

        <fieldset className="space-y-3 border-t border-[var(--border)] pt-4">
          <legend className="sr-only">Sözleşme ve izin onayları</legend>

          <label className="flex gap-3 text-sm leading-snug">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={form.acceptCommercial}
              onChange={(e) => update("acceptCommercial", e.target.checked)}
            />
            <span>
              Ticari elektronik ileti, e-posta, SMS ve arama metnini okudum. Tarafınızdan
              gönderilecek bilgilendirmeleri almak istiyorum.{" "}
              <Link
                href="/ticari-elektronik-ileti"
                target="_blank"
                className="underline underline-offset-2"
              >
                Ticari Elektronik İleti
              </Link>
            </span>
          </label>
          {fieldError("acceptCommercial")}

          <label className="flex gap-3 text-sm leading-snug">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={form.acceptMembership}
              onChange={(e) => update("acceptMembership", e.target.checked)}
              required
            />
            <span>
              <Link
                href="/uyelik-sozlesmesi"
                target="_blank"
                className="underline underline-offset-2"
              >
                Üyelik Sözleşmesi
              </Link>
              ’ni okudum ve kabul ediyorum. <span className="text-red-600">*</span>
            </span>
          </label>
          {fieldError("acceptMembership")}

          <label className="flex gap-3 text-sm leading-snug">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={form.acceptKvkk}
              onChange={(e) => update("acceptKvkk", e.target.checked)}
              required
            />
            <span>
              <Link
                href="/kisisel-verilerin-korunmasi"
                target="_blank"
                className="underline underline-offset-2"
              >
                KVKK Aydınlatma Metni
              </Link>
              ’ni okudum ve kabul ediyorum. <span className="text-red-600">*</span>
            </span>
          </label>
          {fieldError("acceptKvkk")}
        </fieldset>

        <Button
          type="submit"
          className="w-full uppercase tracking-wide"
          size="lg"
          disabled={loading || !canSubmit}
        >
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </Button>
      </form>
    </div>
  );
}
