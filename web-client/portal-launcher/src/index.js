/** @format */
require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 9000;

const IDP_ISSUER = process.env.IDP_ISSUER || "http://localhost:3000";
const CLIENT_ID = process.env.CLIENT_ID || "portal-launcher";
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI =
  process.env.REDIRECT_URI || "http://localhost:9000/callback";
const POST_LOGOUT_REDIRECT_URI =
  process.env.POST_LOGOUT_REDIRECT_URI || "http://localhost:9000/";

// DB Pool untuk membaca daftar aplikasi dari tabel clients
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "sso_idp",
  user: process.env.DB_USER || "sso_user",
  password: process.env.DB_PASSWORD || "sso_password",
});

// In-memory store
const pendingRequests = new Map(); // state → { codeVerifier }
const sessions = new Map(); // sessionId → { id_token, user }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

function decodeJwt(token) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  } catch {
    return {};
  }
}

function requireAuth(req, res, next) {
  const sid = getCookie(req, "portal_sid");
  const session = sid ? sessions.get(sid) : null;
  if (!session) return res.redirect("/login");
  req.user = session.user;
  req.idToken = session.id_token;
  next();
}

// Ambil initial dari nama (untuk avatar fallback)
function getInitial(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

// Buat warna gradient yang lebih gelap dari brand_color
function buildGradient(color) {
  if (!color) return "linear-gradient(135deg, #1f7a78 0%, #102a43 100%)";
  return `linear-gradient(135deg, ${color}cc 0%, ${color}66 100%)`;
}

// ─── Static: logo microdata ────────────────────────────────────────────────────

// Salin logo dari frontend/images jika belum ada
const logoSrc = path.join(
  __dirname,
  "../../..",
  "frontend/images/microdata-logo.webp",
);
const logoPublicDir = path.join(__dirname, "../public/images");
const logoDest = path.join(logoPublicDir, "microdata-logo.webp");

if (fs.existsSync(logoSrc) && !fs.existsSync(logoDest)) {
  fs.mkdirSync(logoPublicDir, { recursive: true });
  fs.copyFileSync(logoSrc, logoDest);
}

app.use("/images", express.static(logoPublicDir));

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET / — Halaman portal utama (harus login)
app.get("/", requireAuth, async (req, res) => {
  let apps = [];
  try {
    const result = await pool.query(
      `SELECT client_id, name, client_name, brand_color, app_url
       FROM clients
       WHERE app_url IS NOT NULL AND app_url <> ''
       ORDER BY id ASC`,
    );
    apps = result.rows;
  } catch (err) {
    console.error("Gagal mengambil daftar aplikasi:", err.message);
  }

  const user = req.user;

  // Render kartu untuk setiap aplikasi
  const cards = apps
    .map((app) => {
      const displayName = app.client_name || app.name || app.client_id;
      const initial = getInitial(displayName);
      const gradient = buildGradient(app.brand_color);
      const appUrl = app.app_url;

      return `
      <a href="${appUrl}" class="app-card" style="--card-gradient: ${gradient};">
        <div class="card-icon">
          <span>${initial}</span>
        </div>
        <div class="card-info">
          <h3>${displayName}</h3>
          <span class="card-open">Buka Aplikasi →</span>
        </div>
      </a>`;
    })
    .join("");

  const emptyState =
    apps.length === 0
      ? `<div class="empty-state">
          <p>🔍 Belum ada aplikasi yang terdaftar dengan URL aktif.</p>
          <p>Tambahkan <code>app_url</code> pada tabel <code>clients</code> di database SSO.</p>
        </div>`
      : "";

  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Portal Aplikasi | Microdata</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --ink: #102a43;
      --muted: #64748b;
      --paper: #f0f4f8;
      --white: #ffffff;
      --lime: #c5e86c;
      --teal: #1f7a78;
      --shadow-sm: 0 2px 8px rgba(16,42,67,0.08);
      --shadow-md: 0 8px 32px rgba(16,42,67,0.12);
      --shadow-hover: 0 20px 48px rgba(16,42,67,0.2);
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: var(--paper);
      font-family: 'Manrope', 'Segoe UI', sans-serif;
      color: var(--ink);
    }

    /* ── Topbar ── */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      height: 64px;
      background: var(--ink);
      box-shadow: var(--shadow-md);
    }

    .topbar-brand img {
      height: 38px;
      width: auto;
      object-fit: contain;
      filter: brightness(110%);
    }

    .topbar-user {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background: var(--lime);
      color: var(--ink);
      border-radius: 50%;
      font-size: 15px;
      font-weight: 800;
      flex-shrink: 0;
    }

    .user-name {
      color: #f0f4f8;
      font-size: 14px;
      font-weight: 600;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 8px;
      color: rgba(255,255,255,0.8);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 180ms ease;
      text-decoration: none;
    }
    .logout-btn:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.5);
      color: #fff;
    }

    /* ── Hero ── */
    .hero {
      padding: 56px 40px 32px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero h1 {
      margin: 0 0 6px;
      font-size: 28px;
      font-weight: 800;
      color: var(--ink);
    }

    .hero p {
      margin: 0;
      font-size: 15px;
      color: var(--muted);
    }

    .hero-divider {
      width: 48px;
      height: 3px;
      background: var(--lime);
      border-radius: 99px;
      margin: 16px 0 0;
    }

    /* ── App Grid ── */
    .section-label {
      max-width: 1200px;
      margin: 32px auto 16px;
      padding: 0 40px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }

    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 40px 60px;
    }

    /* ── App Card ── */
    .app-card {
      display: flex;
      flex-direction: column;
      background: var(--white);
      border-radius: 16px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      box-shadow: var(--shadow-sm);
      border: 1px solid rgba(16,42,67,0.07);
      transition: transform 240ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 240ms ease;
      cursor: pointer;
    }

    .app-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-hover);
    }

    .card-icon {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--card-gradient, linear-gradient(135deg, #1f7a78, #102a43));
    }

    .card-icon span {
      width: 56px;
      height: 56px;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      backdrop-filter: blur(4px);
    }

    .card-info {
      padding: 18px 20px 20px;
    }

    .card-info h3 {
      margin: 0 0 8px;
      font-size: 15px;
      font-weight: 700;
      color: var(--ink);
      line-height: 1.3;
    }

    .card-open {
      font-size: 12px;
      font-weight: 700;
      color: var(--teal);
      letter-spacing: 0.02em;
    }

    /* ── Empty State ── */
    .empty-state {
      max-width: 1200px;
      margin: 0 auto;
      padding: 60px 40px;
      text-align: center;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.8;
    }

    .empty-state code {
      background: #e8f0f7;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--teal);
    }

    /* ── Footer ── */
    .portal-footer {
      text-align: center;
      padding: 20px;
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid rgba(16,42,67,0.08);
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .topbar { padding: 0 20px; }
      .hero, .section-label, .apps-grid { padding-left: 20px; padding-right: 20px; }
      .apps-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
      .topbar-brand img { height: 30px; }
      .user-name { display: none; }
    }
  </style>
</head>
<body>

  <!-- Topbar -->
  <header class="topbar">
    <div class="topbar-brand">
      <img src="/images/microdata-logo.webp" alt="Microdata" />
    </div>
    <div class="topbar-user">
      <div class="user-avatar">${getInitial(user.name || user.sub)}</div>
      <span class="user-name">${user.name || user.sub}</span>
      <form method="POST" action="/logout" style="margin:0;">
        <button type="submit" class="logout-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </form>
    </div>
  </header>

  <!-- Hero -->
  <div class="hero">
    <h1>Selamat datang, ${user.name || user.sub}! 👋</h1>
    <p>Pilih aplikasi di bawah untuk mulai bekerja. Kamu tidak perlu login lagi di setiap aplikasi.</p>
    <div class="hero-divider"></div>
  </div>

  <!-- Section label -->
  <div class="section-label">Aplikasi yang Tersedia</div>

  <!-- Apps Grid -->
  <main class="apps-grid">
    ${cards}
    ${emptyState}
  </main>

  <!-- Footer -->
  <footer class="portal-footer">
    Microdata Identity Portal &middot; Sesi Anda terlindungi oleh Single Sign-On
  </footer>

</body>
</html>`);
});

// GET /login — Inisiasi OIDC flow
app.get("/login", (req, res) => {
  const forceLogin = getCookie(req, "portal_force_login") === "1";
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const state = crypto.randomBytes(8).toString("hex");

  pendingRequests.set(state, codeVerifier);

  const authUrl =
    `${IDP_ISSUER}/oidc/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid profile")}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&prompt=login`;

  if (forceLogin) {
    res.setHeader(
      "Set-Cookie",
      "portal_force_login=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/; SameSite=Lax",
    );
  }

  res.redirect(authUrl);
});

