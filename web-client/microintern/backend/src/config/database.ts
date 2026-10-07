import { Pool, PoolClient, types } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Prevent node-pg from parsing DATE type (OID 1082) into JS Date object.
// We want it as raw string "YYYY-MM-DD" to avoid timezone offset issues.
types.setTypeParser(1082, (val) => val);

export type DbClient = Pool | PoolClient;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "clean_arch_db",
});

export const db = pool;

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const MIGRATION_PATH = path.join(__dirname, "../database/migration");
const SEEDER_PATH = path.join(__dirname, "../database/seeder");

const getSqlFiles = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".sql"))
        .sort()
    : [];

const extractTableName = (filename: string): string => {
  const match = filename.match(/^\d+_(.+?)_(?:migration|seeder)\.sql$/);
  return match ? match[1] : "";
};

const tableExists = async (client: DbClient, table: string): Promise<boolean> => {
  const res = await client.query(`SELECT to_regclass('public.${table}') AS exists`);
  return res.rows[0].exists !== null;
};

const isTableEmpty = async (client: DbClient, table: string): Promise<boolean> => {
  const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
  return parseInt(res.rows[0].count, 10) === 0;
};

const runSqlFile = async (client: DbClient, filePath: string) => {
  const sql = fs.readFileSync(filePath, "utf-8");
  await client.query(sql);
};

const runMigrations = async () => {
  console.log("🔄 Running migrations and seeders...");
  const migrationFiles = getSqlFiles(MIGRATION_PATH);
  const seederFiles = getSqlFiles(SEEDER_PATH);

  for (const file of migrationFiles) {
    const table = extractTableName(file);
    if (!table) continue;

    const exists = await tableExists(pool, table);
    if (exists) {
      console.log(`✓ Skipping migration ${file} (table '${table}' already exists)`);
    } else {
      await runSqlFile(pool, path.join(MIGRATION_PATH, file));
      console.log(`✅ Migrated: ${file}`);
    }
  }

  for (const file of seederFiles) {
    const table = extractTableName(file);
    if (!table) continue;

    const empty = await isTableEmpty(pool, table);
    if (!empty) {
      console.log(`✓ Skipping seeder ${file} (table '${table}' has data)`);
    } else {
      await runSqlFile(pool, path.join(SEEDER_PATH, file));
      console.log(`🌱 Seeded: ${file}`);
    }
  }

  console.log("✅ Migration & seeding complete.");
};

export const databaseReady = runMigrations();
