















import pg from "pg";
import { addVaultEarning } from "./vault.mjs";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";




import { sendLevel4Intro, sendLevel4MainUI } from "./bankLevel4.mjs";

const { Pool } = pg;

async function bankSafeSend(channel, payload) {
  try {
    if (!channel || typeof channel.send !== "function") return null;
    if (channel.guild) {
      const me = channel.guild.members?.me;
      if (me) {
        const perms = channel.permissionsFor(me);
        if (!perms || !perms.has("SendMessages") || !perms.has("ViewChannel") || !perms.has("EmbedLinks")) {
          console.log(`[BANK PERM CHECK FAILED] Missing permissions in channel ${channel.id}`);
          return null;
        }
      }
    }
    return await channel.send(payload);
  } catch (err) {
    if (err.code === 50013) {
      console.log(`[BANK PERM ERROR] Cannot send message in channel ${channel.id}`);
    } else {
      console.error(`[BANK SEND ERROR] channel ${channel.id}:`, err.message);
    }
    return null;
  }
}

function bankParseUserAndAmount(args, message) {
  let user = message.mentions.users.first() || null;
  let amount = null;
  for (const a of args) {
    if (a.startsWith("<@") && a.endsWith(">")) continue;
    const n = parseInt(a.replace(/,/g, ""), 10);
    if (!isNaN(n) && isFinite(n) && amount === null) amount = n;
  }
  const firstIsMention = (args[0] || "").startsWith("<@");


  const corrected = !!(user && amount !== null && !firstIsMention);
  return { user, amount, corrected };
}

function bankSmartEmbed(lines, color = 0xe74c3c) {
  return new EmbedBuilder().setDescription(lines.join("\n")).setColor(color);
}

function bankUsageEmbed(format, example, extra) {
  const lines = [
    "❌ **Habka ayaa khaldan**",
    "",
    "📌 **Habka saxda ah:**",
    `\`${format}\``,
    "",
    "📝 **Tusaale:**",
    `\`${example}\``,
  ];
  if (extra) lines.push("", extra);
  return bankSmartEmbed(lines);
}

function bankCorrectedEmbed(correctedCmd) {
  return bankSmartEmbed([
    "💡 **Amarka waa la saxay:**",
    "",
    `✅ \`${correctedCmd}\``,
  ], 0x3498db);
}

function bankLevelGateEmbed(required, current) {
  return bankSmartEmbed([
    `❌ **Atleast waa in aa tahay Level ${required}**`,
    "",
    `📊 Levelkaaga hadda: **${current}**`,
    "",
    "🎮 **Ciyaar si aad level u kordhiso:**",
    "• `!sheeko`",
    "• `!miino`",
    "• `!work`",
    "• `!daily`",
    "",
    `💡 Gaadh Level ${required} si aad amarka u isticmaasho.`,
  ]);
}

function bankNotEnoughEmbed(have, cmd) {
  const lines = [
    "❌ **Ma haysatid coins kugu filan**",
    "",
    `💰 Haysato: **${have.toLocaleString()}** coins`,
  ];
  const suggest = Math.floor(have * 0.5);
  if (suggest >= 100) {
    lines.push("", "💡 **Isku day:**", `\`${cmd} ${suggest}\``);
  } else {
    lines.push("", "🎮 **Coins ku hel:**", "• `!work` · `!daily` · `!vote`", "• `!cf` · `!slots` · `!rob`");
  }
  return bankSmartEmbed(lines);
}



const BANK_OPEN_COST_COINS    = 5_000;
const BANK_OPEN_COST_DIAMONDS = 250;
const MIN_LEVEL_OPEN          = 15;
const MIN_LEVEL_USE           = 5;
const MIN_ACCOUNT_DAYS        = 3;
const MIN_WITHDRAW            = 100;
const WITHDRAW_CD_MS          = 10 * 60 * 1_000;
const DEPOSIT_CD_MS           = 5_000;
const UPGRADE_CD_MS           = 60_000;
const DEPOSIT_TAX             = 0.02;
const DEPOSIT_TAX_BOT         = 0.01;
const DEPOSIT_TAX_OWNER       = 0.01;



const WITHDRAW_OWNER_RATES    = { 1: 0.05, 2: 0.06, 3: 0.07, 4: 0.07 };
const WITHDRAW_BOT            = 0.03;



const WITHDRAW_BOT_RATES      = { 4: 0.04 };
const MAX_PROFIT_PER_HOUR     = { 1: 83, 2: 208, 3: 417 };
const MAX_TX_STORED           = 30;
const PROFIT_INTERVAL_MS      = 60 * 60 * 1_000;
const MIN_DEPOSIT             = 1;
const MAX_DEPOSIT_PER_USER    = 100_000;
const BANK_PASS_COST          = 10_000;
const BANK_PASS_EXTRA         = 50_000;
const BANK_PASS_BOT_CUT       = 0.95;
const BANK_PASS_OWNER_CUT     = 0.05;







const BANK_CAPS    = { 1: 50_000,  2: 200_000, 3: 500_000, 4: 1_000_000 };
const BANK_TOTAL_CAPS = { 1: 70_000, 2: 270_000, 3: 610_000, 4: 1_500_000 };
const PROFIT_RATES = { 1: 0.001,   2: 0.0005,  3: 0.00075 };
const OWNER_DAILY_RATES = { 1: 0.001, 2: 0.0015, 3: 0.002 };

const UPGRADE_COSTS = {
  2: { coins: 30_000,  diamonds: 500, minBalance: 50_000  },
  3: { coins: 100_000, diamonds: 600, minBalance: 200_000 },
};



const SEASON_CHANNEL_IDS = ["1489995748618534912", "1490363808621920348", "1505617307563589702"];


const SEASON_REWARDS = [
  { coins: 5_000, diamonds: 150 },
  { coins: 3_000, diamonds: 100 },
  { coins: 1_000, diamonds: 50  },
];

const SEASON_MEDALS = ["🥇", "🥈", "🥉"];



const BANK_ACTIVITY_CHANNEL_IDS = ["1490591961684377731", "1483393273308643338"];


const MAX_COMBINED_MULT        = 2.0;
const MAX_INVEST_CLAIM         = 1_500;
const COIN_BURN_RATE           = 0.02;
const MIN_INVEST_FOR_DIVERSITY = 500;
const MIN_HOLD_FOR_BANKRUN_MS  = 24 * 60 * 60 * 1000;


const BANK_RUN_WINDOW_MS   = 2  * 60 * 60 * 1000;
const BANK_RUN_TRIGGER     = 3;
const BANK_RUN_BASE_MS     = 6  * 60 * 60 * 1000;
const BANK_RUN_EXTEND_MS   = 2  * 60 * 60 * 1000;
const BANK_RUN_MAX_MS      = 12 * 60 * 60 * 1000;


const CHAMPION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;



const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});





const _bankNwCache = new Map();
const _BANK_NW_TTL = 30_000;

async function bankNwCapBlocked(discordId, incomingCoins = 0) {
  try {
    const now    = Date.now();
    const cached = _bankNwCache.get(discordId);
    let nw, verified;
    if (cached && (now - cached.at) < _BANK_NW_TTL) {
      nw = cached.nw;  verified = cached.verified;
    } else {
      const r = await pool.query(
        `SELECT COALESCE(p.coins,0)
          + COALESCE(CAST(p.game_stats->'invest'->>'amount' AS BIGINT),0)
          + COALESCE(bu.total_deposited,0)
          + COALESCE(bu.total_profit,0)
          + COALESCE(bi.total_bankinvest,0) AS net_worth,
          COALESCE(p.is_verified,false) AS is_verified
         FROM players p
         LEFT JOIN (SELECT user_id, SUM(deposited) AS total_deposited, SUM(profit) AS total_profit
                    FROM bank_users GROUP BY user_id) bu ON bu.user_id = p.discord_id
         LEFT JOIN (SELECT user_id, SUM(amount) AS total_bankinvest
                    FROM bank_investments GROUP BY user_id) bi ON bi.user_id = p.discord_id
         WHERE p.discord_id = $1`,
        [discordId]
      );
      if (!r.rows[0]) return false;
      nw       = Number(r.rows[0].net_worth || 0);
      verified = r.rows[0].is_verified === true;
      _bankNwCache.set(discordId, { nw, verified, at: now });
    }
    return !verified && nw + incomingCoins >= 1_000_000;
  } catch { return false; }
}




function queryWithTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB Timeout")), ms)
    ),
  ]);
}


let activeQueries = 0;
const MAX_QUERIES = 5;

async function safeQuery(fn) {
  while (activeQueries >= MAX_QUERIES) {
    await new Promise(r => setTimeout(r, 50));
  }
  activeQueries++;
  try {
    return await fn();
  } finally {
    activeQueries--;
  }
}


let balanceCache = {};

function addBalanceCache(userId, amount) {
  if (!balanceCache[userId]) balanceCache[userId] = 0;
  balanceCache[userId] += amount;
}

async function flushBalanceCache() {

  if (Object.keys(balanceCache).length === 0) return;
  const snapshot = balanceCache;
  balanceCache = {};
  for (const userId in snapshot) {
    const amount = snapshot[userId];
    try {
      await safeQuery(() =>
        queryWithTimeout(
          pool.query(
            "UPDATE players SET coins = coins + $1 WHERE discord_id = $2",
            [amount, userId]
          )
        )
      );
    } catch (err) {
      console.error("[BANK] Balance flush error for", userId, err.message);

      addBalanceCache(userId, amount);
    }
  }
}

setInterval(flushBalanceCache, 5000);


let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  if (now - lastTick > 10_000) {
    console.log("[BANK] ⚠️ EVENT LOOP BLOCKED — bot may be unresponsive");
  }
  lastTick = now;
}, 2000);



let discordClient = null;




const pendingBankName   = new Map();
const depositCooldowns  = new Map();
const withdrawCooldowns = new Map();
const upgradeCooldowns  = new Map();



async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banks (
      owner_id   TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL UNIQUE,
      level      INTEGER NOT NULL DEFAULT 1,
      created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_users (
      bank_owner_id TEXT   NOT NULL,
      user_id       TEXT   NOT NULL,
      deposited     BIGINT NOT NULL DEFAULT 0,
      profit        BIGINT NOT NULL DEFAULT 0,
      last_active   BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
      last_withdraw BIGINT,
      PRIMARY KEY (bank_owner_id, user_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id            SERIAL  PRIMARY KEY,
      bank_owner_id TEXT    NOT NULL,
      user_id       TEXT    NOT NULL,
      type          TEXT    NOT NULL,
      amount        BIGINT  NOT NULL,
      note          TEXT,
      created_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_investments (
      user_id       TEXT   NOT NULL,
      bank_owner_id TEXT   NOT NULL,
      amount        BIGINT NOT NULL DEFAULT 0,
      last_claim    BIGINT NOT NULL DEFAULT 0,
      deposited_at  BIGINT NOT NULL DEFAULT 0,
      total_earned  BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, bank_owner_id)
    );
  `);
  await pool.query(`ALTER TABLE bank_users ADD COLUMN IF NOT EXISTS has_bank_pass BOOLEAN DEFAULT FALSE`);


  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS bank_run_until        BIGINT  DEFAULT NULL`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS bank_run_window_start  BIGINT  DEFAULT NULL`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS bank_run_count         INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS bank_run_users         TEXT[]  NOT NULL DEFAULT '{}'`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS panic_level            INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS last_invest_activity   BIGINT  DEFAULT NULL`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS champion_rank          INTEGER DEFAULT NULL`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS champion_until         BIGINT  DEFAULT NULL`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS weekly_bank_score      BIGINT  NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE bank_investments ADD COLUMN IF NOT EXISTS last_action BIGINT NOT NULL DEFAULT 0`);

  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS last_wallet_activity BIGINT DEFAULT NULL`);


  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_earnings (
      user_id TEXT PRIMARY KEY,
      amount  BIGINT NOT NULL DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);




  await pool.query(`CREATE INDEX IF NOT EXISTS idx_bank_users_owner   ON bank_users(bank_owner_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_bank_users_user    ON bank_users(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_bank_inv_owner     ON bank_investments(bank_owner_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_bank_inv_user      ON bank_investments(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_bank_tx_owner_time ON bank_transactions(bank_owner_id, id DESC)`);
  console.log("[BANK] ✅ Tables and indexes ready.");
}



function fmt(n) {
  return Math.floor(n).toLocaleString();
}

function levelStars(lvl) {
  return "⭐".repeat(Math.max(1, Math.min(4, lvl)));
}

async function getPlayer(discordId) {
  const r = await pool.query(
    `SELECT discord_id, coins, diamonds, level FROM players WHERE discord_id = $1`,
    [discordId]
  );
  return r.rows[0] || null;
}

async function getBank(ownerId) {
  const r = await pool.query(`SELECT * FROM banks WHERE owner_id = $1`, [ownerId]);
  return r.rows[0] || null;
}

async function getBankByName(name) {
  const r = await pool.query(`SELECT * FROM banks WHERE LOWER(name) = LOWER($1)`, [name]);
  return r.rows[0] || null;
}

async function getBankUser(bankOwnerId, userId) {
  const r = await pool.query(
    `SELECT * FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2`,
    [bankOwnerId, userId]
  );
  return r.rows[0] || null;
}

async function getBankTotal(bankOwnerId) {
  const r = await pool.query(
    `SELECT COALESCE(SUM(deposited + profit), 0) AS total FROM bank_users WHERE bank_owner_id = $1`,
    [bankOwnerId]
  );
  return parseInt(r.rows[0]?.total || "0", 10);
}

async function getBankUserCount(bankOwnerId) {
  const r = await pool.query(
    `SELECT COUNT(*) AS cnt FROM bank_users WHERE bank_owner_id = $1 AND deposited > 0`,
    [bankOwnerId]
  );
  return parseInt(r.rows[0]?.cnt || "0", 10);
}



async function sendBankActivityMessage(embed) {
  for (const channelId of BANK_ACTIVITY_CHANNEL_IDS) {
    try {
      const ch = discordClient?.channels?.cache?.get(channelId);
      if (ch) {
        const sentMsg = await bankSafeSend(ch, { embeds: [embed] });
        if (sentMsg) {
          try {
            await sentMsg.startThread({
              name: "💬 Bank Update — halkan ku hadal",
              autoArchiveDuration: 1440,
              reason: "Bank activity announcement thread",
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error(`[BANK] Activity channel send error (${channelId}):`, err.message);
    }
  }
}






const _healthCache = new Map();
const _HEALTH_TTL  = 30_000;

async function calcBankHealthScore(ownerId, bankData) {
  const now = Date.now();


  const cached = _healthCache.get(ownerId);
  if (cached && (now - cached.at) < _HEALTH_TTL) return cached.data;


  const cap      = BANK_CAPS[bankData.level] || 50_000;
  const totalRes = await pool.query(
    `SELECT COALESCE(SUM(deposited + profit), 0) AS total FROM bank_users WHERE bank_owner_id = $1`,
    [ownerId]
  );
  const total   = Number(totalRes.rows[0]?.total || 0);
  const fillPct = cap > 0 ? (total / cap) * 100 : 0;
  let fillPts;
  if (fillPct <= 70)      fillPts = 25;
  else if (fillPct <= 85) fillPts = 18;
  else if (fillPct <= 95) fillPts = 10;
  else                    fillPts = 3;


  const invRes = await pool.query(
    `SELECT COUNT(*) AS cnt FROM bank_investments WHERE bank_owner_id = $1 AND amount >= $2`,
    [ownerId, MIN_INVEST_FOR_DIVERSITY]
  );
  const investorCount = Number(invRes.rows[0]?.cnt || 0);
  let divPts;
  if (investorCount >= 10)     divPts = 25;
  else if (investorCount >= 5) divPts = 20;
  else if (investorCount >= 3) divPts = 12;
  else if (investorCount >= 1) divPts = 5;
  else                         divPts = 0;


  const lastAct  = bankData.last_invest_activity ? Number(bankData.last_invest_activity) : 0;
  const hoursAgo = lastAct > 0 ? (now - lastAct) / (1000 * 60 * 60) : 999;
  let actPts;
  if (hoursAgo <= 12)      actPts = 25;
  else if (hoursAgo <= 24) actPts = 16;
  else if (hoursAgo <= 48) actPts = 8;
  else                     actPts = 0;


  const runUntil    = bankData.bank_run_until ? Number(bankData.bank_run_until) : null;
  const isRunActive = runUntil && now < runUntil;
  let stabPts;
  if (isRunActive) {
    stabPts = 0;
  } else if (runUntil && (now - runUntil) < 7 * 24 * 60 * 60 * 1000) {
    stabPts = 12;
  } else {
    stabPts = 25;
  }

  const score = fillPts + divPts + actPts + stabPts;

  const data = { score, fillPts, divPts, actPts, stabPts, fillPct, investorCount, hoursAgo, isRunActive, total };
  _healthCache.set(ownerId, { data, at: now });
  return data;
}

function getHealthMultiplier(score) {
  if (score >= 80) return { multiplier: 1.20, tier: "🟢 Elite",      color: 0x2ecc71 };
  if (score >= 60) return { multiplier: 1.00, tier: "🟡 Healthy",    color: 0xf1c40f };
  if (score >= 40) return { multiplier: 0.80, tier: "🟠 Struggling", color: 0xe67e22 };
  if (score >= 20) return { multiplier: 0.60, tier: "🔴 Weak",       color: 0xe74c3c };
  return            { multiplier: 0.40, tier: "💀 Dying",    color: 0x95a5a6 };
}



function getLoyaltyMultiplier(lastActionMs) {
  if (!lastActionMs || lastActionMs <= 0) return { multiplier: 1.00, label: null };
  const hoursAgo = (Date.now() - Number(lastActionMs)) / (1000 * 60 * 60);
  if (hoursAgo >= 168) return { multiplier: 1.28, label: "💎 Diamond Loyalty (7d+) ×1.28" };
  if (hoursAgo >= 72)  return { multiplier: 1.18, label: "🥈 Loyal (3d+) ×1.18" };
  if (hoursAgo >= 48)  return { multiplier: 1.10, label: "🥉 Loyal (2d+) ×1.10" };
  return { multiplier: 1.00, label: null };
}



function getChampionMultiplier(rank, championUntil) {
  const now = Date.now();
  if (!rank || !championUntil || now > Number(championUntil)) return { multiplier: 1.00, label: null, badge: null };
  const daysLeft = Math.ceil((Number(championUntil) - now) / (24 * 60 * 60 * 1000));
  const info = {
    1: { label: `🏆 Champion's Vault ×1.20 (${daysLeft}d left)`, badge: "🏆", multiplier: 1.20 },
    2: { label: `🥈 Silver Reserve ×1.15 (${daysLeft}d left)`,   badge: "🥈", multiplier: 1.15 },
    3: { label: `🥉 Bronze Hold ×1.10 (${daysLeft}d left)`,      badge: "🥉", multiplier: 1.10 },
  };
  return info[rank] ?? { multiplier: 1.00, label: null, badge: null };
}



function getPanicMultiplier(panicLevel, bankRunUntil) {
  const now = Date.now();
  const isActive = bankRunUntil && now < Number(bankRunUntil);
  if (!isActive || !panicLevel) return { multiplier: 1.00, label: null };
  if (panicLevel >= 3) return { multiplier: 0.70, label: "😱 Chaos — ×0.70 extra penalty" };
  if (panicLevel >= 2) return { multiplier: 0.85, label: "⚠️ Panic — ×0.85 extra penalty" };
  return { multiplier: 1.00, label: null };
}



async function checkAndUpdateBankRun(ownerId, withdrawUserId, depositedAtMs = 0) {
  const now = Date.now();



  const holdMs = depositedAtMs > 0 ? now - depositedAtMs : MIN_HOLD_FOR_BANKRUN_MS;
  if (holdMs < MIN_HOLD_FOR_BANKRUN_MS) {

    return;
  }

  try {
    const bankRes = await pool.query(
      `SELECT name, bank_run_until, bank_run_window_start, bank_run_count, bank_run_users, panic_level
       FROM banks WHERE owner_id = $1`,
      [ownerId]
    );
    if (!bankRes.rows[0]) return;
    const bk          = bankRes.rows[0];
    const bankName    = bk.name;
    const runUntil    = bk.bank_run_until    ? Number(bk.bank_run_until)    : null;
    const winStart    = bk.bank_run_window_start ? Number(bk.bank_run_window_start) : null;
    let   count       = Number(bk.bank_run_count || 0);
    let   users       = Array.isArray(bk.bank_run_users) ? bk.bank_run_users : [];
    let   panicLevel  = Number(bk.panic_level || 0);


    if (runUntil && now < runUntil) {
      if (users.includes(withdrawUserId)) return;
      const newUntil = Math.min(runUntil + BANK_RUN_EXTEND_MS, now + BANK_RUN_MAX_MS);
      panicLevel     = Math.min(3, panicLevel + 1);
      users          = [...users, withdrawUserId];
      await pool.query(
        `UPDATE banks SET bank_run_until = $1, bank_run_users = $2, panic_level = $3 WHERE owner_id = $4`,
        [newUntil, users, panicLevel, ownerId]
      );
      const hoursLeft    = Math.ceil((newUntil - now) / 3_600_000);
      const panicLabels  = { 1: "⚠️ Cabsi", 2: "😱 Walwal", 3: "💀 Burburin Buuxa" };
      const panicLabel   = panicLabels[panicLevel] || "⚠️ Cabsi";
      await sendBankActivityMessage(
        new EmbedBuilder()
          .setTitle(`${panicLabel} — ${bankName} Bank Run Wuu Kordha!`)
          .setDescription(
            `📣 Maalgashiyayaasha badan ayaa ka baxay **${bankName}**!\n\n` +
            `🔥 Heerka Wawalka: **${panicLabel}** (Heer ${panicLevel})\n` +
            `⏳ Bank Run-ku wuxuu socdaa **${hoursLeft} saacadood** oo kale\n\n` +
            `📉 Faa'iidada maalgashiyayaasha waxay si weyn u hoos u dhacaysaa.\n` +
            `💡 Talo: Maalgashiyayaasha ku sugan bangigan markii ay xaaladdu dhammaato waxay helayaan abaalgud gaar ah.`
          )
          .setColor(panicLevel >= 3 ? 0x95a5a6 : panicLevel >= 2 ? 0xe74c3c : 0xe67e22)
          .setTimestamp()
      );
      return;
    }


    if (!winStart || (now - winStart) > BANK_RUN_WINDOW_MS) {

      await pool.query(
        `UPDATE banks SET bank_run_window_start = $1, bank_run_count = 1, bank_run_users = $2,
                          bank_run_until = NULL, panic_level = 0
         WHERE owner_id = $3`,
        [now, [withdrawUserId], ownerId]
      );
      return;
    }


    if (!users.includes(withdrawUserId)) {
      count++;
      users = [...users, withdrawUserId];
    }

    if (count >= BANK_RUN_TRIGGER) {

      panicLevel      = 1;
      const runEnds   = now + BANK_RUN_BASE_MS;
      await pool.query(
        `UPDATE banks SET bank_run_until = $1, bank_run_window_start = NULL,
                          bank_run_count = 0, bank_run_users = '{}', panic_level = $2
         WHERE owner_id = $3`,
        [runEnds, panicLevel, ownerId]
      );
      const hoursLeft = Math.ceil(BANK_RUN_BASE_MS / 3_600_000);
      await sendBankActivityMessage(
        new EmbedBuilder()
          .setTitle(`🚨 Bank Run La Ogaaday — ${bankName}!`)
          .setDescription(
            `⚠️ **${count} maalgashe** ayaa ka baxay **${bankName}** 2 saacadood gudahood!\n\n` +
            `📉 **Faa'iidada maalgashiyayaasha waxay hoos u dhacaysaa ${hoursLeft} saacadood.**\n` +
            `🏥 Caafimaadka Bangiga "Xasilloonida" wuxuu haddeer jooga **0/25 pts**.\n\n` +
            `📌 **Maxaa xiga:**\n` +
            `• Ka bixi intaan la dhamin waxay kordhinaysaa wakhtiga xaaladda (max 12 saacadood)\n` +
            `• Maalgashe kasta oo baxu wuxuu kordhinayaa Heerka Wawalka\n` +
            `• Kuwa soo joogsada waxay helayaan abaalgud markii xaaladdu dhammaato\n\n` +
            `💡 Bangiga si toos ah ayuu u soo kabanaayaa markii bank run-ku dhammaado.`
          )
          .setColor(0xe74c3c)
          .setTimestamp()
      );
    } else {

      await pool.query(
        `UPDATE banks SET bank_run_count = $1, bank_run_users = $2 WHERE owner_id = $3`,
        [count, users, ownerId]
      );
    }
  } catch (err) {
    console.error("[BANK] checkAndUpdateBankRun error:", err.message);
  }
}

async function getRecentTransactions(bankOwnerId, limit = 5) {
  const r = await pool.query(
    `SELECT * FROM bank_transactions WHERE bank_owner_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [bankOwnerId, limit]
  );
  return r.rows;
}

async function logTransaction(client, bankOwnerId, userId, type, amount, note = null) {



  await client.query(
    `INSERT INTO bank_transactions (bank_owner_id, user_id, type, amount, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [bankOwnerId, userId, type, Math.floor(amount), note]
  );
}

function isCooledDown(map, key, ms) {
  const last = map.get(key);
  if (!last) return true;
  return Date.now() - last >= ms;
}

function cooldownRemaining(map, key, ms) {
  const last = map.get(key);
  if (!last) return 0;
  return Math.max(0, ms - (Date.now() - last));
}

function msToMinSec(ms) {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function checkAccountAge(user) {
  const ageDays = (Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24);
  return ageDays >= MIN_ACCOUNT_DAYS;
}










const _weeklyBuffer = new Map();

export function addWeeklyEarnings(userId, amount) {
  if (!userId || !amount || amount <= 0) return;
  _weeklyBuffer.set(userId, (_weeklyBuffer.get(userId) || 0) + Math.floor(amount));
}

async function flushWeeklyEarnings() {
  if (_weeklyBuffer.size === 0) return;
  const snapshot = new Map(_weeklyBuffer);
  _weeklyBuffer.clear();

  const ids     = [...snapshot.keys()];
  const amounts = [...snapshot.values()];

  try {
    await pool.query(
      `INSERT INTO weekly_earnings (user_id, amount)
       SELECT * FROM UNNEST($1::text[], $2::bigint[]) AS t(user_id, amount)
       ON CONFLICT (user_id) DO UPDATE SET amount = weekly_earnings.amount + EXCLUDED.amount`,
      [ids, amounts]
    );
  } catch (err) {

    for (const [uid, amt] of snapshot) {
      _weeklyBuffer.set(uid, (_weeklyBuffer.get(uid) || 0) + amt);
    }
    console.error("[SEASON] flushWeeklyEarnings error:", err.message);
  }
}


setInterval(() => { flushWeeklyEarnings().catch(() => {}); }, 30_000);



function calcHourlyProfit(bankLevel, deposited, lastActiveMs) {
  if (deposited <= 0) return 0;






  const rate = PROFIT_RATES[bankLevel] || PROFIT_RATES[1];
  let profit = deposited * rate;


  const lastActive = Number(lastActiveMs || Date.now());
  if (Date.now() - lastActive > 24 * 60 * 60 * 1000) {
    profit = profit * 0.5;
  }




  const hourCap = MAX_PROFIT_PER_HOUR[bankLevel] || MAX_PROFIT_PER_HOUR[1];
  return Math.floor(Math.min(profit, hourCap));
}



async function runProfitCycle() {





  const banks = await pool.query(`SELECT owner_id, level, name FROM banks WHERE level < 4`);
  for (const bank of banks.rows) {
    const profitCap  = BANK_TOTAL_CAPS[bank.level] || BANK_TOTAL_CAPS[1];
    const depositCap = BANK_CAPS[bank.level]       || BANK_CAPS[1];


    const totalRes = await pool.query(
      `SELECT COALESCE(SUM(deposited + profit), 0) AS total FROM bank_users WHERE bank_owner_id = $1`,
      [bank.owner_id]
    );
    const bankWideTotal = Number(totalRes.rows[0]?.total || 0);

    console.log(`[BANK DEBUG] ${bank.name} (L${bank.level}) — Before profit: ${bankWideTotal} / profitCap: ${profitCap}`);

    if (bankWideTotal >= profitCap) {
      console.log(`[BANK DEBUG] ${bank.name} already at/above profitCap — skipping profit this cycle.`);
    } else {
      const users = await pool.query(
        `SELECT user_id, deposited, profit, last_active FROM bank_users WHERE bank_owner_id = $1 AND deposited > 0`,
        [bank.owner_id]
      );
      let totalDeposits = 0;

      let remainingCap = profitCap - bankWideTotal;



      const gainUserIds = [];
      const gainAmounts = [];

      for (const bu of users.rows) {
        if (remainingCap <= 0) break;
        const gain = calcHourlyProfit(bank.level, Number(bu.deposited), bu.last_active);
        totalDeposits += Number(bu.deposited) + Number(bu.profit);
        if (gain <= 0) continue;
        const hourCap    = MAX_PROFIT_PER_HOUR[bank.level] || 83;
        const cappedGain = Math.min(gain, hourCap, remainingCap);
        remainingCap -= cappedGain;
        gainUserIds.push(bu.user_id);
        gainAmounts.push(cappedGain);
      }

      if (gainUserIds.length > 0) {



        await pool.query(
          `UPDATE bank_users AS bu
           SET profit = bu.profit + t.gain
           FROM (SELECT unnest($1::text[]) AS uid, unnest($2::bigint[]) AS gain) t
           WHERE bu.bank_owner_id = $3 AND bu.user_id = t.uid AND bu.deposited > 0`,
          [gainUserIds, gainAmounts, bank.owner_id]
        );

        await pool.query(
          `INSERT INTO bank_transactions (bank_owner_id, user_id, type, amount, note)
           SELECT $1, unnest($2::text[]), 'profit', unnest($3::bigint[]), 'Saacad kasta profit'`,
          [bank.owner_id, gainUserIds, gainAmounts]
        );
      }


      const totalGain      = gainAmounts.reduce((s, g) => s + g, 0);
      const bankWideTotalAfter = bankWideTotal + totalGain;
      console.log(`[BANK DEBUG] ${bank.name} — After profit: ${bankWideTotalAfter} / profitCap: ${profitCap}`);

      const dailyRate = OWNER_DAILY_RATES[bank.level] || 0.001;
      const ownerBonus = Math.floor(totalDeposits * dailyRate / 24);
      if (ownerBonus > 0 && !(await bankNwCapBlocked(bank.owner_id, ownerBonus))) {
        const _v1 = await addVaultEarning(bank.owner_id, ownerBonus);
        if (!_v1) await pool.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [ownerBonus, bank.owner_id]);
        await pool.query(
          `INSERT INTO bank_transactions (bank_owner_id, user_id, type, amount, note)
           VALUES ($1, $1, 'owner_bonus', $2, 'Daily owner bonus (hourly)')`,
          [bank.owner_id, ownerBonus]
        );
        addWeeklyEarnings(bank.owner_id, ownerBonus);
      }
    }



    await pool.query(
      `DELETE FROM bank_transactions
       WHERE bank_owner_id = $1
         AND id < COALESCE(
           (SELECT MIN(id) FROM (
              SELECT id FROM bank_transactions
              WHERE bank_owner_id = $1
              ORDER BY id DESC
              LIMIT $2
            ) sub),
           0
         )`,
      [bank.owner_id, MAX_TX_STORED]
    );
  }
  console.log(`[BANK] 💰 Profit cycle done — ${banks.rows.length} bank(s).`);
}





async function fixOverflowBanks() {
  try {


    const banks = await pool.query(`
      SELECT b.owner_id, b.level, b.name,
             COALESCE(SUM(bu.deposited + bu.profit), 0) AS bank_total
      FROM banks b
      LEFT JOIN bank_users bu ON bu.bank_owner_id = b.owner_id
      GROUP BY b.owner_id, b.level, b.name
    `);
    let fixedCount = 0;

    for (const bank of banks.rows) {
      const profitCap  = BANK_TOTAL_CAPS[bank.level] || BANK_TOTAL_CAPS[1];
      const depositCap = BANK_CAPS[bank.level]       || BANK_CAPS[1];
      const bankTotal  = Number(bank.bank_total || 0);

      if (bankTotal <= profitCap) continue;

      const overflow = bankTotal - profitCap;
      console.log(`[BANK FIX] Overflow detected in ${bank.name} (L${bank.level}): ${bankTotal} > profitCap ${profitCap} → moving ${overflow} to treasury`);


      const usersRes = await pool.query(
        `SELECT * FROM bank_users WHERE bank_owner_id = $1 AND profit > 0 ORDER BY profit DESC`,
        [bank.owner_id]
      );
      let toRemove = overflow;

      for (const bu of usersRes.rows) {
        if (toRemove <= 0) break;
        const userProfit = Number(bu.profit);
        const cut = Math.min(userProfit, toRemove);
        await pool.query(
          `UPDATE bank_users SET profit = profit - $1 WHERE bank_owner_id = $2 AND user_id = $3`,
          [cut, bank.owner_id, bu.user_id]
        );
        toRemove -= cut;
      }


      if (toRemove > 0) {
        const depUsersRes = await pool.query(
          `SELECT * FROM bank_users WHERE bank_owner_id = $1 AND deposited > 0 ORDER BY deposited DESC`,
          [bank.owner_id]
        );
        for (const bu of depUsersRes.rows) {
          if (toRemove <= 0) break;
          const userDep = Number(bu.deposited);
          const cut = Math.min(userDep, toRemove);
          await pool.query(
            `UPDATE bank_users SET deposited = deposited - $1 WHERE bank_owner_id = $2 AND user_id = $3`,
            [cut, bank.owner_id, bu.user_id]
          );
          toRemove -= cut;
        }
      }


      await pool.query(
        `UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`,
        [overflow]
      );

      fixedCount++;
      console.log(`[BANK FIX] ✅ ${bank.name} clamped from ${bankTotal} → ${profitCap}. ${overflow} coins → treasury.`);
    }

    if (fixedCount === 0) {
      console.log(`[BANK FIX] ✅ No overflow detected — all banks within limits.`);
    } else {
      console.log(`[BANK FIX] ✅ Fixed ${fixedCount} bank(s) with overflow.`);
    }
  } catch (err) {
    console.error("[BANK FIX] fixOverflowBanks error:", err.message);
  }
}



const BINV_CLAIM_CD    = 12 * 60 * 60 * 1000;
const BINV_WITHDRAW_CD = 24 * 60 * 60 * 1000;
const BINV_CAP         = 100_000;

async function getBankInvestment(userId, ownerId) {
  const r = await pool.query(
    `SELECT * FROM bank_investments WHERE user_id = $1 AND bank_owner_id = $2`,
    [userId, ownerId]
  );
  return r.rows[0] || null;
}

function calcBankInvestProfit(amount, lastClaimMs, rateMultiplier = 1.0) {
  if (!amount || amount <= 0) return 0;
  const elapsedHours = (Date.now() - (lastClaimMs || Date.now())) / (3600 * 1000);
  if (elapsedHours <= 0) return 0;

  const base  = Math.min(Number(amount), 25_000);
  const extra = Math.max(0, Number(amount) - 25_000);
  const raw   = (base * 0.0025 + extra * 0.0015) * elapsedHours;

  const cappedMult = Math.min(MAX_COMBINED_MULT, Math.max(0.10, rateMultiplier));
  return Math.floor(raw * cappedMult);
}

async function doBankInvest(userId, ownerId, amount) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const playerRes = await client.query(
      `SELECT coins FROM players WHERE discord_id = $1 FOR UPDATE`, [userId]
    );
    if (!playerRes.rows[0] || Number(playerRes.rows[0].coins) < amount) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Coins kuguma filna." };
    }
    await client.query(`UPDATE players SET coins = coins - $1 WHERE discord_id = $2`, [amount, userId]);
    const existing = await client.query(
      `SELECT amount, last_claim, total_earned FROM bank_investments WHERE user_id = $1 AND bank_owner_id = $2`,
      [userId, ownerId]
    );
    let autoClaimed = null;
    if (existing.rowCount > 0) {
      const oldAmt     = Number(existing.rows[0].amount);
      const oldClaim   = Number(existing.rows[0].last_claim);
      const pendProfit = calcBankInvestProfit(oldAmt, oldClaim);

      const userGets   = Math.floor(pendProfit * 0.95);
      const ownerGets  = Math.floor(pendProfit * 0.03);
      const botGets    = pendProfit - userGets - ownerGets;
      await client.query(
        `UPDATE bank_investments SET amount = amount + $1, last_claim = $2, deposited_at = $2, last_action = $2, total_earned = total_earned + $3 WHERE user_id = $4 AND bank_owner_id = $5`,
        [amount, Date.now(), pendProfit, userId, ownerId]
      );

      const [userBlocked, ownerBlocked] = await Promise.all([
        userGets  > 0 ? bankNwCapBlocked(userId,  userGets)  : Promise.resolve(false),
        ownerGets > 0 ? bankNwCapBlocked(ownerId, ownerGets) : Promise.resolve(false),
      ]);

      if (userGets  > 0 && !userBlocked)
        await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [userGets, userId]);
      if (ownerGets > 0 && !ownerBlocked) {
        const _v2 = await addVaultEarning(ownerId, ownerGets);
        if (!_v2) await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [ownerGets, ownerId]);
      }
      if (botGets > 0)   await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [botGets]);
      if (pendProfit > 0) autoClaimed = { profit: pendProfit, userGets, ownerGets };
    } else {
      await client.query(
        `INSERT INTO bank_investments (user_id, bank_owner_id, amount, last_claim, deposited_at, last_action, total_earned) VALUES ($1, $2, $3, $4, $4, $4, 0)`,
        [userId, ownerId, amount, Date.now()]
      );
    }
    await client.query("COMMIT");

    if (autoClaimed) {
      if (autoClaimed.userGets  > 0) addWeeklyEarnings(userId,  autoClaimed.userGets);
      if (autoClaimed.ownerGets > 0) addWeeklyEarnings(ownerId, autoClaimed.ownerGets);
    }

    pool.query(`UPDATE banks SET last_invest_activity = $1 WHERE owner_id = $2`, [Date.now(), ownerId])
      .catch(e => console.error("[BANK] last_invest_activity update error:", e.message));
    return { ok: true, autoClaimed };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[BANK] doBankInvest error:", err);
    return { ok: false, error: "Server khalad. Isku day." };
  } finally { client.release(); }
}