// GET /callback — Tukar code dengan token
app.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res
      .status(400)
      .send(`<p>Login gagal: <b>${error}</b> — ${error_description}</p>`);
  }

  const codeVerifier = pendingRequests.get(state);
  if (!codeVerifier) {
    return res
      .status(400)
      .send(
        "<p>State tidak dikenali atau sudah kedaluwarsa. Silakan coba lagi.</p>",
      );
  }
  pendingRequests.delete(state);

  try {
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );

    const tokenResponse = await fetch(`${IDP_ISSUER}/oidc/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res
        .status(400)
        .send(`<pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
    }

    const payload = decodeJwt(tokenData.id_token);

    const sessionId = crypto.randomBytes(16).toString("hex");
    sessions.set(sessionId, {
      id_token: tokenData.id_token,
      user: {
        sub: payload.sub,
        name: payload.name || payload.sub,
        email: payload.email,
      },
    });

    res.setHeader("Set-Cookie", `portal_sid=${sessionId}; HttpOnly; Path=/`);
    res.redirect("/");
  } catch (err) {
    res.status(500).send(`<p>Terjadi error: ${err.message}</p>`);
  }
});

// POST /logout — Hapus sesi lokal & redirect ke SSO logout
app.use(express.urlencoded({ extended: true }));
app.post("/logout", (req, res) => {
  const sid = getCookie(req, "portal_sid");
  const session = sid ? sessions.get(sid) : null;
  const idToken = session?.id_token;

  if (sid) sessions.delete(sid);
  res.setHeader("Set-Cookie", [
    "portal_sid=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/; SameSite=Lax",
    "portal_force_login=1; Max-Age=300; HttpOnly; Path=/; SameSite=Lax",
  ]);

  const logoutParams = new URLSearchParams({
    client_id: CLIENT_ID,
    post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
  });
  if (idToken) logoutParams.set("id_token_hint", idToken);

  const logoutUrl = `${IDP_ISSUER}/oidc/session/end?${logoutParams}`;

  res.redirect(logoutUrl);
});

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Portal Launcher berjalan di http://localhost:${PORT}`);
});
