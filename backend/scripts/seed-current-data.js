const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const adminUsers = [
  {
    username: "admin",
    passwordHash:
      "$2b$10$IfcuqKt1a7GLsBXtQSi.UumWpYjNjAWygOh8JqtvGvy8RGlCSDwoy",
  },
];

const users = [
  {
    username: "dev",
    passwordHash:
      "$2b$10$guX7OnXMhAq2KNIdW1iPaugx3D69jXMw7oypMmtG6qUbLPniaynPu",
    name: "developer",
    email: "dev@example.com",
  },
  {
    username: "faiq",
    passwordHash:
      "$2b$10$w6QcWUagyKGPusFyrtEAp.2RSOC2PpHohKf/V3VPIvnus8uR.DVWe",
    name: "Faiq Ramadhan",
    email: "ramadhanfaiq40@gmail.com",
  },
  {
    username: "getar",
    passwordHash:
      "$2b$10$fInxeRPyzlnjncc5.NT.uuwZEw8jZaJeKoP35LH2LDQ/QLEcDc2gO",
    name: "getar",
    email: "getar40@gmail.com",
  },
  {
    username: "iqbal",
    passwordHash:
      "$2b$10$FF9X4K1bYgfdNy65c8AtKe7vMl6V8hxA4ZWv6WYuAnQywtTrC1Wxm",
    name: "M.Iqbal",
    email: "iqbal@gmail.com",
  },
  {
    username: "mhs01",
    passwordHash:
      "$2b$10$blyRWQHtXFqb5CNZeVW4jOm.UTWhprV1c.xJB4iqZvammCMAfpFGi",
    name: "Budi Santoso",
    email: "budi@univ.ac.id",
  },
];

const clients = [
  {
    clientId: "arsipdemo",
    clientSecret:
      "0e267a90d11196cb4cc49df48755913bba9f966e8fc03597a4db23939940c4e1",
    redirectUri: "http://localhost:7000/callback",
    postLogoutRedirectUri: "http://localhost:7000/",
    name: "ARSIP-DEMO",
    brandColor: null,
  },
  {
    clientId: "client-arsip-surat",
    clientSecret:
      "04ec99ee66307b3112967367fe65dabeb980bb9137efbdad57def468a35722ff",
    redirectUri: "http://localhost:8000/sso/callback",
    postLogoutRedirectUri: "http://localhost:8000/login",
    name: "Arsip Surat",
    brandColor: "#8b5cf6",
  },
  {
    clientId: "client-dummy",
    clientSecret: "secret-dummy",
    redirectUri: "http://localhost:4000/callback",
    postLogoutRedirectUri: "http://localhost:4000/",
    name: "Client Demo 1",
    brandColor: null,
  },
  {
    clientId: "client-inventaris",
    clientSecret: "secret-inventaris",
    redirectUri: "http://localhost:5000/callback",
    postLogoutRedirectUri: "http://localhost:5000/",
    name: "Sistem Inventaris (Demo)",
    brandColor: "#8b5cf6",
  },
  {
    clientId: "client-microintern",
    clientSecret:
      "7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    redirectUri: "http://localhost:5173/sso/callback",
    postLogoutRedirectUri: "http://localhost:5173/login",
    name: "Microintern PKL",
    brandColor: "#f97316",
  },
  {
    clientId: "client-saims",
    clientSecret: "saims_sso_secret_key_8899aabbccddeeff112233",
    redirectUri: "http://localhost:3002/sso/callback",
    postLogoutRedirectUri: "http://localhost:3002/login",
    name: "SAIMS Inventaris",
    brandColor: "#2563eb",
  },
  {
    clientId: "cpc",
    clientSecret:
      "ba8533455b3f22d7343feebf326929b4f47d273e5b171cc8b5c4139875907fc4",
    redirectUri: "http://localhost:8001/login/sso/callback",
    postLogoutRedirectUri: "http://localhost:8001/login",
    name: "SiteFlow CPC",
    brandColor: "#0891b2",
  },
  {
    clientId: "portal-launcher",
    clientSecret:
      "ceeb344aecb4487ff011bfbefa166adc4cab5b315185dc7915d4d05ec5f53cbb",
    redirectUri: "http://localhost:9000/callback",
    postLogoutRedirectUri: "http://localhost:9000/",
    name: "Portal Launcher",
    brandColor: null,
  },
];

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const admin of adminUsers) {
      await client.query(
        `
        INSERT INTO admin_users (username, password_hash)
        VALUES ($1, $2)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash
        `,
        [admin.username, admin.passwordHash],
      );
    }

    for (const user of users) {
      await client.query(
        `
        INSERT INTO users (username, password_hash, name, email)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          email = EXCLUDED.email
        `,
        [user.username, user.passwordHash, user.name, user.email],
      );
    }

    for (const appClient of clients) {
      await client.query(
        `
        INSERT INTO clients (
          client_id,
          client_secret,
          redirect_uri,
          post_logout_redirect_uri,
          name,
          brand_color
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (client_id) DO UPDATE SET
          client_secret = EXCLUDED.client_secret,
          redirect_uri = EXCLUDED.redirect_uri,
          post_logout_redirect_uri = EXCLUDED.post_logout_redirect_uri,
          name = EXCLUDED.name,
          brand_color = EXCLUDED.brand_color
        `,
        [
          appClient.clientId,
          appClient.clientSecret,
          appClient.redirectUri,
          appClient.postLogoutRedirectUri,
          appClient.name,
          appClient.brandColor,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(
      `Seeder berhasil: ${adminUsers.length} admin, ${users.length} user, ${clients.length} client.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeder gagal:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
