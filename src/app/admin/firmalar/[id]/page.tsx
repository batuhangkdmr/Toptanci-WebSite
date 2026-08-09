import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CompanyStatusForm } from "./company-status-form";
import { getCurrentUser } from "@/lib/auth/session";
import { adminGetCompany } from "@/services/company-service";
import { COMPANY_STATUS_LABELS, formatDate } from "@/lib/utils";
import type { CompanyStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return { title: "Firma" };
    const company = await adminGetCompany(user, id);
    return { title: `${company.companyName} | Admin` };
  } catch {
    return { title: "Firma" };
  }
}

function statusVariant(status: CompanyStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED" || status === "SUSPENDED") return "danger" as const;
  return "secondary" as const;
}

export default async function AdminFirmaDetayPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  let company;
  try {
    company = await adminGetCompany(user, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/firmalar" className="text-sm text-[var(--primary)] hover:underline">
          ← Firmalara dön
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
            {company.companyName}
          </h1>
          <Badge variant={statusVariant(company.status)}>
            {COMPANY_STATUS_LABELS[company.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-white p-5">
          <h2 className="mb-4 font-semibold">Firma Bilgileri</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted-foreground)]">E-posta</dt>
              <dd className="font-medium">{company.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Telefon</dt>
              <dd className="font-medium">{company.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Vergi No</dt>
              <dd className="font-medium">{company.taxNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Vergi Dairesi</dt>
              <dd className="font-medium">{company.taxOffice ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Şehir / İlçe</dt>
              <dd className="font-medium">
                {[company.city, company.district].filter(Boolean).join(" / ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Kayıt Tarihi</dt>
              <dd className="font-medium">{formatDate(company.createdAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted-foreground)]">Adres</dt>
              <dd className="font-medium">{company.address ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <CompanyStatusForm
          companyId={company.id}
          currentStatus={company.status}
          isActive={company.isActive}
        />
      </div>
    </div>
  );
}
