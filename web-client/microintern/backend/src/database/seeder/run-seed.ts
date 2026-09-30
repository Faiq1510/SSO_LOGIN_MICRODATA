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
    const files = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sqlPath = path.join(__dirname, file);
      const sql = fs.readFileSync(sqlPath, "utf-8");
      await client.query(sql);
    }
  } catch (err) {
    process.exit(1);
  } finally {
    await client.end();
  }
};

run();
