import "server-only";
import { getPool, sql } from "@/lib/db/pool";
import { newsletterSchema } from "@/lib/validation/schemas";
import { siteConfig } from "@/lib/site-config";

export async function subscribeNewsletter(
  input: unknown,
  meta?: { ipAddress?: string | null },
) {
  const data = newsletterSchema.parse(input);
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("email", sql.NVarChar, data.email)
    .query<{ Id: string; IsActive: boolean }>(
      "SELECT Id, IsActive FROM NewsletterSubscriptions WHERE Email = @email",
    );

  if (existing.recordset[0]?.IsActive) {
    throw new Error("Bu e-posta adresi zaten e-bültene kayıtlı.");
  }

  if (existing.recordset[0]) {
    await pool
      .request()
      .input("email", sql.NVarChar, data.email)
      .query(`
        UPDATE NewsletterSubscriptions
        SET IsActive = 1, UpdatedAt = SYSUTCDATETIME()
        WHERE Email = @email
      `);
  } else {
    await pool
      .request()
      .input("email", sql.NVarChar, data.email)
      .input("version", sql.NVarChar, siteConfig.legalVersions.COMMERCIAL_COMMUNICATION)
      .input("ip", sql.NVarChar, meta?.ipAddress ?? null)
      .query(`
        INSERT INTO NewsletterSubscriptions (Email, IsActive, ConsentVersion, IpAddress)
        VALUES (@email, 1, @version, @ip)
      `);
  }

  return { message: "E-bülten kaydınız alındı." };
}
