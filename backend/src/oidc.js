/** @format */

const { Provider } = require("oidc-provider");
const fs = require("fs");
const path = require("path");
const pool = require("./db");
const PostgresAdapter = require("./oidc-adapter");

const logoutTemplate = fs.readFileSync(
  path.join(__dirname, "../public/logout/logout.html"),
  "utf8",
);

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function renderLogoutPage(ctx, form) {
  return logoutTemplate
    .replace("__LOGOUT_HOST__", escapeHtml(ctx.host))
    .replace("__LOGOUT_FORM__", form);
}

async function createOidcProvider() {
  const result = await pool.query(
    "SELECT client_id, client_secret, redirect_uri, post_logout_redirect_uri FROM clients",
  );

  const clients = result.rows.map((row) => ({
    client_id: row.client_id,
    client_secret: row.client_secret,
    grant_types: ["authorization_code"],
    redirect_uris: [row.redirect_uri],
    post_logout_redirect_uris: row.post_logout_redirect_uri
      ? [row.post_logout_redirect_uri]
      : [],
    response_types: ["code"],
  }));

  const oidc = new Provider(process.env.ISSUER || "http://localhost:3000", {
    clients,
    adapter: PostgresAdapter,
    jwks: JSON.parse(process.env.OIDC_JWKS),
    cookies: {
      keys: [process.env.COOKIES_KEY],
      long: { signed: true, sameSite: "none", secure: true },
      short: { signed: true, sameSite: "none", secure: true },
    },
    claims: {
      openid: ["sub"],
      profile: ["name"],
    },

    interactions: {
      async url(ctx, interaction) {
        return `/oidc/interaction/${interaction.uid}`;
      },
    },

    async findAccount(ctx, sub) {
      const result = await pool.query(
        "SELECT id, name, email FROM users WHERE id = $1",
        [sub],
      );
      const user = result.rows[0];
      if (!user) return undefined;

      return {
        accountId: sub,
        async claims() {
          return {
            sub,
            name: user.name,
            email: user.email,
          };
        },
      };
    },

    features: {
      devInteractions: { enabled: false },
      rpInitiatedLogout: {
        enabled: true,
        logoutSource(ctx, form) {
          ctx.body = renderLogoutPage(ctx, form);
        },
      },
    },
  });

  oidc.proxy = true;

  oidc.on("server_error", (ctx, err) => {
    console.error("OIDC SERVER ERROR:", err);
  });

  return oidc;
}

module.exports = createOidcProvider;