async function doBankInvestClaim(userId, ownerId) {
  const inv = await getBankInvestment(userId, ownerId);
  if (!inv) return { ok: false, error: "Maalgashi kuma haysatid bangigan." };


  const bankData = await getBank(ownerId);
  if (!bankData) return { ok: false, error: "Bank lama helin." };


  const healthData                         = await calcBankHealthScore(ownerId, bankData);
  const { multiplier: healthMult, tier: healthTier } = getHealthMultiplier(healthData.score);
  const { multiplier: loyaltyMult, label: loyaltyLabel } = getLoyaltyMultiplier(Number(inv.last_action || 0));
  const { multiplier: champMult,   label: champLabel }   = getChampionMultiplier(bankData.champion_rank, bankData.champion_until);
  const { multiplier: panicMult,   label: panicLabel }   = getPanicMultiplier(bankData.panic_level, bankData.bank_run_until);
  const combinedMult = healthMult * loyaltyMult * champMult * panicMult;

  const rawProfit = calcBankInvestProfit(Number(inv.amount), Number(inv.last_claim), combinedMult);
  if (rawProfit <= 0) return { ok: false, error: "Faa'iido ma jirto hadda. Sug wax yar." };


  const profit = Math.min(rawProfit, MAX_INVEST_CLAIM);

  const burnAmt   = Math.floor(profit * COIN_BURN_RATE);
  const distributableProfit = profit - burnAmt;
  const userGets  = Math.floor(distributableProfit * 0.95);
  const ownerGets = Math.floor(distributableProfit * 0.03);
  const botGets   = distributableProfit - userGets - ownerGets;
  if (userGets > 0 && await bankNwCapBlocked(userId, userGets)) {
    return { ok: false, error: "\uD83D\uDD12 Accountgaaga waxa uu gaaray xadka lacagta loogu tala galay dadka aan verify ahayn." };
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE bank_investments SET last_claim = $1, last_action = $1, total_earned = total_earned + $2 WHERE user_id = $3 AND bank_owner_id = $4`,
      [Date.now(), profit, userId, ownerId]
    );
    if (!(await bankNwCapBlocked(userId, userGets)))
      await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [userGets, userId]);
    if (!(await bankNwCapBlocked(ownerId, ownerGets))) {
      const _v3 = await addVaultEarning(ownerId, ownerGets);
      if (!_v3) await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [ownerGets, ownerId]);
    }
    await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [botGets]);
    await client.query("COMMIT");

    pool.query(`UPDATE banks SET last_invest_activity = $1 WHERE owner_id = $2`, [Date.now(), ownerId])
      .catch(e => console.error("[BANK] last_invest_activity update error:", e.message));
    addWeeklyEarnings(userId, userGets);
    addWeeklyEarnings(ownerId, ownerGets);
    return {
      ok: true, profit, userGets, ownerGets,
      healthScore: healthData.score, healthTier,
      combinedMult, loyaltyLabel, champLabel, panicLabel,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[BANK] doBankInvestClaim error:", err);
    return { ok: false, error: "Server khalad." };
  } finally { client.release(); }
}

async function doBankInvestWithdraw(userId, ownerId) {
  const inv = await getBankInvestment(userId, ownerId);
  if (!inv || Number(inv.amount) <= 0) return { ok: false, error: "Maalgashi kuma haysatid bangigan." };
  const principal   = Number(inv.amount);

  const depositedAt = Number(inv.deposited_at || 0);

  const rawProfit   = calcBankInvestProfit(principal, Number(inv.last_claim));

  const profit      = Math.min(rawProfit, MAX_INVEST_CLAIM);

  const burnAmt     = Math.floor(profit * COIN_BURN_RATE);
  const distributableProfit = profit - burnAmt;

  const userProfit  = Math.floor(distributableProfit * 0.95);
  const ownerProfit = Math.floor(distributableProfit * 0.03);
  const botProfit   = distributableProfit - userProfit - ownerProfit;

  const totalToUser = principal + userProfit;
  if (userProfit > 0 && await bankNwCapBlocked(userId, userProfit)) {
    return { ok: false, error: "\uD83D\uDD12 Accountgaaga waxa uu gaaray xadka lacagta loogu tala galay dadka aan verify ahayn. Lacagta ku invest galay waad bixin kartaa laakiin faa'iidada (profit) ma heli kartid." };
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM bank_investments WHERE user_id = $1 AND bank_owner_id = $2`, [userId, ownerId]);

    await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [totalToUser, userId]);

    if (ownerProfit > 0) {
      const _v4 = await addVaultEarning(ownerId, ownerProfit);
      if (!_v4) await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [ownerProfit, ownerId]);
    }

    if (botProfit > 0) {
      await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [botProfit]);
    }
    await client.query("COMMIT");

    if (userProfit  > 0) addWeeklyEarnings(userId,  userProfit);
    if (ownerProfit > 0) addWeeklyEarnings(ownerId, ownerProfit);

    pool.query(`UPDATE banks SET last_invest_activity = $1 WHERE owner_id = $2`, [Date.now(), ownerId])
      .catch(e => console.error("[BANK] last_invest_activity update error:", e.message));
    checkAndUpdateBankRun(ownerId, userId, depositedAt)
      .catch(e => console.error("[BANK] checkAndUpdateBankRun error:", e.message));
    return { ok: true, principal, pendProfit: profit, userProfit, ownerProfit, totalToUser };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[BANK] doBankInvestWithdraw error:", err);
    return { ok: false, error: "Server khalad." };
  } finally { client.release(); }
}



function buildOpenPromptEmbed() {
  return new EmbedBuilder()
    .setTitle("🏦 Bank")
    .setDescription(
      `❌ Wax bank ma lihid!\n\n🎯 Level **${MIN_LEVEL_OPEN}+** ayaa u baahan tahay\n💸 **${fmt(BANK_OPEN_COST_COINS)} Coins**  ·  **${fmt(BANK_OPEN_COST_DIAMONDS)} 💎**`
    )
    .setColor(0xe74c3c);
}

function buildOpenPromptRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bank_open_coins_${userId}`)
      .setLabel(`💰 Create — ${fmt(BANK_OPEN_COST_COINS)} Coins`)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`bank_open_diamonds_${userId}`)
      .setLabel(`💎 Create — ${fmt(BANK_OPEN_COST_DIAMONDS)} Diamonds`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`bank_nobank_close_${userId}`)
      .setLabel("Close")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );
}

async function buildOwnerBankEmbed(bank, ownerId) {
  const cap  = BANK_CAPS[bank.level];
  const rate = PROFIT_RATES[bank.level];

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);




  const [healthData, userCount, todayRes, allTimeRes, invRes] = await Promise.all([
    calcBankHealthScore(ownerId, bank),
    getBankUserCount(ownerId),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS earned FROM bank_transactions WHERE bank_owner_id = $1 AND type = 'profit' AND created_at >= $2`,
      [ownerId, todayStart.getTime()]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS earned FROM bank_transactions WHERE bank_owner_id = $1 AND type = 'profit'`,
      [ownerId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_inv, COUNT(*) AS inv_count FROM bank_investments WHERE bank_owner_id = $1 AND amount > 0`,
      [ownerId]
    ),
  ]);


  const total        = healthData.total;
  const todayEarned  = Number(todayRes.rows[0]?.earned || 0);
  const totalEarned  = Number(allTimeRes.rows[0]?.earned || 0);
  const totalInv     = Number(invRes.rows[0]?.total_inv || 0);
  const invCount     = Number(invRes.rows[0]?.inv_count || 0);


  const { multiplier: hMult, tier: hTier } = getHealthMultiplier(healthData.score);
  const filled  = Math.round(healthData.score / 10);
  const barStr  = "▓".repeat(filled) + "░".repeat(10 - filled);
  const champInfo = getChampionMultiplier(bank.champion_rank, bank.champion_until);
  const runActive = healthData.isRunActive;
  const now       = Date.now();
  const runHoursLeft = runActive
    ? Math.ceil((Number(bank.bank_run_until) - now) / 3_600_000)
    : 0;


  const effectiveRate = ((rate * hMult) * 100).toFixed(3);


  const champBadge = champInfo.badge ? ` ${champInfo.badge}` : "";
  const bankRunLine = runActive
    ? `\n🚨 **Bank Run aktif** — ${runHoursLeft}h haray · Panic Level ${bank.panic_level || 1}`
    : "";

  const embed = new EmbedBuilder()
    .setTitle(`🏦 ${bank.name} ${levelStars(bank.level)}${champBadge}`)
    .setDescription(`👤 <@${ownerId}>  ·  ⭐ Level ${bank.level}\n💡 Lacagtaada ayaa kuu shaqeenaysa${bankRunLine}`)
    .addFields(
      { name: "💰 Balance",    value: `${fmt(total)} / ${fmt(cap)} Coins`,         inline: true },
      { name: "📈 Base Rate",  value: `+${rate * 100}% / saac`,                    inline: true },
      { name: "👥 Users",      value: `${userCount}`,                               inline: true },
      { name: "📊 Today",      value: `+${fmt(todayEarned)} Coins`,                 inline: true },
      { name: "🧾 All-time",   value: `+${fmt(totalEarned)} Coins`,                 inline: true },
      { name: "💼 Investors",  value: `${invCount} · ${fmt(totalInv)} Coins`,       inline: true },
      {
        name: "🏥 Bank Health",
        value: [
          `\`[${barStr}]\` **${healthData.score}/100** — ${hTier}`,
          `▸ Fill Rate: ${Math.round(healthData.fillPct)}%  (${healthData.fillPts}/25 pts)`,
          `▸ Diversity: ${healthData.investorCount} investors  (${healthData.divPts}/25 pts)`,
          `▸ Activity: ${healthData.hoursAgo < 999 ? Math.round(healthData.hoursAgo) + "h ago" : "None"}  (${healthData.actPts}/25 pts)`,
          `▸ Stability: ${runActive ? "🚨 Bank Run" : "✅ Stable"}  (${healthData.stabPts}/25 pts)`,
          `▸ Investor Rate Multiplier: **×${hMult.toFixed(2)}** → **${effectiveRate}%/saac**`,
        ].join("\n"),
        inline: false,
      },
      ...(champInfo.badge ? [{
        name: "🏆 Champion Badge",
        value: champInfo.label,
        inline: false,
      }] : []),
      { name: "💸 Fees", value: `Deposit: ${Math.round(DEPOSIT_TAX * 100)}%  ·  Withdraw: You get **${Math.round((1 - (WITHDRAW_OWNER_RATES[bank.level] || 0.05) - WITHDRAW_BOT) * 100)}%** · Owner: ${Math.round((WITHDRAW_OWNER_RATES[bank.level] || 0.05) * 100)}% · Bot: ${Math.round(WITHDRAW_BOT * 100)}%`, inline: false },
    )
    .setColor(runActive ? 0xe74c3c : (champInfo.badge ? 0xf1c40f : 0x2ecc71));

  return embed;
}

function buildOwnerBankRows(ownerId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bank_info_${ownerId}`).setLabel("📊 Info").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bank_upgrade_${ownerId}`).setLabel("⬆️ Upgrade").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`bank_users_btn_${ownerId}`).setLabel("👥 Users").setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bank_invest_list_${ownerId}`).setLabel("💼 Investments").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`bank_howto_${ownerId}`).setLabel("📕 Side").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`bank_owner_close_${ownerId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
    ),
  ];
}



