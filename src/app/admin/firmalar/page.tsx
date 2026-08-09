import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { getCurrentUser } from "@/lib/auth/session";
import { adminListCompanies } from "@/services/company-service";
import { COMPANY_STATUS_LABELS, formatDate } from "@/lib/utils";
import type { CompanyStatus } from "@/types";

export const metadata: Metadata = {
  title: "Firmalar | Admin",
};

function statusVariant(status: CompanyStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED" || status === "SUSPENDED") return "danger" as const;
  return "secondary" as const;
}

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function AdminFirmalarPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q?.trim() || undefined;
  const status = params.status || undefined;

  const result = await adminListCompanies(user, { search, status, page });
  const totalPages = Math.max(1, Math.ceil(result.total / 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Firmalar
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Firma kayıtlarını ve onay durumlarını yönetin.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Firma ara..."
          defaultValue={search ?? ""}
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
        >
          <option value="">Tüm durumlar</option>
          {(Object.keys(COMPANY_STATUS_LABELS) as CompanyStatus[]).map((s) => (
            <option key={s} value={s}>
              {COMPANY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Şehir</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Kayıt</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((company) => (
              <tr key={company.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{company.companyName}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{company.email}</div>
                </td>
                <td className="hidden px-4 py-3 text-[var(--muted-foreground)] md:table-cell">
                  {company.city ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(company.status)}>
                    {COMPANY_STATUS_LABELS[company.status]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-[var(--muted-foreground)] lg:table-cell">
                  {formatDate(company.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/firmalar/${company.id}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.items.length === 0 && (
          <p className="py-10 text-center text-[var(--muted-foreground)]">Firma bulunamadı.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/firmalar"
        searchParams={{ q: search, status }}
      />
    </div>
  );
}
