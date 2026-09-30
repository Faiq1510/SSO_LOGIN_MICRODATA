import { db, DbClient } from "../config/database";

export interface PendingOtp {
  id: string;
  email: string;
  otp_code: string;
  type: string;
  expires_at: Date;
  created_at: Date;
}

export const insertOtp = async (data: { email: string; otp_code: string; type: string; expires_at: Date }, dbClient: DbClient = db): Promise<PendingOtp> => {
  const query = `
    INSERT INTO pending_otps (email, otp_code, type, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [data.email, data.otp_code, data.type, data.expires_at];
  const result = await dbClient.query(query, values);
  return result.rows[0];
};

export const findOtp = async (email: string, type: string, otp_code: string, dbClient: DbClient = db): Promise<PendingOtp | null> => {
  const query = `
    SELECT * FROM pending_otps
    WHERE email = $1 AND type = $2 AND otp_code = $3
  `;
  const result = await dbClient.query(query, [email, type, otp_code]);
  return result.rows[0] || null;
};

export const deleteOtp = async (email: string, type: string, dbClient: DbClient = db): Promise<void> => {
  const query = `
    DELETE FROM pending_otps
    WHERE email = $1 AND type = $2
  `;
  await dbClient.query(query, [email, type]);
};
