import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    redirect("/giris");
  }

  return (
    <div className="flex min-h-full flex-1 bg-[var(--background)]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-[var(--border)] bg-white px-6">
          <p className="text-sm text-[var(--muted-foreground)]">
            Merhaba,{" "}
            <span className="font-medium text-[var(--foreground)]">
              {user.firstName} {user.lastName}
            </span>
          </p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
