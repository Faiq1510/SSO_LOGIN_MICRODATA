import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { pool } from "../../backend/src/config/database";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });
process.env.DB_NAME = process.env.TEST_DB_NAME || "microintern_test";

const schemaPath = path.resolve(__dirname, "../../database/schema.sql");

export async function ensureTestDatabaseExists(): Promise<void> {
  const adminClient = new pg.Client({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgres",
    database: "postgres",
  });

  await adminClient.connect();
  const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [process.env.DB_NAME]);
  if (res.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
  }
  await adminClient.end();
}

export async function resetTestDatabase(): Promise<void> {
  await ensureTestDatabaseExists();
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(schemaPath, "utf-8");
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await client.query("GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;");
    await client.query(sql);
  } finally {
    client.release();
  }
}

export async function closeTestDatabasePool(): Promise<void> {
  await pool.end();
}