async function handleBankCommand(message) {
  const userId = message.author.id;

  if (!checkAccountAge(message.author)) {
    return message.reply("⚠️ Account-kaagu weli ma gaarin **3 maalmood** — hada ma isticmaali kartid nidaamka bangiga.");
  }

  const player = await getPlayer(userId);
  if (!player) {
    return message.reply("❌ Wax xog ah kama heyno adi. ciyaar gameska nasiib marka hore.");
  }
  if (player.level < MIN_LEVEL_USE) {
    return message.reply({ embeds: [bankLevelGateEmbed(MIN_LEVEL_USE, player.level)] });
  }

  const bank = await getBank(userId);

  if (!bank) {
    if (player.level < MIN_LEVEL_OPEN) {
      return message.reply({ embeds: [bankLevelGateEmbed(MIN_LEVEL_OPEN, player.level)] });
    }
    await message.reply({ embeds: [buildOpenPromptEmbed()], components: [buildOpenPromptRow(userId)] });
  } else if (bank.level >= 4) {



    await sendLevel4MainUI(message, userId, bank);
  } else {
    const embed = await buildOwnerBankEmbed(bank, userId);
    await message.reply({ embeds: [embed], components: buildOwnerBankRows(userId) });
  }
}



async function handleBankInfo(message) {
  const userId = message.author.id;
  const bank = await getBank(userId);
  if (!bank) {
    return message.reply("❌ Adigu ma lihid wax bank ah. Furo mid marka hore: `!bank`");
  }

  const usersRes = await pool.query(
    `SELECT * FROM bank_users WHERE bank_owner_id = $1 ORDER BY (deposited + profit) DESC`,
    [userId]
  );
  const users = usersRes.rows.filter(u => Number(u.deposited) + Number(u.profit) > 0);

  const total       = users.reduce((s, u) => s + Number(u.deposited) + Number(u.profit), 0);
  const totalProfit = users.reduce((s, u) => s + Number(u.profit), 0);

  let userLines = "Wali lacag la dhigtay ma jirto.";
  if (users.length > 0) {
    userLines = users.slice(0, 15).map((u, i) => {
      const bal = Number(u.deposited) + Number(u.profit);
      return `**${i + 1}.** <@${u.user_id}> — ${fmt(bal)} coins (profit: +${fmt(u.profit)})`;
    }).join("\n");
  }

  const embed = new EmbedBuilder()
    .setTitle(`📊 ${bank.name} — Bank Insights`)
    .setColor(0x2ecc71)
    .addFields(
      { name: "💰 Wadarta guud",         value: `${fmt(total)} coins`,       inline: true },
      { name: "📈 Profit Wadarta",  value: `${fmt(totalProfit)} coins`, inline: true },
      { name: "👥 Users",           value: `${users.length}`,           inline: true },
      { name: "🏆 Top Depositors",  value: userLines,                   inline: false }
    );

  await message.reply({ embeds: [embed] });
}



async function handleBankAccount(message) {
  const userId = message.author.id;
  const res = await pool.query(
    `SELECT bu.bank_owner_id, bu.deposited, bu.profit, bu.last_active, b.name, b.level
     FROM bank_users bu
     JOIN banks b ON b.owner_id = bu.bank_owner_id
     WHERE bu.user_id = $1 AND (bu.deposited + bu.profit) > 0
     ORDER BY (bu.deposited + bu.profit) DESC`,
    [userId]
  );

  if (res.rows.length === 0) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏦 Bank Account")
          .setDescription("❌ Wax bank account ma lihid\n\n💡 Dhig lacag bank kasta:\n`!deposit <lacag> @bankowner`")
          .setColor(0xe74c3c),
      ],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bank_acc_close_${userId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      )],
    });
  }

  const bankLines = res.rows.map(row => {
    const deposited = Number(row.deposited);
    const profit    = Number(row.profit);
    const liveProfit = calcHourlyProfit(row.level, deposited, row.last_active);
    const total = deposited + profit;
    return [
      `📍 **${row.name}** ${levelStars(row.level)}`,
      `💰 Deposited: ${fmt(deposited)}`,
      `📈 Profit: +${fmt(profit)}  (≈+${fmt(liveProfit)}/saac next)`,
      `💼 Total: **${fmt(total)} Coins**`,
    ].join("\n");
  }).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle("🏦 Bank Accounts")
    .setDescription(bankLines + "\n\n📥 **Deposit Fee:** 2%  ·  📤 **Withdraw Fee:** 8–10% (by bank level)\n💡 *Lacagtaada ayaa kuu shaqeenaysa*")
    .setColor(0xf1c40f)
    .setFooter({ text: "Profit waxaa lagu daraa saacad kasta · Max: L1=83 · L2=208 · L3=417 coins/saac" });

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bank_acc_deposit_${userId}`).setLabel("💰 Deposit").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`bank_acc_withdraw_${userId}`).setLabel("💸 Withdraw").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`bank_acc_close_${userId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );


  const bankButtons = res.rows.slice(0, 16).map(row =>
    new ButtonBuilder()
      .setCustomId(`bank_acc_details_${userId}_${row.bank_owner_id}`)
      .setLabel(row.name.slice(0, 20))
      .setEmoji("📊")
      .setStyle(ButtonStyle.Secondary)
  );

  const components = [actionRow];
  for (let i = 0; i < bankButtons.length; i += 4) {
    components.push(new ActionRowBuilder().addComponents(...bankButtons.slice(i, i + 4)));
  }

  await message.reply({ embeds: [embed], components });
}



export async function executeDeposit(userId, ownerId, amount, replyFn, checkAccountAgeFn) {
  if (checkAccountAgeFn && !checkAccountAgeFn()) {
    return replyFn("⚠️ Accountkaagu ma gaarin **3 maalmood**.");
  }
  const player = await getPlayer(userId);
  if (!player || player.level < MIN_LEVEL_USE) {
    const lvl = player ? player.level : 1;
    return replyFn({ embeds: [bankLevelGateEmbed(MIN_LEVEL_USE, lvl)] });
  }
  if (ownerId === userId) {
    return replyFn("❌ Bangigaaga ma dhigi kartid lacag adiga kuu gaar ah.");
  }
  const bank = await getBank(ownerId);
  if (!bank) {
    return replyFn("❌ Bankgaas wali acc kama furan. Hubi IDga ownerka please.");
  }
  if (isNaN(amount) || amount <= 0) {
    return replyFn("❌ Qadar khaldan — waa in ay ahaataa tiro togan oo saxan.");
  }
  if (amount < MIN_DEPOSIT) {
    return replyFn({ embeds: [new EmbedBuilder().setTitle("❌ Lacag yar").setDescription(`Ugu yaraan **${MIN_DEPOSIT} Coin** ayaad dhigan kartaa.`).setColor(0xe74c3c)] });
  }
  if (Number(player.coins) < amount) {
    return replyFn({ embeds: [bankNotEnoughEmbed(Number(player.coins), `!deposit`)] });
  }

  const tax      = Math.floor(amount * DEPOSIT_TAX);
  const taxBot   = Math.floor(amount * DEPOSIT_TAX_BOT);
  const taxOwner = tax - taxBot;
  const bankGets = amount - tax;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bankRow = await client.query(`SELECT level, name FROM banks WHERE owner_id = $1 FOR UPDATE`, [ownerId]);
    if (bankRow.rowCount === 0) { await client.query("ROLLBACK"); return replyFn("❌ Bank lama helin."); }


    const lockedLevel = bankRow.rows[0].level;
    const lockedName  = bankRow.rows[0].name;
    const cap      = BANK_CAPS[lockedLevel] || BANK_CAPS[1];
    const totalCap = BANK_TOTAL_CAPS[lockedLevel] || BANK_TOTAL_CAPS[1];



    const combinedRow = await client.query(
      `SELECT
         (SELECT COALESCE(SUM(deposited + profit), 0) FROM bank_users WHERE bank_owner_id = $1) AS bank_total,
         COALESCE(bu.deposited, 0)         AS user_deposited,
         COALESCE(bu.has_bank_pass, FALSE) AS has_bank_pass
       FROM (SELECT 1) dummy
       LEFT JOIN bank_users bu ON bu.bank_owner_id = $1 AND bu.user_id = $2`,
      [ownerId, userId]
    );
    const currentTotal       = parseInt(combinedRow.rows[0].bank_total   || "0", 10);
    const currentUserDeposit = parseInt(combinedRow.rows[0].user_deposited || "0", 10);
    const hasPass            = combinedRow.rows[0].has_bank_pass === true;

    console.log(`[BANK DEBUG] Deposit attempt to ${lockedName} (L${lockedLevel}) — currentTotal: ${currentTotal}, depositCap: ${cap}, profitCap: ${totalCap}, bankGets: ${bankGets}`);

    const space = Math.max(0, cap - currentTotal);
    if (space <= 0) {
      await client.query("ROLLBACK");
      return replyFn({ embeds: [new EmbedBuilder()
        .setTitle("❌ Bank wuu buuxaa!")
        .setDescription(`**${lockedName}** lacag intaas ka badan ma dhigan kartid.\n\n💡 Fadlan raadi bank kale oo aad lacag dhigatid\n\n📋 Isticmaal \`!banklb\` si aad u aragtid bankiyada kale`)
        .setColor(0xe74c3c)] });
    }
    if (currentTotal + bankGets > cap) {
      await client.query("ROLLBACK");
      return replyFn({ embeds: [new EmbedBuilder()
        .setTitle("⚠️ Boos yar ayaa haray")
        .setDescription(`**${lockedName}** wuxuu qaadan karaa ugu badnaan **${fmt(space)} Coins** oo kaliya.\n\n💡 Isku day:\n\`!deposit ${space} @owner\``)
        .setColor(0xf39c12)] });
    }
    if (currentTotal + bankGets > totalCap) {
      await client.query("ROLLBACK");
      const totalSpace = Math.max(0, totalCap - currentTotal);
      return replyFn({ embeds: [new EmbedBuilder()
        .setTitle("❌ Bank wuu Buuxaa! (Total Cap)")
        .setDescription(`**${lockedName}** wuxuu gaaray xadkiisa ugu sarreeya oo wadar ah.\n\n` +
          (totalSpace > 0 ? `💡 Isku day:\n\`!deposit ${totalSpace} @owner\`` : `📋 Isticmaal \`!banklb\` si aad u aragtid bankiyada kale`))
        .setColor(0xe74c3c)] });
    }
    const effectiveMax = hasPass ? MAX_DEPOSIT_PER_USER + BANK_PASS_EXTRA : MAX_DEPOSIT_PER_USER;
    if (currentUserDeposit + bankGets > effectiveMax) {
      await client.query("ROLLBACK");
      const userSpace = Math.max(0, effectiveMax - currentUserDeposit);
      if (userSpace <= 0) {
        const passHint = hasPass ? "" : "\n🎫 **Bank Pass** — Gado bank pass oo kordhi xadiga";
        const fullEmbed = new EmbedBuilder()
          .setTitle("🏦 Bank Buuxa!")
          .setDescription(`Waxaad dhigtay ugu badnaan **${fmt(effectiveMax)} Coins** bank-kan.`)
          .addFields(
            { name: "💡 Maxaad samayn kartaa?", value: [
              "📋 **Bank LB** — Raadi banks kale oo wax dhigan kartid",
              ...(!hasPass ? ["🎫 **Bank Pass** — Gado bank pass oo kordhi xadiga"] : []),
              "💼 **Invest** — Maalgeli bank-gan hadda joogtid",
              "🗑️ **Close** — Iska xir daaqadan oo dhan",
            ].join("\n"), inline: false },
          )
          .setColor(0xe74c3c);
        return replyFn(null, fullEmbed, { bankFull: true, hasPass, bankOwnerId: ownerId, userId });
      } else {
        return replyFn(null, new EmbedBuilder()
          .setTitle("⚠️ Limit waa gaartay")
          .setDescription(`Qof kasta wuxuu dhigi karaa ugu badnaan **${fmt(effectiveMax)} Coins** bank kasta.`)
          .addFields(
            { name: "📊 Boos ka haray", value: `**${fmt(userSpace)} Coins** oo kaliya`, inline: true },
            { name: "💡 Isku day", value: `\`!deposit ${userSpace} @owner\``, inline: true },
          )
          .setColor(0xf39c12));
      }
    }

    const debit = await client.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`, [amount, userId]
    );
    if (debit.rowCount === 0) { await client.query("ROLLBACK"); return replyFn("❌ Lacag kugu filan ma haysatid."); }

    await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [taxBot]);
    if (taxOwner > 0) {
      const _v5 = await addVaultEarning(ownerId, taxOwner);
      if (!_v5) await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [taxOwner, ownerId]);


      await logTransaction(client, ownerId, ownerId, "owner_earning", taxOwner, "deposit fee");
    }
    await client.query(
      `INSERT INTO bank_users (bank_owner_id, user_id, deposited, profit, last_active) VALUES ($1, $2, $3, 0, $4)
       ON CONFLICT (bank_owner_id, user_id) DO UPDATE SET deposited = bank_users.deposited + $3, last_active = $4`,
      [ownerId, userId, bankGets, Date.now()]
    );
    await logTransaction(client, ownerId, userId, "deposit", bankGets, `owner fee: ${taxOwner}`);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[BANK] executeDeposit error:", err);
    return replyFn("❌ Khalad ayaa dhacay. Isku day mar kale.");
  } finally {
    client.release();
  }

  const newBalRes = await pool.query(
    `SELECT COALESCE(deposited + profit, 0) AS balance FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2`,
    [ownerId, userId]
  );
  const newBalance = Number(newBalRes.rows[0]?.balance || 0);
  const depCap = BANK_CAPS[bank.level];

  return replyFn(null, new EmbedBuilder()
    .setTitle("💰 Deposit Guuleysey!")
    .setDescription(`✅ Waxaad dhigatay **${fmt(amount)} Coins**`)
    .addFields(
      { name: "🏦 Bank",       value: bank.name,                              inline: true },
      { name: "💸 Fee",        value: `-${fmt(tax)} (${DEPOSIT_TAX * 100}%)`, inline: true },
      { name: "👤 Owner Cut",  value: `${fmt(taxOwner)} coins`,               inline: true },
      { name: "💼 Balance",    value: `**${fmt(newBalance)} / ${fmt(depCap)} Coins**`, inline: false },
    )
    .setColor(0x2ecc71),
    { bankOwnerId: ownerId, userId }
  );
}















export async function executeWithdraw(userId, ownerId, amount, replyFn) {
  if (isNaN(amount) || amount < MIN_WITHDRAW) {
    return replyFn(`❌ Ugu yaraan **${MIN_WITHDRAW} coins** ayaa la bixi kartaa.`);
  }
  const player = await getPlayer(userId);
  if (!player || player.level < MIN_LEVEL_USE) {
    const lvl = player ? player.level : 1;
    return replyFn({ embeds: [bankLevelGateEmbed(MIN_LEVEL_USE, lvl)] });
  }
  const bank = await getBank(ownerId);
  if (!bank) {
    return replyFn("❌ Bankgaan account kaagama diwaangashana. Hubi IDga ownerka.");
  }

  const cdKey = `${userId}_${ownerId}`;
  if (!isCooledDown(withdrawCooldowns, cdKey, WITHDRAW_CD_MS)) {
    const rem = cooldownRemaining(withdrawCooldowns, cdKey, WITHDRAW_CD_MS);
    return replyFn(`⏱️ Sug **${msToMinSec(rem)}** ka hor intaadan mar kale saarin.`);
  }

  const buPre = await getBankUser(ownerId, userId);
  const balancePre = buPre ? Number(buPre.deposited) + Number(buPre.profit) : 0;
  if (balancePre < amount) {
    return replyFn(`❌ Bankigan kaliya waxaa kuu taala: **${fmt(balancePre)} coins**  kuguma filna **${fmt(amount)}**.\nKala  bax **${fmt(balancePre)}** ama ka yar.`);
  }

  withdrawCooldowns.set(cdKey, Date.now());





  const ownerRate = WITHDRAW_OWNER_RATES[bank.level] || 0.05;
  const botRate   = WITHDRAW_BOT_RATES[bank.level] ?? WITHDRAW_BOT;
  const userRate  = 1 - ownerRate - botRate;
  const userGets  = Math.floor(amount * userRate);
  const ownerGets = Math.floor(amount * ownerRate);
  const botGets   = amount - userGets - ownerGets;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT deposited, profit FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2 FOR UPDATE`,
      [ownerId, userId]
    );
    if (locked.rowCount === 0) {
      await client.query("ROLLBACK"); withdrawCooldowns.delete(cdKey);
      return replyFn("❌ Lacag ma aadan dhigan bankigan.");
    }
    const deposited = Number(locked.rows[0].deposited);
    const profit    = Number(locked.rows[0].profit);
    const balance   = deposited + profit;
    if (balance < amount) {
      await client.query("ROLLBACK"); withdrawCooldowns.delete(cdKey);
      return replyFn(`❌ Bankigan kaliya waxaa kuu taala: **${fmt(balance)} coins** **${fmt(amount)}**.`);
    }

    let newProfit = profit, newDeposited = deposited;
    if (amount <= newProfit) {
      newProfit -= amount;
    } else {
      newDeposited = deposited - (amount - newProfit);
      newProfit = 0;
    }




    if (newDeposited <= 0 && newProfit <= 0) {
      await client.query(
        `DELETE FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2`,
        [ownerId, userId]
      );
    } else {
      await client.query(
        `UPDATE bank_users SET deposited = $1, profit = $2, last_active = $3, last_withdraw = $3
         WHERE bank_owner_id = $4 AND user_id = $5`,
        [newDeposited, newProfit, Date.now(), ownerId, userId]
      );
    }
    await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [userGets, userId]);
    const _v6 = await addVaultEarning(ownerId, ownerGets);
    if (!_v6) await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [ownerGets, ownerId]);
    await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [botGets]);
    await logTransaction(client, ownerId, userId, "withdraw", amount, null);
    if (ownerGets > 0) {


      await logTransaction(client, ownerId, ownerId, "owner_earning", ownerGets, "withdraw fee");
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK"); withdrawCooldowns.delete(cdKey);
    console.error("[BANK] executeWithdraw error:", err);
    return replyFn("❌ Khalad ayaa dhacay. Isku day mar kale.");
  } finally {
    client.release();
  }

  const ownerPct    = Math.round(ownerRate * 100);
  const userPct     = Math.round(userRate  * 100);
  const totalFeePct = 100 - userPct;
  return replyFn(null, new EmbedBuilder()
    .setTitle("💸 Withdraw Success!")
    .setDescription(`✅ Waxaad la baxday **${fmt(amount)} Coins**`)
    .addFields(
      { name: "💸 Fee",      value: `-${fmt(amount - userGets)} (${totalFeePct}%)`, inline: true },
      { name: "👑 Owner",    value: `+${fmt(ownerGets)} (${ownerPct}%)`,             inline: true },
      { name: "💼 Adigu",   value: `**+${fmt(userGets)} Coins** (${userPct}%)`,     inline: true },
    )
    .setColor(0x3498db),
    { bankOwnerId: ownerId, userId }
  );
}



