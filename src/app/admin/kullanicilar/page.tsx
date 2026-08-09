import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { UserActions } from "./user-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { adminListUsers } from "@/services/company-service";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kullanıcılar | Admin",
};

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminKullanicilarPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q?.trim() || undefined;

  const result = await adminListUsers(user, { search, page });
  const totalPages = Math.max(1, Math.ceil(result.total / 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[var(--navy)]">
          Kullanıcılar
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Platform kullanıcılarını görüntüleyin.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <Input
          name="q"
          placeholder="Kullanıcı ara..."
          defaultValue={search ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Ara
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Firma</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Kayıt</th>
              <th className="px-4 py-3 text-right font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {u.firstName} {u.lastName}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                </td>
                <td className="hidden px-4 py-3 text-[var(--muted-foreground)] md:table-cell">
                  {u.companyName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" ? "Admin" : "Firma"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? "success" : "secondary"}>
                    {u.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-[var(--muted-foreground)] lg:table-cell">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role !== "ADMIN" && (
                    <UserActions userId={u.id} isActive={u.isActive} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.items.length === 0 && (
          <p className="py-10 text-center text-[var(--muted-foreground)]">Kullanıcı yok.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/kullanicilar"
        searchParams={{ q: search }}
      />
    </div>
  );
}
