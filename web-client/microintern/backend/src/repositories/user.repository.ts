import { db, DbClient } from "../config/database";

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  role: "peserta" | "admin";
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  name?: string | null;
  password?: string | null;
}

export const findAllUsers = async (dbClient: DbClient = db): Promise<User[]> => {
  const result = await dbClient.query(`
    SELECT u.id, u.email, u.google_id, u.role, u.email_verified, u.created_at, u.updated_at,
           p.nama_lengkap AS name
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    ORDER BY u.created_at DESC
  `);
  return result.rows;
};

export const findUserById = async (id: string, dbClient: DbClient = db): Promise<User | null> => {
  const result = await dbClient.query(
    `
    SELECT u.id, u.email, u.google_id, u.role, u.email_verified, u.created_at, u.updated_at,
           p.nama_lengkap AS name
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const findUserByIdWithPassword = async (id: string, dbClient: DbClient = db): Promise<User | null> => {
  const result = await dbClient.query(
    `
    SELECT u.id, u.email, u.google_id, u.role, u.email_verified, u.created_at, u.updated_at,
           p.nama_lengkap AS name, u.password_hash
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.id = $1
  `,
    [id]
  );
  return result.rows[0] || null;
};

export const findUserByEmail = async (email: string, dbClient: DbClient = db): Promise<User | null> => {
  const result = await dbClient.query(
    `
    SELECT u.id, u.email, u.google_id, u.role, u.email_verified, u.created_at, u.updated_at,
           p.nama_lengkap AS name
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.email = $1
  `,
    [email]
  );
  return result.rows[0] || null;
};

export const findUserByEmailWithPassword = async (email: string, dbClient: DbClient = db): Promise<User | null> => {
  const result = await dbClient.query(
    `
    SELECT u.id, u.email, u.password_hash, u.google_id, u.role, u.email_verified, u.created_at, u.updated_at,
           p.nama_lengkap AS name, u.password_hash AS password
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.email = $1
  `,
    [email]
  );
  const user = result.rows[0] || null;
  if (user) {
    return { ...user, password: user.password_hash };
  }
  return user;
};

export const findUserByGoogleId = async (googleId: string, dbClient: DbClient = db): Promise<User | null> => {
  const result = await dbClient.query(
    `
    SELECT u.id, u.email, u.google_id, u.role, u.email_verified, u.created_at, u.updated_at,
           p.nama_lengkap AS name
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.google_id = $1
  `,
    [googleId]
  );
  return result.rows[0] || null;
};

export const insertUser = async (
  data: {
    email: string;
    password_hash?: string | null;
    google_id?: string | null;
    role?: "peserta" | "admin";
    email_verified?: boolean;
  },
  dbClient: DbClient = db
): Promise<User> => {
  const passwordHash = data.password_hash || null;
  const googleId = data.google_id || null;
  const role = data.role || "peserta";
  const emailVerified = data.email_verified || false;

  const result = await dbClient.query(
    `
    INSERT INTO users (email, password_hash, google_id, role, email_verified)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, google_id, role, email_verified, created_at, updated_at
  `,
    [data.email, passwordHash, googleId, role, emailVerified]
  );

  const user = result.rows[0];
  return user;
};

export const modifyUser = async (
  id: string,
  data: {
    email?: string;
    password_hash?: string | null;
    google_id?: string | null;
    role?: "peserta" | "admin";
    email_verified?: boolean;
  },
  dbClient: DbClient = db
): Promise<User | null> => {
  const existing = await findUserByIdWithPassword(id, dbClient);
  if (!existing) return null;

  const email = data.email !== undefined ? data.email : existing.email;
  const passwordHash = data.password_hash !== undefined ? data.password_hash : existing.password_hash;
  const googleId = data.google_id !== undefined ? data.google_id : existing.google_id;
  const role = data.role !== undefined ? data.role : existing.role;
  const emailVerified = data.email_verified !== undefined ? data.email_verified : existing.email_verified;

  const result = await dbClient.query(
    `
    UPDATE users
    SET email = $1, password_hash = $2, google_id = $3, role = $4, email_verified = $5, updated_at = NOW()
    WHERE id = $6
    RETURNING id, email, google_id, role, email_verified, created_at, updated_at
  `,
    [email, passwordHash, googleId, role, emailVerified, id]
  );

  const user = result.rows[0];
  if (!user) return null;
  return user;
};

export const removeUserById = async (id: string, dbClient: DbClient = db): Promise<boolean> => {
  const result = await dbClient.query("DELETE FROM users WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const searchUsers = async (query: string, excludeUserId?: string, dbClient: DbClient = db): Promise<any[]> => {
  const params: any[] = [`%${query}%`];
  let excludeQuery = "";
  if (excludeUserId) {
    params.push(excludeUserId);
    excludeQuery = `AND u.id != $${params.length}`;
  }

  const result = await dbClient.query(
    `
    SELECT u.id, u.email, p.nama_lengkap AS name, p.institusi, p.program_studi
    FROM users u
    LEFT JOIN profil_peserta p ON p.user_id = u.id
    WHERE u.role = 'peserta' AND (
      u.email ILIKE $1 OR
      p.nama_lengkap ILIKE $1
    )
    AND NOT EXISTS (
      SELECT 1
      FROM kelompok_anggota ka
      JOIN pengajuan_pkl pp ON pp.kelompok_id = ka.kelompok_id
      JOIN jadwal_pkl jp ON jp.pengajuan_id = pp.id
      WHERE ka.user_id = u.id
        AND pp.status = 'aktif'
        AND jp.tanggal_selesai > CURRENT_DATE
    )
    ${excludeQuery}
    LIMIT 10
  `,
    params
  );
  return result.rows;
};