async function handleDeposit(message, args) {
  const userId = message.author.id;

  const _loanCheck = await pool.query(`SELECT 1 FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL`, [userId]);
  if (_loanCheck.rowCount > 0) {
    return message.reply({ embeds: [new EmbedBuilder().setTitle("Amarka waa la diiday").setDescription("Adiga oo dayn lagugu leeyahay lacag meel ma dhigan kartid.").setColor(0xe74c3c)] });
  }

  if (!isCooledDown(depositCooldowns, userId, DEPOSIT_CD_MS)) {
    const rem = cooldownRemaining(depositCooldowns, userId, DEPOSIT_CD_MS);
    return message.reply(`⏱️ Sug **${msToMinSec(rem)}** ka hor intaadan mar kale dhigan.`);
  }
  depositCooldowns.set(userId, Date.now());

  const parsed = bankParseUserAndAmount(args, message);
  const amount = parsed.amount;
  const ownerMention = parsed.user;

  if (amount === null && !ownerMention) {
    depositCooldowns.delete(userId);
    return message.reply({ embeds: [bankUsageEmbed("!deposit <lacag> @bankowner", "!deposit 1000 @luuza", "💰 Geli lacagta aad rabto inaad dhigato.")] });
  }
  if (amount === null) {
    depositCooldowns.delete(userId);
    return message.reply({ embeds: [bankUsageEmbed("!deposit <lacag> @bankowner", "!deposit 1000 @luuza", "💰 Geli lacagta aad rabto inaad dhigato.")] });
  }
  if (!ownerMention) {
    depositCooldowns.delete(userId);
    return message.reply({ embeds: [bankUsageEmbed("!deposit <lacag> @bankowner", `!deposit ${amount} @luuza`, "💡 Waa inaad mention-garayso bankownerka.")] });
  }
  if (amount <= 0 || amount < MIN_DEPOSIT) {
    depositCooldowns.delete(userId);
    return message.reply({ embeds: [new EmbedBuilder().setTitle("❌ Lacag yar").setDescription(`Ugu yaraan **${MIN_DEPOSIT} Coin** ayaad dhigan kartaa.`).setColor(0xe74c3c)] });
  }
  if (parsed.corrected) {
    await message.channel.send({ embeds: [bankCorrectedEmbed(`!deposit ${amount} @${ownerMention.username}`)] });
  }

  const _depOwnerId = ownerMention.id;
  const _depUserId  = userId;
  await executeDeposit(_depUserId, _depOwnerId, amount,
    async (errMsg, embed, _meta) => {
      if (errMsg) { depositCooldowns.delete(_depUserId); return message.reply(errMsg); }
      if (_meta?.bankFull) {
        depositCooldowns.delete(_depUserId);
        const fullBtns = [
          new ButtonBuilder().setCustomId(`bankfull_lb_${_depUserId}`).setLabel("📋 Bank LB").setStyle(ButtonStyle.Primary),
        ];
        if (!_meta.hasPass) {
          fullBtns.push(
            new ButtonBuilder().setCustomId(`bankfull_pass_${_depUserId}_${_meta.bankOwnerId}`).setLabel("🎫 Bank Pass").setStyle(ButtonStyle.Success),
          );
        }
        fullBtns.push(
          new ButtonBuilder().setCustomId(`bankfull_invest_${_depUserId}_${_meta.bankOwnerId}`).setLabel("💼 Invest").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`bankfull_close_${_depUserId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
        );
        return message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(...fullBtns)] });
      }
      const depRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bank_viewbank_${_depOwnerId}_${_depUserId}`).setLabel("📊 View Bank").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`bank_dep_more_${_depUserId}_${_depOwnerId}`).setLabel("💰 Deposit More").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`bank_dep_close_${_depUserId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      );
      await message.reply({ embeds: [embed], components: [depRow] });
    },
    () => checkAccountAge(message.author)
  );
}



async function handleWithdraw(message, args) {
  const userId = message.author.id;
  if (!checkAccountAge(message.author)) {
    return message.reply("⚠️ Account-kaagu ma gaarin **3 maalmood**.");
  }
  const parsed = bankParseUserAndAmount(args, message);
  const ownerMention = parsed.user;
  const amount = parsed.amount;
  if (amount === null && !ownerMention) {
    return message.reply({ embeds: [bankUsageEmbed("!withdraw <lacag> @bankowner", "!withdraw 100 @luuza", "💰 Geli lacagta aad rabto inaad bixiso.")] });
  }
  if (!ownerMention) {
    return message.reply({ embeds: [bankUsageEmbed("!withdraw <lacag> @bankowner", "!withdraw 100 @luuza", "💡 Waa inaad mention-garayso bankownerka.")] });
  }
  if (amount === null) {
    return message.reply({ embeds: [bankUsageEmbed("!withdraw <lacag> @bankowner", `!withdraw 100 @${ownerMention.username}`, "💰 Geli lacagta aad rabto inaad bixiso.")] });
  }
  if (amount <= 0 || amount < MIN_WITHDRAW) {
    return message.reply({ embeds: [new EmbedBuilder().setTitle("❌ Lacag yar").setDescription(`Ugu yaraan **${fmt(MIN_WITHDRAW)} Coins** ayaad bixin kartaa.`).setColor(0xe74c3c)] });
  }
  if (parsed.corrected) {
    await message.channel.send({ embeds: [bankCorrectedEmbed(`!withdraw ${amount} @${ownerMention.username}`)] });
  }
  const _withOwnerId = ownerMention.id;
  const _withUserId  = userId;
  await executeWithdraw(_withUserId, _withOwnerId, amount,
    async (errMsg, embed, _meta) => {
      if (errMsg) return message.reply(errMsg);
      const withRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bank_dep_more_${_withUserId}_${_withOwnerId}`).setLabel("💰 Deposit Again").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`bank_viewbank_${_withOwnerId}_${_withUserId}`).setLabel("📊 View Bank").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`bank_with_close_${_withUserId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      );
      await message.reply({ embeds: [embed], components: [withRow] });
    }
  );
}



async function handleTransfer(message, args) {
  const userId = message.author.id;

  if (!checkAccountAge(message.author)) {
    return message.reply("⚠️ Account-kaagu ma gaarin **3 maalmood**.");
  }


  const mentions = [...message.mentions.users.values()];
  if (mentions.length < 2) {
    return message.reply({ embeds: [bankUsageEmbed(
      "!transfer <lacag> @fromBank @toBank",
      "!transfer 5000 @bankA @bankB",
      "💸 Lacag bank ka baxso oo bank kale dhig."
    )] });
  }


  let amount = null;
  for (const a of args) {
    if (a.startsWith("<@")) continue;
    const n = parseInt(a.replace(/,/g, ""), 10);
    if (!isNaN(n) && isFinite(n) && n > 0) { amount = n; break; }
  }

  if (!amount) {
    return message.reply({ embeds: [bankUsageEmbed(
      "!transfer <lacag> @fromBank @toBank",
      "!transfer 5000 @bankA @bankB",
      "💰 Geli lacagta aad wareejin rabto."
    )] });
  }

  if (amount < MIN_WITHDRAW) {
    return message.reply({ embeds: [new EmbedBuilder()
      .setTitle("❌ Lacag yar")
      .setDescription(`Ugu yaraan **${fmt(MIN_WITHDRAW)} Coins** ayaa la wareejin karaa.`)
      .setColor(0xe74c3c)] });
  }

  const fromOwner   = mentions[0];
  const toOwner     = mentions[1];
  const fromOwnerId = fromOwner.id;
  const toOwnerId   = toOwner.id;

  if (fromOwnerId === toOwnerId) {
    return message.reply("❌ From iyo To waa in ay ka kala duwan yihiin.");
  }


  const fromBank = await getBank(fromOwnerId);
  if (!fromBank) return message.reply(`❌ **${fromOwner.username}** ma laha bank.`);
  const toBank = await getBank(toOwnerId);
  if (!toBank) return message.reply(`❌ **${toOwner.username}** ma laha bank.`);



  const ownerRate = WITHDRAW_OWNER_RATES[fromBank.level] || 0.05;
  const userRate  = 1 - ownerRate - (WITHDRAW_BOT_RATES[fromBank.level] ?? WITHDRAW_BOT);
  const userGets  = Math.floor(amount * userRate);


  const processingEmbed = new EmbedBuilder()
    .setTitle("💸 Bank Transfer Initiated")
    .setDescription("Xawilaada lacag bank to bank kale...")
    .setColor(0xf1c40f)
    .addFields(
      { name: "🏦 From",    value: `<@${fromOwnerId}>`,  inline: true },
      { name: "🏦 To",      value: `<@${toOwnerId}>`,    inline: true },
      { name: "💰 Amount",  value: `${fmt(amount)} 🪙`,  inline: false },
      { name: "⏳ Status",  value: "Processing...",       inline: false }
    );

  const processingMsg = await message.reply({ embeds: [processingEmbed] });


  let withdrawOk  = false;
  let withdrawErr = null;

  await executeWithdraw(userId, fromOwnerId, amount, (errMsg, _embed) => {
    if (errMsg) withdrawErr = errMsg;
    else        withdrawOk  = true;
  });

  if (!withdrawOk) {
    const failEmbed = new EmbedBuilder()
      .setTitle("❌ Transfer Ma guulaysan — Withdraw")
      .setColor(0xe74c3c);
    if (typeof withdrawErr === "string") {
      failEmbed.setDescription(withdrawErr);
    } else if (withdrawErr?.embeds) {
      return processingMsg.edit({ embeds: withdrawErr.embeds, components: [] });
    }
    return processingMsg.edit({ embeds: [failEmbed], components: [] });
  }


  let depositOk  = false;
  let depositErr = null;

  await executeDeposit(userId, toOwnerId, userGets,
    async (errMsg, embed, meta) => {
      if (errMsg) {
        depositErr = errMsg;
      } else if (meta?.bankFull) {
        depositErr = embed;
      } else {
        depositOk = true;
      }
    },
    () => checkAccountAge(message.author)
  );

  if (!depositOk) {

    const warnEmbed = new EmbedBuilder()
      .setTitle("⚠️ Transfer — Deposit Failed")
      .setDescription(
        `Withdraw wuu guulaystay laakiin deposit failed ayuu noqday.\n\n` +
        `💰 **${fmt(userGets)} Coins** waxay ku jiraan walletkaaga.\n` +
        `Isku day si toos ah: \`!deposit ${userGets} @${toOwner.username}\``
      )
      .setColor(0xe67e22);
    if (typeof depositErr === "string") {
      warnEmbed.addFields({ name: "❌ Sababta", value: depositErr, inline: false });
    }
    return processingMsg.edit({ embeds: [warnEmbed], components: [] });
  }


  const successEmbed = new EmbedBuilder()
    .setTitle("✅ Xawilaada way dhamaatay")
    .setColor(0x2ecc71)
    .addFields(
      { name: "🏦 From",          value: `<@${fromOwnerId}>`,                             inline: true },
      { name: "🏦 To",            value: `<@${toOwnerId}>`,                               inline: true },
      { name: "💰 Final Amount",  value: `**${fmt(userGets)} Coins** (ka dib canshuurta)`,     inline: false }
    );

  const successRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bank_transfer_close_${userId}`)
      .setLabel("Close")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`bank_acc_details_${userId}_${toOwnerId}`)
      .setLabel(toBank.name.slice(0, 20))
      .setEmoji("📊")
      .setStyle(ButtonStyle.Secondary)
  );

  return processingMsg.edit({ embeds: [successEmbed], components: [successRow] });
}



async function handleUpgrade(message) {
  const userId = message.author.id;
  const bank = await getBank(userId);
  if (!bank) {
    return message.reply("❌ Adigu ma lihid bank. Furo mid marka hore: `!bank`");
  }
  if (bank.level === 3) {

    return sendLevel4Intro(message, userId, bank);
  }
  if (bank.level >= 4) {
    return message.reply("Bankgaaga wuxuu joogaa levelka ugu sareeya.");
  }
  if (!isCooledDown(upgradeCooldowns, userId, UPGRADE_CD_MS)) {
    const rem = cooldownRemaining(upgradeCooldowns, userId, UPGRADE_CD_MS);
    return message.reply(`⏱️ Sug **${msToMinSec(rem)}**.`);
  }

  const nextLevel = bank.level + 1;
  const cost      = UPGRADE_COSTS[nextLevel];
  const total     = await getBankTotal(userId);

  if (total < cost.minBalance) {
    return message.reply(
      `❌ Bank waa inuu lahaadaa ugu yaraan **${fmt(cost.minBalance)} coins** la dhigtay.\n` +
      `Hadda waxaa taala: **${fmt(total)} coins**`
    );
  }

  const player = await getPlayer(userId);
  if (!player) return message.reply("❌ Macluumaadkaaga lama helin.");

  const embed = new EmbedBuilder()
    .setTitle(`⬆️ Upgrade → Level ${nextLevel} ${levelStars(nextLevel)}`)
    .setColor(0x9b59b6)
    .addFields(
      { name: "📈 Profit Cusub",   value: `${PROFIT_RATES[nextLevel] * 100}%/saac`,        inline: true },
      { name: "🏦 Xad Cusub",      value: `${fmt(BANK_CAPS[nextLevel])} coins`,            inline: true },
      { name: "💰 Kharash (Coins)", value: `${fmt(cost.coins)} — Haysatid: ${fmt(player.coins)}`,      inline: false },
      { name: "💎 Kharash (Diamonds)", value: `${fmt(cost.diamonds)} — Haysatid: ${fmt(player.diamonds)}`, inline: false }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bank_upgrade_coins_${userId}_${nextLevel}`)
      .setLabel(`${fmt(cost.coins)} Coins`)
      .setEmoji("💰")
      .setStyle(ButtonStyle.Success)
      .setDisabled(Number(player.coins) < cost.coins),
    new ButtonBuilder()
      .setCustomId(`bank_upgrade_diamonds_${userId}_${nextLevel}`)
      .setLabel(`${fmt(cost.diamonds)} Diamonds`)
      .setEmoji("💎")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(Number(player.diamonds) < cost.diamonds),
    new ButtonBuilder()
      .setCustomId(`bank_upgrade_cancel_${userId}`)
      .setLabel("Jooji")
      .setStyle(ButtonStyle.Danger)
  );

  await message.reply({ embeds: [embed], components: [row] });
}





const BANKLB_PAGE_SIZE = 5;

async function buildBanklbPage(page, userId) {
  const res = await pool.query(`
    SELECT b.owner_id, b.name, b.level,
           COALESCE(SUM(bu.deposited + bu.profit), 0) AS total_money,
           COUNT(CASE WHEN bu.deposited > 0 THEN 1 END) AS user_count,
           p.level AS owner_level, p.username AS owner_name, p.is_verified AS owner_verified
    FROM banks b
    LEFT JOIN bank_users bu ON bu.bank_owner_id = b.owner_id
    LEFT JOIN players p ON p.discord_id = b.owner_id
    GROUP BY b.owner_id, b.name, b.level, p.level, p.username, p.is_verified
    ORDER BY total_money DESC
  `);

  const all        = res.rows;
  const total      = all.length;
  const slice      = all.slice(page * BANKLB_PAGE_SIZE, (page + 1) * BANKLB_PAGE_SIZE);
  const totalPages = Math.ceil(total / BANKLB_PAGE_SIZE);
  const medals     = ["🥇", "🥈", "🥉"];

  const lines = [];
  for (let i = 0; i < slice.length; i++) {
    const b         = slice[i];
    const globalIdx = page * BANKLB_PAGE_SIZE + i;
    const ownerLvl  = b.owner_level ?? "?";
    const ownerName = b.owner_name  ?? "Unknown";
    const cap       = BANK_CAPS[b.level] || BANK_CAPS[1];
    const pct       = Math.min(100, Math.round((Number(b.total_money) / cap) * 100));
    const barFull   = Math.round(pct / 10);
    const bar       = "▓".repeat(barFull) + "░".repeat(10 - barFull);
    const rank      = globalIdx < 3 ? medals[globalIdx] : `**${globalIdx + 1}.**`;
    lines.push(
      `${rank} **${b.name}** ${levelStars(b.level)}`,
      `💵 ${fmt(b.total_money)} / ${fmt(cap)} Coins`,
      `${bar} ${pct}%`,
      `👤 ${ownerName}${b.owner_verified ? " <:verify:1505450667064692817>" : ""} (Lvl ${ownerLvl})  ·  👥 ${b.user_count} users`,
      ""
    );
  }

  const embed = new EmbedBuilder()
    .setTitle("🏦  B A N K  L E A D E R B O A R D")
    .setDescription(total === 0
      ? "Wali bank lama furin Noqo qofkii ugu horeeyey ee mid furta!"
      : lines.join("\n"))
    .setColor(0xf1c40f)
    .setFooter({ text: `Bogga ${page + 1} / ${totalPages || 1}` });

  const prevBtn = new ButtonBuilder()
    .setCustomId(`banklb_prev_${userId}_${page}`)
    .setLabel("Prev")
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page === 0);

  const closeBtn = new ButtonBuilder()
    .setCustomId(`bank_lb_close_${userId}`)
    .setLabel("Close")
    .setEmoji("🗑️")
    .setStyle(ButtonStyle.Danger);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`banklb_next_${userId}_${page}`)
    .setLabel("Next")
    .setEmoji("➡️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled((page + 1) * BANKLB_PAGE_SIZE >= total);

  const components = [new ActionRowBuilder().addComponents(prevBtn, closeBtn, nextBtn)];
  return { embed, components, total };
}

async function handleBankLeaderboard(message) {
  const userId = message.author.id;
  const { embed, components, total } = await buildBanklbPage(0, userId);
  if (total === 0) {
    return message.reply({ embeds: [embed] });
  }
  return message.reply({ embeds: [embed], components });
}



async function handlePendingName(message) {
  const userId = message.author.id;
  if (!pendingBankName.has(userId)) return false;

  const { channelId } = pendingBankName.get(userId);
  if (message.channelId !== channelId) return false;

  const name = message.content.trim();

  if (!name || name.length < 2 || name.length > 40) {
    await message.reply("❌ Magacu waa inuu lahaado **2–40** xaraf. Isku day mar kale.");
    return true;
  }
  if (/[<>@#&]/.test(name)) {
    await message.reply("❌ Magaca waxaa ku jira xarfo aan la oggolayn. Isku day mid cusub.");
    return true;
  }

  const existing = await getBankByName(name);
  if (existing) {
    await message.reply(`❌ Magaca **"${name}"** horey ayuu u jiraa. Dooro magac kale.`);
    return true;
  }

  const ownBank = await getBank(userId);
  if (ownBank) {
    pendingBankName.delete(userId);
    await message.reply("❌ Horey ayaad u lahyd bank.");
    return true;
  }

  try {
    await pool.query(
      `INSERT INTO banks (owner_id, name, level) VALUES ($1, $2, 1)`,
      [userId, name]
    );
  } catch (err) {
    if (err.code === "23505") {
      await message.reply(`❌ Magaca **"${name}"** horey ayuu u jiraa. Dooro magac kale.`);
      return true;
    }
    console.error("[BANK] Insert bank error:", err);
    await message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
    return true;
  }

  pendingBankName.delete(userId);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🏦 Bank Waa La Furay!")
        .setColor(0xf1c40f)
        .setDescription(
          `✅ **${name}** waa la furay!\n\n` +
          `🏦 **Heer:** Level 1 ⭐\n` +
          `💰 **Xad:** ${fmt(BANK_CAPS[1])} coins\n` +
          `📈 **Profit:** ${PROFIT_RATES[1] * 100}%/saac (max ${MAX_PROFIT_PER_HOUR[1]} coins/saac/qof)\n\n` +
          `Dadku lacag kugu dhigan karaan: \`!deposit <lacag> @${message.author.username}\`\n` +
          `Macluumaadka: \`!bank info\``
        ),
    ],
  });
  return true;
}



const INVLB_PAGE_SIZE = 10;

async function buildInvlbPage(page, userId) {
  const res = await pool.query(
    `SELECT bi.user_id, bi.bank_owner_id, bi.amount, bi.total_earned, bi.last_claim,
            b.name AS bank_name, b.level
     FROM bank_investments bi
     JOIN banks b ON b.owner_id = bi.bank_owner_id
     WHERE bi.amount > 0
     ORDER BY bi.amount DESC`
  );
  const all    = res.rows;
  const total  = all.length;
  const slice  = all.slice(page * INVLB_PAGE_SIZE, (page + 1) * INVLB_PAGE_SIZE);
  const medals = ["🥇","🥈","🥉"];

  const _invVerified = slice.length > 0
    ? await pool.query(
        `SELECT discord_id FROM players WHERE discord_id = ANY($1::text[]) AND is_verified = true`,
        [slice.map(r => r.user_id)]
      ).then(r => new Set(r.rows.map(row => row.discord_id))).catch(() => new Set())
    : new Set();

  const lines = slice.map((r, i) => {
    const globalIdx = page * INVLB_PAGE_SIZE + i;
    const rank    = medals[globalIdx] || `**${globalIdx + 1}.**`;
    const pending = calcBankInvestProfit(Number(r.amount), Number(r.last_claim));
    const badge   = _invVerified.has(r.user_id) ? " <:verify:1505450667064692817>" : "";
    return (
      `${rank} <@${r.user_id}>${badge} — 🏦 ${r.bank_name} ${levelStars(r.level)}\n` +
      `💼 ${fmt(r.amount)} Coins  ·  📈 +${fmt(pending)} pending  ·  🧾 ${fmt(r.total_earned)} earned`
    );
  }).join("\n\n");

  const totalPages = Math.ceil(total / INVLB_PAGE_SIZE);
  const embed = new EmbedBuilder()
    .setTitle("💼 Bank Investment Leaderboard")
    .setDescription(total === 0 ? "Wali qof maalgashi sameeyey ma jiro." : lines)
    .setColor(0xf1c40f)
    .setFooter({ text: `Bogga ${page + 1} / ${totalPages || 1}  ·  ${total} maalgashi guud` });

  const prevBtn = new ButtonBuilder()
    .setCustomId(`invlb_prev_${userId}_${page}`)
    .setLabel("Prev")
    .setEmoji("⬅️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page === 0);

  const closeBtn = new ButtonBuilder()
    .setCustomId(`invlb_close_${userId}`)
    .setLabel("Close")
    .setEmoji("🗑️")
    .setStyle(ButtonStyle.Danger);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`invlb_next_${userId}_${page}`)
    .setLabel("Next")
    .setEmoji("➡️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled((page + 1) * INVLB_PAGE_SIZE >= total);

  const components = [new ActionRowBuilder().addComponents(prevBtn, closeBtn, nextBtn)];
  return { embed, components, total };
}



const SEASON_PAGE_SIZE = 10;

async function buildSeasonPage(page, userId) {
  const res = await pool.query(
    `SELECT we.user_id, we.amount, p.username, p.is_verified
     FROM weekly_earnings we
     LEFT JOIN players p ON p.discord_id = we.user_id
     WHERE we.amount > 0
     ORDER BY we.amount DESC`
  );
  const all   = res.rows;
  const total = all.length;
  const slice = all.slice(page * SEASON_PAGE_SIZE, (page + 1) * SEASON_PAGE_SIZE);

  const countdown   = nextThursdayCountdown();
  const totalPages  = Math.ceil(total / SEASON_PAGE_SIZE);

  const lines = slice.map((row, i) => {
    const globalIdx = page * SEASON_PAGE_SIZE + i;
    const medal = SEASON_MEDALS[globalIdx] || `**${globalIdx + 1}.**`;
    const name  = row.username ? row.username : `<@${row.user_id}>`;
    const badge = row.is_verified ? " <:verify:1505450667064692817>" : "";
    const coins = Number(row.amount).toLocaleString();
    return `${medal} ${name}${badge} — **${coins} coins**`;
  }).join("\n");

  const embed = new EmbedBuilder()
    .setTitle("🏆 Weekly Season Leaderboard")
    .setDescription(
      "🌟 **Top players of this week**\n\n" +
      lines +
      `\n\n⏱️ **Dhamaadka seasonka:** ${countdown}\n` +
      "💡 *samee maalgashi oo faaiid si aad ugu guulaysatid seasonal rewards ka khamiislaha!*"
    )
    .setColor(0xf1c40f)
    .setFooter({ text: `Bogga ${page + 1} / ${totalPages || 1}  ·  ${total} ciyaaryahan  ·  Dhamaad: khamiis walba 8:00 PM EAT` })
    .setTimestamp();

  const prevBtn = new ButtonBuilder()
    .setCustomId(`season_prev_${userId}_${page}`)
    .setLabel("Prev").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
    .setDisabled(page === 0);

  const closeBtn = new ButtonBuilder()
    .setCustomId(`season_close_${userId}`)
    .setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`season_next_${userId}_${page}`)
    .setLabel("Next").setEmoji("➡️").setStyle(ButtonStyle.Secondary)
    .setDisabled((page + 1) * SEASON_PAGE_SIZE >= total);

  const components = [new ActionRowBuilder().addComponents(prevBtn, closeBtn, nextBtn)];
  return { embed, components, total };
}



