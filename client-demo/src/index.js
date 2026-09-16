const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = 4000;

// ==== Konfigurasi, sesuai yang terdaftar di backend/src/oidc.js ====
const IDP_ISSUER = "http://localhost:3000";
const CLIENT_ID = "client-dummy";
const CLIENT_SECRET = "secret-dummy";
const REDIRECT_URI = "http://localhost:4000/callback";
const SCOPE = "openid profile";

const pendingRequests = new Map();
const sessions = new Map(); // sessionId -> id_token

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; max-width: 400px; margin: 100px auto; text-align: center;">
        <h2>Web Perusahaan A (Demo)</h2>
        <p>Tidak ada form login di sini.</p>
        <a href="/login">
          <button style="padding: 10px 20px;">Login dengan SSO Perusahaan</button>
        </a>
      </body>
    </html>
  `);
});

app.get("/login", (req, res) => {
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
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&state=${state}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&prompt=login`;

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res
      .status(400)
      .send(`<p>Login gagal: ${error} - ${error_description}</p>`);
  }

  const codeVerifier = pendingRequests.get(state);
  if (!codeVerifier) {
    return res
      .status(400)
      .send("<p>State tidak dikenali atau sudah kedaluwarsa.</p>");
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

    const payload = JSON.parse(
      Buffer.from(tokenData.id_token.split(".")[1], "base64url").toString(),
    );

    // Simpan id_token ke sesi supaya bisa dipakai lagi saat logout
    const sessionId = crypto.randomBytes(16).toString("hex");
    sessions.set(sessionId, tokenData.id_token);
    res.setHeader("Set-Cookie", `sid=${sessionId}; HttpOnly; Path=/`);

    res.send(`
      <html>
        <body style="font-family: sans-serif; max-width: 500px; margin: 100px auto;">
          <h2>Login berhasil!</h2>
          <p>Kamu login sebagai: <b>${payload.sub}</b></p>
          <p>Berlaku sampai: ${new Date(payload.exp * 1000).toLocaleString()}</p>
          <hr />
          <p>Access token (dipotong): <code>${tokenData.access_token.slice(0, 20)}...</code></p>
          <p><a href="/">Kembali ke beranda</a> | <a href="/logout">Logout</a></p>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`<p>Terjadi error: ${err.message}</p>`);
  }
});

app.get("/logout", (req, res) => {
  const sessionId = getCookie(req, "sid");
  const idToken = sessions.get(sessionId);
  sessions.delete(sessionId);
  res.setHeader("Set-Cookie", "sid=; Max-Age=0; Path=/");

  if (!idToken) {
    return res.redirect("/");
  }

  const logoutUrl =
    `${IDP_ISSUER}/oidc/session/end?` +
    `id_token_hint=${idToken}` +
    `&post_logout_redirect_uri=${encodeURIComponent("http://localhost:4000/")}`;

  res.redirect(logoutUrl);
});

app.listen(PORT, () => {
  console.log(`Client demo berjalan di http://localhost:${PORT}`);
});
