import fs from "fs";
import path from "path";
import sql from "mssql/msnodesqlv8";

async function main() {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocal)) {
    const dotenv = await import("dotenv");
    dotenv.config({ path: envLocal, override: true });
  }

  const connectionString = process.env.MSSQL_CONNECTION_STRING;
  if (!connectionString) {
    console.error("HATA: MSSQL_CONNECTION_STRING tanımlı değil.");
    process.exit(1);
  }

  console.log("MSSQL bağlantısı kontrol ediliyor...");
  const pool = new sql.ConnectionPool({
    connectionString,
  } as unknown as sql.config);
  try {
    await pool.connect();
    const result = await pool
      .request()
      .query<{ ServerTime: Date }>("SELECT SYSUTCDATETIME() AS ServerTime");
    console.log("MSSQL bağlantısı başarılı.");
    console.log(
      "Sunucu zamanı (UTC):",
      new Date(result.recordset[0].ServerTime).toISOString(),
    );
  } catch (error) {
    console.error(
      "HATA:",
      error instanceof Error ? error.message : "Bilinmeyen hata",
    );
    process.exit(1);
  } finally {
    await pool.close().catch(() => undefined);
  }
}

main();