async function handleInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;
  const cid = interaction.customId;


  if (
    cid.startsWith("bank_invest_list_") ||
    cid.startsWith("biinvest_claim_")   ||
    cid.startsWith("biinvest_withdraw_") ||
    cid.startsWith("invlb_prev_")        ||
    cid.startsWith("invlb_next_")        ||
    cid.startsWith("myinv_prev_")        ||
    cid.startsWith("myinv_next_")        ||
    cid.startsWith("myinv_qclaim_")      ||
    cid.startsWith("banklb_prev_")       ||
    cid.startsWith("banklb_next_")       ||
    cid.startsWith("season_prev_")       ||
    cid.startsWith("season_next_")
  ) {
    return handleBankInvestInteraction(interaction);
  }


  if (interaction.isModalSubmit() && cid.startsWith("bank_modal_deposit_")) {
    const userId = cid.replace("bank_modal_deposit_", "");
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }

    const _loanCheckMod = await pool.query(`SELECT 1 FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL`, [userId]);
    if (_loanCheckMod.rowCount > 0) {
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle("Amarka waa la diiday").setDescription("Adiga oo dayn lagugu leeyahay lacag meel ma dhigan kartid.").setColor(0xe74c3c)], ephemeral: true });
    }

    const rawAmount = interaction.fields.getTextInputValue("dep_amount").trim();
    const rawOwner  = interaction.fields.getTextInputValue("dep_owner").trim();
    const amount    = parseInt(rawAmount, 10);
    const ownerId   = rawOwner.replace(/\D/g, "");

    if (!isCooledDown(depositCooldowns, userId, DEPOSIT_CD_MS)) {
      const rem = cooldownRemaining(depositCooldowns, userId, DEPOSIT_CD_MS);
      return interaction.reply({ content: `⏱️ Sug **${msToMinSec(rem)}** ka hor intaadan mar kale dhigan.`, ephemeral: true });
    }
    depositCooldowns.set(userId, Date.now());

    await interaction.deferReply({ ephemeral: true });
    await executeDeposit(userId, ownerId, amount,
      async (errMsg, embed) => {
        if (errMsg) { depositCooldowns.delete(userId); return interaction.editReply({ content: errMsg }); }
        return interaction.editReply({ embeds: [embed] });
      }
    );
    return;
  }


  if (interaction.isModalSubmit() && cid.startsWith("bank_modal_withdraw_")) {
    const userId = cid.replace("bank_modal_withdraw_", "");
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }
    const rawAmount = interaction.fields.getTextInputValue("wd_amount").trim();
    const rawOwner  = interaction.fields.getTextInputValue("wd_owner").trim();
    const amount    = parseInt(rawAmount, 10);
    const ownerId   = rawOwner.replace(/\D/g, "");

    await interaction.deferReply({ ephemeral: true });
    await executeWithdraw(userId, ownerId, amount,
      async (errMsg, embed) => {
        if (errMsg) return interaction.editReply({ content: errMsg });
        return interaction.editReply({ embeds: [embed] });
      }
    );
    return;
  }


  if (interaction.isModalSubmit() && cid.startsWith("bank_dep_more_modal_")) {
    const parts   = cid.replace("bank_dep_more_modal_", "").split("_");
    const userId  = parts[0];
    const ownerId = parts[1];
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }
    const rawAmount = interaction.fields.getTextInputValue("dep_more_amount").trim();
    const amount = parseInt(rawAmount, 10);
    if (!isCooledDown(depositCooldowns, userId, DEPOSIT_CD_MS)) {
      const rem = cooldownRemaining(depositCooldowns, userId, DEPOSIT_CD_MS);
      return interaction.reply({ content: `⏱️ Sug **${msToMinSec(rem)}**.`, ephemeral: true });
    }
    depositCooldowns.set(userId, Date.now());
    await interaction.deferReply({ ephemeral: true });
    await executeDeposit(userId, ownerId, amount,
      async (errMsg, embed) => {
        if (errMsg) { depositCooldowns.delete(userId); return interaction.editReply({ content: errMsg }); }
        return interaction.editReply({ embeds: [embed] });
      },
      null
    );
    return;
  }


  if (interaction.isModalSubmit() && cid.startsWith("bankfull_invest_modal_")) {
    const parts = cid.replace("bankfull_invest_modal_", "").split("_");
    const actorId = parts[0];
    const bankOwnerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const rawAmount = interaction.fields.getTextInputValue("invest_amount").trim().replace(/,/g, "");
      const amount = parseInt(rawAmount, 10);
      if (isNaN(amount) || amount < 100) {
        return interaction.editReply({ content: "❌ Ugu yaraan **100 Coins** ayaad maalgelin kartaa." });
      }
      if (bankOwnerId === actorId) {
        return interaction.editReply({ content: "❌ Bangigaaga adiga ma maalgashi kartid." });
      }
      const bank = await getBank(bankOwnerId);
      if (!bank) return interaction.editReply({ content: "❌ Bank lama helin." });
      const existing = await getBankInvestment(actorId, bankOwnerId);
      const currentAmt = existing ? Number(existing.amount) : 0;
      if (currentAmt >= BINV_CAP) {
        return interaction.editReply({ content: `❌ Xadka maalgashiga **${fmt(BINV_CAP)} Coins** ayaad gaartay bank-gan.\nWax kale ma dhigi kartid.` });
      }
      const roomLeft = BINV_CAP - currentAmt;
      if (amount > roomLeft) {
        return interaction.editReply({ content: `❌ Boos haray: **${fmt(roomLeft)} Coins** oo kaliya.\nXadka maalgashiga waa **${fmt(BINV_CAP)} Coins**.` });
      }
      const result = await doBankInvest(actorId, bankOwnerId, amount);
      if (!result.ok) return interaction.editReply({ content: `❌ ${result.error}` });
      const newInv = await getBankInvestment(actorId, bankOwnerId);
      const newAmt = newInv ? Number(newInv.amount) : amount;
      const rateText = newAmt <= 25_000 ? "0.25% / saac" : "0.25% (≤25k) + 0.15% / saac";
      const autoClaimLine = result.autoClaimed
        ? `\n\n💰 **Faa'iidadii hore waa la uruuriyay:** +${fmt(result.autoClaimed.userGets)} Coins → walletkaaga`
        : "";
      const investEmbed = new EmbedBuilder()
        .setTitle("💼 Maalgashi Success!")
        .setDescription(`✅ Waxaad ku maalgashay **${fmt(amount)} Coins** bank ga **${bank.name}**${autoClaimLine}`)
        .addFields(
          { name: "💼 Total Invested", value: `**${fmt(newAmt)} / ${fmt(BINV_CAP)} Coins**`, inline: true },
          { name: "📈 Profit Rate", value: `**${rateText}**`, inline: true },
        )
        .setColor(0x2ecc71)
        .setFooter({ text: "Profit waxaad claim garaysa 12h kadib" });
      const dismissBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bankfull_dismiss_${actorId}`).setLabel("Dismiss").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      );
      return interaction.editReply({ embeds: [investEmbed], components: [dismissBtn] });
    } catch (err) {
      console.error("[BANK] Invest modal error:", err);
      return interaction.editReply({ content: "❌ Khalad dhacay. Fadlan isku day mar kale." });
    }
  }




  if (interaction.isModalSubmit() && cid.startsWith("myinv_invest_modal_")) {
    const parts       = cid.replace("myinv_invest_modal_", "").split("_");
    const actorId     = parts[0];
    const bankOwnerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const rawAmount = interaction.fields.getTextInputValue("myinv_invest_amount").trim().replace(/,/g, "");
      const amount    = parseInt(rawAmount, 10);
      if (isNaN(amount) || amount < 1) {
        return interaction.editReply({ content: "❌ Lacagta aad gelinayso waa in ay ka weyn tahay 0." });
      }
      if (bankOwnerId === actorId) {
        return interaction.editReply({ content: "❌ Bangigaaga adiga ma maalgashi kartid." });
      }
      const bank = await getBank(bankOwnerId);
      if (!bank) return interaction.editReply({ content: "❌ Bank lama helin." });
      const existing   = await getBankInvestment(actorId, bankOwnerId);
      const currentAmt = existing ? Number(existing.amount) : 0;

      if (amount < 100) {
        return interaction.editReply({ content: "❌ Ugu yaraan **100 Coins** ayaad maal gashan kartaa." });
      }
      if (currentAmt >= BINV_CAP) {
        return interaction.editReply({ content: `❌ Xadka maalgashiga **${fmt(BINV_CAP)} Coins** ayaad gaartay bank-gan.` });
      }
      const roomLeft = BINV_CAP - currentAmt;
      if (amount > roomLeft) {
        return interaction.editReply({ content: `❌ Boos haray: **${fmt(roomLeft)} Coins** oo kaliya.` });
      }
      const result = await doBankInvest(actorId, bankOwnerId, amount);
      if (!result.ok) return interaction.editReply({ content: `❌ ${result.error}` });
      const newInv  = await getBankInvestment(actorId, bankOwnerId);
      const newAmt  = newInv ? Number(newInv.amount) : amount;
      const newRoom = Math.max(0, BINV_CAP - newAmt);
      const isAddingTo = currentAmt > 0;
      const autoClaimLine = result.autoClaimed
        ? `\n\n💰 **Faa'iidadii hore waa la uruuriyay:** +${fmt(result.autoClaimed.userGets)} Coins → walletkaaga`
        : "";
      const investEmbed = new EmbedBuilder()
        .setTitle(isAddingTo ? "💼 Lacag ayaad ku dartay Maalgashiga!" : "💼 Maalgashi Cusub success!")
        .setDescription(
          (isAddingTo
            ? `✅ Waxaad ku dartay **${fmt(amount)} Coins** maalgashigaagii hore ee bank-ga **${bank.name}**`
            : `✅ Waxaad kuu bilaabatay maalgashi cusub: **${fmt(amount)} Coins** — **${bank.name}**`
          ) + autoClaimLine
        )
        .addFields(
          { name: "💼 Maalgashiga Guud",  value: `**${fmt(newAmt)} / ${fmt(BINV_CAP)} Coins**`, inline: true },
          { name: "📦 Booskaaga Haray",   value: `**${fmt(newRoom)} Coins**`,                    inline: true },
          { name: "📈 Rate",              value: `0.25%/saac (≤25k) · +0.15%/saac`,              inline: true },
        )
        .setColor(0x2ecc71)
        .setFooter({ text: "Profit waxaad claim garaysa 12h kadib" });
      return interaction.editReply({ embeds: [investEmbed] });
    } catch (err) {
      console.error("[BANK] myinv_invest_modal error:", err);
      return interaction.editReply({ content: "❌ Khalad dhacay. Fadlan isku day mar kale." });
    }
  }

  if (!interaction.isButton()) return;


  if (cid.startsWith("bank_acc_deposit_")) {
    const ownerId = cid.replace("bank_acc_deposit_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
    }

    const _loanCheckBtn = await pool.query(`SELECT 1 FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL`, [interaction.user.id]);
    if (_loanCheckBtn.rowCount > 0) {
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle("Amarka waa la diiday").setDescription("Adiga oo dayn lagugu leeyahay lacag meel ma dhigan kartid.").setColor(0xe74c3c)], ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`bank_modal_deposit_${ownerId}`)
      .setTitle("💰 Bank Deposit");
    const amountInput = new TextInputBuilder()
      .setCustomId("dep_amount")
      .setLabel("Lacagta aad dhigayso (Coins)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Tusaale: 5000")
      .setRequired(true)
      .setMaxLength(10);
    const ownerInput = new TextInputBuilder()
      .setCustomId("dep_owner")
      .setLabel("Bank Owner ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Kudar ID-ga ownerka bangiga chatka ku qor ?info @user kadib carlBot ayaa ID ka arkaysaa")
      .setRequired(true)
      .setMaxLength(20);
    modal.addComponents(
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(ownerInput)
    );
    return interaction.showModal(modal);
  }


  if (cid.startsWith("bank_acc_withdraw_")) {
    const ownerId = cid.replace("bank_acc_withdraw_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
    }
    const modal = new ModalBuilder()
      .setCustomId(`bank_modal_withdraw_${ownerId}`)
      .setTitle("💸 Bank Withdrawal");
    const amountInput = new TextInputBuilder()
      .setCustomId("wd_amount")
      .setLabel("Lacagta aad la baxayso (Coins)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ugu yaraan 100")
      .setRequired(true)
      .setMaxLength(10);
    const ownerInput = new TextInputBuilder()
      .setCustomId("wd_owner")
      .setLabel("Bank Owner ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Kudar ID-ga ownerka bangiga")
      .setRequired(true)
      .setMaxLength(20);
    modal.addComponents(
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(ownerInput)
    );
    return interaction.showModal(modal);
  }


  if (cid.startsWith("bankfull_lb_")) {
    const actorId = cid.replace("bankfull_lb_", "");
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Buttonkaaga ma ahan.", ephemeral: true });
    }
    const res = await pool.query(`
      SELECT b.owner_id, b.name, b.level,
             COALESCE(SUM(bu.deposited + bu.profit), 0) AS total_money,
             COUNT(CASE WHEN bu.deposited > 0 THEN 1 END) AS user_count,
             p.level AS owner_level, p.username AS owner_name
      FROM banks b
      LEFT JOIN bank_users bu ON bu.bank_owner_id = b.owner_id
      LEFT JOIN players p ON p.discord_id = b.owner_id
      GROUP BY b.owner_id, b.name, b.level, p.level, p.username
      ORDER BY total_money DESC
      LIMIT 10
    `);
    if (res.rows.length === 0) {
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle("🏦 Bank Leaderboard").setDescription("Wali bank la furin.").setColor(0xf1c40f)], ephemeral: true });
    }
    const medals = ["🥇", "🥈", "🥉"];
    const lines = [];
    for (let i = 0; i < res.rows.length; i++) {
      const b = res.rows[i];
      const ownerName = b.owner_name ?? "Unknown";
      const cap = BANK_CAPS[b.level] || BANK_CAPS[1];
      const pct = Math.min(100, Math.round((Number(b.total_money) / cap) * 100));
      const barFull = Math.round(pct / 10);
      const bar = "▓".repeat(barFull) + "░".repeat(10 - barFull);
      if (i < 3) {
        lines.push(`${medals[i]} **${b.name}** ${levelStars(b.level)}\n💵 ${fmt(b.total_money)} / ${fmt(cap)} Coins\n${bar} ${pct}%\n👤 ${ownerName} (Lvl ${b.owner_level ?? "?"})  ·  👥 ${b.user_count} users\n`);
      } else {
        lines.push(`**${i + 1}.** **${b.name}** ${levelStars(b.level)}\n💵 ${fmt(b.total_money)} · 👤 ${ownerName} · 👥 ${b.user_count}\n`);
      }
    }
    const lbEmbed = new EmbedBuilder()
      .setTitle("🏦  B A N K  L E A D E R B O A R D")
      .setDescription(lines.join("\n"))
      .setColor(0xf1c40f)
      .setFooter({ text: "!deposit <lacag> @bankowner — dhig bank kale" });
    const dismissBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bankfull_dismiss_${actorId}`).setLabel("Dismiss").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
    );
    return interaction.reply({ embeds: [lbEmbed], components: [dismissBtn], ephemeral: true });
  }


  if (cid.startsWith("bankfull_pass_")) {
    const parts = cid.replace("bankfull_pass_", "").split("_");
    const actorId = parts[0];
    const bankOwnerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Buttonkaaga ma ahan.", ephemeral: true });
    }
    const player = await getPlayer(actorId);
    const canAfford = player && Number(player.coins) >= BANK_PASS_COST;
    const passEmbed = new EmbedBuilder()
      .setTitle("🎫 Bank Pass")
      .setDescription(`Bank Pass waxay kordhinaysaa limit-kaaga deposit ee bank-kan.\n\n**${fmt(MAX_DEPOSIT_PER_USER)} → ${fmt(MAX_DEPOSIT_PER_USER + BANK_PASS_EXTRA)} Coins**`)
      .addFields(
        { name: "💰 Qiimaha", value: `**${fmt(BANK_PASS_COST)} Coins**`, inline: true },
        { name: "📊 Lacagtaada", value: `**${fmt(player?.coins ?? 0)} Coins**`, inline: true },
        { name: "ℹ️ Faahfaahin", value: "Hal mar ayaa loo isticmaali karaa bank-kan oo keliya.\n95% botka · 5% bank ownerka", inline: false },
      )
      .setColor(canAfford ? 0x2ecc71 : 0xe74c3c);
    const passRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bankpass_confirm_${actorId}_${bankOwnerId}`).setLabel("✅ Iibso").setStyle(ButtonStyle.Success).setDisabled(!canAfford),
      new ButtonBuilder().setCustomId(`bankfull_dismiss_${actorId}`).setLabel("❌ Jooji").setStyle(ButtonStyle.Danger)
    );
    return interaction.reply({ embeds: [passEmbed], components: [passRow], ephemeral: true });
  }


  if (cid.startsWith("bankpass_confirm_")) {
    const parts = cid.replace("bankpass_confirm_", "").split("_");
    const actorId = parts[0];
    const bankOwnerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Buttonkaaga ma ahan.", ephemeral: true });
    }
    const existing = await pool.query(
      `SELECT has_bank_pass FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2`, [bankOwnerId, actorId]
    );
    if (existing.rows[0]?.has_bank_pass) {
      return interaction.update({ content: "\u200B", embeds: [new EmbedBuilder().setTitle("⚠️ Horey ayaad u leedahay").setDescription("Bank Pass bank-kan horey ayaad u iibsatay.").setColor(0xf39c12)], components: [] });
    }
    const player = await getPlayer(actorId);
    if (!player || Number(player.coins) < BANK_PASS_COST) {
      return interaction.update({ content: "\u200B", embeds: [new EmbedBuilder().setTitle("❌ Lacag kugu filan ma haysatid").setDescription(`Waxaad u baahan tahay **${fmt(BANK_PASS_COST)} Coins**.`).setColor(0xe74c3c)], components: [] });
    }
    const botCut = Math.floor(BANK_PASS_COST * BANK_PASS_BOT_CUT);
    const ownerCut = BANK_PASS_COST - botCut;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const debit = await client.query(`UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`, [BANK_PASS_COST, actorId]);
      if (debit.rowCount === 0) { await client.query("ROLLBACK"); return interaction.update({ content: "\u200B", embeds: [new EmbedBuilder().setTitle("❌ Lacag kugu filan ma haysatid").setColor(0xe74c3c)], components: [] }); }
      await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [botCut]);
      const _v7 = await addVaultEarning(bankOwnerId, ownerCut);
      if (!_v7) await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [ownerCut, bankOwnerId]);
      await client.query(
        `INSERT INTO bank_users (bank_owner_id, user_id, deposited, profit, last_active, has_bank_pass)
         VALUES ($1, $2, 0, 0, $3, TRUE)
         ON CONFLICT (bank_owner_id, user_id) DO UPDATE SET has_bank_pass = TRUE`,
        [bankOwnerId, actorId, Date.now()]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[BANK] Bank Pass purchase error:", err);
      return interaction.update({ content: "\u200B", embeds: [new EmbedBuilder().setTitle("❌ Khalad dhacay").setDescription("Fadlan isku day mar kale.").setColor(0xe74c3c)], components: [] });
    } finally {
      client.release();
    }
    return interaction.update({
      content: "\u200B",
      embeds: [new EmbedBuilder()
        .setTitle("🎫 Bank Pass — Waad Iibsatay!")
        .setDescription(`Limit-kaaga deposit wuxuu noqday **${fmt(MAX_DEPOSIT_PER_USER + BANK_PASS_EXTRA)} Coins** bank-kan.`)
        .addFields(
          { name: "💰 Lacag la jariyey", value: `**${fmt(BANK_PASS_COST)} Coins**`, inline: true },
          { name: "🏦 Limit cusub", value: `**${fmt(MAX_DEPOSIT_PER_USER + BANK_PASS_EXTRA)} Coins**`, inline: true },
        )
        .setColor(0x2ecc71)
      ],
      components: []
    });
  }


  if (interaction.isButton() && cid.startsWith("bankfull_invest_")) {
    const parts = cid.replace("bankfull_invest_", "").split("_");
    const actorId = parts[0];
    const bankOwnerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Buttonkaaga ma ahan.", ephemeral: true });
    }
    const bank = await getBank(bankOwnerId);
    if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });
    const modal = new ModalBuilder()
      .setCustomId(`bankfull_invest_modal_${actorId}_${bankOwnerId}`)
      .setTitle(`💼 Invest — ${bank.name}`);
    const amountInput = new TextInputBuilder()
      .setCustomId("invest_amount")
      .setLabel("Lacagta aad maalgalinayso (Coins)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ugu yaraan 100 · Max 100,000")
      .setRequired(true)
      .setMaxLength(10);
    modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
    return interaction.showModal(modal);
  }


  if (cid.startsWith("bankfull_dismiss_")) {
    const actorId = cid.replace("bankfull_dismiss_", "");
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Buttonkaaga ma ahan.", ephemeral: true });
    }
    try {
      await interaction.update({ content: "\u200B", embeds: [], components: [] });
    } catch { try { await interaction.deferUpdate(); } catch {} }
    return;
  }


  if (cid.startsWith("myinv_bank_")) {
    const parts   = cid.replace("myinv_bank_", "").split("_");
    const actorId = parts[0];
    const ownerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }
    try {
      const inv = await getBankInvestment(actorId, ownerId);
      if (!inv || Number(inv.amount) <= 0) {
        return interaction.reply({ content: "❌ Maalgashi ma haysatid bangigan.", ephemeral: true });
      }
      const bank    = await getBank(ownerId);
      if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });

      const amount  = Number(inv.amount);
      const pending = calcBankInvestProfit(amount, Number(inv.last_claim));
      const locked  = Date.now() - Number(inv.deposited_at) < BINV_WITHDRAW_CD;
      const remMs   = locked ? BINV_WITHDRAW_CD - (Date.now() - Number(inv.deposited_at)) : 0;
      const remH    = Math.floor(remMs / 3_600_000);
      const remM    = Math.floor((remMs % 3_600_000) / 60_000);
      const roomLeft = Math.max(0, BINV_CAP - amount);

      const detailEmbed = new EmbedBuilder()
        .setTitle(`🏦 Ku soo dhowow ${bank.name} ${levelStars(bank.level)}`)
        .setDescription(`👤 <@${ownerId}>  ·  ⭐ Level ${bank.level}\n💡 Lacagtaada ayaa kuu shaqeenaysa`)
        .addFields(
          { name: "💼 Invested",       value: `${fmt(amount)} Coins`,                                 inline: true },
          { name: "📈 Pending Profit", value: `+${fmt(pending)} Coins`,                               inline: true },
          { name: "🧾 Total Earned",   value: `${fmt(inv.total_earned)} Coins`,                       inline: true },
          { name: "📊 Rate",           value: `0.25%/saac (≤25k) · +0.15%/saac (extra)`,              inline: true },
          { name: "💼 Room Left",      value: `${fmt(roomLeft)} / ${fmt(BINV_CAP)} Coins`,            inline: true },
          { name: "🔒 Withdraw",       value: locked ? `Locked — ${remH}h ${remM}m haray` : "✅ Diyaar", inline: true },
        )
        .setColor(0x2ecc71)
        .setFooter({ text: "95% adiga · 3% owner · 2% bot  |  Claim: 12h · Withdraw: 24h" });

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`biinvest_claim_${ownerId}_${actorId}`)
          .setLabel(pending > 0 ? `📈 Claim (+${fmt(pending)})` : "📈 Claim")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pending <= 0),
        new ButtonBuilder()
          .setCustomId(`biinvest_withdraw_${ownerId}_${actorId}`)
          .setLabel("💸 Withdraw")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(locked),
        new ButtonBuilder()
          .setCustomId(`myinv_invest_${actorId}_${ownerId}`)
          .setLabel("💼 Invest More")
          .setStyle(ButtonStyle.Success)
          .setDisabled(roomLeft <= 0),
        new ButtonBuilder()
          .setCustomId(`myinv_close_${actorId}`)
          .setLabel("Close")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({ embeds: [detailEmbed], components: [actionRow], ephemeral: true });
    } catch (err) {
      console.error("[BANK] myinv_bank handler error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay.", ephemeral: true });
    }
  }



  if (cid.startsWith("myinv_invest_") && !cid.startsWith("myinv_invest_modal_")) {
    const parts   = cid.replace("myinv_invest_", "").split("_");
    const actorId = parts[0];
    const ownerId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }



    try {
      const modal = new ModalBuilder()
        .setCustomId(`myinv_invest_modal_${actorId}_${ownerId}`)
        .setTitle("💼 Ku dar Maalgashi");
      const amountInput = new TextInputBuilder()
        .setCustomId("myinv_invest_amount")
        .setLabel("Lacagta aad ku dari doonto (Coins)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(`Ugu yaraan 100 · Max ${fmt(BINV_CAP)} Coins`)
        .setRequired(true)
        .setMaxLength(10);
      modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
      return interaction.showModal(modal);
    } catch (err) {
      console.error("[BANK] myinv_invest button error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true });
    }
  }


  const CLOSE_PREFIXES = [
    "bank_acc_close_", "bank_info_close_", "bank_lb_close_",
    "bank_nobank_close_", "bank_owner_close_",
    "bank_dep_close_", "bank_with_close_", "bankfull_close_",
    "myinv_close_", "invlb_close_", "season_close_",
    "bank_transfer_close_",
  ];
  const matchedClose = CLOSE_PREFIXES.find(p => cid.startsWith(p));
  if (matchedClose) {
    const closerId = cid.slice(matchedClose.length);
    if (interaction.user.id !== closerId) {
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    }

    const flags = interaction.message?.flags;
    const isEphemeral = flags
      ? (typeof flags.has === "function" ? flags.has(64) : !!((flags.bitfield ?? flags ?? 0) & 64))
      : false;
    if (isEphemeral) {

      try {
        await interaction.update({ content: "\u200B", embeds: [], components: [] });
      } catch {
        try { await interaction.deferUpdate(); } catch {}
      }
    } else {

      try {
        await interaction.deferUpdate();
        await interaction.message.delete().catch(() => {});
      } catch {
        try { await interaction.deferUpdate(); } catch {}
      }
    }
    return;
  }


  if (cid.startsWith("bank_viewbank_")) {
    const parts = cid.replace("bank_viewbank_", "").split("_");
    const ownerId = parts[0];
    const actorId = parts[1];
    if (interaction.user.id !== actorId) {
      return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
    }
    try {
      const bank = await getBank(ownerId);
      if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });
      const embed = await buildOwnerBankEmbed(bank, ownerId);
      return interaction.reply({ embeds: [embed], components: buildOwnerBankRows(ownerId), ephemeral: true });
    } catch (err) {
      console.error("[BANK] bank_viewbank handler error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay.", ephemeral: true });
    }
  }


  if (cid.startsWith("bank_dep_more_")) {
    const parts = cid.replace("bank_dep_more_", "").split("_");
    const depUserId  = parts[0];
    const depOwnerId = parts[1];
    if (interaction.user.id !== depUserId) {
      return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
    }
    const modal = new ModalBuilder()
      .setCustomId(`bank_dep_more_modal_${depUserId}_${depOwnerId}`)
      .setTitle("💰 Deposit More");
    const amtInput = new TextInputBuilder()
      .setCustomId("dep_more_amount")
      .setLabel("Lacagta aad dhiganeyso (Coins)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Tusaale: 5000")
      .setRequired(true)
      .setMaxLength(10);
    modal.addComponents(new ActionRowBuilder().addComponents(amtInput));
    return interaction.showModal(modal);
  }


  if (cid.startsWith("bank_acc_details_")) {
    const parts = cid.replace("bank_acc_details_", "").split("_");
    const accUserId  = parts[0];
    const accOwnerId = parts[1];
    if (interaction.user.id !== accUserId) {
      return interaction.reply({ content: "❌ This is not your menu.", ephemeral: true });
    }
    try {
      const bu = await getBankUser(accOwnerId, accUserId);
      if (!bu) return interaction.reply({ content: "❌ Lacag ma aadan dhigan bangigan.", ephemeral: true });
      const bank = await getBank(accOwnerId);
      if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });
      const dep     = Number(bu.deposited);
      const profit  = Number(bu.profit);
      const total   = dep + profit;
      const cap     = BANK_CAPS[bank.level];
      const rate    = PROFIT_RATES[bank.level] || 0.005;
      const next    = calcHourlyProfit(bank.level, dep, bu.last_active);
      const lastPr  = bu.last_active ? new Date(Number(bu.last_active)).toLocaleString("en-GB") : "—";
      const detailEmbed = new EmbedBuilder()
        .setTitle(`📊 ${bank.name} ${levelStars(bank.level)}`)
        .setDescription(`👤 Owner: <@${accOwnerId}>  ·  ⭐ Level ${bank.level}`)
        .addFields(
          { name: "💰 Deposited",   value: `${fmt(dep)} Coins`,                inline: true },
          { name: "📈 Profit",      value: `+${fmt(profit)} Coins`,             inline: true },
          { name: "💼 Total",       value: `${fmt(total)} Coins`,               inline: true },
          { name: "📊 Rate",        value: `+${rate * 100}% / saac`,            inline: true },
          { name: "🔜 Next Profit", value: `≈+${fmt(next)} Coins / saac`,       inline: true },
          { name: "🏦 Bank Cap",    value: `${fmt(cap)} Coins`,                 inline: true },
          { name: "🕐 Last Update", value: lastPr,                              inline: false },
        )
        .setColor(0x2ecc71);
      const detailRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`bank_acc_back_${accUserId}`)
          .setLabel("◀ Back to Banks")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`bank_acc_close_${accUserId}`)
          .setLabel("Close")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Danger),
      );
      return interaction.update({ embeds: [detailEmbed], components: [detailRow] });
    } catch (err) {
      console.error("[BANK] acc_details handler error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay.", ephemeral: true });
    }
  }


  if (cid.startsWith("bank_acc_back_")) {
    const accUserId = cid.replace("bank_acc_back_", "");
    if (interaction.user.id !== accUserId) {
      return interaction.reply({ content: "❌ This is not your menu.", ephemeral: true });
    }
    try {
      const res = await pool.query(
        `SELECT bu.bank_owner_id, bu.deposited, bu.profit, bu.last_active, b.name, b.level
         FROM bank_users bu
         JOIN banks b ON b.owner_id = bu.bank_owner_id
         WHERE bu.user_id = $1 AND (bu.deposited + bu.profit) > 0
         ORDER BY (bu.deposited + bu.profit) DESC`,
        [accUserId]
      );
      if (res.rows.length === 0) {
        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("🏦 Bank Accounts")
              .setDescription("❌ Wax bank account ma lihid\n\n💡 Dhig lacag bank kasta:\n`!deposit <lacag> @bankowner`")
              .setColor(0xe74c3c),
          ],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`bank_acc_close_${accUserId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
          )],
        });
      }
      const bankLines = res.rows.map(row => {
        const deposited  = Number(row.deposited);
        const profit     = Number(row.profit);
        const liveProfit = calcHourlyProfit(row.level, deposited, row.last_active);
        const total      = deposited + profit;
        return [
          `📍 **${row.name}** ${levelStars(row.level)}`,
          `💰 Deposited: ${fmt(deposited)}`,
          `📈 Profit: +${fmt(profit)}  (≈+${fmt(liveProfit)}/saac next)`,
          `💼 Total: **${fmt(total)} Coins**`,
        ].join("\n");
      }).join("\n\n");
      const listEmbed = new EmbedBuilder()
        .setTitle("🏦 Bank Accounts")
        .setDescription(bankLines + "\n\n📥 **Deposit Fee:** 2%  ·  📤 **Withdraw Fee:** 8–10% (by bank level)\n💡 *Lacagtaada ayaa kuu shaqeenaysa*")
        .setColor(0xf1c40f)
        .setFooter({ text: "Profit waxaa lagu daraa saacad kasta · Max: L1=83 · L2=208 · L3=417 coins/saac" });
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bank_acc_deposit_${accUserId}`).setLabel("💰 Deposit").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`bank_acc_withdraw_${accUserId}`).setLabel("💸 Withdraw").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`bank_acc_close_${accUserId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      );
      const bankButtons = res.rows.slice(0, 16).map(row =>
        new ButtonBuilder()
          .setCustomId(`bank_acc_details_${accUserId}_${row.bank_owner_id}`)
          .setLabel(row.name.slice(0, 20))
          .setEmoji("📊")
          .setStyle(ButtonStyle.Secondary)
      );
      const components = [actionRow];
      for (let i = 0; i < bankButtons.length; i += 4) {
        components.push(new ActionRowBuilder().addComponents(...bankButtons.slice(i, i + 4)));
      }
      return interaction.update({ embeds: [listEmbed], components });
    } catch (err) {
      console.error("[BANK] acc_back handler error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay.", ephemeral: true });
    }
  }


  if (cid.startsWith("bank_users_btn_")) {
    const ownerId = cid.replace("bank_users_btn_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Bank owner kaliya ayaa tan arki kara.", ephemeral: true });
    }
    try {
      const bank = await getBank(ownerId);
      if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });
      const usersRes = await pool.query(
        `SELECT user_id, deposited, profit FROM bank_users WHERE bank_owner_id = $1 AND deposited > 0 ORDER BY (deposited + profit) DESC`,
        [ownerId]
      );
      const users = usersRes.rows;
      if (users.length === 0) {
        return interaction.reply({ content: "❌ Wali users ma jiraan.", ephemeral: true });
      }
      const lines = users.slice(0, 15).map((u, i) => {
        const bal = Number(u.deposited) + Number(u.profit);
        return `\`#${i + 1}\` <@${u.user_id}> — 💰 ${fmt(bal)} (profit: +${fmt(u.profit)})`;
      }).join("\n");
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`👥 ${bank.name} — Users`)
          .setDescription(lines)
          .setColor(0xf1c40f)
          .setFooter({ text: `${users.length} users total` })],
        ephemeral: true,
      });
    } catch (err) {
      console.error("[BANK] bank_users_btn handler error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay.", ephemeral: true });
    }
  }


  if (cid.startsWith("bank_open_coins_")) {
    const ownerId = cid.replace("bank_open_coins_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Badhankaan kaaga ma aha.", ephemeral: true });
    }
    const player = await getPlayer(ownerId);
    if (!player || Number(player.coins) < BANK_OPEN_COST_COINS) {
      return interaction.reply({
        content:
          `❌ Lacag kugu filan ma haysatid.\n` +
          `💰coins Haysatid: **${fmt(player?.coins || 0)}** coins u  Baahan tahay: **${fmt(BANK_OPEN_COST_COINS)}**`,
        ephemeral: true,
      });
    }
    if (player.level < MIN_LEVEL_OPEN) {
      return interaction.reply({ embeds: [bankLevelGateEmbed(MIN_LEVEL_OPEN, player.level)], flags: 64 });
    }
    if (await getBank(ownerId)) {
      return interaction.reply({ content: "❌ Horey ayaad u lahyd bank.", ephemeral: true });
    }
    const r = await pool.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`,
      [BANK_OPEN_COST_COINS, ownerId]
    );
    if (r.rowCount === 0) {
      return interaction.reply({ content: "❌ Lacag kugu filan ma haysatid.", ephemeral: true });
    }
    pendingBankName.set(ownerId, { channelId: interaction.channelId });
    return interaction.reply({
      content:
        `🎉 **Hambalyo!** Waxaad Bank ka furatay Nasiib Bot!\n\n` +
        `Fadlan soo qor **magaca bangigaaga** halkaan hoose.\n` +
        `⚠️ Magaca **lama badali karo** markii la doorto.`,
      ephemeral: true,
    });
  }


  if (cid.startsWith("bank_open_diamonds_")) {
    const ownerId = cid.replace("bank_open_diamonds_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Badhanka kaaga ma aha.", ephemeral: true });
    }
    const player = await getPlayer(ownerId);
    if (!player || Number(player.diamonds) < BANK_OPEN_COST_DIAMONDS) {
      return interaction.reply({
        content:
          `❌ Diamonds kugu filan ma haysatid.\n` +
          `💎 diamondka Haysatid: **${fmt(player?.diamonds || 0)}** — diamondka u Baahan tahay: **${fmt(BANK_OPEN_COST_DIAMONDS)}**`,
        ephemeral: true,
      });
    }
    if (player.level < MIN_LEVEL_OPEN) {
      return interaction.reply({ embeds: [bankLevelGateEmbed(MIN_LEVEL_OPEN, player.level)], flags: 64 });
    }
    if (await getBank(ownerId)) {
      return interaction.reply({ content: "❌ Horey ayaad u lahyd bank.", ephemeral: true });
    }
    const r = await pool.query(
      `UPDATE players SET diamonds = diamonds - $1 WHERE discord_id = $2 AND diamonds >= $1 RETURNING diamonds`,
      [BANK_OPEN_COST_DIAMONDS, ownerId]
    );
    if (r.rowCount === 0) {
      return interaction.reply({ content: "❌ Diamonds kugu filan ma haysatid.", ephemeral: true });
    }
    pendingBankName.set(ownerId, { channelId: interaction.channelId });
    return interaction.reply({
      content:
        `🎉 **Hambalyo!** Waxaad Bank ka furatay Nasiib Bot!\n\n` +
        `Fadlan soo qor **magaca bangigaaga** halkaan hoose.\n` +
        `⚠️ Magaca **lama badali karo** markii la doorto.`,
      ephemeral: true,
    });
  }


  if (cid.startsWith("bank_info_")) {
    const ownerId = cid.replace("bank_info_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Kaliya bank owner ayaa arki kara.", ephemeral: true });
    }
    const bank = await getBank(ownerId);
    if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });

    const usersRes = await pool.query(
      `SELECT * FROM bank_users WHERE bank_owner_id = $1 ORDER BY (deposited + profit) DESC`,
      [ownerId]
    );
    const users = usersRes.rows.filter(u => Number(u.deposited) + Number(u.profit) > 0);
    const total = users.reduce((s, u) => s + Number(u.deposited) + Number(u.profit), 0);
    const totalProfit = users.reduce((s, u) => s + Number(u.profit), 0);

    let userLines = "Wali lacag la dhigtay ma jirto.";
    if (users.length > 0) {
      userLines = users.slice(0, 15).map((u, i) => {
        return `**${i + 1}.** <@${u.user_id}> — ${fmt(Number(u.deposited) + Number(u.profit))} coins`;
      }).join("\n");
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`📊 ${bank.name} — Bank Insights`)
          .setColor(0x2ecc71)
          .addFields(
            { name: "💰 Wadarta guud",       value: `${fmt(total)} coins`,       inline: true },
            { name: "📈wadarta  Profitka",        value: `${fmt(totalProfit)} coins`, inline: true },
            { name: "👥 Users",         value: `${users.length}`,           inline: true },
            { name: "🏆 Top Depositors", value: userLines,                  inline: false }
          ),
      ],
      ephemeral: true,
    });
  }


  if (cid.startsWith("bank_upgrade_") && !cid.includes("coins_") && !cid.includes("diamonds_") && !cid.includes("cancel")) {
    const ownerId = cid.replace("bank_upgrade_", "");
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Badhanka kaaga ma aha.", ephemeral: true });
    }
    const bank = await getBank(ownerId);
    if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });
    if (bank.level === 3) {

      return sendLevel4Intro(interaction, ownerId, bank);
    }
    if (bank.level >= 4) {
      return interaction.reply({ content: "Bankgaaga wuxuu joogaa levelka ugu sareeya.", ephemeral: true });
    }
    const nextLevel = bank.level + 1;
    const cost = UPGRADE_COSTS[nextLevel];
    const currentTotal = await getBankTotal(ownerId);
    const player = await getPlayer(ownerId);

    if (currentTotal < cost.minBalance) {
      return interaction.reply({
        content: `❌ Bank waa inuu lahaadaa **${fmt(cost.minBalance)} coins** oo dhigasho ah. hada inta taala: **${fmt(currentTotal)}**`,
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`bank_upgrade_coins_${ownerId}_${nextLevel}`)
        .setLabel(`${fmt(cost.coins)} Coins`)
        .setEmoji("💰")
        .setStyle(ButtonStyle.Success)
        .setDisabled(Number(player?.coins || 0) < cost.coins),
      new ButtonBuilder()
        .setCustomId(`bank_upgrade_diamonds_${ownerId}_${nextLevel}`)
        .setLabel(`${fmt(cost.diamonds)} Diamonds`)
        .setEmoji("💎")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(Number(player?.diamonds || 0) < cost.diamonds),
      new ButtonBuilder()
        .setCustomId(`bank_upgrade_cancel_${ownerId}`)
        .setLabel("Jooji")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`⬆️ Upgrade → Level ${nextLevel} ${levelStars(nextLevel)}`)
          .setColor(0x9b59b6)
          .addFields(
            { name: "📈 Profit Cusub",      value: `${PROFIT_RATES[nextLevel] * 100}%/saac`,               inline: true },
            { name: "🏦 Xad Cusub",         value: `${fmt(BANK_CAPS[nextLevel])} coins`,                   inline: true },
            { name: "💰 Coins",             value: `${fmt(cost.coins)} — Haysatid: ${fmt(player?.coins || 0)}`,   inline: false },
            { name: "💎 Diamonds",          value: `${fmt(cost.diamonds)} — Haysatid: ${fmt(player?.diamonds || 0)}`, inline: false }
          ),
      ],
      components: [row],
      ephemeral: true,
    });
  }


  if (cid.startsWith("bank_upgrade_coins_")) {
    const parts = cid.replace("bank_upgrade_coins_", "").split("_");
    const ownerId   = parts[0];
    const nextLevel = parseInt(parts[1], 10);
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Badhanka kaaga ma aha.", ephemeral: true });
    }
    return doUpgrade(interaction, ownerId, nextLevel, "coins");
  }


  if (cid.startsWith("bank_upgrade_diamonds_")) {
    const parts = cid.replace("bank_upgrade_diamonds_", "").split("_");
    const ownerId   = parts[0];
    const nextLevel = parseInt(parts[1], 10);
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: "❌ Badhanka kaaga ma aha.", ephemeral: true });
    }
    return doUpgrade(interaction, ownerId, nextLevel, "diamonds");
  }


  if (cid.startsWith("bank_upgrade_cancel_")) {
    return interaction.reply({ content: "✅ Upgrade waa la joojiyay.", ephemeral: true });
  }


  if (cid.startsWith("bank_howto_")) {
    return interaction.reply({
      content:
        `**📘 Sida Loo Isticmaalo Bangiga:**\n\n` +
        `💰 **Dhigo:** \`!deposit <lacag> @owner\`\n` +
        `💸 **La bax:** \`!withdraw <lacag> @owner\`\n` +
        `📊 **Macluumaad:** \`!bank info\` (owner kaliya)\n` +
        `⬆️ **Upgrade:** \`!upgrade bank\`\n` +
        `🏆 **Leaderboard:** \`!bank leaderboard\`\n\n` +
        `⚠️ Deposit: 2% canshuur botka ayaa qaadanaya.\n` +
        `⚠️ Withdrawal: 92% adigaa leh · 5-7% Bank owner (level ku xiran) · 3% botka leh.\n` +
        `📈 Profit: Saacad kasta waxaa kuu kordhaya lacag ku salaysan heerka bankga (max: L1=83 · L2=208 · L3=417 coins/saac).`,
      ephemeral: true,
    });
  }
}



