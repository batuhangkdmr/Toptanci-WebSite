import "server-only";
import sql from "mssql/msnodesqlv8";

type GlobalWithPool = typeof globalThis & {
  __mssqlPool?: sql.ConnectionPool;
  __mssqlPoolPromise?: Promise<sql.ConnectionPool>;
};

const globalForDb = globalThis as GlobalWithPool;

function getConnectionString(): string {
  const connectionString = process.env.MSSQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "MSSQL_CONNECTION_STRING ortam değişkeni tanımlı değil. .env.local dosyasını kontrol edin.",
    );
  }
  return connectionString;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (globalForDb.__mssqlPool?.connected) {
    return globalForDb.__mssqlPool;
  }

  if (globalForDb.__mssqlPoolPromise) {
    return globalForDb.__mssqlPoolPromise;
  }

  const poolPromise = (async () => {
    const pool = new sql.ConnectionPool({
      connectionString: getConnectionString(),
    } as unknown as sql.config);
    await pool.connect();
    globalForDb.__mssqlPool = pool;
    return pool;
  })();

  globalForDb.__mssqlPoolPromise = poolPromise;

  try {
    return await poolPromise;
  } catch (error) {
    globalForDb.__mssqlPoolPromise = undefined;
    globalForDb.__mssqlPool = undefined;
    throw error;
  }
}

export async function getRequest(): Promise<sql.Request> {
  const pool = await getPool();
  return pool.request();
}

export async function withTransaction<T>(
  fn: (request: sql.Request, transaction: sql.Transaction) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);
    const result = await fn(request, transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch {
      // ignore rollback errors
    }
    throw error;
  }
}

export { sql };
