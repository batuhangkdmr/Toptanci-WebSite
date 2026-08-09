import "dotenv/config";
import fs from "fs";
import path from "path";
import sql from "mssql/msnodesqlv8";

async function ensureDatabase(): Promise<void> {
  const connectionString = process.env.MSSQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("MSSQL_CONNECTION_STRING tanımlı değil.");
  }

  // Ensure database exists by connecting to master if needed
  const dbMatch = connectionString.match(
    /(?:Initial Catalog|Database)=([^;]+)/i,
  );
  const dbName = dbMatch?.[1]?.trim() ?? "toptanciProj";

  const masterCs = connectionString
    .replace(/(Initial Catalog|Database)=[^;]+/i, "$1=master")
    .replace(/;;+/g, ";");

  const masterPool = new sql.ConnectionPool({
    connectionString: masterCs,
  } as unknown as sql.config);
  try {
    await masterPool.connect();
    await masterPool
      .request()
      .input("dbName", sql.NVarChar, dbName)
      .query(`
        IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = @dbName)
        BEGIN
          DECLARE @sql NVARCHAR(300) = N'CREATE DATABASE [' + @dbName + N']';
          EXEC sp_executesql @sql;
        END
      `);
    console.log(`Veritabanı hazır: ${dbName}`);
  } finally {
    await masterPool.close();
  }
}

function splitBatches(content: string): string[] {
  return content
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

async function migrate(): Promise<void> {
  // Load .env.local if present
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocal)) {
    const dotenv = await import("dotenv");
    dotenv.config({ path: envLocal, override: true });
  }

  if (!process.env.MSSQL_CONNECTION_STRING) {
    throw new Error("MSSQL_CONNECTION_STRING .env.local içinde tanımlı olmalı.");
  }

  await ensureDatabase();

  const pool = new sql.ConnectionPool({
    connectionString: process.env.MSSQL_CONNECTION_STRING,
  } as unknown as sql.config);
  await pool.connect();

  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__Migrations')
      BEGIN
        CREATE TABLE __Migrations (
          Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Migrations PRIMARY KEY,
          Name NVARCHAR(255) NOT NULL,
          AppliedAt DATETIME2 NOT NULL CONSTRAINT DF_Migrations_AppliedAt DEFAULT SYSUTCDATETIME(),
          CONSTRAINT UQ_Migrations_Name UNIQUE (Name)
        );
      END
    `);

    const migrationsDir = path.resolve(process.cwd(), "database/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const applied = await pool
        .request()
        .input("name", sql.NVarChar, file)
        .query<{ Id: number }>(
          "SELECT Id FROM __Migrations WHERE Name = @name",
        );

      if (applied.recordset.length > 0) {
        console.log(`Atlandı (uygulanmış): ${file}`);
        continue;
      }

      console.log(`Uygulanıyor: ${file}`);
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      const batches = splitBatches(content);

      for (const batch of batches) {
        await pool.request().query(batch);
      }

      await pool
        .request()
        .input("name", sql.NVarChar, file)
        .query("INSERT INTO __Migrations (Name) VALUES (@name)");

      console.log(`Tamamlandı: ${file}`);
    }

    console.log("Migration işlemi başarıyla tamamlandı.");
  } finally {
    await pool.close();
  }
}

migrate().catch((err) => {
  console.error("Migration hatası:", err);
  process.exit(1);
});
