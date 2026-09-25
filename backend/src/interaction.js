/** @format */

const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const DEFAULT_ACCENT = "#ee6c4d";
const DEFAULT_ACCENT_DARK = "#d65338";

const getTemplatePath = (relativePath) => {
  const publicPath = path.join(__dirname, "../public", relativePath);
  if (fs.existsSync(publicPath)) return publicPath;
  return path.join(__dirname, "../../frontend", relativePath);
};

const loginTemplate = fs.readFileSync(
  getTemplatePath("login/login.html"),
  "utf8",
);
const consentTemplate = fs.readFileSync(
  getTemplatePath("consent/consent.html"),
  "utf8",
);

function darkenHex(hex, percent = 0.1) {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) - Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) - Math.round(255 * percent);
  let b = (num & 0x0000ff) - Math.round(255 * percent);
  r = Math.max(0, r);
  g = Math.max(0, g);
  b = Math.max(0, b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

async function renderLoginPage(uid, clientId, showError = false) {
  const result = await pool.query(
    "SELECT brand_color FROM clients WHERE client_id = $1",
    [clientId],
  );
  const accent = result.rows[0]?.brand_color || DEFAULT_ACCENT;
  const accentDark = darkenHex(accent);

  return loginTemplate
    .replace("__LOGIN_ACTION__", `/oidc/interaction/${uid}/login`)
    .replace(
      '<div class="alert" role="alert" aria-live="polite" hidden>',
      `<div class="alert" role="alert" aria-live="polite"${showError ? "" : " hidden"}>`,
    )
    .replace("__ACCENT__", accent)
    .replace("__ACCENT_DARK__", accentDark);
}

function renderConsentPage(uid) {
  return consentTemplate.replace(
    "__CONSENT_ACTION__",
    `/oidc/interaction/${uid}/confirm`,
  );
}

function renderExpiredInteractionPage() {
  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sesi Berakhir | microdata</title>
        <link rel="stylesheet" href="/consent/consent.css" />
      </head>
      <body>
        <main class="consent-shell">
          <header class="topbar">
            <div class="brand-lockup">
              <span class="brand-mark" aria-hidden="true">m</span>
              <span class="brand-name">microdata</span>
            </div>
          </header>
          <section class="consent-card expired-card">
            <div class="icon-orbit" aria-hidden="true"><div class="app-icon">!</div></div>
            <p class="eyebrow">SESSION ENDED</p>
            <h1>Sesi sudah berakhir</h1>
            <p class="intro">Permintaan login ini sudah digunakan atau kedaluwarsa. Mulai login dari aplikasi kembali.</p>
          </section>
        </main>
      </body>
    </html>
  `;
}

function isExpiredInteractionError(err) {
  return (
    err?.name === "SessionNotFound" || err?.message?.includes("SessionNotFound")
  );
}

function createInteractionRouter(oidc) {
  const router = express.Router();

  router.get("/interaction/:uid", async (req, res, next) => {
    try {
      const { uid, prompt, params } = await oidc.interactionDetails(req, res);

      if (prompt.name === "login") {
        res.send(await renderLoginPage(uid, params.client_id));
        return;
      }

      if (prompt.name === "consent") {
        res.send(renderConsentPage(uid));
        return;
      }

      next(new Error("Prompt tidak dikenal"));
    } catch (err) {
      if (isExpiredInteractionError(err)) {
        return res.status(400).send(renderExpiredInteractionPage());
      }
      next(err);
    }
  });

  router.post(
    "/interaction/:uid/login",
    express.urlencoded({ extended: true }),
    async (req, res, next) => {
      try {
        const { username, password } = req.body;
        const { uid } = req.params;
        const { params } = await oidc.interactionDetails(req, res);

        const result = await pool.query(
          "SELECT id, password_hash FROM users WHERE username = $1",
          [username],
        );
        const user = result.rows[0];

        const passwordMatches = user
          ? await bcrypt.compare(password, user.password_hash)
          : await bcrypt.compare(password, "$2b$10$invalidsaltinvalidsaltin");

        if (!user || !passwordMatches) {
          return res.send(await renderLoginPage(uid, params.client_id, true));
        }

        const loginResult = {
          login: { accountId: String(user.id) },
        };
        await oidc.interactionFinished(req, res, loginResult, {
          mergeWithLastSubmission: false,
        });
      } catch (err) {
        if (isExpiredInteractionError(err)) {
          return res.status(400).send(renderExpiredInteractionPage());
        }
        next(err);
      }
    },
  );

  router.post("/interaction/:uid/confirm", async (req, res, next) => {
    try {
      const { params, session } = await oidc.interactionDetails(req, res);

      const grant = new oidc.Grant({
        accountId: session.accountId,
        clientId: params.client_id,
      });
      grant.addOIDCScope("openid profile");
      const grantId = await grant.save();

      const result = { consent: { grantId } };
      await oidc.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true,
      });
    } catch (err) {
      if (isExpiredInteractionError(err)) {
        return res.status(400).send(renderExpiredInteractionPage());
      }
      next(err);
    }
  });

  return router;
}

module.exports = createInteractionRouter;
