import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";
import { findUserByEmail } from "@/repositories/user-repository";
import { findCompanyById } from "@/repositories/company-repository";
import type { CompanyStatus, UserRole } from "@/types";

declare module "next-auth" {
  interface User {
    role: UserRole;
    companyId: string | null;
    companyStatus: CompanyStatus | null;
    companyName: string | null;
    firstName: string;
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      companyId: string | null;
      companyStatus: CompanyStatus | null;
      companyName: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    companyId: string | null;
    companyStatus: CompanyStatus | null;
    companyName: string | null;
    firstName: string;
    lastName: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const user = await findUserByEmail(email);

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        let companyStatus: CompanyStatus | null = null;
        let companyName: string | null = null;

        if (user.role === "COMPANY_USER") {
          if (!user.companyId) return null;
          const company = await findCompanyById(user.companyId);
          if (!company || !company.isActive) return null;
          if (company.status === "REJECTED" || company.status === "SUSPENDED") {
            return null;
          }
          // PENDING users may sign in but are limited to /onay-bekleniyor
          companyStatus = company.status;
          companyName = company.companyName;
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          companyStatus,
          companyName,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/giris",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyStatus = user.companyStatus;
        token.companyName = user.companyName;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = (token.email as string) ?? "";
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.companyStatus = token.companyStatus;
        session.user.companyName = token.companyName;
      }
      return session;
    },
  },
  trustHost: true,
});
