const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");

function createInteractionRouter(oidc) {
  const router = express.Router();

  router.get("/interaction/:uid", async (req, res, next) => {
    try {
      const { uid, prompt } = await oidc.interactionDetails(req, res);

      if (prompt.name === "login") {
        res.send(`
          <html>
            <body style="font-family: sans-serif; max-width: 400px; margin: 100px auto;">
              <h2>Login</h2>
              <form method="post" action="/oidc/interaction/${uid}/login">
                <div><input type="text" name="username" placeholder="Username" required /></div>
                <div style="margin-top:10px">
                  <input type="password" name="password" placeholder="Password" required />
                </div>
                <button type="submit" style="margin-top:15px">Masuk</button>
              </form>
            </body>
          </html>
        `);
        return;
      }

      if (prompt.name === "consent") {
        res.send(`
          <html>
            <body style="font-family: sans-serif; max-width: 400px; margin: 100px auto;">
              <h2>Izinkan Akses</h2>
              <p>Aplikasi meminta akses ke profil dasar kamu.</p>
              <form method="post" action="/oidc/interaction/${uid}/confirm">
                <button type="submit">Setujui</button>
              </form>
            </body>
          </html>
        `);
        return;
      }

      next(new Error("Prompt tidak dikenal"));
    } catch (err) {
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
          return res.send(`
            <html>
              <body style="font-family: sans-serif; max-width: 400px; margin: 100px auto;">
                <h2>Login</h2>
                <p style="color:red;">Username atau password salah.</p>
                <form method="post" action="/oidc/interaction/${uid}/login">
                  <div><input type="text" name="username" placeholder="Username" required /></div>
                  <div style="margin-top:10px">
                    <input type="password" name="password" placeholder="Password" required />
                  </div>
                  <button type="submit" style="margin-top:15px">Masuk</button>
                </form>
              </body>
            </html>
          `);
        }

        const loginResult = {
          login: { accountId: String(user.id) },
        };
        await oidc.interactionFinished(req, res, loginResult, {
          mergeWithLastSubmission: false,
        });
      } catch (err) {
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
      next(err);
    }
  });

  return router;
}

module.exports = createInteractionRouter;
