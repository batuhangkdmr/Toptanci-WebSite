import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import sql from "mssql/msnodesqlv8";

async function seedAdmin(): Promise<void> {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocal)) {
    const dotenv = await import("dotenv");
    dotenv.config({ path: envLocal, override: true });
  }

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || "Admin";
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || "Kullanıcı";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL ve ADMIN_PASSWORD .env.local içinde tanımlı olmalıdır.",
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD en az 8 karakter olmalıdır.");
  }

  if (!process.env.MSSQL_CONNECTION_STRING) {
    throw new Error("MSSQL_CONNECTION_STRING tanımlı değil.");
  }

  const pool = new sql.ConnectionPool({
    connectionString: process.env.MSSQL_CONNECTION_STRING,
  } as unknown as sql.config);
  await pool.connect();

  try {
    const existing = await pool
      .request()
      .input("email", sql.NVarChar, email.toLowerCase())
      .query<{ Id: string }>(
        "SELECT Id FROM Users WHERE Email = @email",
      );

    if (existing.recordset.length > 0) {
      console.log(`Admin zaten mevcut: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool
      .request()
      .input("firstName", sql.NVarChar, firstName)
      .input("lastName", sql.NVarChar, lastName)
      .input("email", sql.NVarChar, email.toLowerCase())
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("role", sql.NVarChar, "ADMIN")
      .query(`
        INSERT INTO Users (CompanyId, FirstName, LastName, Email, PasswordHash, Role, IsActive)
        VALUES (NULL, @firstName, @lastName, @email, @passwordHash, @role, 1)
      `);

    console.log(`Admin hesabı oluşturuldu: ${email}`);
  } finally {
    await pool.close();
  }
}

seedAdmin().catch((err) => {
  console.error("Admin seed hatası:", err);
  process.exit(1);
});