async function doUpgrade(interaction, ownerId, nextLevel, payWith) {
  if (!isCooledDown(upgradeCooldowns, ownerId, UPGRADE_CD_MS)) {
    return interaction.reply({ content: "⏱️ Sug wax yar.", ephemeral: true });
  }

  const bank = await getBank(ownerId);
  if (!bank || bank.level !== nextLevel - 1) {
    return interaction.reply({ content: "❌ Upgrade lama samayn karo.", ephemeral: true });
  }

  const cost = UPGRADE_COSTS[nextLevel];
  if (!cost) return interaction.reply({ content: "❌ Heer khaldan.", ephemeral: true });

  const currentTotal = await getBankTotal(ownerId);
  if (currentTotal < cost.minBalance) {
    return interaction.reply({
      content: `❌ Bank waa inuu lahaadaa **${fmt(cost.minBalance)} coins** oo dhigasho ah. la dhigay Hadda: **${fmt(currentTotal)}**`,
      ephemeral: true,
    });
  }

  upgradeCooldowns.set(ownerId, Date.now());

  if (payWith === "coins") {
    const r = await pool.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1`,
      [cost.coins, ownerId]
    );
    if (r.rowCount === 0) {
      upgradeCooldowns.delete(ownerId);
      return interaction.reply({ content: "❌ Coins kugu filan ma haysatid.", ephemeral: true });
    }
  } else {
    const r = await pool.query(
      `UPDATE players SET diamonds = diamonds - $1 WHERE discord_id = $2 AND diamonds >= $1`,
      [cost.diamonds, ownerId]
    );
    if (r.rowCount === 0) {
      upgradeCooldowns.delete(ownerId);
      return interaction.reply({ content: "❌ Diamonds kugu filan ma haysatid.", ephemeral: true });
    }
  }

  await pool.query(`UPDATE banks SET level = $1 WHERE owner_id = $2`, [nextLevel, ownerId]);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`🎉 Upgrade Guulaystay! Level ${nextLevel} ${levelStars(nextLevel)}`)
        .setColor(0xf1c40f)
        .addFields(
          { name: "📈 Profit Rateka Cusub", value: `${PROFIT_RATES[nextLevel] * 100}%/saac`, inline: true },
          { name: "🏦 Xad Cusub",        value: `${fmt(BANK_CAPS[nextLevel])} coins`,     inline: true },
          {
            name:  "💳 Lacagta La Bixiyey",
            value: payWith === "coins" ? `${fmt(cost.coins)} coins` : `${fmt(cost.diamonds)} diamonds`,
            inline: true,
          }
        ),
    ],
  });
}



async function handleBankInvestInteraction(interaction) {
  const cid = interaction.customId;


  if (cid.startsWith("bank_invest_list_")) {
    const ownerId = cid.replace("bank_invest_list_", "");
    if (interaction.user.id !== ownerId)
      return interaction.reply({ content: "❌ Bank owner kaliya ayaa tan arki kara.", ephemeral: true });
    const bank = await getBank(ownerId);
    if (!bank) return interaction.reply({ content: "❌ Bank lama helin.", ephemeral: true });
    const res = await pool.query(
      `SELECT bi.user_id, bi.amount, bi.last_claim, bi.total_earned
       FROM bank_investments bi WHERE bi.bank_owner_id = $1 AND bi.amount > 0
       ORDER BY bi.amount DESC LIMIT 20`,
      [ownerId]
    );
    if (res.rows.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle(`💼 ${bank.name} — Investors`).setDescription("Weli xiddig maalgashi ku dhigin.").setColor(0x95a5a6)],
        ephemeral: true,
      });
    }
    const totalInvested = res.rows.reduce((s, r) => s + Number(r.amount), 0);
    const lines = res.rows.map((r, i) => {
      const pending = calcBankInvestProfit(Number(r.amount), Number(r.last_claim));
      return `**${i + 1}.** <@${r.user_id}>\n💼 ${fmt(r.amount)} Coins  ·  📈 Pending: +${fmt(pending)}  ·  🧾 Earned: ${fmt(r.total_earned)}`;
    }).join("\n\n");
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`💼 ${bank.name} — Investors`)
          .setDescription(lines)
          .addFields({ name: "📊 Total Invested", value: `${fmt(totalInvested)} Coins  ·  ${res.rows.length} investors`, inline: false })
          .setColor(0x2ecc71),
      ],
      ephemeral: true,
    });
  }


  if (cid.startsWith("biinvest_claim_")) {
    const parts   = cid.replace("biinvest_claim_", "").split("_");
    const ownerId = parts[0];
    const actorId = parts[1];
    const userId  = interaction.user.id;
    if (userId !== actorId) return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    const result = await doBankInvestClaim(userId, ownerId);
    if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    let skimmed = 0;
    if (result.userGets > 0) {
      try {
        const garnResult = await applyIncome(userId, result.userGets);
        skimmed = garnResult.skimmed || 0;
        if (skimmed > 0) {
          await pool.query(
            `UPDATE players SET coins = GREATEST(0, coins - $1) WHERE discord_id = $2`,
            [skimmed, userId]
          );
        }
      } catch (e) {
        console.error("[BANK] claim garnishment error:", e.message);
      }
    }
    const netReceived = result.userGets - skimmed;
    const bank = await getBank(ownerId);
    const multParts = [];
    if (result.healthTier)   multParts.push(result.healthTier);
    if (result.loyaltyLabel) multParts.push(result.loyaltyLabel);
    if (result.champLabel)   multParts.push(result.champLabel);
    if (result.panicLabel)   multParts.push(result.panicLabel);
    const multStr = multParts.length
      ? multParts.join("\n")
      : "📊 Rate: Standard (no bonuses active)";
    const claimEmbed = new EmbedBuilder()
      .setTitle("📈 Maalgashi Claim success!")
      .setDescription(`✅ Faa'iidada bangiga waa la qaatay.`)
      .addFields(
        { name: "💰 Adiga",       value: `+${fmt(netReceived)} Coins (95%${skimmed > 0 ? ` · −${fmt(skimmed)} loan skim` : ""})`, inline: true },
        { name: "👑 Owner",       value: `+${fmt(result.ownerGets)} Coins (3%)`,                                                   inline: true },
        { name: "🏦 Bank",        value: bank?.name || ownerId,                                                                    inline: true },
        { name: "⚡ Rate Applied", value: `×${result.combinedMult.toFixed(3)} combined`,                                           inline: true },
        { name: "📊 Breakdown",   value: multStr,                                                                                  inline: false },
      )
      .setColor(result.combinedMult >= 1.0 ? 0x2ecc71 : 0xe67e22)
      .setFooter({ text: `Health: ${result.healthScore}/100 · Claim resets your loyalty clock` });
    return interaction.reply({ embeds: [claimEmbed], ephemeral: true });
  }


  if (cid.startsWith("biinvest_withdraw_")) {
    const parts   = cid.replace("biinvest_withdraw_", "").split("_");
    const ownerId = parts[0];
    const actorId = parts[1];
    const userId  = interaction.user.id;
    if (actorId && userId !== actorId) return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    const inv     = await getBankInvestment(userId, ownerId);
    if (!inv) return interaction.reply({ content: "❌ Maalgashi ma haysatid bangigan.", ephemeral: true });
    const sinceDeposit = Date.now() - Number(inv.deposited_at);
    if (sinceDeposit < BINV_WITHDRAW_CD) {
      const remMs = BINV_WITHDRAW_CD - sinceDeposit;
      const remH  = Math.floor(remMs / 3600000);
      const remM  = Math.floor((remMs % 3600000) / 60000);
      return interaction.reply({ content: `🔒 Weli ma diyaar gashana. **${remH}h ${remM}m** ka dib.`, ephemeral: true });
    }
    const result = await doBankInvestWithdraw(userId, ownerId);
    if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    let skimmed = 0;
    if (result.userProfit > 0) {
      try {
        const garnResult = await applyIncome(userId, result.userProfit);
        skimmed = garnResult.skimmed || 0;
        if (skimmed > 0) {
          await pool.query(
            `UPDATE players SET coins = GREATEST(0, coins - $1) WHERE discord_id = $2`,
            [skimmed, userId]
          );
        }
      } catch (e) {
        console.error("[BANK] withdraw garnishment error:", e.message);
      }
    }
    const netProfit = result.userProfit - skimmed;
    const netToUser = result.principal + netProfit;
    const bank = await getBank(ownerId);
    const withdrawEmbed = new EmbedBuilder()
      .setTitle("🏦 Maalgashi Withdraw success!")
      .setDescription(`✅ Waxaad heshay **${fmt(netToUser)} Coins** oo dhan`)
      .addFields(
        { name: "💼 Maalgashigaagii",    value: `${fmt(result.principal)} Coins`,                                                                                  inline: true },
        { name: "📈 Faa'iido la soo qaatay", value: result.pendProfit > 0 ? `+${fmt(netProfit)} Coins (95%${skimmed > 0 ? ` · −${fmt(skimmed)} loan skim` : ""})` : "0 Coins", inline: true },
        { name: "🏦 Bank",               value: bank?.name || ownerId,                                                                                              inline: true },
      )
      .setColor(0x3498db);
    if (result.pendProfit > 0) {
      withdrawEmbed.setFooter({ text: `Faa'iidadii ${fmt(result.pendProfit)} Coins ahayd waxaa toos loogu daray lacagta la soo celiyey` });
    }
    return interaction.reply({ embeds: [withdrawEmbed], ephemeral: true });
  }


  if (cid.startsWith("invlb_prev_") || cid.startsWith("invlb_next_")) {
    const isPrev  = cid.startsWith("invlb_prev_");
    const rest    = cid.replace(isPrev ? "invlb_prev_" : "invlb_next_", "");
    const lastUnd = rest.lastIndexOf("_");
    const userId  = rest.slice(0, lastUnd);
    const curPage = parseInt(rest.slice(lastUnd + 1), 10);
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ Liiskaaga ma ahan.", ephemeral: true });
    const newPage = isPrev ? curPage - 1 : curPage + 1;
    await interaction.deferUpdate();
    try {
      const { embed, components, total } = await buildInvlbPage(newPage, userId);
      if (newPage < 0 || newPage * INVLB_PAGE_SIZE >= total) {
        return interaction.followUp({ content: "❌ Bogga la raadinayo ma jiro.", ephemeral: true });
      }
      return interaction.editReply({ embeds: [embed], components });
    } catch (err) {
      console.error("[INVLB] pagination error:", err);
      return interaction.followUp({ content: "❌ Khalad dhacay. Isku day mar kale.", ephemeral: true });
    }
  }


  if (cid.startsWith("myinv_qclaim_")) {
    const rest    = cid.replace("myinv_qclaim_", "");
    const sepIdx  = rest.indexOf("_");
    const userId  = rest.slice(0, sepIdx);
    const ownerId = rest.slice(sepIdx + 1);
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });



    await interaction.deferUpdate();

    try {

      const result = await doBankInvestClaim(userId, ownerId);
      if (!result.ok) {
        return interaction.followUp({ content: `❌ ${result.error}`, ephemeral: true });
      }

      let skimmed = 0;
      if (result.userGets > 0) {
        try {
          const garnResult = await applyIncome(userId, result.userGets);
          skimmed = garnResult.skimmed || 0;
          if (skimmed > 0) {
            await pool.query(
              `UPDATE players SET coins = GREATEST(0, coins - $1) WHERE discord_id = $2`,
              [skimmed, userId]
            );
          }
        } catch (e) {
          console.error("[BANK] myinv_qclaim garnishment error:", e.message);
        }
      }

      const netReceived = result.userGets - skimmed;
      const bank = await getBank(ownerId);
      const multParts = [];
      if (result.healthTier)   multParts.push(result.healthTier);
      if (result.loyaltyLabel) multParts.push(result.loyaltyLabel);
      if (result.champLabel)   multParts.push(result.champLabel);
      if (result.panicLabel)   multParts.push(result.panicLabel);
      const multStr = multParts.length
        ? multParts.join("\n")
        : "📊 Rate: Standard (no bonuses active)";

      const claimEmbed = new EmbedBuilder()
        .setTitle("📈 Maalgashi Claim success!")
        .setDescription(`✅ Faa'iidada bangiga waa la qaatay.`)
        .addFields(
          { name: "💰 Adiga",       value: `+${fmt(netReceived)} Coins (95%${skimmed > 0 ? ` · −${fmt(skimmed)} loan skim` : ""})`, inline: true },
          { name: "👑 Owner",       value: `+${fmt(result.ownerGets)} Coins (3%)`,                                                   inline: true },
          { name: "🏦 Bank",        value: bank?.name || ownerId,                                                                    inline: true },
          { name: "⚡ Rate Applied", value: `×${result.combinedMult.toFixed(3)} combined`,                                           inline: true },
          { name: "📊 Breakdown",   value: multStr,                                                                                  inline: false },
        )
        .setColor(result.combinedMult >= 1.0 ? 0x2ecc71 : 0xe67e22)
        .setFooter({ text: `Health: ${result.healthScore}/100 · Claim resets your loyalty clock` });


      await interaction.followUp({ embeds: [claimEmbed], ephemeral: true });


      const rows = await fetchMyInvRows(userId);

      let curPage = 0;
      try {
        const prevBtn = interaction.message?.components
          ?.flatMap(c => c.components ?? [])
          .find(b => b.customId?.startsWith("myinv_prev_"));
        if (prevBtn) {
          const lastUnd = prevBtn.customId.lastIndexOf("_");
          curPage = parseInt(prevBtn.customId.slice(lastUnd + 1), 10) || 0;
        }
      } catch { curPage = 0; }

      const maxPage = Math.max(0, Math.ceil(rows.length / MYINV_PAGE_SIZE) - 1);
      curPage = Math.min(curPage, maxPage);
      await interaction.editReply(await buildMyInvV2Page(rows, curPage, userId));
    } catch (err) {
      console.error("[BANK] myinv_qclaim error:", err);
      return interaction.followUp({ content: "❌ Khalad dhacay. Isku day mar kale.", ephemeral: true });
    }
    return;
  }


  if (cid.startsWith("myinv_prev_") || cid.startsWith("myinv_next_")) {
    const isPrev  = cid.startsWith("myinv_prev_");
    const rest    = cid.replace(isPrev ? "myinv_prev_" : "myinv_next_", "");
    const lastUnd = rest.lastIndexOf("_");
    const userId  = rest.slice(0, lastUnd);
    const curPage = parseInt(rest.slice(lastUnd + 1), 10);
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ Panelkaaga ma ahan.", ephemeral: true });
    const newPage = isPrev ? curPage - 1 : curPage + 1;
    await interaction.deferUpdate();
    try {
      const rows = await fetchMyInvRows(userId);
      if (newPage < 0 || newPage * MYINV_PAGE_SIZE >= rows.length) {
        return interaction.followUp({ content: "❌ Bogga la raadinayo ma jiro.", ephemeral: true });
      }
      return interaction.editReply(await buildMyInvV2Page(rows, newPage, userId));
    } catch (err) {
      console.error("[MYINV] pagination error:", err);
      return interaction.followUp({ content: "❌ Khalad dhacay. Isku day mar kale.", ephemeral: true });
    }
  }


  if (cid.startsWith("season_prev_") || cid.startsWith("season_next_")) {
    const isPrev  = cid.startsWith("season_prev_");
    const rest    = cid.replace(isPrev ? "season_prev_" : "season_next_", "");
    const lastUnd = rest.lastIndexOf("_");
    const userId  = rest.slice(0, lastUnd);
    const curPage = parseInt(rest.slice(lastUnd + 1), 10);
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ Liiskaaga ma ahan.", ephemeral: true });
    const newPage = isPrev ? curPage - 1 : curPage + 1;
    await interaction.deferUpdate();
    try {
      const { embed, components, total } = await buildSeasonPage(newPage, userId);
      if (newPage < 0 || newPage * SEASON_PAGE_SIZE >= total) {
        return interaction.followUp({ content: "❌ Bogga la raadinayo ma jiro.", ephemeral: true });
      }
      return interaction.editReply({ embeds: [embed], components });
    } catch (err) {
      console.error("[SEASON] pagination error:", err);
      return interaction.followUp({ content: "❌ Khalad dhacay. Isku day mar kale.", ephemeral: true });
    }
  }


  if (cid.startsWith("banklb_prev_") || cid.startsWith("banklb_next_")) {
    const isPrev  = cid.startsWith("banklb_prev_");
    const rest    = cid.replace(isPrev ? "banklb_prev_" : "banklb_next_", "");
    const lastUnd = rest.lastIndexOf("_");
    const userId  = rest.slice(0, lastUnd);
    const curPage = parseInt(rest.slice(lastUnd + 1), 10);
    if (interaction.user.id !== userId)
      return interaction.reply({ content: "❌ Liiskaaga ma ahan.", ephemeral: true });
    const newPage = isPrev ? curPage - 1 : curPage + 1;
    await interaction.deferUpdate();
    try {
      const { embed, components, total } = await buildBanklbPage(newPage, userId);
      if (newPage < 0 || newPage * BANKLB_PAGE_SIZE >= total) {
        return interaction.followUp({ content: "❌ Bogga la raadinayo ma jiro.", ephemeral: true });
      }
      return interaction.editReply({ embeds: [embed], components });
    } catch (err) {
      console.error("[BANKLB] pagination error:", err);
      return interaction.followUp({ content: "❌ Khalad dhacay. Isku day mar kale.", ephemeral: true });
    }
  }

  return false;
}



