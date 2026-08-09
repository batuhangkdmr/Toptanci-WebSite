import "server-only";
import { sql } from "@/lib/db/pool";
import type { LegalDocType } from "@/lib/site-config";

export type ConsentRecord = {
  id: string;
  userId: string;
  docType: LegalDocType;
  documentVersion: string;
  accepted: boolean;
  acceptedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ConsentRow = {
  Id: string;
  UserId: string;
  DocType: LegalDocType;
  DocumentVersion: string;
  Accepted: boolean;
  AcceptedAt: Date | null;
  IpAddress: string | null;
  UserAgent: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
};

function mapConsent(row: ConsentRow): ConsentRecord {
  return {
    id: row.Id,
    userId: row.UserId,
    docType: row.DocType,
    documentVersion: row.DocumentVersion,
    accepted: row.Accepted,
    acceptedAt: row.AcceptedAt,
    ipAddress: row.IpAddress,
    userAgent: row.UserAgent,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

export async function insertUserConsent(
  transaction: sql.Transaction,
  data: {
    userId: string;
    docType: LegalDocType;
    documentVersion: string;
    accepted: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
  },
): Promise<ConsentRecord> {
  const request = new sql.Request(transaction);
  const result = await request
    .input("userId", sql.UniqueIdentifier, data.userId)
    .input("docType", sql.NVarChar, data.docType)
    .input("documentVersion", sql.NVarChar, data.documentVersion)
    .input("accepted", sql.Bit, data.accepted)
    .input("acceptedAt", sql.DateTime2, data.accepted ? new Date() : null)
    .input("ipAddress", sql.NVarChar, data.ipAddress ?? null)
    .input("userAgent", sql.NVarChar, data.userAgent?.slice(0, 500) ?? null)
    .query<ConsentRow>(`
      INSERT INTO UserConsents (
        UserId, DocType, DocumentVersion, Accepted, AcceptedAt, IpAddress, UserAgent
      )
      OUTPUT INSERTED.*
      VALUES (
        @userId, @docType, @documentVersion, @accepted, @acceptedAt, @ipAddress, @userAgent
      )
    `);
  return mapConsent(result.recordset[0]);
}

export async function upsertCommercialConsent(
  userId: string,
  accepted: boolean,
  version: string,
  meta?: { ipAddress?: string | null; userAgent?: string | null },
): Promise<void> {
  const { getPool } = await import("@/lib/db/pool");
  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("docType", sql.NVarChar, "COMMERCIAL_COMMUNICATION")
    .input("documentVersion", sql.NVarChar, version)
    .input("accepted", sql.Bit, accepted)
    .input("acceptedAt", sql.DateTime2, accepted ? new Date() : null)
    .input("ipAddress", sql.NVarChar, meta?.ipAddress ?? null)
    .input("userAgent", sql.NVarChar, meta?.userAgent?.slice(0, 500) ?? null)
    .query(`
      INSERT INTO UserConsents (
        UserId, DocType, DocumentVersion, Accepted, AcceptedAt, IpAddress, UserAgent
      )
      VALUES (
        @userId, @docType, @documentVersion, @accepted, @acceptedAt, @ipAddress, @userAgent
      )
    `);
}
