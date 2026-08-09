import "server-only";
import { getPool, sql } from "@/lib/db/pool";

export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  message: string;
  serverTime?: string;
}> {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query<{ ServerTime: Date }>("SELECT SYSUTCDATETIME() AS ServerTime");
    const serverTime = result.recordset[0]?.ServerTime;
    return {
      ok: true,
      message: "MSSQL bağlantısı başarılı.",
      serverTime: serverTime ? new Date(serverTime).toISOString() : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen veritabanı hatası";
    return { ok: false, message };
  }
}

export { sql };
