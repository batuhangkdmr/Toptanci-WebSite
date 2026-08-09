import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicCatalogEnabled =
  (process.env.PUBLIC_CATALOG_ENABLED ?? "true").toLowerCase() !== "false";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  const isAuthPage = pathname.startsWith("/giris") || pathname.startsWith("/kayit");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProductBrowse = pathname.startsWith("/urunler");
  const isCompanyProtected =
    pathname.startsWith("/sepet") ||
    pathname.startsWith("/siparisler") ||
    pathname.startsWith("/hesabim") ||
    (!publicCatalogEnabled && isProductBrowse);
  const isPendingPage = pathname.startsWith("/onay-bekleniyor");

  if (isAuthPage && isLoggedIn) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/giris", req.url));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (isCompanyProtected || isPendingPage) {
    if (!isLoggedIn) {
      const giris = new URL("/giris", req.url);
      giris.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(giris);
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/giris",
    "/kayit",
    "/admin/:path*",
    "/urunler/:path*",
    "/sepet",
    "/siparisler/:path*",
    "/hesabim",
    "/onay-bekleniyor",
  ],
};
