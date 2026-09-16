const pool = require("./db");

class PostgresAdapter {
  constructor(name) {
    this.model = name;
  }

  async upsert(id, payload, expiresIn) {
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    await pool.query(
      `INSERT INTO oidc_payloads (id, model, payload, grant_id, user_code, uid, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id, model) DO UPDATE
       SET payload = $3, grant_id = $4, user_code = $5, uid = $6, expires_at = $7`,
      [
        id,
        this.model,
        payload,
        payload.grantId || null,
        payload.userCode || null,
        payload.uid || null,
        expiresAt,
      ],
    );
  }

  async find(id) {
    const result = await pool.query(
      `SELECT payload FROM oidc_payloads
       WHERE id = $1 AND model = $2 AND (expires_at IS NULL OR expires_at > NOW())`,
      [id, this.model],
    );
    return result.rows[0]?.payload;
  }

  async findByUid(uid) {
    const result = await pool.query(
      `SELECT payload FROM oidc_payloads
       WHERE uid = $1 AND model = $2 AND (expires_at IS NULL OR expires_at > NOW())`,
      [uid, this.model],
    );
    return result.rows[0]?.payload;
  }

  async findByUserCode(userCode) {
    const result = await pool.query(
      `SELECT payload FROM oidc_payloads
       WHERE user_code = $1 AND model = $2 AND (expires_at IS NULL OR expires_at > NOW())`,
      [userCode, this.model],
    );
    return result.rows[0]?.payload;
  }

  async consume(id) {
    await pool.query(
      `UPDATE oidc_payloads
       SET payload = jsonb_set(payload, '{consumed}', to_jsonb(extract(epoch from now())::int))
       WHERE id = $1 AND model = $2`,
      [id, this.model],
    );
  }

  async destroy(id) {
    await pool.query(`DELETE FROM oidc_payloads WHERE id = $1 AND model = $2`, [
      id,
      this.model,
    ]);
  }

  async revokeByGrantId(grantId) {
    await pool.query(`DELETE FROM oidc_payloads WHERE grant_id = $1`, [
      grantId,
    ]);
  }
}

module.exports = PostgresAdapter;
