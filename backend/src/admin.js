const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("./db");

const router = express.Router();
router.use(express.json());

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000; // 8 jam

function sign(value) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("hex");
}

function createSessionToken(username) {
  const payload = JSON.stringify({
    username,
    exp: Date.now() + SESSION_MAX_AGE,
  });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifySessionToken(token) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function requireAdminSession(req, res, next) {
  const session = verifySessionToken(getCookie(req, "admin_session"));
  if (!session) {
    return res
      .status(401)
      .json({ error: "Belum login atau sesi kedaluwarsa." });
  }
  req.admin = session;
  next();
}

// =========================================================================
// LOGIN & LOGOUT (route ini TIDAK dilindungi requireAdminSession)
// =========================================================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      "SELECT password_hash FROM admin_users WHERE username = $1",
      [username],
    );
    const admin = result.rows[0];

    const passwordMatches = admin
      ? await bcrypt.compare(password, admin.password_hash)
      : await bcrypt.compare(password, "$2b$10$invalidsaltinvalidsaltin");

    if (!admin || !passwordMatches) {
      return res.status(401).json({ error: "Username atau password salah." });
    }

    const token = createSessionToken(username);
    res.setHeader(
      "Set-Cookie",
      `admin_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE / 1000}`,
    );
    res.json({ message: "Login berhasil", username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", "admin_session=; Max-Age=0; Path=/");
  res.json({ message: "Logout berhasil" });
});

router.get("/me", requireAdminSession, (req, res) => {
  res.json({ username: req.admin.username });
});

// =========================================================================
// Mulai dari sini, SEMUA route di bawah wajib login
// =========================================================================
router.use(requireAdminSession);

// =========================================================================
// 1. MANAGEMENT USER (tidak berubah dari sebelumnya)
// =========================================================================

router.post("/users", async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !password || !name || !email) {
      return res.status(400).json({
        error: "Semua field (username, password, name, email) wajib diisi.",
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, name, email) VALUES ($1, $2, $3, $4) RETURNING id, username, name, email",
      [username, passwordHash, name, email],
    );
    res
      .status(201)
      .json({ message: "User berhasil ditambahkan", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Username atau Email sudah terdaftar." });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, name, email, created_at FROM users ORDER BY id DESC",
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: `User dengan ID ${req.params.id} berhasil dihapus` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. MANAGEMENT CLIENT (tidak berubah dari sebelumnya)
// =========================================================================

router.post("/clients", async (req, res) => {
  try {
    const {
      client_id,
      name,
      redirect_uri,
      post_logout_redirect_uri,
      brand_color,
    } = req.body;
    if (!client_id || !name || !redirect_uri) {
      return res
        .status(400)
        .json({ error: "client_id, name, dan redirect_uri wajib diisi." });
    }
    const clientSecret =
      req.body.client_secret || crypto.randomBytes(32).toString("hex");
    const result = await pool.query(
      `INSERT INTO clients (client_id, client_secret, redirect_uri, post_logout_redirect_uri, name, brand_color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, client_id, name, redirect_uri, post_logout_redirect_uri, brand_color`,
      [
        client_id,
        clientSecret,
        redirect_uri,
        post_logout_redirect_uri || null,
        name,
        brand_color || null,
      ],
    );
    res.status(201).json({
      message: "Client aplikasi berhasil didaftarkan",
      client: result.rows[0],
      client_secret: clientSecret,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "client_id sudah digunakan." });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get("/clients", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, client_id, name, redirect_uri, post_logout_redirect_uri, brand_color, created_at FROM clients ORDER BY id ASC",
    );
    res.json({ clients: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/clients/:client_id", async (req, res) => {
  try {
    await pool.query("DELETE FROM clients WHERE client_id = $1", [
      req.params.client_id,
    ]);
    res.json({ message: `Client ${req.params.client_id} berhasil dihapus` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
