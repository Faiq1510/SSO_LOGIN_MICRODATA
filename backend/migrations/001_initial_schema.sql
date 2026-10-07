CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  post_logout_redirect_uri TEXT,
  name TEXT NOT NULL,
  brand_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oidc_payloads (
  id TEXT NOT NULL,
  model TEXT NOT NULL,
  payload JSONB NOT NULL,
  grant_id TEXT,
  user_code TEXT,
  uid TEXT,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (id, model)
);

CREATE INDEX IF NOT EXISTS oidc_payloads_grant_id_idx
  ON oidc_payloads (grant_id);

CREATE INDEX IF NOT EXISTS oidc_payloads_uid_idx
  ON oidc_payloads (uid);

CREATE INDEX IF NOT EXISTS oidc_payloads_user_code_idx
  ON oidc_payloads (user_code);

CREATE INDEX IF NOT EXISTS oidc_payloads_expires_at_idx
  ON oidc_payloads (expires_at);