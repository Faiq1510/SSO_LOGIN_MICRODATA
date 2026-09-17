/** @format */

const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const loginTemplate = fs.readFileSync(
  path.join(__dirname, "../public/login/login.html"),
  "utf8",
);
const consentTemplate = fs.readFileSync(
  path.join(__dirname, "../public/consent/consent.html"),
  "utf8",
);

function renderLoginPage(uid, showError = false) {
  return loginTemplate
    .replace("__LOGIN_ACTION__", `/oidc/interaction/${uid}/login`)
    .replace(
      '<div class="alert" role="alert" aria-live="polite" hidden>',
      `<div class="alert" role="alert" aria-live="polite"${showError ? "" : " hidden"}>`,
    );
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
  return err?.name === "SessionNotFound" || err?.message?.includes("SessionNotFound");
}

function createInteractionRouter(oidc) {
  const router = express.Router();

  router.get("/interaction/:uid", async (req, res, next) => {
    try {
      const { uid, prompt } = await oidc.interactionDetails(req, res);

      if (prompt.name === "login") {
        res.send(renderLoginPage(uid));
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

        const result = await pool.query(
          "SELECT id, password_hash FROM users WHERE username = $1",
          [username],
        );
        const user = result.rows[0];

        const passwordMatches = user
          ? await bcrypt.compare(password, user.password_hash)
          : await bcrypt.compare(password, "$2b$10$invalidsaltinvalidsaltin");

        if (!user || !passwordMatches) {
          return res.send(renderLoginPage(uid, true));
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