const MYINV_PAGE_SIZE = 5;

async function fetchMyInvRows(userId) {
  const res = await pool.query(
    `SELECT bi.bank_owner_id, bi.amount, bi.last_claim, b.name AS bank_name, b.level
     FROM bank_investments bi
     JOIN banks b ON b.owner_id = bi.bank_owner_id
     WHERE bi.user_id = $1 AND bi.amount > 0`,
    [userId]
  );
  const rows = res.rows;

  rows.forEach(r => {
    r._claimable = calcBankInvestProfit(Number(r.amount), Number(r.last_claim));
  });

  rows.sort((a, b) => {
    if (b._claimable !== a._claimable) return b._claimable - a._claimable;
    return a.bank_owner_id < b.bank_owner_id ? -1 : a.bank_owner_id > b.bank_owner_id ? 1 : 0;
  });
  return rows;
}

async function buildMyInvV2Page(rows, page, userId) {
  const total      = rows.length;
  const totalPages = Math.ceil(total / MYINV_PAGE_SIZE) || 1;
  const slice      = rows.slice(page * MYINV_PAGE_SIZE, (page + 1) * MYINV_PAGE_SIZE);


  const enriched = slice.map(r => ({
    ...r,
    _claimable: calcBankInvestProfit(Number(r.amount), Number(r.last_claim)),
  }));

  const components = [

    {
      type: 17,
      accent_color: 0xf1c40f,
      components: [
        {
          type: 10,
          content: `## <:maalgalin:1514977878972829798> Dhamaan bankyada aad maalgashatay\n-# Taabo buttonka aad rabtid.`,
        },
        { type: 14, divider: true, spacing: 1 },

        ...enriched.flatMap(r => [
          {
            type: 10,
            content: `**${r.bank_name} | ${fmt(Number(r.amount))} Coins**\n\nClaimable Profit:\n**+${fmt(r._claimable)} Coins**`,
          },
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setCustomId(`myinv_qclaim_${userId}_${r.bank_owner_id}`)
                .setLabel("Claim Profit")
                .setEmoji(r._claimable > 0
                  ? "<:claim:1515946275810578603>"
                  : "<:claimed:1515946277769183303>")
                .setStyle(ButtonStyle.Success)
                .toJSON(),
              new ButtonBuilder()
                .setCustomId(`myinv_bank_${userId}_${r.bank_owner_id}`)
                .setLabel("Info")
                .setEmoji("<:bank:1514987948041441330>")
                .setStyle(ButtonStyle.Primary)
                .toJSON(),
            ],
          },
          { type: 14, divider: true, spacing: 1 },
        ]),

        {
          type: 1,
          components: [
            new ButtonBuilder()
              .setCustomId(`myinv_prev_${userId}_${page}`)
              .setEmoji("⬅️")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0)
              .toJSON(),
            new ButtonBuilder()
              .setCustomId(`myinv_close_${userId}`)
              .setEmoji("🗑️")
              .setStyle(ButtonStyle.Danger)
              .toJSON(),
            new ButtonBuilder()
              .setCustomId(`myinv_next_${userId}_${page}`)
              .setEmoji("➡️")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled((page + 1) * MYINV_PAGE_SIZE >= total)
              .toJSON(),
          ],
        },
        {
          type: 10,
          content: `-# Page ${page + 1} / ${totalPages}  ·  ${total} bank${total !== 1 ? "s" : ""}`,
        },
      ],
    },
  ];

  return { flags: 1 << 15, components };
}

async function handleMyInvestment(message) {
  const userId = message.author.id;
  const rows   = await fetchMyInvRows(userId);

  if (rows.length === 0) {
    return message.reply({
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0x95a5a6,
          components: [
            {
              type: 10,
              content: `## Not Found\n-# Ma jiro wax bank ah oo aad maalgashatay.\n\nSi bank u maalgashatid qor:\n\n\`!invest lacagta @bankowner\`\n\nama\n\n\`/invest lacagta @bankowner\``,
            },
            { type: 14, divider: true, spacing: 1 },
            {
              type: 1,
              components: [
                new ButtonBuilder()
                  .setCustomId(`myinv_close_${userId}`)
                  .setEmoji("🗑️")
                  .setStyle(ButtonStyle.Danger)
                  .toJSON(),
              ],
            },
          ],
        },
      ],
    });
  }

  await message.reply(await buildMyInvV2Page(rows, 0, userId));
}




function nextThursdayCountdown() {
  const nowMs = Date.now();
  const now   = new Date(nowMs);
  const day   = now.getUTCDay();
  let daysUntil = (4 - day + 7) % 7;
  if (daysUntil === 0) {

    const todayReset = Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
      17, 0, 0, 0
    );
    if (nowMs >= todayReset) daysUntil = 7;
  }

  const target = new Date(nowMs);
  target.setUTCDate(target.getUTCDate() + daysUntil);
  target.setUTCHours(17, 0, 0, 0);
  const diffMs   = target.getTime() - nowMs;
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d} maalmood`);
  if (h > 0) parts.push(`${h} saacadood`);
  if (m > 0 || parts.length === 0) parts.push(`${m} daqiiqo`);
  return parts.join(", ");
}

async function handleSeasonCommand(message) {
  try {

    const metaRes = await pool.query(`SELECT value FROM weekly_meta WHERE key = 'last_reset'`);
    const lastReset = Number(metaRes.rows[0]?.value || 0);
    const seasonStarted = lastReset > 0;


    if (!seasonStarted) {
      const countdown = nextThursdayCountdown();
      const closeBtn = new ButtonBuilder()
        .setCustomId(`season_close_${message.author.id}`)
        .setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏆 Weekly Season")
            .setDescription(
              "⏳ **Seasonku wali ma bilaaban!**\n\n" +
              "🗓️ Seasonka ugu horreeya wuxuu bilaabmayaa:\n" +
              "**Khamiista 8:00 PM — Xiliga Soomaaliya (EAT)**\n\n" +
              `⏱️ **Waxaa haray:** ${countdown}\n\n` +
              "💡 *Ciyaar nasiib games si aad uga mid noqoto kooxda ugu horeysa!*"
            )
            .setColor(0x95a5a6)
            .setFooter({ text: "Season wuxuu dhamaadaa khamiis walba 8:00 PM EAT" }),
        ],
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });
    }


    const userId = message.author.id;
    const { embed, components, total } = await buildSeasonPage(0, userId);


    if (total === 0) {
      const countdown = nextThursdayCountdown();
      const closeBtn = new ButtonBuilder()
        .setCustomId(`season_close_${userId}`)
        .setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏆 Weekly Season Leaderboard")
            .setDescription(
              "Wali ciyaartooy Lacag kama faaiidin invest.\n\n" +
              "Invest ku samee bankyada dadka oo faaiid si oga soo muuqatid!\n\n" +
              `⏱️ **Dhamaadka seasonka:** ${countdown}`
            )
            .setColor(0xf1c40f)
            .setFooter({ text: "Waxaa la tir tiraa khamiis walba 8:00 PM (EAT)" }),
        ],
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });
    }

    await message.reply({ embeds: [embed], components });
  } catch (err) {
    console.error("[SEASON] handleSeasonCommand error:", err);
    await message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
  }
}



let seasonResetRunning = false;





function isSeasonResetTime() {
  const now = new Date();

  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);



  return (
    eat.getUTCDay()    === 4 &&
    eat.getUTCHours()  === 20 &&
    eat.getUTCMinutes() < 5
  );
}

async function runSeasonReset(discordClient) {
  if (seasonResetRunning) return;
  seasonResetRunning = true;
  console.log("[SEASON] 🏆 Running weekly season reset...");

  try {

    const metaRes = await pool.query(
      `SELECT value FROM weekly_meta WHERE key = 'last_reset'`
    );
    const lastReset = Number(metaRes.rows[0]?.value || 0);

    if (Date.now() - lastReset < 2 * 60 * 60 * 1000) {
      console.log("[SEASON] Reset already ran this window — skipping.");
      seasonResetRunning = false;
      return;
    }


    const top3Res = await pool.query(
      `SELECT we.user_id, we.amount, p.username
       FROM weekly_earnings we
       LEFT JOIN players p ON p.discord_id = we.user_id
       WHERE we.amount > 0
       ORDER BY we.amount DESC
       LIMIT 3`
    );
    const winners = top3Res.rows;


    if (winners.length > 0) {



      try {
        const totalCoins = winners
          .slice(0, SEASON_REWARDS.length)
          .reduce((sum, _, i) => sum + SEASON_REWARDS[i].coins, 0);
        const walletRow = await pool.query(`SELECT coins FROM bot_wallet WHERE id = 1`);
        const treasuryBal = Number(walletRow.rows[0]?.coins || 0);
        const deduct = Math.min(totalCoins, treasuryBal);
        if (deduct > 0) {
          await pool.query(
            `UPDATE bot_wallet SET coins = coins - $1 WHERE id = 1`,
            [deduct]
          );
        }
      } catch (treasuryErr) {
        console.error("[SEASON] Treasury deduction error:", treasuryErr.message);
      }

      for (let i = 0; i < winners.length && i < SEASON_REWARDS.length; i++) {
        const { coins, diamonds } = SEASON_REWARDS[i];
        const uid = winners[i].user_id;
        try {
          await pool.query(
            `UPDATE players SET coins = coins + $1, diamonds = diamonds + $2 WHERE discord_id = $3`,
            [coins, diamonds, uid]
          );
        } catch (rewardErr) {
          console.error(`[SEASON] Failed to reward user ${uid}:`, rewardErr.message);
        }
      }


      let desc = "✨ **Tartankii todobaadlaha wuu soo dhamaaday!**\n\n";
      for (let i = 0; i < winners.length && i < SEASON_REWARDS.length; i++) {
        const { coins, diamonds } = SEASON_REWARDS[i];
        desc += `${SEASON_MEDALS[i]} <@${winners[i].user_id}> — **+${coins.toLocaleString()} coins** & **${diamonds}💎**\n`;
      }
      const announcementEmbed = new EmbedBuilder()
        .setTitle("🏆 Natiijada Seasonka todobaadlaha!")
        .setDescription(desc)
        .setColor(0xf1c40f)
        .setTimestamp()
        .setFooter({ text: "Season cusub ayaa bilaabanaya hadda!" });

      for (const chanId of SEASON_CHANNEL_IDS) {
        const channel = discordClient.channels.cache.get(chanId);
        if (channel) {
          try {
            const sentMsg = await bankSafeSend(channel, { embeds: [announcementEmbed] });
            if (sentMsg) {
              try {
                await sentMsg.startThread({
                  name: "🏆 Season Results — ku Hadal halkan",
                  autoArchiveDuration: 4320,
                  reason: "Weekly season results — discuss here",
                });
              } catch {}
            }
          } catch (sendErr) {
            console.error(`[SEASON] Failed to send to channel ${chanId}:`, sendErr.message);
          }
        } else {
          console.warn(`[SEASON] ⚠️ Announcement channel not found: ${chanId}`);
        }
      }


      await new Promise(r => setTimeout(r, 10_000));
    } else {
      console.log("[SEASON] No players this week — skipping rewards and announcement.");
    }


    try {

      await pool.query(`UPDATE banks SET champion_rank = NULL, champion_until = NULL`);



      const topBanksRes = await pool.query(`
        SELECT b.owner_id, b.name,
               b.weekly_bank_score,
               COALESCE(SUM(bu.deposited + bu.profit), 0) AS live_total
        FROM banks b
        LEFT JOIN bank_users bu ON bu.bank_owner_id = b.owner_id
        GROUP BY b.owner_id, b.name, b.weekly_bank_score
        HAVING b.weekly_bank_score > 0 OR COALESCE(SUM(bu.deposited + bu.profit), 0) > 0
        ORDER BY
          CASE WHEN b.weekly_bank_score > 0 THEN b.weekly_bank_score
               ELSE COALESCE(SUM(bu.deposited + bu.profit), 0)
          END DESC
        LIMIT 3
      `);
      const topBanks = topBanksRes.rows;

      if (topBanks.length > 0) {
        const champLabels = [
          { rank: 1, badge: "🏆", title: "Vault champion", bonus: "+20% maalgashi rate" },
          { rank: 2, badge: "🥈", title: "Bilada qalinka", bonus: "+15% maalgashi rate" },
          { rank: 3, badge: "🥉", title: "Bilada Bronzeka",     bonus: "+10% maalgashi rate" },
        ];
        const champUntil = Date.now() + CHAMPION_DURATION_MS;

        let champDesc = "✨ **Bankiyada ugu sarreeya todobaadkan:**\n\n";
        for (let i = 0; i < topBanks.length && i < 3; i++) {
          const bank = topBanks[i];
          const info = champLabels[i];
          const scoreDisplay = bank.weekly_bank_score > 0
            ? fmt(Number(bank.weekly_bank_score))
            : fmt(Number(bank.live_total));
          await pool.query(
            `UPDATE banks SET champion_rank = $1, champion_until = $2 WHERE owner_id = $3`,
            [info.rank, champUntil, bank.owner_id]
          );
          champDesc += `${info.badge} **${bank.name}** — <@${bank.owner_id}>\n`;
          champDesc += `   📊 ${scoreDisplay} Coins (xilliga)  ·  🎖️ ${info.title}  ·  ${info.bonus}\n\n`;
        }
        champDesc += `🕐 Badgega wuxuu socdaa **7 maalmood** — Naasib maalgashiga!`;

        const champEmbed = new EmbedBuilder()
          .setTitle("🏆 Bankooyinka Guuleystay — Todobaadkan!")
          .setDescription(champDesc)
          .setColor(0xf1c40f)
          .setTimestamp()
          .setFooter({ text: "Season cusub ayaa bilaabanaya hadda!" });


        for (const chanId of SEASON_CHANNEL_IDS) {
          try {
            const ch = discordClient?.channels?.cache?.get(chanId);
            if (ch) {
              const sentMsg = await bankSafeSend(ch, { embeds: [champEmbed] });
              if (sentMsg) {
                try {
                  await sentMsg.startThread({
                    name: "🏅 Champions — ku hadal halkan",
                    autoArchiveDuration: 4320,
                    reason: "Champion badges — discuss here",
                  });
                } catch {}
              }
            }
          } catch (sendErr) {
            console.error(`[SEASON] Champion send error (${chanId}):`, sendErr.message);
          }
        }
        console.log(`[SEASON] ✅ Champion badges awarded to ${topBanks.length} bank(s).`);
      }
    } catch (champErr) {
      console.error("[SEASON] Champion badge error:", champErr.message);
    }


    await pool.query(`DELETE FROM weekly_earnings`);
    await pool.query(`UPDATE banks SET weekly_bank_score = 0`);


    await pool.query(
      `INSERT INTO weekly_meta (key, value) VALUES ('last_reset', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [String(Date.now())]
    );

    console.log("[SEASON] ✅ Season reset complete. New season started.");
  } catch (err) {
    console.error("[SEASON] runSeasonReset error:", err);
  } finally {
    seasonResetRunning = false;
  }
}








function startSeasonScheduler(discordClient) {
  function msUntilNextSeasonReset() {
    const now     = new Date();
    const day     = now.getUTCDay();
    const hour    = now.getUTCHours();
    const min     = now.getUTCMinutes();
    const sec     = now.getUTCSeconds();
    const msInDay = (hour * 3600 + min * 60 + sec) * 1000 + now.getUTCMilliseconds();

    let daysAhead = (4 - day + 7) % 7;

    if (daysAhead === 0 && (hour > 17 || (hour === 17 && min >= 5))) daysAhead = 7;
    const msToMidnight = daysAhead * 86_400_000 - msInDay;
    return msToMidnight + 17 * 3_600_000;
  }

  function scheduleNext() {
    const delay = msUntilNextSeasonReset();
    const hrsUntil = Math.round(delay / 3_600_000 * 10) / 10;
    console.log(`[SEASON] Next reset in ${hrsUntil}h (Thu 20:00 EAT / 17:00 UTC)`);
    setTimeout(async () => {
      try { await runSeasonReset(discordClient); }
      catch (err) { console.error("[SEASON] Scheduler error:", err.message); }
      scheduleNext();
    }, delay);
  }

  scheduleNext();
  console.log("[SEASON] ✅ Season scheduler started (event-driven, not polling).");
}



async function handleMessage(message) {
  if (message.author.bot) return;
  const content = message.content.trim();


  if (pendingBankName.has(message.author.id)) {

    if (!content.startsWith("!")) {
      const handled = await handlePendingName(message);
      if (handled) return;
    }
  }

  if (content === "!bank")                                      return handleBankCommand(message);
  if (content === "!bank info")                                 return handleBankInfo(message);
  if (content === "!bank account" || content === "!bank acc")   return handleBankAccount(message);
  if (content === "!bank leaderboard" || content === "!banklb") return handleBankLeaderboard(message);
  if (content === "!upgrade bank")                              return handleUpgrade(message);
  if (content === "!myinvestment" || content === "!myinv")      return handleMyInvestment(message);
  if (content === "!season" || content === "!seasonlb")         return handleSeasonCommand(message);

  if (content === "!deposit") {
    return message.reply({ embeds: [bankUsageEmbed("!deposit <lacag> @bankowner", "!deposit 1000 @luuza", "💰 Lacagtaada bank ku dhig si aad u ammaanto.")] });
  }
  if (content.startsWith("!deposit ")) {
    return handleDeposit(message, content.slice(9).trim().split(/\s+/));
  }
  if (content === "!withdraw") {
    return message.reply({ embeds: [bankUsageEmbed("!withdraw <lacag> @bankowner", "!withdraw 500 @luuza", "💸 Lacagtaada bangiga ka soo bixi.")] });
  }
  if (content.startsWith("!withdraw ")) {
    return handleWithdraw(message, content.slice(10).trim().split(/\s+/));
  }


  if (content === "!transfer" || content === "!tr") {
    return message.reply({ embeds: [bankUsageEmbed(
      "!transfer <lacag> @fromBank @toBank",
      "!transfer 5000 @bankA @bankB",
      "💸 Lacag bank ka bixiso oo bank kale ku dhig."
    )] });
  }
  if (content.startsWith("!transfer ") || content.startsWith("!tr ")) {
    const sliceAt = content.startsWith("!transfer ") ? 10 : 4;
    return handleTransfer(message, content.slice(sliceAt).trim().split(/\s+/));
  }


  if (content.startsWith("!invest ") && message.mentions.users.size > 0) {
    const userId  = message.author.id;
    const investArgs = content.split(/\s+/).slice(1);
    const investParsed = bankParseUserAndAmount(investArgs, message);
    const owner   = investParsed.user;
    const ownerId = owner.id;
    if (ownerId === userId) return message.reply("❌ Bangigaaga adiga ma maalgashan kartid.");
    const amount  = investParsed.amount;
    if (!amount || isNaN(amount) || amount < 100)
      return message.reply({ embeds: [bankUsageEmbed("!invest <lacag> @bankowner", `!invest 1000 @${owner.username}`, "📈 Ugu yaraan **100 Coins** · Max **100,000 Coins**")] });
    if (investParsed.corrected) {
      await message.channel.send({ embeds: [bankCorrectedEmbed(`!invest ${amount} @${owner.username}`)] });
    }

    const bank = await getBank(ownerId);
    if (!bank) return message.reply("❌ Userkaas wax bank ah ma laha.");

    const existing = await getBankInvestment(userId, ownerId);
    const currentAmt = existing ? Number(existing.amount) : 0;
    if (currentAmt + amount > BINV_CAP)
      return message.reply(`❌ Xadka maalgashiga bangigan waa **${fmt(BINV_CAP)} Coins**. Adiga waxaad ka haysataa **${fmt(currentAmt)}** — room left: **${fmt(BINV_CAP - currentAmt)}**.`);

    const result = await doBankInvest(userId, ownerId, amount);
    if (!result.ok) return message.reply(`❌ ${result.error}`);

    const newInv = await getBankInvestment(userId, ownerId);
    const newAmt = newInv ? Number(newInv.amount) : amount;
    const pendingProfit = calcBankInvestProfit(newAmt, Number(newInv?.last_claim || Date.now()));
    const sinceDeposit  = Date.now() - Number(newInv?.deposited_at || Date.now());
    const withdrawLocked = sinceDeposit < BINV_WITHDRAW_CD;
    const autoClaimLine = result.autoClaimed
      ? `\n\n💰 **Faa'iidadii hore waa la uruuriyay:** +${fmt(result.autoClaimed.userGets)} Coins → lacagtaada`
      : "";

    const embed = new EmbedBuilder()
      .setTitle("💼 Bank Invest Guuleysey!")
      .setDescription(`✅ **${fmt(amount)} Coins** waxaad ku maalgashatay **${bank.name}** ${levelStars(bank.level)}${autoClaimLine}`)
      .addFields(
        { name: "💰 Maalgashi guud",  value: `${fmt(newAmt)} / ${fmt(BINV_CAP)} Coins`, inline: true },
        { name: "📈 Rate",            value: `+0.25%/saac (≤25k) · +0.15% extra`,         inline: true },
        { name: "💸 Faa'iido",        value: `95% adiga · 3% owner · 2% bot`,            inline: false },
        { name: "🔒 Withdraw",        value: withdrawLocked ? "Weli ma diyaar gashana (24h)" : "✅ Diyaar", inline: true },
      )
      .setColor(0x2ecc71)
      .setFooter({ text: `Claim: 12h · Withdraw: 24h · 100% principal ku soo celinaysa` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`biinvest_claim_${ownerId}_${userId}`)
        .setLabel(pendingProfit > 0 ? `📈 Claim (+${fmt(pendingProfit)})` : "📈 Claim")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pendingProfit <= 0),
      new ButtonBuilder()
        .setCustomId(`biinvest_withdraw_${ownerId}_${userId}`)
        .setLabel("🏦 Withdraw Principal")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(withdrawLocked),
    );
    return message.reply({ embeds: [embed], components: [row] });
  }


  if (content === "!invlb" || content === "!inv leaderboard") {
    const userId = message.author.id;
    const { embed, components, total } = await buildInvlbPage(0, userId);
    if (total === 0) {
      return message.reply({ embeds: [embed] });
    }
    return message.reply({ embeds: [embed], components });
  }


  if (content === "!ai me" || content === "!ai") {
    return handleAiMe(message);
  }


  if (content === "!binvest" || content === "!bank invest") {
    const userId = message.author.id;
    const res = await pool.query(
      `SELECT bi.*, b.name AS bank_name, b.level FROM bank_investments bi JOIN banks b ON b.owner_id = bi.bank_owner_id WHERE bi.user_id = $1 AND bi.amount > 0 ORDER BY bi.amount DESC`,
      [userId]
    );
    if (res.rows.length === 0) {
      return message.reply({
        embeds: [new EmbedBuilder().setTitle("💼 Bank Investments").setDescription("Wax maalgashi ah ma haysatid.\n\n💡 Bilow: `!invest <lacag> @bankowner`").setColor(0x95a5a6)],
      });
    }
    const lines = res.rows.map((r, i) => {
      const pending = calcBankInvestProfit(Number(r.amount), Number(r.last_claim));
      const locked  = Date.now() - Number(r.deposited_at) < BINV_WITHDRAW_CD;
      return `**${i + 1}.** 🏦 **${r.bank_name}** ${levelStars(r.level)} — <@${r.bank_owner_id}>\n💼 Invested: ${fmt(r.amount)} Coins  ·  📈 Pending: +${fmt(pending)}\n🧾 Total Earned: ${fmt(r.total_earned)}  ·  ${locked ? "🔒 Withdraw locked" : "✅ Can withdraw"}`;
    }).join("\n\n");
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💼 Maalgashigaaga Bankooyinka")
          .setDescription(lines + "\n\n*Isticmaal `!invest <lacag> @owner` si aad ugu maalgasbid bank.*")
          .setColor(0xf1c40f),
      ],
    });
  }
}










