require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { Pool } = require("pg");
const createOidcProvider = require("./oidc");
const createInteractionRouter = require("./interaction");
const adminRouter = require("./admin");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", true);

const swaggerPath = path.join(__dirname, "../swagger.yaml");
if (fs.existsSync(swaggerPath)) {
  try {
    const swaggerDocument = YAML.load(swaggerPath);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (err) {
    console.error("Gagal membaca swagger.yaml:", err.message);
  }
}

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static Files
const staticPath = fs.existsSync(path.join(__dirname, "../public"))
  ? path.join(__dirname, "../public")
  : path.join(__dirname, "../../frontend");
app.use(express.static(staticPath));

// 3. Routers
app.use("/admin", adminRouter);

// Database Pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get("/", (req, res) => {
  res.json({ message: "SSO Backend berjalan" });
});

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");
    res.json({
      status: "ok",
      db_connected: true,
      server_time: result.rows[0].server_time,
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db_connected: false, error: err.message });
  }
});

async function main() {
  const oidc = await createOidcProvider();
  const interactionRouter = createInteractionRouter(oidc);

  app.use("/oidc", interactionRouter);
  app.use("/oidc", oidc.callback());

  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Gagal menjalankan server:", err);
  process.exit(1);
});
