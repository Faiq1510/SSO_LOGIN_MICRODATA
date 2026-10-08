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
app.use(express.static(path.join(__dirname, "../public")));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Helper untuk metadata aplikasi (Icon SVG, Role, Deskripsi)
function getAppMetadata(app) {
  const name = (app.client_name || app.name || app.client_id || "").toLowerCase();

  if (name.includes("surat") || name.includes("arsip")) {
    return {
      category: "Website",
      roles: ["Admin", "Supervisor"],
      logoSvg: `<svg class="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
      brandTitle: "ARSIP SURAT",
      shortDesc: "Penomoran & Tata Kelola Surat"
    };
  } else if (name.includes("intern") || name.includes("pkl") || name.includes("microintern")) {
    return {
      category: "Website",
      roles: ["Admin", "Peserta"],
      logoSvg: `<svg class="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>`,
      brandTitle: "MICROINTERN PKL",
      shortDesc: "Portal Manajamen Magang & PKL"
    };
  } else if (name.includes("cpc") || name.includes("siteflow")) {
    return {
      category: "Website",
      roles: ["Admin", "Operator"],
      logoSvg: `<svg class="w-16 h-16 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`,
      brandTitle: "SITEFLOW CPC",
      shortDesc: "Logistik & Cash Processing Center"
    };
  } else if (name.includes("saims") || name.includes("inventaris") || name.includes("asset")) {
    return {
      category: "Website",
      roles: ["Admin", "Staff"],
      logoSvg: `<svg class="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
      brandTitle: "SAIMS INVENTARIS",
      shortDesc: "Peminjaman & Inventaris Aset"
    };
  }

  return {
    category: "Website",
    roles: ["Admin"],
    logoSvg: `<svg class="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    brandTitle: (app.client_name || app.name || app.client_id || "APLIKASI").toUpperCase(),
    shortDesc: "Aplikasi Terintegrasi SSO"
  };
}


function renderPortal({ cards, emptyState, user }) {
  const templatePath = path.join(__dirname, "../views/portal.html");
  return fs
    .readFileSync(templatePath, "utf8")
    .replaceAll("{{CARDS}}", cards)
    .replaceAll("{{EMPTY_STATE}}", emptyState)
    .replaceAll("{{USER_NAME}}", user.name || user.sub)
    .replaceAll("{{USER_EMAIL}}", user.email || "SSO Authenticated User");
}
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

  // Render kartu aplikasi dengan Microdata layout & Tailwind styling
  const cards = apps
    .map((app) => {
      const displayName = app.client_name || app.name || app.client_id;
      const meta = getAppMetadata(app);
      const appUrl = app.app_url;
      const roleBadges = meta.roles
        .map(r => `<span class="bg-white/15 text-white/90 text-[11px] font-medium px-2.5 py-0.5 rounded-md border border-white/10">${r}</span>`)
        .join(" ");

      return `
      <div class="app-card-item flex-shrink-0 w-[calc(100vw-3rem)] max-w-80 sm:w-80 md:w-72 snap-start group" data-category="${meta.category.toLowerCase()}" data-title="${displayName.toLowerCase()} ${meta.brandTitle.toLowerCase()} ${meta.shortDesc.toLowerCase()}">
        <div class="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-indigo-500/20 hover:border-white/30 flex flex-col h-full">
          <!-- Upper White Box Container for Logo -->
          <div class="h-44 bg-white p-6 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-slate-50 transition-colors">
            <div class="transform group-hover:scale-110 transition-transform duration-300">
              ${meta.logoSvg}
            </div>
            <div class="mt-3 font-extrabold text-sm tracking-widest text-slate-800 uppercase text-center truncate w-full px-2">
              ${meta.brandTitle}
            </div>
          </div>

          <!-- Lower Dark Glass Info & Actions -->
          <div class="p-5 flex-1 flex flex-col justify-between bg-slate-950/40 backdrop-blur-md">
            <div>
              <h3 class="text-white font-bold text-sm tracking-wide mb-1 uppercase truncate" title="${displayName}">
                ${displayName}
              </h3>
              <p class="text-xs text-slate-400 mb-3 line-clamp-1">${meta.shortDesc}</p>
              
              <!-- Roles Badges -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-slate-400 font-medium">Role:</span>
                ${roleBadges}
              </div>
            </div>

            <!-- Launch Button -->
            <a href="${appUrl}" class="app-launch mt-5 w-full flex items-center justify-between px-4 py-2.5 bg-white/10 hover:bg-indigo-600 border border-white/15 hover:border-indigo-400 rounded-xl text-xs font-semibold text-white transition-all duration-200 shadow-md group/btn">
              <span>Launch</span>
              <svg class="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const emptyState =
    apps.length === 0
      ? `<div class="w-full text-center py-16 text-slate-300 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          <p class="text-lg font-medium">🔍 Belum ada aplikasi yang terdaftar dengan URL aktif.</p>
          <p class="text-sm text-slate-400 mt-1">Tambahkan <code class="bg-white/10 px-2 py-0.5 rounded text-indigo-300">app_url</code> pada tabel <code class="bg-white/10 px-2 py-0.5 rounded text-indigo-300">clients</code> di database SSO.</p>
        </div>`
      : "";

  res.send(renderPortal({ cards, emptyState, user }));
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