function startDailySnapshotScheduler() {


  function msUntilNextSnapshot() {
    const now     = new Date();
    const hour    = now.getUTCHours();
    const min     = now.getUTCMinutes();
    const sec     = now.getUTCSeconds();
    const msInDay = (hour * 3600 + min * 60 + sec) * 1000 + now.getUTCMilliseconds();
    const target  = 21 * 3_600_000;
    const ms      = target - msInDay;
    return ms > 0 ? ms : ms + 86_400_000;
  }

  async function runSnapshot() {
    try {
      const result = await pool.query(`
        UPDATE banks
        SET weekly_bank_score = weekly_bank_score + (
          SELECT COALESCE(SUM(bu.deposited + bu.profit), 0)
          FROM bank_users bu
          WHERE bu.bank_owner_id = banks.owner_id
        )
      `);
      console.log(`[SNAPSHOT] ✅ Daily weekly_bank_score snapshot taken — ${result.rowCount} bank(s) updated.`);
    } catch (err) {
      console.error("[SNAPSHOT] Daily snapshot error:", err.message);
    }
  }

  function scheduleNext() {
    const delay = msUntilNextSnapshot();
    const hrsUntil = Math.round(delay / 3_600_000 * 10) / 10;
    console.log(`[SNAPSHOT] Next snapshot in ${hrsUntil}h (21:00 UTC / 00:00 EAT)`);
    setTimeout(async () => {
      await runSnapshot();
      scheduleNext();
    }, delay);
  }

  scheduleNext();
  console.log("[SNAPSHOT] ✅ Daily snapshot scheduler started (event-driven, not polling).");
}






export {
  pool,
  getBank,
  getPlayer,
  getBankUser,
  getBankTotal,
  getBankUserCount,
  fmt,
  levelStars,
  logTransaction,
  isCooledDown,
  cooldownRemaining,
  msToMinSec,
  checkAccountAge,
};

export async function setupBankSystem(client) {
  discordClient = client;
  await initTables();

  client.on("messageCreate", async (message) => {
    if (message._permBlocked) return;
    try {
      await handleMessage(message);
    } catch (err) {
      console.error("[BANK] messageCreate error:", err);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      await handleInteraction(interaction);
    } catch (err) {
      console.error("[BANK] interactionCreate error:", err);
    }
  });


  setInterval(async () => {
    try { await runProfitCycle(); }
    catch (err) { console.error("[BANK] Profit cycle error:", err); }
  }, PROFIT_INTERVAL_MS);


  setTimeout(async () => {
    try {

      await fixOverflowBanks();
      await runProfitCycle();
    }
    catch (err) { console.error("[BANK] Initial profit cycle error:", err); }
  }, 30_000);


  startSeasonScheduler(client);




  startDailySnapshotScheduler();

  console.log("[BANK] ✅ Bank system is online.");
}



async function gracefulShutdown(signal) {
  console.log(`[BANK] ${signal} received — flushing balance cache before exit...`);
  await flushBalanceCache();
  console.log("[BANK] Cache flushed. Exiting.");
  process.exit(0);
}

process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));











const _shopMxCache = { value: 1.0, cachedAt: 0 };
const _SHOP_MX_TTL = 10 * 60_000;

export async function getShopPriceMultiplier() {
  const now = Date.now();
  if (now - _shopMxCache.cachedAt < _SHOP_MX_TTL) return _shopMxCache.value;
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(coins), 0) FROM players) +
        (SELECT COALESCE(SUM(deposited + profit), 0) FROM bank_users) AS total_coins
    `);
    const totalCoins = Number(result.rows[0]?.total_coins || 0);
    let mx;
    if      (totalCoins < 1_000_000)  mx = 1.00;
    else if (totalCoins < 2_000_000)  mx = 1.10;
    else if (totalCoins < 5_000_000)  mx = 1.20;
    else if (totalCoins < 10_000_000) mx = 1.30;
    else if (totalCoins < 20_000_000) mx = 1.40;
    else                              mx = 1.50;
    _shopMxCache.value    = mx;
    _shopMxCache.cachedAt = now;
    return mx;
  } catch (err) {
    console.error("[BANK] getShopPriceMultiplier error:", err.message);
    return _shopMxCache.value;
  }
}











async function ensureAiUsageTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      user_id  TEXT    PRIMARY KEY,
      count    INTEGER NOT NULL DEFAULT 0,
      reset_at BIGINT  NOT NULL DEFAULT 0
    )
  `);
}

async function checkAndIncrementAiUsage(userId) {
  await ensureAiUsageTable();
  const now     = Date.now();
  const DAY_MS  = 24 * 60 * 60 * 1000;
  const DAILY_LIMIT = 3;


  const res = await pool.query(
    `INSERT INTO ai_usage (user_id, count, reset_at)
     VALUES ($1, 1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       count    = CASE WHEN ai_usage.reset_at < $3 THEN 1 ELSE ai_usage.count + 1 END,
       reset_at = CASE WHEN ai_usage.reset_at < $3 THEN $2 ELSE ai_usage.reset_at END
     RETURNING count, reset_at`,
    [userId, now + DAY_MS, now]
  );

  const { count, reset_at } = res.rows[0];
  if (count > DAILY_LIMIT) {

    await pool.query(
      `UPDATE ai_usage SET count = $1 WHERE user_id = $2`,
      [DAILY_LIMIT, userId]
    );
    const msLeft    = Number(reset_at) - now;
    const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
    return { allowed: false, hoursLeft };
  }
  return { allowed: true, used: count, limit: DAILY_LIMIT };
}




function buildOfflineNasiibAdvice(s) {
  const {
    username, level, wallet, totalBanked,
    totalInvest, totalUnclaimedInv, netWorth,
    ownedBank = null, ownedBankBalance = 0, ownedBankEarned = 0,
    bankCount, invCount,
  } = s;

  const f = (n) => Number(n || 0).toLocaleString("en-US");
  const lines = [];

  lines.push(`${username}, anigu waxaan kuu eegay xogtaada hadda — heerkaagu waa Level ${level} oo wadarta hantidaadu (Net Worth) waa **${f(netWorth)} 🪙**.`);



  if (ownedBank) {
    lines.push(`Bank kaaga **${ownedBank.name}** (L${ownedBank.level}) wuxuu hadda hayaa ${f(ownedBankBalance)} 🪙, waqti dheer wuxuu kuu soo galiyay ${f(ownedBankEarned)} 🪙 oo faa'iido ah dhinaca milkiilaha.`);
    if (ownedBankEarned < 1000 && ownedBankBalance < 50000) {
      lines.push(`Bank kaagu wali waa cuseeb — soo jiido dadka inay lacag ku dhigtaan si faa'iidadaadu kor u kacdo, oo heerkiisa kor ugu qaadid markaa hantida sii kordhi.`);
    }
  } else if (wallet > 0) {
    lines.push(`Adigu weli ma lihid bank gaar ah — qor \`!bank\` si aad u furato hadii aad tahay level 15 iyo ka badan, kadibna dadka kale ee bankaaga lacag dhigtaa ayaa kuu soo gelin doona faa'iido.`);
  }


  if (totalBanked > 0) {
    lines.push(`Bankyo kale waxaad ku haysataa ${f(totalBanked)} 🪙 oo ku qaybsan ${bankCount} bank — sii hayso si faa'iidadu kuugu kordho.`);
  } else if (wallet > 5000) {
    lines.push(`Hadda lacag bank kale kuma haysid — qayb ka mid ah ${f(wallet)} ee wallet kaaga ku dhig bank kale si faa'iidada saacadlaha ah aad u heshid.`);
  }


  if (wallet > 10000 && wallet > Math.max(totalBanked, 1) * 1.5) {
    lines.push(`Wallet-kaaga malahan waxaa ku jirta ${f(wallet)} 🪙 oo aan shaqayn — qayb ka mid ah dhig bank ama maalgeli si ay kuu shaqayso.`);
  }


  if (totalUnclaimedInv > 0) {
    lines.push(`Faa'iido maalgashi oo aan la qaadan ah ayaa taal ${f(totalUnclaimedInv)} 🪙 — degdeg u qaado ka hor inta aan la lumin ama aysan kaa gaarin cap.`);
  } else if (totalInvest > 0) {
    lines.push(`Maalgashigaagu waa ${f(totalInvest)} 🪙 oo si tartiib ah u korayo — sii wad oo ha joojin.`);
  } else if (wallet > 5000) {
    lines.push(`Ma jiraan maalgashiyo aad leedahay — qayb yar oo lacagta ah maalgeli si dakhli yar kuugu yimaado.`);
  }


  if (netWorth >= 1_000_000) {
    lines.push(`Xaaladdaadu way fiican tahay — sii wad nidaamkan, oo wax yar maalin walba bank ku dar.`);
  } else if (netWorth >= 100_000) {
    lines.push(`Waxaad ku socotaa jid wanaagsan — sii wad oo bank-kaaga heerkiisa kor u qaad si faa'iidadu kuugu kordho.`);
  } else {
    lines.push(`Bilow yar yar — maalin walba in yar bank ku dar oo sii joogtee, waqti gaaban gudahood waad arki doontaa kororka.`);
  }

  return lines.join(" ");
}

async function handleAiMe(message) {
  const userId   = message.author.id;
  const username = message.author.username;
  let thinkingMsg = null;

  try {

    const player = await getPlayer(userId);
    if (!player) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("❌ Profile Not Found")
        .setDescription("Ma helin xogahaaga. Si aad ugu bilaabdo, ka samee wax shaqo ah bot ka.")
        .setColor(0xe74c3c)] });
    }

    if (Number(player.level) < 5) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("🧠 NasiibAI")
        .setDescription("Si aad u isticmaasho NasiibAi waa in aad tahay level 5+")
        .setColor(0x9b59b6)
        .setFooter({ text: `Heerkaaga hadda: Level ${player.level}` })] });
    }


    const usage = await checkAndIncrementAiUsage(userId);
    if (!usage.allowed) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("⏳ NasiibAI  Xadka waa gaartay")
        .setDescription(
          `Maanta waxaad isticmaashay **3/3** jeer NasiibAI.\n\n` +
          `🔄 Waxay dib u furmi doontaa **${usage.hoursLeft} saac** gudahood.`
        )
        .setColor(0xe67e22)
        .setFooter({ text: "Daily limit: 3 per 24h" })] });
    }


    const stageEmbed = (desc) => new EmbedBuilder()
      .setTitle("🧠 NasiibAI")
      .setDescription(desc)
      .setColor(0x9b59b6)
      .setFooter({ text: `${usage.used}/${usage.limit} maanta` });



    const stageDelay = (ms = 900) => new Promise(r => setTimeout(r, ms));


    thinkingMsg = await message.reply({ embeds: [stageEmbed("NasiibAi way fikiraysaa...")] });
    await stageDelay();


    await thinkingMsg.edit({ embeds: [stageEmbed("Waxay aruurinaysa  xogtaada...")] });
    await stageDelay();

    const [bankRes, invRes, ownedBankRes, ownedBankEarningsRes] = await Promise.all([

      pool.query(
        `SELECT bu.deposited, bu.profit, bu.last_active, b.name, b.level, b.owner_id
         FROM bank_users bu
         JOIN banks b ON b.owner_id = bu.bank_owner_id
         WHERE bu.user_id = $1 AND (bu.deposited + bu.profit) > 0
         ORDER BY (bu.deposited + bu.profit) DESC`,
        [userId]
      ),

      pool.query(
        `SELECT bi.amount, bi.last_claim, b.name AS bank_name
         FROM bank_investments bi
         JOIN banks b ON b.owner_id = bi.bank_owner_id
         WHERE bi.user_id = $1 AND bi.amount > 0`,
        [userId]
      ),


      pool.query(
        `SELECT b.name, b.level,
                COALESCE((SELECT SUM(bu.deposited + bu.profit)
                          FROM bank_users bu
                          WHERE bu.bank_owner_id = b.owner_id), 0) AS bank_balance
         FROM banks b
         WHERE b.owner_id = $1`,
        [userId]
      ),

      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS earned
         FROM bank_transactions
         WHERE bank_owner_id = $1 AND type = 'profit'`,
        [userId]
      ),
    ]);


    await thinkingMsg.edit({ embeds: [stageEmbed("Waxay xogta ka soo qaadanaysaa database...")] });
    await stageDelay();

    const wallet      = Number(player.coins);
    const level       = Number(player.level);
    const diamonds    = Number(player.diamonds || 0);



    const totalBanked = bankRes.rows.reduce((s, r) => s + Number(r.deposited) + Number(r.profit), 0);


    const totalInvest = invRes.rows.reduce((s, r) => s + Number(r.amount), 0);
    const totalUnclaimedInv = invRes.rows.reduce((s, r) => {
      return s + calcBankInvestProfit(Number(r.amount), new Date(r.last_claim).getTime());
    }, 0);



    const ownedBank        = ownedBankRes.rows[0] || null;
    const ownedBankBalance = ownedBank ? Number(ownedBank.bank_balance || 0) : 0;
    const ownedBankEarned  = Number(ownedBankEarningsRes.rows[0]?.earned || 0);



    const netWorth = wallet + totalBanked + totalInvest + totalUnclaimedInv;

    const ownBankLine = ownedBank
      ? `  ${ownedBank.name} (L${ownedBank.level}) — current_balance=${fmt(ownedBankBalance)}, lifetime_owner_profit_earned=${fmt(ownedBankEarned)}`
      : `  Adigu weli ma furan bank gaar ahaaneed (!bank si aad mid u furato).`;

    const banksSummary = bankRes.rows.length === 0
      ? "  Ma jiraan bankyo aad lacag ku haysid."
      : bankRes.rows.map(r => {
          const total      = Number(r.deposited) + Number(r.profit);
          const nextProfit = calcHourlyProfit(r.level, Number(r.deposited), r.last_active);
          return `  ${r.name} (L${r.level}): deposited=${fmt(Number(r.deposited))}, profit=${fmt(Number(r.profit))}, total=${fmt(total)}, next_hourly≈${fmt(nextProfit)}`;
        }).join("\n");

    const invSummary = invRes.rows.length === 0
      ? "  Ma jiraan maalgasiyal (qor !invest si aad u bilowdo)."
      : invRes.rows.map(r => {
          const unclaimed = calcBankInvestProfit(Number(r.amount), new Date(r.last_claim).getTime());
          return `  ${r.bank_name}: invested=${fmt(Number(r.amount))}, unclaimed≈${fmt(unclaimed)}`;
        }).join("\n");

    const contextText = [
      `Player: ${username} (Level ${level}, ${diamonds} Diamonds)`,
      `Wallet coins: ${fmt(wallet)}`,
      `Total banked in other players' banks: ${fmt(totalBanked)} across ${bankRes.rows.length} bank(s)`,
      `Total invested via !invest: ${fmt(totalInvest)} across ${invRes.rows.length} investment(s)`,
      `Total unclaimed investment profit: ${fmt(totalUnclaimedInv)}`,
      `Net worth (wallet + banked + invested + unclaimed profit): ${fmt(netWorth)}`,
      ``,
      `Bank you own (you cannot deposit into your own bank — you earn from other people depositing):`,
      ownBankLine,
      ``,
      `Banks you've deposited in:`,
      banksSummary,
      ``,
      `Investments (from !invest deposit button):`,
      invSummary,
    ].join("\n");


    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return thinkingMsg.edit({ embeds: [new EmbedBuilder()
        .setTitle("⚠️ AI lama habeyn")
        .setDescription("GEMINI_API_KEY lama helin. Adminka la xiriir.")
        .setColor(0xe67e22)] });
    }


    await thinkingMsg.edit({ embeds: [stageEmbed("NasiibAi waxay diyaarinaysaa jawaabta...")] });
    await stageDelay();

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const systemInstruction = [
      "Adiga waxaad tahay Nasiib — gargaaraha shakhsi ahaaneed ee bot-ka dhaqaalaha.",
      "LUUQADA: Kaliya Soomaali ayaad ku jawaabaysaa. Ha isticmaalin English. Haddaba jawaabtu waa inay ahaataa Soomaali sax ah, xasaasi ah, oo aad u dabiici ah.",
      "XADDIGA: 4 ilaa 6 jumlad oo dheer. Qoraal sii socda — liistooyin ha samayn.",
      "XEERARKA:",
      "- Tixraac lambarada dhabta ah ee player-ka — ha bixin talo guud.",
      "- Haddii lacagtu wallet ku jirto oo aan bank lagu dhigin ama la maalgashin, u sheeg inuu shaqo u geliyo.",
      "- Haddii uu leeyahay faa'iido maalgashi aan la sheegin, kula degdeg inuu sheegto.",
      "- Hadduu xaaladu wanaagsan tahay, dhiiri geli oo aayar u sheeg si xushmad leh.",
      "- Hadduu cusub yahay ama xaaladdiisu liidatay, kula naxariisto oo kicin.",
      "- Ha xusine magacyada miiska database-ka, goobaha qoraalka, ama ereyada farsamada.",
      "- Dhamee si dabiici ah isagoo Nasiib ahaan — naf leh, la kulmaya, aan robod ahayn.",
      "IMPORTANT (INTERNAL UNDERSTANDING): Follow all rules strictly. The assistant must respond ONLY in Somali, use real financial data, be natural and human like, never give generic advice, and act as a personal financial assistant named Nasiib."
    ].join("\n");




    const modelCandidates = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest",
      "gemini-2.0-flash",
    ];

    let aiText  = "";
    let lastErr = null;
    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text:
            `Xogta maaliyadeed ee player-ka:\n\n${contextText}\n\nGeli warbixintaada shakhsi ahaaneed ee tafatiran hadda.`
          }] }],
          generationConfig: { maxOutputTokens: 200 },
        });
        aiText = (result.response.text() || "").trim();
        if (aiText) {
          lastErr = null;
          break;
        }
      } catch (e) {
        lastErr = e;
        const status = e?.status ?? e?.response?.status ?? null;


        if (status === 404 || status === 429) continue;

        break;
      }
    }




    if (!aiText) {
      console.warn("[AI ME] All Gemini models failed, using offline fallback. Last error:",
        lastErr?.message || lastErr);
      aiText = buildOfflineNasiibAdvice({
        username, level, wallet, totalBanked,
        totalInvest, totalUnclaimedInv, netWorth,
        ownedBank, ownedBankBalance, ownedBankEarned,
        bankCount: bankRes.rows.length,
        invCount:  invRes.rows.length,
      });
    }


    const successEmbed = new EmbedBuilder()
      .setTitle("🧠 NasiibAI — Xogta Shakhsi Ahaaneed")
      .setDescription(aiText)
      .setColor(0x9b59b6)
      .addFields(
        { name: "💰 Wallet",        value: `${fmt(wallet)} 🪙`,           inline: true },
        { name: "🏦 Bankyo Kale",   value: `${fmt(totalBanked)} 🪙`,      inline: true },
        { name: "📈 Invested",      value: `${fmt(totalInvest)} 🪙`,      inline: true },
        { name: "🎁 Faa'iido la sugayo",value: `${fmt(totalUnclaimedInv)} 🪙`,inline: true },
        ...(ownedBank ? [{
          name: "👑 Bank aad leedahay",
          value: `**${ownedBank.name}** (L${ownedBank.level}) — Balance: ${fmt(ownedBankBalance)} · Lifetime profit: ${fmt(ownedBankEarned)}`,
          inline: false
        }] : []),
        { name: "💎 Net Worth Wadar", value: `**${fmt(netWorth)} 🪙**`,    inline: false }
      )
      .setFooter({ text: `Xogahaaga keliya ayaan arkaa · ${usage.used}/${usage.limit} maanta` });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`bank_acc_close_${userId}`)
        .setLabel("Close")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );

    return thinkingMsg.edit({ embeds: [successEmbed], components: [closeRow] });

  } catch (err) {
    console.error("[AI ME] Error:", err);



    const status     = err?.status ?? err?.response?.status ?? null;
    const rawMessage = String(err?.message || "");
    const isQuota    =
      status === 429 ||
      /quota|rate[- ]?limit|too many requests|exceeded/i.test(rawMessage);


    let retryHint = "";
    try {
      const retryInfo = (err?.errorDetails || []).find(d =>
        String(d?.["@type"] || "").includes("RetryInfo")
      );
      if (retryInfo?.retryDelay) retryHint = String(retryInfo.retryDelay);
    } catch {}

    let errEmbed;
    if (isQuota) {
      errEmbed = new EmbedBuilder()
        .setTitle("⏳ NasiibAi waa mashquul")
        .setDescription([
          "NasiibAi hadda waxaa la gaaray xadka codsiyada Gemini (free tier quota).",
          retryHint
            ? `Fadlan ku celi **${retryHint}** gudahood.`
            : "Fadlan dib u isku day daqiiqado yar gudahood.",
          "",
          "_Adminka: hubi GEMINI_API_KEY iyo planka Google AI Studio._"
        ].join("\n"))
        .setColor(0xf1c40f);
    } else {
      errEmbed = new EmbedBuilder()
        .setTitle("❌ Khalad Ayaa Dhacay")
        .setDescription("NasiibAi hadda ma shaqeynayso. Isku day mar kale.")
        .setColor(0xe74c3c);
    }

    if (thinkingMsg) return thinkingMsg.edit({ embeds: [errEmbed] });
    return message.reply({ embeds: [errEmbed] });
  }
}




const _decayCooldown = new Map();
const _DECAY_CD_MS   = 5 * 60_000;

export async function applyWalletIdleDecay(userId) {
  const now = Date.now();
  const last = _decayCooldown.get(userId) || 0;
  if (now - last < _DECAY_CD_MS) return;
  _decayCooldown.set(userId, now);
  try {
    const r = await pool.query(
      `SELECT coins, last_wallet_activity FROM players WHERE discord_id = $1`,
      [userId]
    );
    if (!r.rows[0]) return;

    const coins            = Number(r.rows[0].coins || 0);
    const lastActivity     = Number(r.rows[0].last_wallet_activity || 0);
    const idleMs           = now - lastActivity;
    const SEVEN_DAYS_MS    = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY_MS       = 24 * 60 * 60 * 1000;


    await pool.query(
      `UPDATE players SET last_wallet_activity = $1 WHERE discord_id = $2`,
      [now, userId]
    );


    if (lastActivity === 0 || idleMs < SEVEN_DAYS_MS || coins <= 0) return;

    const extraDays  = Math.floor((idleMs - SEVEN_DAYS_MS) / ONE_DAY_MS);
    const decayRate  = Math.min(0.10 + extraDays * 0.01, 0.50);
    const decayAmt   = Math.floor(coins * decayRate);
    if (decayAmt <= 0) return;

    await pool.query(
      `UPDATE players SET coins = GREATEST(0, coins - $1) WHERE discord_id = $2`,
      [decayAmt, userId]
    );
    console.log(`[BANK] 💸 Idle decay: ${userId} lost ${decayAmt} coins (${Math.round(decayRate * 100)}% rate, ${Math.floor(idleMs / ONE_DAY_MS)}d idle)`);
  } catch (err) {
    console.error("[BANK] applyWalletIdleDecay error:", err.message);
  }
}
