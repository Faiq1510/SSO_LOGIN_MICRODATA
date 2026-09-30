import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "microintern",
});

const run = async () => {
  try {
    await client.connect();
    console.log("🔌 Connected to PostgreSQL for running migrations");

    // Drop all tables by recreating public schema
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");
    await client.query("GRANT ALL ON SCHEMA public TO postgres;");
    await client.query("GRANT ALL ON SCHEMA public TO public;");
    console.log("🧹 Dropped all tables successfully");

    const files = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`📜 Running migration file: ${file}`);
      const sqlPath = path.join(__dirname, file);
      const sql = fs.readFileSync(sqlPath, "utf-8");
      await client.query(sql);
    }

    console.log("✅ Migrations run successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client.end();
  }
};

run();
