const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, "../migrations");
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const version = file.replace(/\.sql$/, "");
      const result = await client.query(
        "SELECT 1 FROM schema_migrations WHERE version = $1",
        [version],
      );

      if (result.rowCount > 0) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [version],
      );
      console.log(`Migration berhasil: ${version}`);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .catch((error) => {
    console.error("Migration gagal:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
