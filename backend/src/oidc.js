const { Provider } = require("oidc-provider");
const pool = require("./db");
const PostgresAdapter = require("./oidc-adapter");

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

  const oidc = new Provider("http://localhost:3000", {
    clients,
    adapter: PostgresAdapter,
    jwks: JSON.parse(process.env.OIDC_JWKS),
    cookies: {
      keys: [process.env.COOKIES_KEY],
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
    },
  });

  return oidc;
}

module.exports = createOidcProvider;
