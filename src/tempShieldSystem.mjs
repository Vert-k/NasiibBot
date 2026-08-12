

















































import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});









export const TEMP_SHIELD_EMOJI = "🛟";


export const TEMP_SHIELD_TYPES = Object.freeze({
  LOTTERY: "lottery_temp",
  REFUND:  "refund_temp",
});

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;


async function initTempShieldTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS temp_shields (
      user_id    TEXT PRIMARY KEY,
      expires_at BIGINT NOT NULL,
      type       TEXT NOT NULL,
      granted_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_temp_shields_expires ON temp_shields(expires_at)`
  );
  console.log("[TEMP_SHIELD] ✅ Table ready.");
}















export async function giveShield(userId, durationMs, type) {
  if (!userId) throw new Error("giveShield: userId is required");
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error("giveShield: durationMs must be a positive number");
  }
  const now           = Date.now();
  const candidateExp  = now + durationMs;


  const r = await pool.query(
    `
    INSERT INTO temp_shields (user_id, expires_at, type, granted_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE
      SET expires_at = GREATEST(temp_shields.expires_at, EXCLUDED.expires_at),
          type       = CASE
                         WHEN EXCLUDED.expires_at > temp_shields.expires_at
                         THEN EXCLUDED.type
                         ELSE temp_shields.type
                       END,
          granted_at = CASE
                         WHEN EXCLUDED.expires_at > temp_shields.expires_at
                         THEN EXCLUDED.granted_at
                         ELSE temp_shields.granted_at
                       END
    RETURNING expires_at, type
    `,
    [userId, candidateExp, type, now]
  );

  const effectiveExp  = Number(r.rows[0].expires_at);
  const effectiveType = r.rows[0].type;
  const kept          = effectiveExp !== candidateExp;

  return { expiresAt: effectiveExp, type: effectiveType, kept };
}





export async function hasActiveTempShield(userId) {
  if (!userId) return false;
  const r = await pool.query(
    `SELECT 1 FROM temp_shields WHERE user_id = $1 AND expires_at > $2 LIMIT 1`,
    [userId, Date.now()]
  );
  return r.rowCount > 0;
}





export async function getActiveTempShield(userId) {
  if (!userId) return null;
  const r = await pool.query(
    `SELECT user_id, expires_at, type, granted_at
       FROM temp_shields
      WHERE user_id = $1 AND expires_at > $2`,
    [userId, Date.now()]
  );
  if (r.rowCount === 0) return null;
  return {
    userId:    r.rows[0].user_id,
    expiresAt: Number(r.rows[0].expires_at),
    type:      r.rows[0].type,
    grantedAt: Number(r.rows[0].granted_at),
  };
}





export async function clearTempShield(userId) {
  if (!userId) return;
  await pool.query(`DELETE FROM temp_shields WHERE user_id = $1`, [userId]);
}




export async function clearExpiredTempShields() {
  await pool.query(`DELETE FROM temp_shields WHERE expires_at <= $1`, [Date.now()]);
}






export function formatShieldRemaining(ms) {
  if (ms <= 0) return "0 daqiiqo";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const parts = [];
  if (h > 0) parts.push(`${h} saac`);
  if (m > 0) parts.push(`${m} daqiiqo`);
  return parts.length ? parts.join(" ") : "in ka yar 1 daqiiqo";
}


let _started = false;





export async function setupTempShieldSystem() {
  await initTempShieldTables();
  if (_started) return;
  _started = true;

  setInterval(() => {
    clearExpiredTempShields().catch((e) =>
      console.error("[TEMP_SHIELD] sweeper error:", e)
    );
  }, SWEEP_INTERVAL_MS);

  console.log("[TEMP_SHIELD] ✅ Auto-shield system is online.");
}
