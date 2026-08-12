import { createRequire } from "module"; const require = createRequire(import.meta.url);
import { setupBankSystem, applyWalletIdleDecay, getShopPriceMultiplier } from "./bankSystem.mjs";
import { setupBankLevel4 } from "./bankLevel4.mjs";
import { setupCoinflipPvp } from "./coinflipPvp.mjs";
import { setupTicketSystem } from "./ticketSystem.mjs";
import { setupBankSlashCommands } from "./bankSlashCommands.mjs";
import { hasActiveTempShield, getActiveTempShield, formatShieldRemaining, TEMP_SHIELD_EMOJI } from "./tempShieldSystem.mjs";
import { setupVault, addVaultEarning, isDogGuardActive } from "./vault.mjs";
import { setupServerBoost } from "./serverBoost.mjs";
import { setupBankTransfer } from "./bankTransfer.mjs";
import { setupEventSystem, buildEventItemsWalletLine } from "./event/index.mjs";
import { setupCiladSystem, handleCiladDmRelay } from "./cilad.mjs";
import {
  setupLoanSystem,
  handleLoanCommand,
  handleLoanPay,
  handleLoanInteraction,
  hasActiveLoan,
  applyIncome,
  getActiveLoan,
} from "./loanSystem.mjs";
import { setupTowerSystem, activeTowerGames } from "./tower.mjs";

async function safeSend(channel, payload) {
  try {
    if (!channel || typeof channel.send !== "function") return null;
    if (channel.guild) {
      const me = channel.guild.members?.me;
      if (me) {
        const perms = channel.permissionsFor(me);
        if (!perms || !perms.has("SendMessages") || !perms.has("ViewChannel") || !perms.has("EmbedLinks")) {
          console.log(`[PERM CHECK FAILED] Missing permissions in channel ${channel.id}`);
          return null;
        }
      }
    }
    return await channel.send(payload);
  } catch (err) {
    if (err.code === 50013) {
      console.log(`[PERM ERROR] Cannot send message in channel ${channel.id}`);
    } else {
      console.error(`[SEND ERROR] channel ${channel.id}:`, err.message);
    }
    return null;
  }
}
import { setupSomaliHelp } from "./somalihelp.mjs";
import { setupPermissionSystem, chatDropDisabled } from "./permissionSystem.mjs";
import { buildVerifyEmbed, checkNetWorthMilestone, setupVerifyInteractions, PRIVACY_URL, TOS_URL, VERIFY_BADGE } from "./verifySystem.mjs";
import "./voteSystem.mjs";
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};


import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";


import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";


var schema_exports = {};
__export(schema_exports, {
  botSettings: () => botSettings,
  guildConfigs: () => guildConfigs,
  insertPlayerSchema: () => insertPlayerSchema,
  players: () => players,
  staff: () => staff
});
import { pgTable, text, integer, serial, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var players = pgTable("players", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  bio: text("bio").default("No bio set."),
  activeTitle: text("active_title"),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  gamesPlayed: integer("games_played").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  highestStreak: integer("highest_streak").notNull().default(0),
  achievements: jsonb("achievements").notNull().default([]),
  gameStats: jsonb("game_stats").notNull().default({
    fti: { wins: 0, losses: 0, played: 0 },
    bluff: { wins: 0, losses: 0, played: 0 },
    iq: { wins: 0, losses: 0, played: 0 },
    guess: { wins: 0, losses: 0, played: 0 },
    tower: { played: 0, highestFloor: 0, totalXpEarned: 0 },
    miino: { played: 0, wins: 0, losses: 0, bestReveal: 0 },
    sheeko: { played: 0, wins: 0, losses: 0, timesFooledAll: 0 }
  }),
  warnings: integer("warnings").notNull().default(0),
  mutedUntil: text("muted_until"),
  banned: boolean("banned").notNull().default(false),
  prestige: integer("prestige").notNull().default(0),
  dailyStreak: integer("daily_streak").notNull().default(0),
  lastDaily: text("last_daily"),
  xpBoost: integer("xp_boost").notNull().default(0),
  diamonds: integer("diamonds").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  legendaryCrates: integer("legendary_crates").notNull().default(0),
  ownedTitles: jsonb("owned_titles").notNull().default([])
});
var botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  settings: jsonb("settings").notNull().default({})
});
var staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  role: text("role").notNull(),
  addedBy: text("added_by").notNull()
});
var guildConfigs = pgTable("guild_configs", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  welcomeChannelId: text("welcome_channel_id"),
  levelUpChannelId: text("level_up_channel_id"),
  starboardChannelId: text("starboard_channel_id"),
  starboardThreshold: integer("starboard_threshold").notNull().default(3),
  countingChannelId: text("counting_channel_id"),
  countingCurrent: integer("counting_current").notNull().default(0),
  countingLastUser: text("counting_last_user"),
  reactionRoles: jsonb("reaction_roles").notNull().default([]),
  automodEnabled: boolean("automod_enabled").notNull().default(false),
  automodAntiLink: boolean("automod_anti_link").notNull().default(false)
});
var insertPlayerSchema = createInsertSchema(players);


var { Pool } = pg;
let dbOnline = false;
if (!process.env.DATABASE_URL) {
  console.warn('[DB] WARNING: DATABASE_URL is not set — botka wuxuu shaqeenayaa database la,aan');
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost/fallback' });
var db = drizzle(pool, { schema: schema_exports });


const NW_UNVERIFIED_CAP = 1_000_000;





const _appNwCache = new Map();
const _APP_NW_TTL = 30_000;

async function calcPlayerNetWorth(discordId) {
  try {
    const now    = Date.now();
    const cached = _appNwCache.get(discordId);
    if (cached && (now - cached.at) < _APP_NW_TTL) {
      return { netWorth: cached.netWorth, isVerified: cached.isVerified };
    }
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
    if (!r.rows[0]) return { netWorth: 0, isVerified: false };
    const netWorth   = Number(r.rows[0].net_worth || 0);
    const isVerified = r.rows[0].is_verified === true;
    _appNwCache.set(discordId, { netWorth, isVerified, at: now });
    return { netWorth, isVerified };
  } catch { return { netWorth: 0, isVerified: false }; }
}
async function nwCapBlocked(discordId, incomingCoins = 0) {
  const { netWorth, isVerified } = await calcPlayerNetWorth(discordId);
  if (isVerified) return null;
  if (netWorth + incomingCoins >= NW_UNVERIFIED_CAP) {
    return new EmbedBuilder()
      .setTitle("\uD83D\uDD12 Xad — Net Worth")
      .setDescription(
        `\uD83D\uDD12 Accountgaaga waxa uu gaaray xadka lacagta loogu tala galay dadka aan verify ahayn.\n\n` +
        `\uD83D\uDCB0 **Net Worth-kaaga:** ${netWorth.toLocaleString()} \uD83E\uDE99\n` +
        `\uD83D\uDD12 **Xadka:** 1,000,000 \uD83E\uDE99\n\n` +
        `\u2705 Qor **\`!verify\`** si aad u xaqiijiso oo xadka la saaro.`
      )
      .setColor(0xe74c3c)
      .setFooter({ text: "!verify — Available at 950,000+ net worth \u00B7 Nasiib" });
  }
  return null;
}

async function checkDbHealth() {
  try {
    await pool.query('SELECT 1');
    if (!dbOnline) console.log('[DB] ✅ Database is back online — economy commands restored.');
    dbOnline = true;
  } catch (err) {
    if (dbOnline) console.error('[DB] ⚠️ Database went offline:', err.message);
    dbOnline = false;
  }
}

async function safeQuery(q, params = []) {
  try {
    return await pool.query(q, params);
  } catch (err) {
    console.error('[DB ERROR]', err.message);
    return null;
  }
}
async function autoMigrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        discord_id TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        bio TEXT DEFAULT 'No bio set.',
        active_title TEXT,
        xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        games_played INTEGER NOT NULL DEFAULT 0,
        imposter_wins INTEGER NOT NULL DEFAULT 0,
        citizen_wins INTEGER NOT NULL DEFAULT 0,
        current_streak INTEGER NOT NULL DEFAULT 0,
        highest_streak INTEGER NOT NULL DEFAULT 0,
        achievements JSONB NOT NULL DEFAULT '[]',
        game_stats JSONB NOT NULL DEFAULT '{"fti":{"wins":0,"losses":0,"played":0},"bluff":{"wins":0,"losses":0,"played":0},"iq":{"wins":0,"losses":0,"played":0},"guess":{"wins":0,"losses":0,"played":0}}',
        warnings INTEGER NOT NULL DEFAULT 0,
        muted_until TEXT,
        banned BOOLEAN NOT NULL DEFAULT false
      );
    `);
    const addCol = async (table, col, type, def) => {
      const defClause = def !== void 0 ? ` DEFAULT ${def}` : "";
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}${defClause}`).catch(() => {
      });
    };
    await addCol("players", "bio", "TEXT", "'No bio set.'");
    await addCol("players", "active_title", "TEXT");
    await addCol("players", "xp", "INTEGER NOT NULL", "0");
    await addCol("players", "level", "INTEGER NOT NULL", "1");
    await addCol("players", "current_streak", "INTEGER NOT NULL", "0");
    await addCol("players", "highest_streak", "INTEGER NOT NULL", "0");
    await addCol("players", "achievements", "JSONB NOT NULL", "'[]'");
    await addCol("players", "game_stats", "JSONB NOT NULL", `'{"fti":{"wins":0,"losses":0,"played":0},"bluff":{"wins":0,"losses":0,"played":0},"iq":{"wins":0,"losses":0,"played":0},"guess":{"wins":0,"losses":0,"played":0}}'`);
    await addCol("players", "warnings", "INTEGER NOT NULL", "0");
    await addCol("players", "muted_until", "TEXT");
    await addCol("players", "banned", "BOOLEAN NOT NULL", "false");
    await addCol("players", "imposter_wins", "INTEGER NOT NULL", "0");
    await addCol("players", "citizen_wins", "INTEGER NOT NULL", "0");
    await addCol("players", "prestige", "INTEGER NOT NULL", "0");
    await addCol("players", "daily_streak", "INTEGER NOT NULL", "0");
    await addCol("players", "last_daily", "TEXT");
    await addCol("players", "xp_boost", "INTEGER NOT NULL", "0");
    await addCol("players", "diamonds", "INTEGER NOT NULL", "0");
    await addCol("players", "coins", "INTEGER NOT NULL", "0");
    await addCol("players", "legendary_crates", "INTEGER NOT NULL", "0");
    await addCol("players", "vote_streak", "INTEGER NOT NULL", "0");
    await addCol("players", "owned_titles", "JSONB NOT NULL", "'[]'");
    await addCol("players", "last_vote_time", "BIGINT", "NULL");
    await addCol("players", "on_hold", "BOOLEAN NOT NULL", "false");
    await addCol("players", "on_hold_reason", "TEXT");
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false`);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS verify_reward_claimed BOOLEAN NOT NULL DEFAULT false`);
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS nw_milestone_dm_sent BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_settings (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL UNIQUE,
        settings JSONB NOT NULL DEFAULT '{}'
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        discord_id TEXT NOT NULL,
        role TEXT NOT NULL,
        added_by TEXT NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS guild_configs (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL UNIQUE,
        welcome_channel_id TEXT,
        level_up_channel_id TEXT,
        starboard_channel_id TEXT,
        starboard_threshold INTEGER NOT NULL DEFAULT 3,
        counting_channel_id TEXT,
        counting_current INTEGER NOT NULL DEFAULT 0,
        counting_last_user TEXT,
        reaction_roles JSONB NOT NULL DEFAULT '[]',
        automod_enabled BOOLEAN NOT NULL DEFAULT false,
        automod_anti_link BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        user_id   TEXT    PRIMARY KEY,
        last_vote BIGINT  NOT NULL,
        processed BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS vote_settings (
        user_id           TEXT    PRIMARY KEY,
        reminders_enabled BOOLEAN NOT NULL DEFAULT true
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS drop_disabled_channels (
        channel_id TEXT PRIMARY KEY,
        guild_id   TEXT NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_wallet (
        id       INTEGER PRIMARY KEY DEFAULT 1,
        coins    BIGINT  NOT NULL DEFAULT 0,
        diamonds BIGINT  NOT NULL DEFAULT 0,
        CHECK (id = 1)
      );
    `);
    await client.query(`
      INSERT INTO bot_wallet (id, coins, diamonds) VALUES (1, 0, 0) ON CONFLICT (id) DO NOTHING;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS limited_shop (
        id       INTEGER PRIMARY KEY DEFAULT 1,
        name     TEXT    NOT NULL DEFAULT 'Observer',
        price    INTEGER NOT NULL DEFAULT 2500,
        ability  TEXT    NOT NULL DEFAULT 'observer_hint',
        expires_at BIGINT NOT NULL DEFAULT 0,
        CHECK (id = 1)
      );
    `);
    await client.query(`
      INSERT INTO limited_shop (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS heist_shop_rotation (
        item_id  TEXT    PRIMARY KEY,
        stock    INTEGER NOT NULL DEFAULT 0,
        reset_at BIGINT  NOT NULL DEFAULT 0
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS heist_inventory (
        user_id     TEXT    NOT NULL,
        item_id     TEXT    NOT NULL,
        quantity    INTEGER NOT NULL DEFAULT 1,
        acquired_at BIGINT  NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, item_id)
      );
    `);
    console.log("Database migration complete.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
  }
}


import { eq, desc } from "drizzle-orm";
var DEFAULT_SETTINGS = {
  xpEnabled: true,
  baseWinXP: 25,
  participationXP: 5,
  citizenSurviveXP: 15,
  imposterKillXP: 5,
  imposterSurviveXP: 20,
  streakMultipliers: { "3": 0.05, "5": 0.08, "10": 0.12, "15": 0.15 },
  finalStandEnabled: true,
  inactivityRemovalEnabled: true
};
var DatabaseStorage = class {
  async getPlayer(discordId) {
    const [player] = await db.select().from(players).where(eq(players.discordId, discordId));
    return player;
  }
  async getTopPlayers() {
    return await db.select().from(players).orderBy(desc(players.level), desc(players.xp)).limit(10);
  }
  async createPlayer(player) {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }
  async updateBio(discordId, bio) {
    const [updated] = await db.update(players).set({ bio }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateTitle(discordId, title) {
    const [updated] = await db.update(players).set({ activeTitle: title }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updatePlayerStats(discordId, stats) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    if (stats.numPlayers < 4) return player;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned || restriction.onHold) return player;
    let { xp, wins, losses, gamesPlayed, currentStreak, highestStreak } = player;
    const gStats = this.ensureGameStats(player.gameStats);
    gamesPlayed += 1;
    gStats.fti.played += 1;
    let baseXP = stats.win ? 35 : 10;
    let bonusXP = 0;
    if (stats.role === "imposter") {
      if (stats.survived) bonusXP += 12;
      bonusXP += stats.eliminatedPlayerCount * 8;
    } else {
      if (stats.correctVote) bonusXP += 6;
      if (stats.survived) bonusXP += 8;
    }
    if (stats.clutchWin) bonusXP += 15;
    if (stats.win) {
      wins += 1;
      gStats.fti.wins += 1;
      currentStreak += 1;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
    } else {
      losses += 1;
      gStats.fti.losses += 1;
      currentStreak = 0;
    }
    const streakBonus = this.getStreakBonus(currentStreak);
    const prestigeBoost = (player.prestige || 0) * 5;
    let earned = Math.floor((baseXP + bonusXP) * (1 + streakBonus)) + prestigeBoost;
    if (gStats.xpAbsorb) { earned = Math.floor(earned * 2); gStats.xpAbsorb = false; }
    const result = this.applyXPAndLevel(xp, player.level, earned);
    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level, wins, losses, gamesPlayed, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return { player: updated, xpAwarded: earned };
  }
  async updateGuessStats(discordId, result, guessCount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned || restriction.onHold) return player;
    let { wins, losses, gamesPlayed, currentStreak, highestStreak } = player;
    const gStats = this.ensureGameStats(player.gameStats);
    gamesPlayed += 1;
    gStats.guess.played += 1;
    if (result === "win") {
      wins += 1;
      gStats.guess.wins += 1;
      currentStreak += 1;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
    } else if (result === "loss") {
      losses += 1;
      gStats.guess.losses += 1;
      currentStreak = 0;
    }
    const [updated] = await db.update(players).set({ wins, losses, gamesPlayed, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateBluffStats(discordId, result, numPlayers) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    if (numPlayers < 3) return player;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned || restriction.onHold) return player;
    let { xp, wins, losses, gamesPlayed, currentStreak, highestStreak } = player;
    const gStats = this.ensureGameStats(player.gameStats);
    gamesPlayed += 1;
    gStats.bluff.played += 1;
    let earnedXP = 0;
    if (result === "win") {
      wins += 1;
      gStats.bluff.wins += 1;
      earnedXP = 30;
      currentStreak += 1;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
    } else {
      losses += 1;
      gStats.bluff.losses += 1;
      earnedXP = 5;
      currentStreak = 0;
    }
    const streakBonus = this.getStreakBonus(currentStreak);
    const prestigeBoost = (player.prestige || 0) * 5;
    const earned = Math.floor(earnedXP * (1 + streakBonus)) + prestigeBoost;
    const lvlResult = this.applyXPAndLevel(xp, player.level, earned);
    const [updated] = await db.update(players).set({ xp: lvlResult.xp, level: lvlResult.level, wins, losses, gamesPlayed, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateTowerStats(discordId, floorsClimbed, xpEarned) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned || restriction.onHold) return player;
    const gStats = this.ensureGameStats(player.gameStats);
    gStats.tower.played += 1;
    if (floorsClimbed > gStats.tower.highestFloor) gStats.tower.highestFloor = floorsClimbed;
    gStats.tower.totalXpEarned += xpEarned;
    const prestigeBoost = (player.prestige || 0) * 5;
    let towerXP = xpEarned;
    if (gStats.xpAbsorb) { towerXP = Math.floor(towerXP * 2); gStats.xpAbsorb = false; }
    const totalXP = towerXP + prestigeBoost;
    const result = this.applyXPAndLevel(player.xp, player.level, totalXP);
    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level, gamesPlayed: player.gamesPlayed + 1, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return { player: updated, xpAwarded: towerXP };
  }
  async updateMiinoStats(discordId, result, tilesRevealed, xpEarned) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned || restriction.onHold) return player;
    const gStats = this.ensureGameStats(player.gameStats);
    gStats.miino.played += 1;
    if (result === "win") gStats.miino.wins += 1;
    else gStats.miino.losses += 1;
    if (tilesRevealed > gStats.miino.bestReveal) gStats.miino.bestReveal = tilesRevealed;
    const prestigeBoost = (player.prestige || 0) * 5;
    let minoXP = xpEarned;
    if (gStats.xpAbsorb) { minoXP = Math.floor(minoXP * 2); gStats.xpAbsorb = false; }
    const totalXP = minoXP + prestigeBoost;
    const lvlResult = this.applyXPAndLevel(player.xp, player.level, totalXP);
    const [updated] = await db.update(players).set({ xp: lvlResult.xp, level: lvlResult.level, gamesPlayed: player.gamesPlayed + 1, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return { player: updated, xpAwarded: minoXP };
  }
  async updateShekoStats(discordId, result, fooledAllCount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned || restriction.onHold) return player;
    let { wins, losses, currentStreak, highestStreak } = player;
    const gStats = this.ensureGameStats(player.gameStats);
    gStats.sheeko.played += 1;
    let earnedXP = 0;
    if (result === "win") {
      wins += 1;
      gStats.sheeko.wins += 1;
      earnedXP = 20;
      currentStreak += 1;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
    } else {
      losses += 1;
      gStats.sheeko.losses += 1;
      earnedXP = 5;
      currentStreak = 0;
    }
    gStats.sheeko.timesFooledAll += fooledAllCount;
    const streakBonus = this.getStreakBonus(currentStreak);
    const prestigeBoost = (player.prestige || 0) * 5;
    let earned = Math.floor(earnedXP * (1 + streakBonus)) + prestigeBoost;
    if (gStats.xpAbsorb) { earned = Math.floor(earned * 2); gStats.xpAbsorb = false; }
    const lvlResult = this.applyXPAndLevel(player.xp, player.level, earned);
    const [updated] = await db.update(players).set({ xp: lvlResult.xp, level: lvlResult.level, wins, losses, gamesPlayed: player.gamesPlayed + 1, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return { player: updated, xpAwarded: earned };
  }
  async resetAllXP() {
    await db.update(players).set({
      xp: 0,
      level: 1,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      currentStreak: 0,
      highestStreak: 0,
      gameStats: {
        fti: { wins: 0, losses: 0, played: 0 },
        bluff: { wins: 0, losses: 0, played: 0 },
        iq: { wins: 0, losses: 0, played: 0 },
        guess: { wins: 0, losses: 0, played: 0 },
        tower: { played: 0, highestFloor: 0, totalXpEarned: 0 },
        miino: { played: 0, wins: 0, losses: 0, bestReveal: 0 },
        sheeko: { played: 0, wins: 0, losses: 0, timesFooledAll: 0 }
      }
    });
  }
  async updatePlayerXP(discordId, amount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const result = this.applyXPAndLevel(player.xp, player.level, amount);
    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async claimDaily(discordId) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (player.lastDaily === today) return null;
    const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
    const gStats = this.ensureGameStats(player.gameStats);
    let shieldUsed = false;
    let streak;
    if (player.lastDaily === yesterday) {
      streak = player.dailyStreak + 1;
    } else if (player.dailyStreak > 0 && gStats.streakShield) {
      streak = player.dailyStreak + 1;
      gStats.streakShield = false;
      shieldUsed = true;
    } else {
      streak = 1;
    }
    const bonusDay = streak % 7 === 0;
    const legendaryDay = streak % 30 === 0;
    let dailyXP = 15 + Math.min(streak * 3, 30);
    if (bonusDay) dailyXP += 25;
    let shopBoostXP = 0;
    if (gStats.xpBoostDays && gStats.xpBoostDays > 0) {
      shopBoostXP = 10;
      gStats.xpBoostDays -= 1;
    }
    const totalXP = dailyXP + player.xpBoost + shopBoostXP;
    const result = this.applyXPAndLevel(player.xp, player.level, totalXP);
    let diamondsEarned = 3;
    let cratesEarned = 0;
    if (legendaryDay) { diamondsEarned += 100; cratesEarned = 1; }
    const weekNum = Math.min(Math.floor((streak - 1) / 7), 7);
    let coinsEarned = 50 + weekNum * 15;
    if (bonusDay) coinsEarned += 100;
    if (legendaryDay) coinsEarned += 3000;
    const newDiamonds = Math.max(0, (player.diamonds || 0) + diamondsEarned);
    const newCrates = (player.legendaryCrates || 0) + cratesEarned;

    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level, dailyStreak: streak, lastDaily: today, diamonds: newDiamonds, legendaryCrates: newCrates, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return { player: updated, xpEarned: totalXP, streak, bonusDay, legendaryDay, diamondsEarned, coinsEarned, cratesEarned, shieldUsed, shopBoostXP };
  }
  async addDiamonds(discordId, amount) {
    const r = await pool.query(
      `UPDATE players SET diamonds = GREATEST(0, diamonds + $1) WHERE discord_id = $2 RETURNING *`,
      [amount, discordId]
    );
    return r.rows[0] ? this._mapRow(r.rows[0]) : null;
  }
  async addCoins(discordId, amount) {

    const r = await pool.query(
      `UPDATE players SET coins = coins + $1 WHERE discord_id = $2 RETURNING *`,
      [amount, discordId]
    );
    return r.rows[0] ? this._mapRow(r.rows[0]) : null;
  }
  async spendCoins(discordId, amount) {
    const r = await pool.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING *`,
      [amount, discordId]
    );
    return r.rows[0] ? this._mapRow(r.rows[0]) : null;
  }
  async addBotCoins(amount) {
    if (!amount || amount <= 0) return;
    await pool.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [amount]);
    console.log(`[TREASURY] +${Math.floor(amount)} (incoming)`);
  }
  async spendBotCoins(amount) {
    if (!amount || amount <= 0) return;
    await pool.query(`UPDATE bot_wallet SET coins = GREATEST(0, coins - $1) WHERE id = 1`, [amount]);
    console.log(`[TREASURY] -${Math.floor(amount)} (outgoing)`);
  }
  async addBotDiamonds(amount) {
    if (!amount || amount <= 0) return;
    await pool.query(`UPDATE bot_wallet SET diamonds = diamonds + $1 WHERE id = 1`, [amount]);
  }
  async getBotWallet() {
    const r = await pool.query(`SELECT coins, diamonds FROM bot_wallet WHERE id = 1`);
    return r.rows[0] || { coins: 0, diamonds: 0 };
  }
  async spendDiamonds(discordId, amount) {
    const r = await pool.query(
      `UPDATE players SET diamonds = diamonds - $1 WHERE discord_id = $2 AND diamonds >= $1 RETURNING *`,
      [amount, discordId]
    );
    return r.rows[0] ? this._mapRow(r.rows[0]) : null;
  }
  async transferCoins(fromId, toId, amount) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const debit = await client.query(
        `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`,
        [amount, fromId]
      );
      if (debit.rowCount === 0) { await client.query('ROLLBACK'); return null; }

      const credit = await client.query(
        `UPDATE players SET coins = coins + $1 WHERE discord_id = $2 RETURNING coins`,
        [amount, toId]
      );
      await client.query('COMMIT');
      return { fromCoins: debit.rows[0].coins, toCoins: credit.rows[0].coins };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  _mapRow(row) {
    return {
      discordId: row.discord_id,
      username: row.username,
      xp: row.xp,
      level: row.level,
      coins: row.coins,
      diamonds: row.diamonds,
      legendaryCrates: row.legendary_crates,
      dailyStreak: row.daily_streak,
      lastDaily: row.last_daily,
      xpBoost: row.xp_boost,
      gameStats: row.game_stats,
      wins: row.wins,
      losses: row.losses,
      gamesPlayed: row.games_played,
      currentStreak: row.current_streak,
      highestStreak: row.highest_streak,
      prestige: row.prestige,
      bio: row.bio,
      activeTitle: row.active_title,
      warnings: row.warnings,
      mutedUntil: row.muted_until,
      bannedUntil: row.banned_until,
      voteStreak: row.vote_streak || 0,
      lastVoteTime: row.last_vote_time || null,
      onHold: row.on_hold ?? false,
      onHoldReason: row.on_hold_reason || null,
    };
  }
  async openLegendaryCrate(discordId) {
    const player = await this.getPlayer(discordId);
    if (!player || (player.legendaryCrates || 0) < 1) return null;
    const newCrates = (player.legendaryCrates || 0) - 1;
    const [updated] = await db.update(players).set({ legendaryCrates: newCrates }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async prestige(discordId) {
    const player = await this.getPlayer(discordId);
    if (!player || player.level < 50) return null;
    const newPrestige = player.prestige + 1;
    const newXpBoost = newPrestige * 5;
    const [updated] = await db.update(players).set({ level: 1, xp: 0, prestige: newPrestige, xpBoost: newXpBoost }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async warnPlayer(discordId) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const [updated] = await db.update(players).set({ warnings: player.warnings + 1 }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async mutePlayer(discordId, until) {
    const [updated] = await db.update(players).set({ mutedUntil: until }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async unmutePlayer(discordId) {
    const [updated] = await db.update(players).set({ mutedUntil: null }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async banPlayer(discordId) {
    const [updated] = await db.update(players).set({ banned: true }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async unbanPlayer(discordId) {
    const [updated] = await db.update(players).set({ banned: false }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async holdPlayer(discordId, reason) {
    await pool.query(`UPDATE players SET on_hold = true, on_hold_reason = $1 WHERE discord_id = $2`, [reason, discordId]);
  }
  async unholdPlayer(discordId) {
    await pool.query(`UPDATE players SET on_hold = false, on_hold_reason = NULL WHERE discord_id = $1`, [discordId]);
  }
  async isPlayerRestricted(discordId) {
    const player = await this.getPlayer(discordId);
    if (!player) return { muted: false, banned: false, onHold: false, mutedUntil: null };
    let muted = false;
    if (player.mutedUntil) {
      if (new Date(player.mutedUntil) > /* @__PURE__ */ new Date()) {
        muted = true;
      } else {
        await db.update(players).set({ mutedUntil: null }).where(eq(players.discordId, discordId));
      }
    }
    const onHold = !!(player.onHold);
    return { muted, banned: player.banned, onHold, onHoldReason: player.onHoldReason || null, mutedUntil: player.mutedUntil };
  }
  async getStaff() {
    return await db.select({ discordId: staff.discordId, role: staff.role, addedBy: staff.addedBy }).from(staff);
  }
  async addStaff(discordId, role, addedBy) {
    const existing = await db.select().from(staff).where(eq(staff.discordId, discordId));
    if (existing.length > 0) {
      await db.update(staff).set({ role, addedBy }).where(eq(staff.discordId, discordId));
    } else {
      await db.insert(staff).values({ discordId, role, addedBy });
    }
  }
  async removeStaff(discordId) {
    await db.delete(staff).where(eq(staff.discordId, discordId));
  }
  async getBotSettings(guildId) {
    const [row] = await db.select().from(botSettings).where(eq(botSettings.guildId, guildId));
    if (!row) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...row.settings };
  }
  async updateBotSettings(guildId, newSettings) {
    const current = await this.getBotSettings(guildId);
    const merged = { ...current, ...newSettings };
    const existing = await db.select().from(botSettings).where(eq(botSettings.guildId, guildId));
    if (existing.length > 0) {
      await db.update(botSettings).set({ settings: merged }).where(eq(botSettings.guildId, guildId));
    } else {
      await db.insert(botSettings).values({ guildId, settings: merged });
    }
    return merged;
  }
  xpRequiredForLevel(level) {
    const base = 75 + level * 40 + level * level * 8;
    if (level >= 25) {
      const extra = Math.floor((level - 24) * (level - 24) * 12);
      return base + extra;
    }
    return base;
  }
  applyXPAndLevel(xp, level, earned) {
    const startLevel = level;
    if (level >= 25 && earned > 0) {
      const reduction = Math.min(0.5, (level - 24) * 0.02);
      earned = Math.max(1, Math.floor(earned * (1 - reduction)));
    }
    xp += earned;
    while (xp >= this.xpRequiredForLevel(level)) {
      xp -= this.xpRequiredForLevel(level);
      level += 1;
    }
    while (xp < 0 && level > 1) {
      level -= 1;
      xp += this.xpRequiredForLevel(level);
    }
    xp = Math.max(0, xp);
    return { xp, level, levelsGained: level - startLevel };
  }
  ensureGameStats(raw) {
    const gs = raw || {};
    if (!gs.fti) gs.fti = { wins: 0, losses: 0, played: 0 };
    if (!gs.bluff) gs.bluff = { wins: 0, losses: 0, played: 0 };
    if (!gs.iq) gs.iq = { wins: 0, losses: 0, played: 0 };
    if (!gs.guess) gs.guess = { wins: 0, losses: 0, played: 0 };
    if (!gs.tower) gs.tower = { played: 0, highestFloor: 0, totalXpEarned: 0 };
    if (!gs.miino) gs.miino = { played: 0, wins: 0, losses: 0, bestReveal: 0 };
    if (!gs.sheeko) gs.sheeko = { played: 0, wins: 0, losses: 0, timesFooledAll: 0 };
    if (gs.xpAbsorb === undefined) gs.xpAbsorb = false;
    if (gs.slotInsurance === undefined) gs.slotInsurance = false;
    return gs;
  }
  getStreakBonus(streak) {
    if (streak >= 15) return 0.15;
    if (streak >= 10) return 0.12;
    if (streak >= 5) return 0.08;
    if (streak >= 3) return 0.05;
    return 0;
  }
  async getGuildConfig(guildId) {
    const [row] = await db.select().from(guildConfigs).where(eq(guildConfigs.guildId, guildId));
    return row || null;
  }
  async upsertGuildConfig(guildId, data) {
    const existing = await this.getGuildConfig(guildId);
    if (existing) {
      const [updated] = await db.update(guildConfigs).set(data).where(eq(guildConfigs.guildId, guildId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(guildConfigs).values({ guildId, ...data }).returning();
      return created;
    }
  }
  async updateCounting(guildId, current, lastUser) {
    await db.update(guildConfigs).set({ countingCurrent: current, countingLastUser: lastUser }).where(eq(guildConfigs.guildId, guildId));
  }
};
var _rawStorage = new DatabaseStorage();

var storage = _rawStorage;


import T from "./somali.mjs";


var CARD_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var CARD_SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
function createDeck() {
  const deck = [];
  for (const r of CARD_RANKS) for (const s of CARD_SUITS) deck.push(`${r}${s}`);
  return deck.sort(() => Math.random() - 0.5);
}
function dealCards(players2) {
  const deck = createDeck();
  let i = 0;
  while (i < deck.length) {
    for (const p of players2) {
      if (i < deck.length) {
        p.hand.push(deck[i]);
        i++;
      }
    }
  }
}
function getCardRank(card) {
  return card.replace(/[â â¥â¦â£]/g, "");
}
var OWNER_ID = "MEESHAAN IDGAAGA GALI";

const OWNER_ONLY_CHANNEL = "ROOTI ";
const ANNOUNCEMENT_CHANNEL_IDS = new Set([
  "halkan gali weekly channel",
  "halkan gali weekly channel",
  "Halkan gali channelka bankiga",
]);
async function setupBot() {
  await checkDbHealth();
  setInterval(checkDbHealth, 5 * 60_000);
  try {
    await autoMigrate();
  } catch (err) {
    console.error('[DB] Migration failed, continuing without full DB setup:', err.message);
  }

  try {
    await pool.query(`UPDATE bot_wallet SET coins = GREATEST(coins, 500000) WHERE id = 1`);
    const tw = await pool.query(`SELECT coins FROM bot_wallet WHERE id = 1`);
    console.log(`[TREASURY] ✅ Bot wallet ready — ${Number(tw.rows[0]?.coins || 0).toLocaleString()} coins`);
  } catch (e) { console.error('[TREASURY] Seed error:', e.message); }
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions
    ],
    partials: [0, 1, 2, 3, 4]

  });

  client.on("guildCreate", async (guild) => {
    console.log(`[GUILD JOIN] Joined "${guild.name}" (${guild.id}) — now in ${client.guilds.cache.size} servers.`);
  });

  client.on("error", (err) => console.error("[ERROR] Discord client error:", err));

  setInterval(() => {
    console.log(`[HEARTBEAT] Bot alive — ${new Date().toISOString()}`);
    const now = Date.now();
  }, 60 * 60 * 1000);
  const lobbies = /* @__PURE__ */ new Map();
  const activeGames = /* @__PURE__ */ new Map();
  const activeGuessGames = /* @__PURE__ */ new Map();
  const bioRequests = /* @__PURE__ */ new Map();
  const recentChallenges = /* @__PURE__ */ new Map();
  const activeFtiChannels = /* @__PURE__ */ new Set();
  const duelDisabledCooldown = /* @__PURE__ */ new Map();
  const giveRoleCooldown = /* @__PURE__ */ new Map();
  const activeMiinoGames = /* @__PURE__ */ new Map();
  const activeMiinoV2Games = /* @__PURE__ */ new Map();
  const miinoV2Invites = /* @__PURE__ */ new Map();
  const activeShekoGames = /* @__PURE__ */ new Map();
  const sugQueue = /* @__PURE__ */ new Map();

  const nwCache = { rows: null, lastRefresh: 0 };

  async function refreshNwCache() {
    try {
      const res = await pool.query(`
        SELECT
          p.discord_id,
          p.username,
          p.is_verified,
          COALESCE(p.coins, 0) AS wallet,
          COALESCE(CAST(p.game_stats->'invest'->>'amount' AS BIGINT), 0) AS bot_invest,
          COALESCE(bu.total_deposited, 0) AS bank_deposited,
          COALESCE(bu.total_profit, 0) AS bank_profit,
          COALESCE(bi.total_bankinvest, 0) AS bank_invested,
          (
            COALESCE(p.coins, 0)
            + COALESCE(CAST(p.game_stats->'invest'->>'amount' AS BIGINT), 0)
            + COALESCE(bu.total_deposited, 0)
            + COALESCE(bu.total_profit, 0)
            + COALESCE(bi.total_bankinvest, 0)
          ) AS net_worth
        FROM players p
        LEFT JOIN (
          SELECT user_id, SUM(deposited) AS total_deposited, SUM(profit) AS total_profit
          FROM bank_users GROUP BY user_id
        ) bu ON bu.user_id = p.discord_id
        LEFT JOIN (
          SELECT user_id, SUM(amount) AS total_bankinvest
          FROM bank_investments GROUP BY user_id
        ) bi ON bi.user_id = p.discord_id
        WHERE (
          COALESCE(p.coins, 0)
          + COALESCE(CAST(p.game_stats->'invest'->>'amount' AS BIGINT), 0)
          + COALESCE(bu.total_deposited, 0)
          + COALESCE(bu.total_profit, 0)
          + COALESCE(bi.total_bankinvest, 0)
        ) > 0
        ORDER BY net_worth DESC
      `);
      nwCache.rows = res.rows;
      nwCache.lastRefresh = Date.now();
      console.log("[NW CACHE] Refreshed:", new Date().toUTCString());
    } catch (err) {
      console.error("[NW CACHE] Refresh error:", err.message);
    }
  }

  function scheduleNwDailyRefresh() {
    const now = new Date();
    const next = new Date();
    next.setUTCHours(21, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const delay = next - now;
    setTimeout(() => {
      refreshNwCache();
      setInterval(refreshNwCache, 24 * 60 * 60 * 1000);
    }, delay);
    const hrsUntil = Math.round(delay / 3_600_000 * 10) / 10;
    console.log(`[NW CACHE] Next auto-refresh in ${hrsUntil}h (12:00 PM EAT)`);
  }
  const level60Claimed = /* @__PURE__ */ new Set();
  const activeDrops = /* @__PURE__ */ new Map();
  const inviteCache = /* @__PURE__ */ new Map();
  const activeGiveaways = /* @__PURE__ */ new Map();
  const starboardPosted = /* @__PURE__ */ new Set();
  const spamTracker = /* @__PURE__ */ new Map();
  const coinflipCooldowns = /* @__PURE__ */ new Map();
  const slotsCooldowns = /* @__PURE__ */ new Map();
  const robCooldowns = /* @__PURE__ */ new Map();



  const channelGameCounts = /* @__PURE__ */ new Map();
  const FAST_MODE_THRESHOLD = 3;
  function bumpActiveGames(channelId) {
    channelGameCounts.set(channelId, (channelGameCounts.get(channelId) || 0) + 1);
  }
  function dropActiveGames(channelId) {
    const n = (channelGameCounts.get(channelId) || 0) - 1;
    if (n <= 0) channelGameCounts.delete(channelId);
    else channelGameCounts.set(channelId, n);
  }
  function isChannelBusy(channelId) {
    return (channelGameCounts.get(channelId) || 0) >= FAST_MODE_THRESHOLD;
  }
  const workCooldowns = /* @__PURE__ */ new Map();
  const economyProcessing = /* @__PURE__ */ new Set();
  const pendingGives = /* @__PURE__ */ new Map();
  let isShuttingDown = false;



  const userLocks = new Map();

  async function withUserLock(userId, fn) {
    while (userLocks.get(userId)) {
      await new Promise(res => setTimeout(res, 15));
    }
    userLocks.set(userId, true);
    try {
      return await fn();
    } finally {
      userLocks.delete(userId);
    }
  }


  function withDualUserLock(idA, idB, fn) {
    const [first, second] = idA < idB ? [idA, idB] : [idB, idA];
    return withUserLock(first, () => withUserLock(second, fn));
  }

  const economyRecentActivity = /* @__PURE__ */ new Map();


  const _fs = require("fs");
  const GAME_STATE_FILE = "./game_state.json";

  function _serializeState(obj) {
    if (obj instanceof Map) return { __T: "Map", e: [...obj.entries()].map(([k, v]) => [k, _serializeState(v)]) };
    if (obj instanceof Set) return { __T: "Set", v: [...obj].map(_serializeState) };
    if (Array.isArray(obj))  return obj.map(_serializeState);
    if (obj !== null && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "function") continue;
        if (k === "inactivityTimer" || k === "isProcessing") { out[k] = null; continue; }
        out[k] = _serializeState(v);
      }
      return out;
    }
    return obj;
  }

  function _deserializeState(obj) {
    if (obj && obj.__T === "Map") return new Map(obj.e.map(([k, v]) => [k, _deserializeState(v)]));
    if (obj && obj.__T === "Set") return new Set(obj.v.map(_deserializeState));
    if (Array.isArray(obj)) return obj.map(_deserializeState);
    if (obj !== null && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) out[k] = _deserializeState(v);
      return out;
    }
    return obj;
  }

  function saveGameStatesToDisk() {
    try {
      const state = {
        activeGames: _serializeState(activeGames),
        activeMiinoV2Games: _serializeState(activeMiinoV2Games),
        savedAt: Date.now(),
      };
      _fs.writeFileSync(GAME_STATE_FILE, JSON.stringify(state), "utf8");
      console.log(`[STATE] 💾 Saved ${activeGames.size} FTI + ${activeMiinoV2Games.size} Miino game(s) to disk.`);
    } catch (err) {
      console.error("[STATE] Failed to save game states:", err.message);
    }
  }

  async function restoreGameStatesFromDisk() {
    if (!_fs.existsSync(GAME_STATE_FILE)) return;
    try {
      const raw = JSON.parse(_fs.readFileSync(GAME_STATE_FILE, "utf8"));
      _fs.unlinkSync(GAME_STATE_FILE);
      if (!raw || Date.now() - raw.savedAt > 10 * 60 * 1000) {
        console.log("[STATE] Saved state is older than 10 min — skipping restore.");
        return;
      }

      const savedFTI = _deserializeState(raw.activeGames);
      for (const [lobbyId, game] of savedFTI) {
        try {
          const channel = await client.channels.fetch(game.channelId).catch(() => null);
          if (!channel) { console.warn(`[STATE] Channel ${game.channelId} not found — dropping FTI game ${lobbyId}`); continue; }
          game.isProcessing = false;
          activeGames.set(lobbyId, game);
          activeFtiChannels.add(game.channelId);
          await safeSend(channel, `🔄 **Bot wuxuu dib u bilaabay.** Ciyaartii FTI (Day **${game.day}**, **${game.alive.length}** ciyaartooda) dib ayay ugu bilaabanysaa xiligii dooda!`);
          startFTIRound(lobbyId, channel);
          console.log(`[STATE] ✅ Restored FTI game in channel ${game.channelId} (day ${game.day}, ${game.alive.length} alive)`);
        } catch (err) {
          console.error(`[STATE] Failed to restore FTI game ${lobbyId}:`, err.message);
        }
      }

      const savedMiino = _deserializeState(raw.activeMiinoV2Games);
      for (const [gameId, game] of savedMiino) {
        try {
          const channel = await client.channels.fetch(game.channelId).catch(() => null);
          if (!channel) { console.warn(`[STATE] Channel ${game.channelId} not found — dropping Miino game ${gameId}`); continue; }
          game.inactivityTimer = null;
          activeMiinoV2Games.set(gameId, game);
          const embed = buildMiinoV2Embed(game);
          const rows  = buildMiinoV2Buttons(game);
          const controlRow = buildMiinoV2ControlRow(game);
          const msg = await safeSend(channel, {
            content: `🔄 **Bot wuxuu dib u bilaabay — ciyaartii Miino way sii socon doontaa!** <@${game.currentTurn}> — wareega waaye.`,
            embeds: [embed],
            components: [controlRow, ...rows],
          });
          if (msg) game.messageId = msg.id;
          resetMiinoV2Timer(game, channel);
          console.log(`[STATE] ✅ Restored Miino V2 game ${gameId}`);
        } catch (err) {
          console.error(`[STATE] Failed to restore Miino game ${gameId}:`, err.message);
        }
      }
    } catch (err) {
      console.error("[STATE] Failed to restore game states:", err.message);
    }
  }


  async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    saveGameStatesToDisk();
    const deadline = Date.now() + 12000;
    while (economyProcessing.size > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 100));
    }
    process.exit(0);
  }
  process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));


  function makeCloseButton(authorId) {
    return new ButtonBuilder()
      .setCustomId(`close_panel_${authorId}`)
      .setLabel("Close")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger);
  }

  const activeShopPanels  = new Map();
  const activeDShopPanels = new Map();


  const SHOP_CATALOG = {
    boosts: [
      { id: "xpboost",   label: "⚡ XP Boost",       price: 500,   desc: "+10 XP maalin walba (7 maalmood)" },
      { id: "luckycrate",label: "🍀 Lucky Crate",     price: 750,   desc: "Coins, Diamonds ama XP — nasiib!" },
      { id: "liin",        label: "🍋 Liin Dhanaan",      price: 100,   desc: "Hoos u dhig rob cooldown 10% (stacks!) mar kasta oo aad isticmaasho" },
      { id: "xpabsorb",    label: "🧲 XP Absorb",          price: 250,   desc: "Labo jibaar XP ciyaarta xigta (FTI, Miino, Sheeko, Tower) — hal mar" },
      { id: "slotinsurance", label: "🎰 Slot Insurance",   price: 600,   desc: "Haddii !slots kaaga xiga ku khasaranto, 30% bet kaaga waa laguu soo celinayaa" },
    ],
    items: [
      { id: "shield",    label: "🛡️ Streak Shield",  price: 1200,  desc: "Streakgaaga daily badbaadi hal mar" },
      { id: "title",     label: "🏅 Coin Lord Title", price: 2000,  desc: "\"💰 Coin Lord\" profilekaaga" },
    ],
  };
  const DSHOP_CATALOG = {
    power: [
      { id: "xpsurge",    label: "⚡ XP Surge",      price: 50,  desc: "+250 XP si toos ah" },
      { id: "diacrate",   label: "🎲 Diamond Crate",  price: 60,  desc: "500–1,500 Coins ama 8–20 Diamonds" },
    ],
    defense: [
      { id: "robshield",  label: "🛡️ Rob Shield",    price: 35,  desc: "12h ka badbaad in lagu dhaco" },
    ],
    premium: [
      { id: "legendtitle",label: "👑 Legend Title",   price: 100, desc: "4 exclusive titles — flex!" },
      { id: "coinshower", label: "💰 Coin Shower",    price: 150, desc: "800–2,000 Coins si toos ah" },
    ],
  };


  const HEIST_COIN_IDS = ["h_boots","h_bolt","h_smoke","h_bag","h_usb","h_gloves","h_clock","h_drill","h_decoy","h_sack","h_emp"];
  const HEIST_DIA_IDS  = ["h_neural","h_ghost","h_qkey","h_jammer","h_scanner","h_drone","h_badge"];


  const HEIST_ITEMS = {
    h_boots:   { id:"h_boots",   label:"🥾 Steel-Toe Boots",  rarity:"⚪ Common",    price:800,  currency:"coins",    stock:6, rotHours:24,  stat:"+8% Speed",                             phase:"Entry",          flavor:"Kabo baabuud ah oo khafiif ah. Howsha ayey isla markiiba xaliyaan." },
    h_bolt:    { id:"h_bolt",    label:"🔩 Bolt Cutter",       rarity:"⚪ Common",    price:500,  currency:"coins",    stock:6, rotHours:24,  stat:"+15% Brute Force",                      phase:"Entry · Breach", flavor:"Qadiimi la isku halayn karo. Qof walpa 1xabo ayuu iska heesta. kuma shaqeenayso khasnada level 3." },
    h_smoke:   { id:"h_smoke",   label:"💨 Smoke Canister",    rarity:"⚪ Common",    price:600,  currency:"coins",    stock:5, rotHours:24,  stat:"+12% Stealth (Escape phase)",           phase:"Escape",         flavor:"Qalab military. Hallwayga ayey mudo 2second ah buuxisaa. waardiyaasha way neceb yahiin." },
    h_bag:     { id:"h_bag",     label:"👜 Getaway Bag",       rarity:"⚪ Common",    price:700,  currency:"coins",    stock:5, rotHours:24,  stat:"+10% Escape · +8% Loot Bonus",          phase:"Loot · Escape",  flavor:"Habeenkii ayaa la sii diyaarsadaa. Wadooyin baxsasho ayey kuu ifinaysaa." },
    h_usb:     { id:"h_usb",     label:"🔌 USB Cracker",       rarity:"⚪ Common",    price:1200, currency:"coins",    stock:4, rotHours:24,  stat:"+10% Hacking",                          phase:"Breach",         flavor:"Waxaa ku jiro ilaa 14 exploits diyaarsan. raqiis, saamayn leh, wax raad ah aan reebin." },
    h_gloves:  { id:"h_gloves",  label:"🧤 Shadow Gloves",     rarity:"🟢 Uncommon",  price:2200, currency:"coins",    stock:3, rotHours:48,  stat:"+8% Speed · +10% Stealth",              phase:"Entry · Breach", flavor:"shanqarta ugu yar samee. wax faro ah aan ka tagin. Ha i waydiin meesha ay ka yimaaden." },
    h_clock:   { id:"h_clock",   label:"🕶️ Dark Clock",        rarity:"🟢 Uncommon",  price:2500, currency:"coins",    stock:3, rotHours:48,  stat:"+20% Stealth (digital presence)",       phase:"Breach · Loot",  flavor:"Systemka ayey ka dhigaysaa like in aysan waxba dhacaynin. Waa hubaa qofkii sameeyey xabsi ayuu ku jiraa." },
    h_drill:   { id:"h_drill",   label:"🧱 Thermal Drill",     rarity:"🟢 Uncommon",  price:4000, currency:"coins",    stock:2, rotHours:48,  stat:"+28% Brute Force",                      phase:"Breach",         flavor:"500°C tip. Waxay goyn kartaa bir 40mm ah mudo 90seconds ah. way qaylo dheer tahay, lkn saamayn leh." },
    h_decoy:   { id:"h_decoy",   label:"🎭 Decoy Alarm",       rarity:"🟢 Uncommon",  price:3500, currency:"coins",    stock:2, rotHours:48,  stat:"+22% Stealth (Escape phase)",           phase:"Escape",         flavor:"waxay ku xirmaysaa bank alarm system. Qalabkii ay isku haleenayeen nacsii." },
    h_sack:    { id:"h_sack",    label:"💰 Loot Sack",         rarity:"🟢 Uncommon",  price:2800, currency:"coins",    stock:3, rotHours:48,  stat:"+18% Loot Bonus (stackable per team)",  phase:"Loot",           flavor:"waxay qaada 4jibaar inta boorsada caadiga qaado. waxaa u baahan tahay 2qof in ay qaadan hadii maalin qurxoon ku jirtid." },
    h_emp:     { id:"h_emp",     label:"💣 EMP Pulse",          rarity:"🟢 Uncommon",  price:3000, currency:"coins",    stock:2, rotHours:48,  stat:"+20% Escape",                           phase:"Escape",         flavor:"Jaam garee wax walpa oo 30-meter radius kuu jira. Telephonekaaga xitaa ku dar, so marka hore jeebka gasho." },
    h_neural:  { id:"h_neural",  label:"📡 Neural Tap",         rarity:"🟢 Uncommon",  price:40,   currency:"diamonds", stock:2, rotHours:48,  stat:"+22% Hacking · camera disable on high roll", phase:"Breach",    flavor:"wuxuu galaa nooc walpa oo ethernet port. wuxuu u eh yahay qalab charger. lkn howl wayn ayuu hayaa." },
    h_ghost:   { id:"h_ghost",   label:"👻 Ghost Soles",        rarity:"🔵 Rare",      price:120,  currency:"diamonds", stock:2, rotHours:72,  stat:"+20% Speed · +15% Stealth",             phase:"Entry · Breach", flavor:"Shay ka samaysan carbonfiber oo yareeya dhawaaqa. Waxay baabi’isaa ogaanshaha dareemayaasha cadaadiska." },
    h_qkey:    { id:"h_qkey",    label:"🔑 QuantumKey",          rarity:"🔵 Rare",      price:180,  currency:"diamonds", stock:1, rotHours:96,  stat:"+45% Hacking (guarantees digital breach)", phase:"Breach",      flavor:"waxaa la sameeyey iyada la adeegsanayo quantum compute. waxay jabinaysaa AES-256bit kaliya mudo 12second. Qofka sameeyey ama saaid ayuu taajir u yahay ama already waa la khaarijiyey." },
    h_jammer:  { id:"h_jammer",  label:"📻 Signal Jammer",      rarity:"🔵 Rare",      price:150,  currency:"diamonds", stock:2, rotHours:72,  stat:"+30% Stealth · nulls one alarm trigger",phase:"Breach",         flavor:"Waxay carqaladaynaysaa (jamming) dhammaan isgaarsiinta ka baxaysa bangiga muddo hal wareeg ah. Waa sharcidarro qalabkan sida uu dhigayo FCC regulations dalal badan (47 dal)." },
    h_scanner: { id:"h_scanner", label:"🔍 Vault Scanner",      rarity:"🔵 Rare",      price:130,  currency:"diamonds", stock:2, rotHours:72,  stat:"Reveals exact loot tier + 1 weakness",  phase:"Pre-Heist Intel",flavor:"Ku jeedi dhisme, waxaadna heli kartaa warbixin ku saabsan qaabdhismeedkiisa iyo qiimihiisa dhaqaale. Waxaa isticmaala dilaalada guryaha iyo anaga." },
    h_drone:   { id:"h_drone",   label:"🦅 Phantom Drone",      rarity:"🟡 Legendary", price:450,  currency:"diamonds", stock:1, rotHours:168, stat:"+25% Stealth · +25% Escape · reveals 1 trap", phase:"All Phases", flavor:"Wareege aamusan. Thermal camera (camera kulaylka dareenta) . 40minute battery. Inta badan markii kor laga arko shimbir ayey u eg tahay." },
    h_badge:   { id:"h_badge",   label:"🪪 Inside Man Badge",   rarity:"🟡 Legendary", price:700,  currency:"diamonds", stock:1, rotHours:168, stat:"+25% ALL stats · Phase 1 auto-passed",  phase:"All Phases",     flavor:"Fayl HR oo dhammaystiran, 3 sano oo shaqo been abuur ah, iyo kaarka aqoonsiga. Dhismuhu wuxuu u malaynayaa inaad halkan ka shaqayso." },
  };


  async function getHeistRotations(itemIds) {
    const now = Date.now();
    const res = await pool.query(
      `SELECT item_id, stock, reset_at FROM heist_shop_rotation WHERE item_id = ANY($1)`,
      [itemIds]
    );
    const existing = {};
    for (const r of res.rows) existing[r.item_id] = { stock: Number(r.stock), reset_at: Number(r.reset_at) };
    const rotMap = {};
    const toReset = [];
    for (const itemId of itemIds) {
      const item = HEIST_ITEMS[itemId];
      if (!item) continue;
      const ex = existing[itemId];
      if (!ex || ex.reset_at < now) {
        const newResetAt = now + item.rotHours * 3600000;
        toReset.push([itemId, item.stock, newResetAt]);
        rotMap[itemId] = { stock: item.stock, reset_at: newResetAt };
      } else {
        rotMap[itemId] = ex;
      }
    }
    for (const [iid, stk, rat] of toReset) {
      await pool.query(
        `INSERT INTO heist_shop_rotation (item_id, stock, reset_at) VALUES ($1,$2,$3)
         ON CONFLICT (item_id) DO UPDATE SET stock=$2, reset_at=$3`,
        [iid, stk, rat]
      );
    }
    return rotMap;
  }

  function fmtHeistTime(ms) {
    if (ms <= 0) return "resets soon";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }



  const RARITY_ORDER = ["⚪ Common", "🟢 Uncommon", "🔵 Rare", "🟡 Legendary"];

  function buildHeistCoinEmbed(rotData, coins) {
    const now = Date.now();
    const groups = {};
    for (const itemId of HEIST_COIN_IDS) {
      const item = HEIST_ITEMS[itemId];
      const rot  = rotData[itemId];
      if (!item || !rot) continue;
      if (!groups[item.rarity]) groups[item.rarity] = [];
      const avail  = rot.stock > 0;
      const ticker = avail ? `📦 ${rot.stock}` : `✗ sold out`;
      const timer  = fmtHeistTime(rot.reset_at - now);
      groups[item.rarity].push(`${avail ? "" : "~~"}${item.label}${avail ? "" : "~~"}  ·  **${item.price.toLocaleString()} 🪙**  ·  ${ticker}  ·  ⏳ ${timer}`);
    }
    let desc = `💰 **${coins.toLocaleString()} Coins**\n`;
    desc += `Items are **1-time use** and consumed in \`!heist\` · \`!myitems\` to check inventory\n`;
    for (const rar of RARITY_ORDER) {
      if (!groups[rar]) continue;
      const resetLabel = rar.includes("Common") ? "resets daily" : "resets every 2d";
      desc += `\n**${rar}** — *${resetLabel}*\n`;
      desc += `${"─".repeat(32)}\n`;
      desc += groups[rar].join("\n") + "\n";
    }
    return new EmbedBuilder()
      .setTitle("🗡️  Heist Armory  —  Coin Gear")
      .setDescription(desc)
      .setColor(0xe67e22)
      .setFooter({ text: "Select an item from the dropdown below to purchase" });
  }

  function buildHeistCoinRows(rotData, uid) {
    const options = HEIST_COIN_IDS
      .filter(id => HEIST_ITEMS[id] && rotData[id])
      .map(id => {
        const item = HEIST_ITEMS[id];
        const rot  = rotData[id];
        const avail = rot.stock > 0;
        const label = item.label.slice(0, 100);
        const desc  = avail
          ? `${item.price.toLocaleString()} coins · ${item.stat}`.slice(0, 100)
          : `SOLD OUT · ${item.price.toLocaleString()} coins · restock soon`.slice(0, 100);
        return new StringSelectMenuOptionBuilder()
          .setLabel(label)
          .setDescription(desc)
          .setValue(id);
      });
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`shopv2_hsel_${uid}`)
      .setPlaceholder("🗡️  Choose a heist item…")
      .addOptions(options);
    return [
      new ActionRowBuilder().addComponents(menu),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`shopv2_main_${uid}`).setLabel("⬅️ Back").setStyle(ButtonStyle.Secondary),
        makeCloseButton(uid).setCustomId(`shopv2_close_${uid}`)
      ),
    ];
  }

  function buildHeistDiaEmbed(rotData, diamonds) {
    const now = Date.now();
    const groups = {};
    for (const itemId of HEIST_DIA_IDS) {
      const item = HEIST_ITEMS[itemId];
      const rot  = rotData[itemId];
      if (!item || !rot) continue;
      if (!groups[item.rarity]) groups[item.rarity] = [];
      const avail  = rot.stock > 0;
      const ticker = avail ? `📦 ${rot.stock}` : `✗ sold out`;
      const timer  = fmtHeistTime(rot.reset_at - now);
      groups[item.rarity].push(`${avail ? "" : "~~"}${item.label}${avail ? "" : "~~"}  ·  **${item.price} 💎**  ·  ${ticker}  ·  ⏳ ${timer}`);
    }
    const resetKey = { "🟢 Uncommon": "2d", "🔵 Rare": "3–4d", "🟡 Legendary": "weekly" };
    let desc = `💎 **${diamonds.toLocaleString()} Diamonds**\n`;
    desc += `Items are **1-time use** and consumed in \`!heist\` · \`!myitems\` to check inventory\n`;
    for (const rar of RARITY_ORDER) {
      if (!groups[rar]) continue;
      desc += `\n**${rar}** — *resets ${resetKey[rar] || "periodically"}*\n`;
      desc += `${"─".repeat(32)}\n`;
      desc += groups[rar].join("\n") + "\n";
    }
    return new EmbedBuilder()
      .setTitle("🗡️  Heist Armory  —  Premium Gear")
      .setDescription(desc)
      .setColor(0x9b59b6)
      .setFooter({ text: "Legendary gear appears once a week — don't miss it" });
  }

  function buildHeistDiaRows(rotData, uid) {
    const options = HEIST_DIA_IDS
      .filter(id => HEIST_ITEMS[id] && rotData[id])
      .map(id => {
        const item = HEIST_ITEMS[id];
        const rot  = rotData[id];
        const avail = rot.stock > 0;
        const label = item.label.slice(0, 100);
        const desc  = avail
          ? `${item.price} diamonds · ${item.stat}`.slice(0, 100)
          : `SOLD OUT · ${item.price} diamonds · restock soon`.slice(0, 100);
        return new StringSelectMenuOptionBuilder()
          .setLabel(label)
          .setDescription(desc)
          .setValue(id);
      });
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`dshopv2_hsel_${uid}`)
      .setPlaceholder("💎  Choose a premium heist item…")
      .addOptions(options);
    return [
      new ActionRowBuilder().addComponents(menu),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dshopv2_main_${uid}`).setLabel("⬅️ Back").setStyle(ButtonStyle.Secondary),
        makeCloseButton(uid).setCustomId(`dshopv2_close_${uid}`)
      ),
    ];
  }

  function buildShopMainEmbed(coins, diamonds, multiplier = 1.0) {
    const econStatus = multiplier > 1.05
      ? `📈 **Economy:** +${Math.round((multiplier - 1) * 100)}% more expensive`
      : multiplier < 0.95
      ? `📉 **Economy:** ${Math.round((1 - multiplier) * 100)}% cheaper`
      : `📊 **Economy:** Normal prices`;
    return new EmbedBuilder()
      .setTitle("🛒 Coin Shop")
      .setDescription(
        `💰 **${coins.toLocaleString()} Coins**  ·  💎 **${diamonds.toLocaleString()} Diamonds**\n\n${econStatus}\n\nDooro qaybta aad rabto:\n\n🧪 **Boosts** — XP & Nasiib\n⚔️ **Items** — Tools & Shields\n🗡️ **Heist** — Rotating heist items`
      )
      .setColor(0xf1c40f)
      .setFooter({ text: "Hel Coins: !work · !daily · !vote · !slots · !duel" });
  }
  function buildShopMainRows(uid) {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`shopv2_cat_boosts_${uid}`).setLabel("🧪 Boosts").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`shopv2_cat_items_${uid}`).setLabel("⚔️ Items").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`shopv2_cat_heist_${uid}`).setLabel("🗡️ Heist").setStyle(ButtonStyle.Danger),
        makeCloseButton(uid).setCustomId(`shopv2_close_${uid}`)
      ),
    ];
  }
  function buildShopCatEmbed(cat, coins, multiplier = 1.0) {
    const items = SHOP_CATALOG[cat] || [];
    const catName = cat === "boosts" ? "🧪 Boosts" : "⚔️ Items";
    const embed = new EmbedBuilder()
      .setTitle(`🛒 Coin Shop — ${catName}`)
      .setColor(0xf1c40f)
      .setFooter({ text: `💰 Lacagtaada: ${coins.toLocaleString()} Coins` });
    for (const it of items) {
      const adjPrice = Math.floor(it.price * multiplier);
      const priceStr = multiplier > 1.01
        ? `~~${it.price.toLocaleString()}~~ → **${adjPrice.toLocaleString()}** Coins 📈`
        : multiplier < 0.99
        ? `~~${it.price.toLocaleString()}~~ → **${adjPrice.toLocaleString()}** Coins 📉`
        : `${adjPrice.toLocaleString()} Coins`;
      embed.addFields({ name: `${it.label}  —  ${priceStr}`, value: it.desc });
    }
    return embed;
  }
  function buildShopCatRows(cat, uid) {
    const items = SHOP_CATALOG[cat] || [];
    const itemBtns = items.map(it =>
      new ButtonBuilder().setCustomId(`shopv2_buy_${it.id}_${uid}`).setLabel(it.label).setStyle(ButtonStyle.Success)
    );
    return [
      new ActionRowBuilder().addComponents(...itemBtns),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`shopv2_main_${uid}`).setLabel("⬅️ Back").setStyle(ButtonStyle.Secondary),
        makeCloseButton(uid).setCustomId(`shopv2_close_${uid}`)
      ),
    ];
  }

  function buildDShopMainEmbed(diamonds) {
    return new EmbedBuilder()
      .setTitle("💎 Diamond Shop")
      .setDescription(
        `💎 **${diamonds.toLocaleString()} Diamonds**\n\nDooro qaybta aad rabto:\n\n⚡ **Power** — XP & Crates\n🛡️ **Defense** — Rob Shield\n👑 **Premium** — Titles & Coins\n🗡️ **Heist** — Premium heist items`
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Hel Diamonds: !daily · Vote top.gg · 30-day streak" });
  }
  function buildDShopMainRows(uid) {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dshopv2_cat_power_${uid}`).setLabel("⚡ Power").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`dshopv2_cat_defense_${uid}`).setLabel("🛡️ Defense").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`dshopv2_cat_premium_${uid}`).setLabel("👑 Premium").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`dshopv2_cat_heist_${uid}`).setLabel("🗡️ Heist").setStyle(ButtonStyle.Danger),
        makeCloseButton(uid).setCustomId(`dshopv2_close_${uid}`)
      ),
    ];
  }
  function buildDShopCatEmbed(cat, diamonds) {
    const items = DSHOP_CATALOG[cat] || [];
    const catNames = { power: "⚡ Power", defense: "🛡️ Defense", premium: "👑 Premium" };
    const catName = catNames[cat] || cat;
    const embed = new EmbedBuilder()
      .setTitle(`💎 Diamond Shop — ${catName}`)
      .setColor(0x5865f2)
      .setFooter({ text: `💎 Diamondskaaga: ${diamonds.toLocaleString()}` });
    for (const it of items) {
      embed.addFields({ name: `${it.label}  —  ${it.price} 💎`, value: it.desc });
    }
    return embed;
  }
  function buildDShopCatRows(cat, uid) {
    const items = DSHOP_CATALOG[cat] || [];
    const itemBtns = items.map(it =>
      new ButtonBuilder().setCustomId(`dshopv2_buy_${it.id}_${uid}`).setLabel(it.label).setStyle(ButtonStyle.Success)
    );
    return [
      new ActionRowBuilder().addComponents(...itemBtns),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dshopv2_main_${uid}`).setLabel("⬅️ Back").setStyle(ButtonStyle.Secondary),
        makeCloseButton(uid).setCustomId(`dshopv2_close_${uid}`)
      ),
    ];
  }

  setInterval(() => {
    const _now = Date.now();
    for (const [key, hist] of economyRecentActivity.entries()) {
      const recent = hist.filter(t => _now - t < 10000);
      if (recent.length === 0) economyRecentActivity.delete(key);
      else economyRecentActivity.set(key, recent);
    }
    for (const [uid, ts] of coinflipCooldowns.entries()) { if (_now - ts > 120000) coinflipCooldowns.delete(uid); }
    for (const [uid, ts] of slotsCooldowns.entries())    { if (_now - ts > 60000)  slotsCooldowns.delete(uid); }
    for (const [uid, ts] of workCooldowns.entries())     { if (_now - ts > 32400000) workCooldowns.delete(uid); }
    for (const [uid, ts] of robCooldowns.entries())      { if (_now - ts > 5400000)  robCooldowns.delete(uid); }
  }, 5 * 60 * 1000);
  const VOTE_BOOST_WINDOW = 12 * 60 * 60 * 1000;
  const WORK_CD_DEFAULT  =  8 * 60 * 60 * 1000;
  const WORK_CD_BOOSTED  =  4 * 60 * 60 * 1000;
  const DAILY_CD         = 24 * 60 * 60 * 1000;
  const ROB_CD           = 30 * 60 * 1000;
  const voteTimeCache = new Map();
  const VOTE_CACHE_TTL = 10 * 60_000;

  async function getLastVoteTime(userId) {
    const _vtc = voteTimeCache.get(userId);
    if (_vtc && Date.now() - _vtc.ts < VOTE_CACHE_TTL) return _vtc.lastVote;
    try {
      const r = await pool.query(`SELECT last_vote FROM votes WHERE user_id = $1`, [String(userId)]);
      const lastVote = Number(r.rows[0]?.last_vote || 0);
      voteTimeCache.set(userId, { lastVote, ts: Date.now() });
      return lastVote;
    } catch { return 0; }
  }
  function hasVoteBoost(lastVoteTime) {
    return lastVoteTime > 0 && (Date.now() - lastVoteTime) < VOTE_BOOST_WINDOW;
  }
  function fmtCdRemaining(elapsed, cdMs) {
    const ms = Math.max(0, cdMs - elapsed);
    const totalMins = Math.ceil(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
  }

  const richRefreshCooldowns = new Map();

  const activeRichMessages   = new Map();



  async function buildRichPayload(authorId, guild) {
    const [richRes, authorRankRes] = await Promise.all([
      pool.query(
        `SELECT discord_id, username, coins, is_verified FROM players WHERE coins > 0 ORDER BY coins DESC LIMIT 10`
      ),
      pool.query(
        `SELECT coins, (SELECT COUNT(*) + 1 FROM players WHERE coins > p.coins) AS rank
         FROM players p WHERE p.discord_id = $1`,
        [authorId]
      ),
    ]);

    const emptyPayload = {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0xF4C430,
          components: [
            { type: 10, content: "## 👑 Taajiriinta Nasiib" },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: "Weli cidna lacag badan ma laha — noqo qofkii ugu horeeyey!" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 4, label: "🗑️ Close", custom_id: `rich_close_${authorId}` },
          ],
        },
      ],
    };

    if (!richRes.rows.length) return emptyPayload;


    const memberMap = new Map();
    if (guild) {
      const ids = richRes.rows.map(r => r.discord_id);
      try {
        const fetched = await Promise.race([
          guild.members.fetch({ user: ids }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
        ]);
        fetched.forEach((m, id) => memberMap.set(id, m));
      } catch {
        ids.forEach(id => {
          const cached = guild.members.cache.get(id);
          if (cached) memberMap.set(id, cached);
        });
      }
    }

    function resolvedName(p) {
      const m = memberMap.get(p.discord_id);
      const base = m ? (m.displayName || p.username) : p.username;

      return p.is_verified ? `${VERIFY_BADGE} ${base}` : base;
    }

    const podiumCrowns = ["🥇", "🥈", "🥉"];
    const top3 = richRes.rows.slice(0, 3);
    const rest  = richRes.rows.slice(3);

    const podiumLines = top3.map((p, i) => {
      const youTag = p.discord_id === authorId ? "  ← **Adiga**" : "";
      return `${podiumCrowns[i]} **${resolvedName(p)}**${youTag}\n⠀┗ 💰 **${Number(p.coins).toLocaleString()} Coins**`;
    }).join("\n\n");

    const rankLines = rest.map((p, i) => {
      const num    = String(i + 4).padStart(2, "0");
      const youTag = p.discord_id === authorId ? " ← **Adiga**" : "";
      return `\`${num}\` **${resolvedName(p)}**${youTag} — **${Number(p.coins).toLocaleString()}** 🪙`;
    }).join("\n");

    const listContent = rest.length
      ? `${podiumLines}\n\n${rankLines}`
      : podiumLines;


    const authorRow = authorRankRes.rows[0];
    let authorContent;
    if (authorRow) {
      const authorCoins = Number(authorRow.coins);
      const authorRank  = Number(authorRow.rank);
      const inTop10 = richRes.rows.some(r => r.discord_id === authorId);
      if (inTop10 && authorRank <= 3) {
        authorContent = `🔥 Waxaad ku jirtaa **Top ${authorRank}!**`;
      } else if (inTop10) {
        authorContent = `📍 Rank **#${authorRank}** · 💰 **${authorCoins.toLocaleString()} Coins** *(liiska ku jirtaa)*`;
      } else {
        authorContent = `📍 Rank **#${authorRank}** · 💰 **${authorCoins.toLocaleString()} Coins**`;
      }
    } else {
      authorContent = "🌱 Weli economy kuma biirinin — bilow **`!daily`** ama **`!work`**!";
    }

    return {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: 0xF4C430,
          components: [
            { type: 10, content: "## 👑 Taajiriinta Nasiib" },
            { type: 10, content: "-# Rich list waxaa ka muuqda 10-da qof ee ugu badan lacagta wallet-kooda." },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: listContent },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: `**👤 Booskaaga:**\n${authorContent}` },
            { type: 14, divider: false, spacing: 1 },
            { type: 10, content: "-# lacagtu waa awood" },
          ],
        },
        {
          type: 1,
          components: [
            { type: 2, style: 4, label: "🗑️ Close",       custom_id: `rich_close_${authorId}`   },
            { type: 2, style: 2, label: "🔄 Refresh",   custom_id: `rich_refresh_${authorId}` },
          ],
        },
      ],
    };
  }


  const holdMsgCooldowns = new Map();
  function logEconomy(userId, source, amount, type = "gain") {
    const sign = type === "gain" ? "+" : "-";
    console.log(`[ECONOMY] ${userId} ${sign}${amount} from ${source} (${new Date().toISOString()})`);
  }

  async function checkTreasury(bet, maxMultiplier) {
    try {
      const w = await storage.getBotWallet();
      return Number(w.coins) >= bet * maxMultiplier;
    } catch { return true; }
  }

  function checkEconomySpam(userId, source) {
    const key = `${userId}_${source}`;
    const now = Date.now();
    const history = economyRecentActivity.get(key) || [];
    const recent = history.filter(t => now - t < 5000);
    recent.push(now);
    economyRecentActivity.set(key, recent);
    if (recent.length >= 4) {
      console.warn(`[ECONOMY WARN] Rapid ${source} from ${userId} — ${recent.length} calls in 5s`);
      return true;
    }
    return false;
  }
  const adminSessions = /* @__PURE__ */ new Map();
  function isAdminSessionActive(userId) {
    const exp = adminSessions.get(userId);
    if (!exp) return false;
    if (Date.now() > exp) { adminSessions.delete(userId); return false; }
    return true;
  }
  function activateAdminSession(userId) {
    adminSessions.set(userId, Date.now() + 15 * 60 * 1000);
  }
  const playerBehavior = /* @__PURE__ */ new Map();
  function trackBehavior(userId, event) {
    const b = playerBehavior.get(userId) || { cfLosses: 0, robLosses: 0, lastTip: 0 };
    if (event === "cf_loss") b.cfLosses++;
    if (event === "rob_received") b.robLosses++;
    playerBehavior.set(userId, b);
  }
  async function maybeSendTip(_userId, _channel) {

    return;
  }
  function calcInvestProfit(invest) {
    if (!invest || !invest.amount || invest.amount <= 0) return 0;
    const elapsed = Date.now() - (invest.lastClaim || Date.now());
    const periods = Math.floor(elapsed / (6 * 60 * 60 * 1000));
    if (periods === 0) return 0;
    const base = Math.min(invest.amount, 25000);
    const extra = Math.max(0, invest.amount - 25000);
    return Math.floor(periods * (base * 0.025 + extra * 0.015));
  }
  const QUEST_POOL = [
    { id: "q_work2",   desc: "Shaqo samee 2 jeer",                        type: "work",        target: 2,    coins: 150, xp: 25 },
    { id: "q_earn500", desc: "ku hel 500 Coins maanta kaliya",             type: "earn_coins",  target: 500,  coins: 100, xp: 20 },
    { id: "q_win2",    desc: "Ku guuleyso 2 ciyaar",                       type: "win_games",   target: 2,    coins: 175, xp: 30 },
    { id: "q_spend300",desc: "Ku kharash garee 300 Coins ciyaaraha nasiib",type: "spend_coins", target: 300,  coins: 125, xp: 20 },
    { id: "q_work3",   desc: "Shaqo samee 3 jeer",                         type: "work",        target: 3,    coins: 200, xp: 35 },
    { id: "q_cf3",     desc: "Ciyaar coinflip 3 jeer",                     type: "play_cf",     target: 3,    coins: 100, xp: 20 },
    { id: "q_earn1k",  desc: "Hel 1,000 Coins maanta kaliya",              type: "earn_coins",  target: 1000, coins: 175, xp: 30 },
    { id: "q_rob1",    desc: "Isku day !rob hal mar",                       type: "rob_attempt", target: 1,    coins: 100, xp: 15 },
    { id: "q_win3",    desc: "Ku guuleyso 3 ciyaar",                       type: "win_games",   target: 3,    coins: 250, xp: 40 },
    { id: "q_slots3",  desc: "Ciyaar !slots 3 jeer",                       type: "play_slots",  target: 3,    coins: 100, xp: 20 },
    { id: "q_spend500",desc: "ku kharash garee 500 Coins ciyaaraha nasiib",type: "spend_coins", target: 500,  coins: 160, xp: 28 },
    { id: "q_earn300", desc: "Hel 300 Coins maanta kaliya",                type: "earn_coins",  target: 300,  coins:  80, xp: 15 },

    { id: "q_fti1",    desc: "🎭 ciyaar FTI hal mar (2+ imposter)", type: "play_fti",    target: 1, coinsMin: 60, coinsMax: 150, xp: 30 },
    { id: "q_sheeko1", desc: "📖 ciyaar game Sheeko hal mar",        type: "play_sheeko", target: 1, coinsMin: 60, coinsMax: 150, xp: 20 },
    { id: "q_tower1",  desc: "🗼 ciyaar Tower game hal mar",          type: "play_tower",  target: 1, coinsMin: 60, coinsMax: 150, xp: 15 },
    { id: "q_miino1",  desc: "💣 ciyaar gamka Miino hal mar",         type: "play_miino",  target: 1, coinsMin: 60, coinsMax: 150, xp: 15 },
  ];
  function seededRand(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }
  function resolveQuestCoins(q, day, slot) {
    if (q.coinsMin !== undefined && q.coinsMax !== undefined) {
      const rng = seededRand(day * 10 + slot);
      return { ...q, coins: Math.floor(q.coinsMin + rng * (q.coinsMax - q.coinsMin + 1)) };
    }
    return q;
  }
  function getDailyQuests() {
    const day = Math.floor(Date.now() / 86400000);
    return [
      resolveQuestCoins(QUEST_POOL[day % QUEST_POOL.length],       day, 0),
      resolveQuestCoins(QUEST_POOL[(day + 4) % QUEST_POOL.length], day, 1),
      resolveQuestCoins(QUEST_POOL[(day + 8) % QUEST_POOL.length], day, 2),
    ];
  }
  async function trackQuest(userId, event, amount = 1) {
    try {
      const player = await storage.getPlayer(userId);
      if (!player) return;
      const today = new Date().toISOString().split("T")[0];
      const gS = storage.ensureGameStats(player.gameStats);
      if (!gS.quests || gS.quests.date !== today) {
        gS.quests = { date: today, q1: 0, q2: 0, q3: 0, claimed1: false, claimed2: false, claimed3: false };
      }
      const quests = getDailyQuests();
      let changed = false;
      for (let i = 0; i < 3; i++) {
        const q = quests[i];
        const key = `q${i + 1}`;
        const claimKey = `claimed${i + 1}`;
        if (gS.quests[claimKey] || (gS.quests[key] || 0) >= q.target) continue;
        if (q.type === event) {
          gS.quests[key] = Math.min((gS.quests[key] || 0) + amount, q.target);
          changed = true;
        }
      }
      if (changed) await db.update(players).set({ gameStats: gS }).where(eq(players.discordId, userId));
    } catch {}
  }
  function hpBar(hp) {
    const pct = Math.max(0, Math.min(1, hp / 100));
    const filled = Math.round(pct * 10);
    return "\u2588".repeat(filled) + "\u2591".repeat(10 - filled) + ` ${Math.max(0, hp)}%`;
  }
  function calcDuelDamage(hasAura = false) {
    const base = Math.floor(Math.random() * 18) + 8;
    const raw = base + (hasAura ? 5 : 0);
    const roll = Math.random();
    if (roll < 0.08) return { dmg: 0,                    effect: "dodge", emoji: "\uD83D\uDCA8", label: "U gambin!"        };
    if (roll < 0.22) return { dmg: Math.floor(raw * 0.35), effect: "block", emoji: "\uD83D\uDEE1\uFE0F", label: "Block!"   };
    if (roll < 0.37) return { dmg: Math.floor(raw * 1.6),  effect: "crit",  emoji: "\uD83D\uDCA5", label: "Critical Hit!" };
    if (roll < 0.42) return { dmg: -10,                   effect: "heal",  emoji: "\uD83E\uDDEA", label: "Heal!"        };
    return               { dmg: raw,                    effect: "normal",emoji: "\u2694\uFE0F",  label: "Weerar!"      };
  }
  function buildDuelBattleEmbed(hp1, hp2, n1, n2, totalPot, round, lastLog, color) {
    const bar1 = hpBar(hp1), bar2 = hpBar(hp2);
    const lines = [
      "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
      `\u2694\uFE0F  **${n1}**`,
      `\u2764\uFE0F  \`${bar1}\``,
      "",
      "\u2013\u2013\u2013\u2013\u2013  **VS**  \u2013\u2013\u2013\u2013\u2013",
      "",
      `\u2694\uFE0F  **${n2}**`,
      `\u2764\uFE0F  \`${bar2}\``,
      "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
      `\uD83C\uDFC6  Prize Pool:  **${totalPot.toLocaleString()} \uD83E\uDE99**`,
    ];
    if (lastLog && round > 0) {
      lines.push("");
      lines.push("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
      lines.push(`**\uD83D\uDD25 Round ${round}**`);
      if (lastLog.effect === "heal") {
        lines.push(`${lastLog.emoji}  **${lastLog.attackerName}** way is bogsiiyeen  \u2014  **+10 HP \u2665**`);
      } else if (lastLog.effect === "dodge") {
        lines.push(`${lastLog.emoji}  **${lastLog.defenderName}** ayaa ka baxsadeen  \u2014  **0 damage**`);
      } else {
        lines.push(`${lastLog.emoji}  **${lastLog.attackerName}**  \u2192  **${lastLog.defenderName}**`);
        lines.push(`\uD83D\uDCA2  **${lastLog.dmg} damage**   \u00B7   *${lastLog.label}*`);
        if (lastLog.hasAura) lines.push(`\uD83D\uDD25  *Aura bonus \u2014 +5 extra damage!*`);
      }
    }
    return lines.join("\n");
  }
  const activeDuels = /* @__PURE__ */ new Map();
  const lastActiveChannels = /* @__PURE__ */ new Map();
  const taraqGames = /* @__PURE__ */ new Map();
  const taraqLeaveCooldowns = /* @__PURE__ */ new Map();

  async function checkLevel60(discordId, channel) {
    const player = await storage.getPlayer(discordId);
    if (!player || player.level < 60 || level60Claimed.has(discordId)) return;
    level60Claimed.add(discordId);
    const member = await channel.guild?.members.fetch(discordId).catch(() => null);
    const name = getDisplayName(member, player.username);
    await safeSend(channel, { embeds: [new EmbedBuilder().setTitle("\u{1F389}\u{1F3C6} LEVEL 60 \u2014 NITRO WINNER! \u{1F3C6}\u{1F389}").setDescription(
      `\u{1F31F} **${name}** ayaa noqday qofkii ugu horreeyay ee gaadha **Level 60**!

\u{1F381} Waxaad ku guuleysatay **1 Month Discord Nitro**!

\u{1F4E9} Si aad u hesho abaalmarintooda, DM u dir **Owner-ka** (<@${OWNER_ID}>)
Ku qor: "Level 60 \u2014 ${name}"

\u{1F38A} Hambalyo! Dadaal iyo dedaal ayaa kugu soo hoyatay!`
    ).setColor(16766720).setThumbnail(member?.displayAvatarURL() || "")] });
    await logToFtiLogs(channel.guild, `\u{1F3C6} **LEVEL 60 REACHED** by ${name} (<@${discordId}>) \u2014 Nitro winner!`);
  }
  async function announceLevelUp(discordId, oldLevel, newLevel, guild, fallbackChannel) {
    if (newLevel <= oldLevel) return;
    const config = await storage.getGuildConfig(guild.id);
    const channelId = config?.levelUpChannelId;
    const ch = channelId ? await guild.channels.fetch(channelId).catch(() => null) : fallbackChannel;
    if (!ch) return;
    const member = await guild.members.fetch(discordId).catch(() => null);
    const player = await storage.getPlayer(discordId);
    const name = getDisplayName(member, player?.username || "Unknown");
    const isMilestone = [10, 25, 50].includes(newLevel);
    const levelsGained = newLevel - oldLevel;
    const diamondsAwarded = levelsGained * 10;
    await storage.addDiamonds(discordId, diamondsAwarded);
    const desc2 = isMilestone ? T.levelup_milestone(name, newLevel) : T.levelup_desc(name, newLevel);
    await safeSend(ch, { embeds: [new EmbedBuilder().setTitle(T.levelup_title).setDescription(`${desc2}\n\n💎 **+${diamondsAwarded} Diamonds** abaal ahaan level-up!`).setColor(isMilestone ? 16766720 : 65416).setThumbnail(member?.displayAvatarURL() || "")] });

    if (oldLevel < 5 && newLevel >= 5) {
      if (!(await nwCapBlocked(discordId, 50))) await storage.addCoins(discordId, 50);
      await storage.addDiamonds(discordId, 5);
      await safeSend(ch, { embeds: [new EmbedBuilder()
        .setTitle("🌟 Hambalyo! Level 5 ayaad gaartay!")
        .setDescription(
          `🎉 **${name}**, waad ku mahadsan tahay ciyaarista nasiib!\n\n` +
          `🎁 **Abaal marin:**\n` +
          `🪙 **+50 Coins**\n` +
          `💎 **+5 Diamonds**\n\n` +
          `🏦 **Bank System ayaa kuu furmay!**\n` +
          `Hadda waxaad ku deposit gayn kartaa lacagtaada bank-ga, waadna ka faa'iidaysan kartaa profit-ka!\n\n` +
          `Qor \`!bank\` si aad u bilowdo.`
        )
        .setColor(0x2ecc71)
        .setThumbnail(member?.displayAvatarURL() || "")
      ] });
    }

    if (oldLevel < 15 && newLevel >= 15) {
      if (!(await nwCapBlocked(discordId, 100))) await storage.addCoins(discordId, 100);
      await storage.addDiamonds(discordId, 10);
      await safeSend(ch, { embeds: [new EmbedBuilder()
        .setTitle("🏆 Hambalyo! Level 15 ayaad gaartay!")
        .setDescription(
          `🌟 **${name}**, adkaysi badan ayaad leedahay!\n\n` +
          `🎁 **Abaal marin:**\n` +
          `🪙 **+100 Coins**\n` +
          `💎 **+10 Diamonds**\n\n` +
          `🏦 **Hadda waxaad furi kartaa Bank-gaaga!**\n` +
          `Samayso bank-gaaga, ku ururi lacag, oo noqo bankier!\n\n` +
          `Qor \`!bank kadib create <magacna u bixi>\` si aad u furto bank-gaaga.`
        )
        .setColor(0xf1c40f)
        .setThumbnail(member?.displayAvatarURL() || "")
      ] });
    }
  }
  function startDropGiftTimer() {
    const delay = (Math.random() * 30 + 15) * 60 * 1e3;
    setTimeout(async () => {
      try {
        for (const [guildId, channelIds] of lastActiveChannels) {
          const channels = [...channelIds].filter((id) => !chatDropDisabled.has(id));
          if (channels.length === 0) continue;
          const randomChId = channels[Math.floor(Math.random() * channels.length)];
          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;
          const ch = await guild.channels.fetch(randomChId).catch(() => null);
          if (!ch || !ch.isTextBased()) continue;
          const botMember = guild.members.me;
          if (botMember) {
            const perms = ch.permissionsFor(botMember);
            if (!perms || !perms.has("SendMessages") || !perms.has("ViewChannel") || !perms.has("EmbedLinks")) continue;
          }
          const xp = Math.floor(Math.random() * 21) + 10;
          const msg = await safeSend(ch, { embeds: [new EmbedBuilder().setTitle(T.drop_title).setDescription(T.drop_desc(xp)).setColor(16739179)] });
          if (!msg) continue;
          const timer = setTimeout(async () => {
            const drop = activeDrops.get(ch.id);
            if (drop) {
              activeDrops.delete(ch.id);
              await msg.edit({ embeds: [new EmbedBuilder().setTitle(T.drop_title).setDescription(T.drop_expired).setColor(6710886)] }).catch(() => {
              });
            }
          }, 6e4);
          activeDrops.set(ch.id, { xp, messageId: msg.id, timer });
        }
        lastActiveChannels.clear();
      } catch (err) {
        console.error("Drop gift error:", err);
      }
      startDropGiftTimer();
    }, delay);
  }
  const ownerAfk = { active: false, reason: "" };
  const STREAK_TIERS = [
    { wins: 15, title: "\u{1F480} Nightmare", bonus: 0.15 },
    { wins: 10, title: "\u{1F451} Unstoppable", bonus: 0.12 },
    { wins: 5, title: "\u26A1 Dominator", bonus: 0.08 },
    { wins: 3, title: "\u{1F525} Rising Threat", bonus: 0.05 }
  ];
  const PERMANENT_ACHIEVEMENTS = [
    { id: "fti_50", name: T.achv_fti50_name, desc: T.achv_fti50_desc, check: (gs) => (gs.fti?.wins || 0) >= 50 },
    { id: "fti_imp10", name: T.achv_imp10_name, desc: T.achv_imp10_desc, check: (gs) => (gs.fti?.wins || 0) >= 10 },
    { id: "fti_cit10", name: T.achv_cit10_name, desc: T.achv_cit10_desc, check: (gs) => (gs.fti?.wins || 0) >= 10 },
    { id: "games_100", name: T.achv_games100_name, desc: T.achv_games100_desc, check: (_gs, p) => (p.gamesPlayed || 0) >= 100 },
    { id: "guess_5", name: T.achv_guess5_name, desc: T.achv_guess5_desc, check: (gs) => (gs.guess?.wins || 0) >= 5 },
    { id: "guess_mind", name: T.achv_guess10_name, desc: T.achv_guess10_desc, check: (gs) => (gs.guess?.wins || 0) >= 10 },
    { id: "bluff_5", name: T.achv_bluff5_name, desc: T.achv_bluff5_desc, check: (gs) => (gs.bluff?.wins || 0) >= 5 },
    { id: "bluff_15", name: T.achv_bluff15_name, desc: T.achv_bluff15_desc, check: (gs) => (gs.bluff?.wins || 0) >= 15 },
    { id: "tower_10", name: T.achv_tower10_name, desc: T.achv_tower10_desc, check: (gs) => (gs.tower?.highestFloor || 0) >= 10 },
    { id: "tower_25", name: T.achv_tower25_name, desc: T.achv_tower25_desc, check: (gs) => (gs.tower?.highestFloor || 0) >= 25 },
    { id: "miino_15", name: T.achv_miino15_name, desc: T.achv_miino15_desc, check: (gs) => (gs.miino?.bestReveal || 0) >= 15 },
    { id: "miino_perfect", name: T.achv_miino_perfect_name, desc: T.achv_miino_perfect_desc, check: (gs) => (gs.miino?.bestReveal || 0) >= 16 },
    { id: "sheeko_5", name: T.achv_sheeko5_name, desc: T.achv_sheeko5_desc, check: (gs) => (gs.sheeko?.wins || 0) >= 5 },
    { id: "sheeko_fool", name: T.achv_sheeko_fool_name, desc: T.achv_sheeko_fool_desc, check: (gs) => (gs.sheeko?.timesFooledAll || 0) >= 3 }
  ];
  const HIDDEN_ACHIEVEMENTS = [
    { id: "cold_blooded", name: T.achv_cold_blooded_name, desc: T.achv_cold_blooded_desc, check: (_gs, p) => (p.currentStreak || 0) >= 3, hidden: true },
    { id: "daily_7", name: T.achv_daily7_name, desc: T.achv_daily7_desc, check: (_gs, p) => (p.dailyStreak || 0) >= 7, hidden: true },
    { id: "prestige_1", name: T.achv_prestige1_name, desc: T.achv_prestige1_desc, check: (_gs, p) => (p.prestige || 0) >= 1, hidden: true },
    { id: "win_streak_10", name: T.achv_streak10_name, desc: T.achv_streak10_desc, check: (_gs, p) => (p.highestStreak || 0) >= 10, hidden: true },
    { id: "all_games", name: T.achv_allgames_name, desc: T.achv_allgames_desc, check: (gs) => (gs.fti?.wins || 0) >= 1 && (gs.bluff?.wins || 0) >= 1 && (gs.guess?.wins || 0) >= 1 && (gs.tower?.played || 0) >= 1 && (gs.miino?.played || 0) >= 1 && (gs.sheeko?.played || 0) >= 1, hidden: true }
  ];
  const COSMETIC_TITLES = [
    { id: "shadow_mind", name: "Shadow Mind", unlock: "fti_imp10" },
    { id: "cold_blood", name: "Cold Blood", unlock: "fti_50" },
    { id: "village_hero", name: "Village Hero", unlock: "fti_cit10" },
    { id: "truth_seeker", name: "Truth Seeker", unlock: "guess_mind" },
    { id: "unstoppable", name: "Unstoppable", unlock: "games_100" },
    { id: "card_shark", name: "Card Shark", unlock: "bluff_5" },
    { id: "master_bluffer", name: "Master Bluffer", unlock: "bluff_15" },
    { id: "cold_blooded_t", name: "Cold Blooded", unlock: "cold_blooded" },
    { id: "diamond_will_t", name: "Diamond Will", unlock: "win_streak_10" },
    { id: "all_rounder_t", name: "All-Rounder", unlock: "all_games" },
    { id: "climber_t", name: "Climber", unlock: "tower_10" },
    { id: "summit_t", name: "Summit Master", unlock: "tower_25" },
    { id: "minesweeper_t", name: "Minesweeper", unlock: "miino_15" },
    { id: "storyteller_t", name: "Storyteller", unlock: "sheeko_5" },
    { id: "deceiver_t", name: "Master Deceiver", unlock: "sheeko_fool" }
  ];
  function getDisplayName(member, fallback) {
    return member?.displayName || fallback;
  }
  async function getPermissionLevel(userId) {
    if (userId === OWNER_ID) return "OWNER";
    const staffList = await storage.getStaff();
    const staffEntry = staffList.find((s) => s.discordId === userId);
    if (staffEntry?.role === "admin") return "ADMIN";
    if (staffEntry?.role === "mod") return "MOD";
    return "USER";
  }
  async function logToFtiLogs(guild, message) {
    try {
      const logChannel = guild.channels.cache.find((c) => c.name === "fti-logs" && c.isTextBased());
      if (logChannel) {
        await safeSend(logChannel, { embeds: [new EmbedBuilder().setDescription(message).setColor(7506394).setTimestamp()] });
      }
    } catch {
    }
  }
  function buildMiinoEmbed(game) {
    let gridStr = "";
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        if (game.revealed[idx]) {
          if (game.grid[idx] === "mine") gridStr += "\u{1F4A5} ";
          else gridStr += `**${game.grid[idx]}** `;
        } else {
          gridStr += "\u2B1C ";
        }
      }
      gridStr += "\n";
    }
    const safeRemaining = game.grid.filter((v, i) => v !== "mine" && !game.revealed[i]).length;
    return new EmbedBuilder().setTitle(T.miino_title).setDescription(
      gridStr + `
\u{1F4B0} **XP:** ${game.accumulatedXP}
\u{1F4CA} **Tiles:** ${game.tilesRevealed}/16 safe | \u{1F4A3} 4 mines
\u{1F7E2} Safe tiles remaining: ${safeRemaining}`
    ).setColor(game.tilesRevealed >= 12 ? 16766720 : game.tilesRevealed >= 6 ? 16755200 : 3447003);
  }
  function buildMiinoButtons(game) {
    const rows = [];
    for (let r = 0; r < 4; r++) {
      const row = new ActionRowBuilder();
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        if (game.revealed[idx]) {
          const label = game.grid[idx] === "mine" ? "\u{1F4A5}" : `${game.grid[idx]}`;
          row.addComponents(
            new ButtonBuilder().setCustomId(`miino_${idx}_${game.playerId}`).setLabel(label).setStyle(game.grid[idx] === "mine" ? ButtonStyle.Danger : ButtonStyle.Success).setDisabled(true)
          );
        } else {
          row.addComponents(
            new ButtonBuilder().setCustomId(`miino_${idx}_${game.playerId}`).setLabel("\u2B1C").setStyle(ButtonStyle.Secondary)
          );
        }
      }
      rows.push(row);
    }
    const cashRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`miino_cashout_${game.playerId}`).setLabel(T.miino_cashout_btn(game.accumulatedXP)).setStyle(ButtonStyle.Primary)
    );
    rows.push(cashRow);
    return rows;
  }
  function resetMiinoTimer(playerId, channel) {
    const game = activeMiinoGames.get(playerId);
    if (!game) return;
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    game.inactivityTimer = setTimeout(async () => {
      const g = activeMiinoGames.get(playerId);
      if (!g) return;
      await storage.updateMiinoStats(playerId, "loss", g.tilesRevealed, 0);
      trackQuest(playerId, "play_miino", 1).catch(() => {});
      await safeSend(channel, { embeds: [new EmbedBuilder().setTitle(T.miino_timeout_title).setDescription(T.miino_timeout_desc(playerId, g.accumulatedXP)).setColor(16711680)] });
      if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
      activeMiinoGames.delete(playerId);
    }, 6e4);
  }
  function resetMiinoV2Timer(game, channel) {
    if (!game) return;
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    const gameId = game.gameId;
    const expectedTurn = game.currentTurn;
    game.inactivityTimer = setTimeout(async () => {
      const g = activeMiinoV2Games.get(gameId);
      if (!g || g.currentTurn !== expectedTurn) return;
      const timedOutId = g.currentTurn;
      const otherId = timedOutId === g.player1Id ? g.player2Id : g.player1Id;
      activeMiinoV2Games.delete(gameId);
      try {
        if (otherId) {
          const minoTimeoutResult = await storage.updateMiinoStats(otherId, "win", g.moves, g.xpReward);
          await storage.updateMiinoStats(timedOutId, "loss", g.moves, 0);
          trackQuest(otherId,    "play_miino", 1).catch(() => {});
          trackQuest(timedOutId, "play_miino", 1).catch(() => {});
          const minoTimeoutXP = minoTimeoutResult?.xpAwarded ?? g.xpReward;
          await safeSend(channel, `\u23F0 <@${timedOutId}> waqtigii wuu dhacay! Wareegga aad qaadan lahayd ma qaadanin.\n\n\u{1F3C6} <@${otherId}> ayaa guuleysteen! **+${minoTimeoutXP} XP**`);
          await checkLevel60(otherId, channel);
        } else {
          await storage.updateMiinoStats(timedOutId, "loss", g.moves, 0);
          trackQuest(timedOutId, "play_miino", 1).catch(() => {});
          await safeSend(channel, `\u23F0 <@${timedOutId}> waqtigii wuu dhacay! Ciyaartii waa la joojiyay.`);
        }
      } catch {}
    }, 2 * 60 * 1000);
  }
  function createMiinoV2Grid(mines) {
    const grid = Array(20).fill("safe");
    const positions = new Set();
    while (positions.size < mines) {
      positions.add(Math.floor(Math.random() * 20));
    }
    for (const pos of positions) grid[pos] = "mine";
    return grid;
  }
  function getMiinoAdjacentCount(grid, idx) {
    const COLS = 5, ROWS = 4;
    const row = Math.floor(idx / COLS);
    const col = idx % COLS;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (grid[nr * COLS + nc] === "mine") count++;
        }
      }
    }
    return count;
  }
  function buildMiinoV2Embed(game) {
    const diffLabels = { easy: "Easy", medium: "Medium", extreme: "Extreme" };
    const minesLeft = game.grid.filter((v, i) => v === "mine" && !game.revealed[i]).length;
    const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    const isMulti = !!game.player2Id;
    const p1Mention = `<@${game.player1Id}>`;
    const p2Mention = isMulti ? ` & <@${game.player2Id}>` : "";
    const currentTurnMention = `<@${game.currentTurn}>`;
    const embed = new EmbedBuilder()
      .setTitle(T.miino_v2_title)
      .setDescription(
        `\u{1F465} **Players:** ${p1Mention}${p2Mention}\n` +
        `\u{1F4CD} **Qofka ay marayso:** ${currentTurnMention} |\n` +
        `\u{1F50D} **Mode:** Reveal\n` +
        `\u26A1 **Difficulty:** ${diffLabels[game.difficulty]} | **Size:** 4x5 | **Miinooyinka haray:** ${minesLeft}\n` +
        `\u{1F4CA} **Moves:** ${game.moves} | \u23F1 **Time:** ${mm}:${ss}`
      )
      .setColor(3447003);
    return embed;
  }
  function buildMiinoV2Buttons(game) {
    const rows = [];
    for (let r = 0; r < 4; r++) {
      const row = new ActionRowBuilder();
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        if (game.revealed[idx]) {
          if (game.grid[idx] === "mine") {
            row.addComponents(new ButtonBuilder().setCustomId(`mv2_${idx}_${game.gameId}`).setLabel("\uD83D\uDCA5").setStyle(ButtonStyle.Danger).setDisabled(true));
          } else {
            const adj = getMiinoAdjacentCount(game.grid, idx);
            const label = adj > 0 ? String(adj) : "\u00B7";
            row.addComponents(new ButtonBuilder().setCustomId(`mv2_${idx}_${game.gameId}`).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(true));
          }
        } else {
          row.addComponents(new ButtonBuilder().setCustomId(`mv2_${idx}_${game.gameId}`).setLabel("\uD83D\uDFE6").setStyle(ButtonStyle.Primary));
        }
      }
      rows.push(row);
    }
    return rows;
  }
  function buildMiinoV2ControlRow(game, disabled = false) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`mv2_mode_${game.gameId}`).setLabel("\uD83D\uDD18 Mode: Reveal").setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId(`mv2_end_${game.gameId}`).setLabel("\uD83D\uDED1 End Game").setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId(`mv2_restart_${game.gameId}`).setLabel("\uD83D\uDFE2 Restart").setStyle(ButtonStyle.Success).setDisabled(disabled)
    );
  }
  function isPlayerInPendingMiinoInvite(playerId) {
    for (const [, data] of miinoV2Invites) {
      if (data.inviterId === playerId || data.inviteeId === playerId) return true;
    }
    return false;
  }
  function isPlayerBusyMiino(playerId) {
    return findMiinoV2GameByPlayer(playerId) || activeMiinoGames.has(playerId) || isPlayerInPendingMiinoInvite(playerId);
  }
  function findMiinoV2GameByPlayer(playerId) {
    for (const [gameId, g] of activeMiinoV2Games) {
      if (g.player1Id === playerId || g.player2Id === playerId) return gameId;
    }
    return null;
  }
  function findPlayerShekoGame(playerId) {
    for (const [gameId, game] of activeShekoGames) {
      if (game.phase !== "finished" && game.players.some((p) => p.id === playerId)) return gameId;
    }
    return null;
  }
  async function startShekoRound(gameId, channel) {
    const game = activeShekoGames.get(gameId);
    if (!game || game.phase === "finished") return;
    if (game.currentStoryteller >= game.players.length) {
      await endShekoGame(gameId, channel);
      return;
    }
    const storyteller = game.players[game.currentStoryteller];
    game.phase = "waiting_story";
    game.statements = [];
    game.lieIndex = -1;
    game.votes = /* @__PURE__ */ new Map();
    const tellRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`sheeko_tell_${gameId}`).setLabel(T.sheeko_tell_btn).setStyle(ButtonStyle.Primary)
    );
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.sheeko_round_title(game.currentStoryteller + 1, game.players.length)).setDescription(T.sheeko_round_desc(storyteller.id)).setColor(15277667)], components: [tellRow] });
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    const expectedRound = game.currentStoryteller;
    game.inactivityTimer = setTimeout(async () => {
      const g = activeShekoGames.get(gameId);
      if (!g || g.phase !== "waiting_story" || g.currentStoryteller !== expectedRound) return;
      g.currentStoryteller += 1;
      await channel.send({ embeds: [new EmbedBuilder().setDescription(T.sheeko_timeout_storyteller(storyteller.id)).setColor(16750848)] });
      await startShekoRound(gameId, channel);
    }, 12e4);
  }
  async function revealShekoResults(gameId, channel) {
    const game = activeShekoGames.get(gameId);
    if (!game || game.phase !== "voting") return;
    game.phase = "revealing";
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    const storyteller = game.players[game.currentStoryteller];
    const lieNum = game.lieIndex + 1;
    const correctVoters = [];
    const wrongVoters = [];
    for (const [voterId, vote] of game.votes) {
      if (vote === lieNum) correctVoters.push(voterId);
      else wrongVoters.push(voterId);
    }
    const totalVoters = game.players.length - 1;
    const fooledAll = correctVoters.length === 0 && game.votes.size > 0;
    const fooledMajority = correctVoters.length < totalVoters / 2;
    let storytellerXP = 5;
    if (fooledAll) storytellerXP = 40;
    else if (fooledMajority) storytellerXP = 25;
    for (const voterId of correctVoters) {
      const p = game.players.find((pl) => pl.id === voterId);
      if (p) p.score += 15;
    }
    const stPlayer = game.players.find((p) => p.id === storyteller.id);
    if (stPlayer) stPlayer.score += storytellerXP;
    for (const voterId of correctVoters) {
      await storage.updatePlayerXP(voterId, 15);
    }
    await storage.updatePlayerXP(storyteller.id, storytellerXP);
    let resultText = `${T.sheeko_lie_was(lieNum, game.statements[game.lieIndex])}

`;
    if (correctVoters.length > 0) {
      resultText += `${T.sheeko_correct} ${correctVoters.map((id) => `<@${id}>`).join(", ")} (+15 XP)
`;
    }
    if (wrongVoters.length > 0) {
      resultText += `${T.sheeko_wrong} ${wrongVoters.map((id) => `<@${id}>`).join(", ")}
`;
    }
    if (fooledAll) {
      const prevCount = game.fooledAllCounts.get(storyteller.id) || 0;
      game.fooledAllCounts.set(storyteller.id, prevCount + 1);
      resultText += T.sheeko_fooled_all(storyteller.username, storytellerXP);
    } else if (fooledMajority) {
      resultText += T.sheeko_fooled_majority(storyteller.username, storytellerXP);
    } else {
      resultText += T.sheeko_not_fooled(storyteller.username, storytellerXP);
    }
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.sheeko_result_title(storyteller.username)).setDescription(resultText).setColor(fooledAll ? 16766720 : fooledMajority ? 16750848 : 3447003)] });
    game.currentStoryteller += 1;
    await new Promise((r) => setTimeout(r, 3e3));
    await startShekoRound(gameId, channel);
  }
  async function endShekoGame(gameId, channel) {
    const game = activeShekoGames.get(gameId);
    if (!game) return;
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    game.phase = "finished";
    const sorted = [...game.players].sort((a, b) => b.score - a.score);
    const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
    const winner = sorted[0];
    const shekoXPMap = new Map();
    for (const p of game.players) {
      const isWinner = p.id === winner.id;
      const playerFooledAll = game.fooledAllCounts.get(p.id) || 0;
      const shekoResult = await storage.updateShekoStats(p.id, isWinner ? "win" : "loss", playerFooledAll);
      shekoXPMap.set(p.id, shekoResult?.xpAwarded ?? (isWinner ? 20 : 5));
      trackQuest(p.id, "play_sheeko", 1).catch(() => {});
    }
    const lines = sorted.map((p, i) => {
      const actualXP = shekoXPMap.get(p.id) ?? (p.id === winner.id ? 20 : 5);
      return `${medals[i] || `${i + 1}.`} ${p.username} \u2014 **${p.score} pts** | +${actualXP} \u2B50 XP`;
    });
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.sheeko_final_title).setDescription(`${lines.join("\n")}${T.sheeko_winner(winner.username)}`).setColor(16766720)] });
    await channel.send({
      embeds: [new EmbedBuilder().setDescription("❤️ Mahadsanid ciyaartooy! U codee Nasiib oo si toos ah u hel **+100 🪙 · +10 💎 · +20 ⭐** abaal marin ah!").setColor(0x2ecc71)],
      components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("🗳️ U codee Nasiib").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1448671256147787861/vote"))]
    });
    for (const p of game.players) {
      await checkLevel60(p.id, channel);
    }
    if (channel.guild) await logToFtiLogs(channel.guild, `\u{1F3AD} **Sheeko** ended \u2014 Winner: ${winner.username} (${winner.score} XP)`);
    const shekoSugKey = `sheeko_${channel.id}`;
    const shekoSugUsers = sugQueue.get(shekoSugKey);
    if (shekoSugUsers && shekoSugUsers.size > 0) {
      const sugMentions = Array.from(shekoSugUsers).map((id) => `<@${id}>`).join(" ");
      await channel.send({ embeds: [new EmbedBuilder().setTitle("\u{1F514} Game Reminder").setDescription(T.sug_sheeko_ended(sugMentions)).setColor(15277667)] });
      sugQueue.delete(shekoSugKey);
    }
    activeShekoGames.delete(gameId);
  }
  function findPlayerGuessGame(playerId) {
    for (const [gameId, game] of activeGuessGames) {
      if (game.phase !== "finished" && (game.player1Id === playerId || game.player2Id === playerId)) {
        return gameId;
      }
    }
    return null;
  }
  function resetInactivityTimer(gameId, channel) {
    const game = activeGuessGames.get(gameId);
    if (!game) return;
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    game.lastActivity = Date.now();
    game.inactivityTimer = setTimeout(async () => {
      const g = activeGuessGames.get(gameId);
      if (!g || g.phase === "finished") return;
      g.phase = "finished";
      await channel.send({ embeds: [new EmbedBuilder().setTitle(T.guess_game_timeout_title).setDescription(T.guess_game_timeout_desc).setColor(16711680)] });
      if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
      activeGuessGames.delete(gameId);
    }, 12e4);
  }
  async function checkRestricted(userId, message) {
    const restriction = await storage.isPlayerRestricted(userId);
    if (restriction.banned) {
      await message.reply(T.restricted_banned);
      return true;
    }
    if (restriction.muted) {
      await message.reply(T.restricted_muted(restriction.mutedUntil));
      return true;
    }
    return false;
  }
  client.once("clientReady", async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);

    client.user?.setPresence({ activities: [], status: "online" });

    restoreGameStatesFromDisk().catch(err => console.error("[STATE] Restore error:", err.message));
    startDropGiftTimer();
    for (const guild of client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        const map = /* @__PURE__ */ new Map();
        invites.forEach((inv) => {
          if (inv.inviter) map.set(inv.inviter.id, (map.get(inv.inviter.id) || 0) + (inv.uses || 0));
        });
        inviteCache.set(guild.id, map);
      } catch {
      }
    }
  });
  client.on("guildMemberAdd", async (member) => {
    try {
      const config = await storage.getGuildConfig(member.guild.id);
      if (config?.welcomeChannelId) {
        const ch = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
        if (ch) {
          await safeSend(ch, { embeds: [new EmbedBuilder().setTitle(T.welcome_title).setDescription(T.welcome_desc(member.displayName, member.guild.name, member.guild.memberCount)).setColor(65416).setThumbnail(member.displayAvatarURL()).setFooter({ text: T.welcome_footer })] });
        }
      }
      const oldInvites = inviteCache.get(member.guild.id) || /* @__PURE__ */ new Map();
      const newInvites = await member.guild.invites.fetch().catch(() => null);
      if (newInvites) {
        const newMap = /* @__PURE__ */ new Map();
        newInvites.forEach((inv) => {
          if (inv.inviter) newMap.set(inv.inviter.id, (newMap.get(inv.inviter.id) || 0) + (inv.uses || 0));
        });
        inviteCache.set(member.guild.id, newMap);
      }
    } catch (err) {
      console.error("guildMemberAdd error:", err);
    }
  });
  client.on("inviteCreate", async (invite) => {
    try {
      const invites = await invite.guild.invites.fetch();
      const map = /* @__PURE__ */ new Map();
      invites.forEach((inv) => {
        if (inv.inviter) map.set(inv.inviter.id, (map.get(inv.inviter.id) || 0) + (inv.uses || 0));
      });
      inviteCache.set(invite.guild.id, map);
    } catch {
    }
  });
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch().catch(() => null);
      if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
      if (!reaction.message.guild) return;
      const guildId = reaction.message.guild.id;
      if (reaction.emoji.name === "\u2B50") {
        const config2 = await storage.getGuildConfig(guildId);
        if (config2?.starboardChannelId && !starboardPosted.has(reaction.message.id)) {
          const threshold = config2.starboardThreshold || 3;
          const starReaction = reaction.message.reactions.cache.get("\u2B50");
          if (starReaction && starReaction.count >= threshold) {
            starboardPosted.add(reaction.message.id);
            const sbCh = await reaction.message.guild.channels.fetch(config2.starboardChannelId).catch(() => null);
            if (sbCh) {
              const msg = reaction.message;
              const embed = new EmbedBuilder().setAuthor({ name: msg.author?.username || "Unknown", iconURL: msg.author?.displayAvatarURL() }).setDescription((msg.content || "") + `

[Jump to message](${msg.url})`).setColor(16766720).setTimestamp(msg.createdAt).setFooter({ text: `\u2B50 ${starReaction.count} | #${msg.channel.name}` });
              if (msg.attachments.first()) embed.setImage(msg.attachments.first().url);
              await safeSend(sbCh, { embeds: [embed] });
            }
          }
        }
      }
      const config = await storage.getGuildConfig(guildId);
      if (config?.reactionRoles && Array.isArray(config.reactionRoles)) {
        const rr = config.reactionRoles.find(
          (r) => r.messageId === reaction.message.id && r.emoji === reaction.emoji.toString()
        );
        if (rr) {
          const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
          if (member) await member.roles.add(rr.roleId).catch(() => {
          });
        }
      }
    } catch (err) {
      console.error("Reaction add error:", err);
    }
  });
  client.on("messageReactionRemove", async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch().catch(() => null);
      if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
      if (!reaction.message.guild) return;
      const config = await storage.getGuildConfig(reaction.message.guild.id);
      if (config?.reactionRoles && Array.isArray(config.reactionRoles)) {
        const rr = config.reactionRoles.find(
          (r) => r.messageId === reaction.message.id && r.emoji === reaction.emoji.toString()
        );
        if (rr) {
          const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
          if (member) await member.roles.remove(rr.roleId).catch(() => {
          });
        }
      }
    } catch (err) {
      console.error("Reaction remove error:", err);
    }
  });
  function parseUserAndAmount(args, message) {
    let user = message.mentions.users.first() || null;
    let amount = null;
    for (const a of args) {
      if (a.startsWith("<@") && a.endsWith(">")) continue;
      const cleaned = a.replace(/,/g, "");
      if (!/^\d+$/.test(cleaned)) continue;
      const n = parseInt(cleaned, 10);
      if (!isNaN(n) && isFinite(n) && amount === null) amount = n;
    }
    const firstIsMention = (args[0] || "").startsWith("<@");
    const corrected = !!(user && amount !== null && !firstIsMention);
    return { user, amount, corrected };
  }

  function smartEmbed(lines, color = 0xe74c3c) {
    return new EmbedBuilder().setDescription(lines.join("\n")).setColor(color);
  }

  function notEnoughEmbed(have, cmd, min) {
    const lines = [
      "❌ **Ma haysatid coins kugu filan**",
      "",
      `💰 Haysato: **${have.toLocaleString()}** coins`,
    ];
    if (have >= (min || 10)) {
      const suggest = Math.min(have, Math.floor(have * 0.5));
      if (suggest >= (min || 10)) {
        lines.push("", "💡 **Isku day:**", `\`${cmd} ${suggest}\``);
      }
    }
    if (have < (min || 10)) {
      lines.push("", "🎮 **Coins ku hel:**", "• `!work` · `!daily` · `!vote`", "• `!cf` · `!slots` · `!rob`");
    }
    return smartEmbed(lines);
  }

  function usageEmbed(format, example, extra) {
    const lines = [
      "❌ **Habka khaldan**",
      "",
      "📌 **Qaab saxda ah:**",
      `\`${format}\``,
      "",
      "📝 **Tusaale:**",
      `\`${example}\``,
    ];
    if (extra) lines.push("", extra);
    return smartEmbed(lines);
  }

  function correctedEmbed(correctedCmd) {
    return smartEmbed([
      "💡 **Amarka waa la saxay:**",
      "",
      `✅ \`${correctedCmd}\``,
    ], 0x3498db);
  }

  function levelGateEmbed(required, current) {
    return smartEmbed([
      `❌ **Atleast waa in aa tahay Level ${required}**`,
      "",
      `📊 Levelkaaga hadda: **${current}**`,
      "",
      "🎮 **Ciyaar gameskan si aad level u kordhiso:**",
      "• `!sheeko`",
      "• `!miino`",
      "• `!fti`",
      "• `!tower`",
      "",
      `💡 Gaadh Level ${required} si aad amarka u isticmaasho.`,
    ]);
  }

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;



    if (message._isSlashSynthetic) return;
    if (message._permBlocked) return;


    if (await handleCiladDmRelay(message, client)) return;


    if (!message.guild && message.content.startsWith("!") && message.content !== "!verify") {
      await message.reply({ embeds: [new EmbedBuilder()
        .setDescription("🇬🇧 Bot commands only work on servers.\n🇸🇴 Amarada botka kaliya waxay ka shaqeeyan serverska.")
        .setColor(0x5865f2)
      ] }).catch(() => {});
      return;
    }


    if (message.channel.id === OWNER_ONLY_CHANNEL) {
      const isAllowed = message.author.id === OWNER_ID || message.author.id === message.guild?.ownerId;
      if (!isAllowed) {
        try { await message.delete(); } catch {}
      }
      return;
    }


    if (ANNOUNCEMENT_CHANNEL_IDS.has(message.channel.id)) {
      try { await message.delete(); } catch {}
      const warn = await message.channel.send({
        content: `<@${message.author.id}> 💬 Fadlan wada-hadal ka samee **thread-ka** embedka hoostisa — channelkan kaliya nasiib bot ayaa ku qori karaa.`,
      }).catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);
      return;
    }

    if (message.content.startsWith('!rem')) {
      const sub = message.content.trim().split(/\s+/)[1]?.toLowerCase();
      const uid = message.author.id;
      try {
        if (sub === 'enable') {
          await pool.query(`INSERT INTO vote_settings (user_id, reminders_enabled) VALUES ($1, true) ON CONFLICT (user_id) DO UPDATE SET reminders_enabled = true`, [uid]);
          await message.reply('✅ xasuusinta codaynta waa laguu furay.');
        } else if (sub === 'disable') {
          await pool.query(`INSERT INTO vote_settings (user_id, reminders_enabled) VALUES ($1, false) ON CONFLICT (user_id) DO UPDATE SET reminders_enabled = false`, [uid]);
          await message.reply('❌ xasuusinta codaynta waa lagaa xiray.');
        } else {
          await message.reply('Isticmaal: `!rem enable` ama `!rem disable`');
        }
      } catch (err) { console.error('[VoteSystem] !rem error:', err); }
      return;
    }
    if (ownerAfk.active && message.author.id === OWNER_ID && !message.content.startsWith("!afk")) {
      ownerAfk.active = false;
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.afk_welcome_title).setDescription(T.afk_welcome_desc).setColor(65416)] });
    }
    if (ownerAfk.active && message.mentions.has(OWNER_ID)) {
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.afk_title).setDescription(T.afk_desc(OWNER_ID, ownerAfk.reason)).setColor(16750848)] });
    }
    if (message.guild) {
      if (!lastActiveChannels.has(message.guild.id)) lastActiveChannels.set(message.guild.id, /* @__PURE__ */ new Set());
      lastActiveChannels.get(message.guild.id).add(message.channel.id);
    }
    if (message.guild) {
      try {
        const config = await storage.getGuildConfig(message.guild.id);
        if (config?.automodEnabled) {
          const key = `${message.guild.id}_${message.author.id}`;
          const now = Date.now();
          if (!spamTracker.has(key)) spamTracker.set(key, { timestamps: [], warned: false });
          const tracker = spamTracker.get(key);
          tracker.timestamps = tracker.timestamps.filter((t) => now - t < 5e3);
          tracker.timestamps.push(now);
          if (tracker.timestamps.length >= 5 && !tracker.warned) {
            tracker.warned = true;
            const permLevel = await getPermissionLevel(message.author.id);
            if (permLevel === "USER") {
              await message.channel.send(T.automod_spam_warn(message.author.id));
              setTimeout(() => {
                tracker.warned = false;
              }, 3e4);
            }
          }
        }
        if (config?.automodAntiLink) {
          const permLevel = await getPermissionLevel(message.author.id);
          if (permLevel === "USER" && /https?:\/\/|www\.|discord\.gg/i.test(message.content)) {
            await message.delete().catch(() => {
            });
            await message.channel.send(T.automod_link_blocked(message.author.id));
            return;
          }
        }
        if (config?.countingChannelId && message.channel.id === config.countingChannelId) {
          const num = parseInt(message.content.trim());
          if (!isNaN(num)) {
            const expected = (config.countingCurrent || 0) + 1;
            if (config.countingLastUser === message.author.id) {
              await message.react("\u274C").catch(() => {
              });
              await message.channel.send(T.counting_same_user(message.author.username));
              await storage.updateCounting(message.guild.id, 0, null);
            } else if (num === expected) {
              await message.react("\u2705").catch(() => {
              });
              await storage.updateCounting(message.guild.id, num, message.author.id);
              if (num % 100 === 0 && num > 0) {
                await message.channel.send(T.counting_milestone(num));
              }
            } else {
              await message.react("\u274C").catch(() => {
              });
              await message.channel.send(T.counting_wrong(message.author.username, expected));
              await storage.updateCounting(message.guild.id, 0, null);
            }
            return;
          }
        }
      } catch {
      }
    }
    const guessGameId = findPlayerGuessGame(message.author.id);
    if (guessGameId) {
      const gg = activeGuessGames.get(guessGameId);
      if (gg && gg.phase === "playing") {
        const num = parseInt(message.content);
        if (!isNaN(num) && num >= 1 && num <= 100) {
          if (gg.currentTurn !== message.author.id) {
            await message.reply(T.guess_not_your_turn);
            return;
          }
          const isP1 = message.author.id === gg.player1Id;
          const secretNum = isP1 ? gg.player2Number : gg.player1Number;
          const guessArr = isP1 ? gg.player1Guesses : gg.player2Guesses;
          guessArr.push(num);
          resetInactivityTimer(guessGameId, message.channel);
          if (num === secretNum) {
            if (isP1) gg.player1Found = true;
            else gg.player2Found = true;
            await message.reply(T.guess_correct(secretNum));
            const otherId = isP1 ? gg.player2Id : gg.player1Id;
            const otherFound = isP1 ? gg.player2Found : gg.player1Found;
            const otherGuesses = isP1 ? gg.player2Guesses : gg.player1Guesses;
            if (!otherFound && otherGuesses.length < guessArr.length) {
              gg.currentTurn = otherId;
              gg.lastChanceTurn = true;
              await message.channel.send(`<@${otherId}>`);
              await message.channel.send({ embeds: [new EmbedBuilder().setTitle(T.guess_title).setDescription(T.guess_your_turn_chance(otherId)).setColor(3447003)] });
            } else {
              await resolveGuessGame(guessGameId, message.channel);
            }
          } else if (num > secretNum) {
            await message.reply(T.guess_lower);
            if (gg.lastChanceTurn) {
              await resolveGuessGame(guessGameId, message.channel);
            } else {
              const nextId = isP1 ? gg.player2Id : gg.player1Id;
              gg.currentTurn = nextId;
              await message.channel.send(`<@${nextId}>`);
              await message.channel.send({ embeds: [new EmbedBuilder().setTitle(T.guess_title).setDescription(T.guess_your_turn(nextId)).setColor(3447003)] });
            }
          } else {
            await message.reply(T.guess_higher);
            if (gg.lastChanceTurn) {
              await resolveGuessGame(guessGameId, message.channel);
            } else {
              const nextId = isP1 ? gg.player2Id : gg.player1Id;
              gg.currentTurn = nextId;
              await message.channel.send(`<@${nextId}>`);
              await message.channel.send({ embeds: [new EmbedBuilder().setTitle(T.guess_title).setDescription(T.guess_your_turn(nextId)).setColor(3447003)] });
            }
          }
          return;
        }
      }
    }
    if (bioRequests.has(message.author.id)) {
      const bio = message.content.slice(0, 120);
      if (bio.includes("http") || bio.includes("www.") || (bio.match(/<@/g) || []).length > 2) {
        await message.reply(T.bio_invalid);
        bioRequests.delete(message.author.id);
        return;
      }
      let player = await storage.getPlayer(message.author.id);
      if (!player) {
        player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      }
      await storage.updateBio(message.author.id, bio);
      bioRequests.delete(message.author.id);
      await message.reply(T.bio_updated);
      return;
    }
    if (message.content === "!bio") {
      bioRequests.set(message.author.id, true);
      await message.reply(T.bio_prompt);
      return;
    }

    if (message.content === "!heist" || message.content.startsWith("!heist ")) {
      try {
        const reply = await message.reply({ content: "⏳ **!heist** — Dhawaan ayay imanaaysaa! Stay tuned. 👀" });
        setTimeout(async () => {
          try { await message.delete(); } catch {}
          try { await reply.delete(); } catch {}
        }, 3000);
      } catch {}
      return;
    }

    if (message.content === "!p" || message.content.startsWith("!p ")) {
      const target = message.mentions.users.first() || message.author;
      let player = await storage.getPlayer(target.id);
      if (!player) {
        if (target.id === message.author.id) {
          player = await storage.createPlayer({ discordId: target.id, username: message.member?.displayName || target.username });
        } else {
          await message.reply(T.profile_not_played);
          return;
        }
      }
      const isVerified = await pool.query(
        `SELECT is_verified FROM players WHERE discord_id = $1`, [target.id]
      ).then(r => r.rows[0]?.is_verified || false).catch(() => false);
      const member = await message.guild?.members.fetch(target.id).catch(() => null);
      const displayName = getDisplayName(member, player.username);
      const rawStats = player.gameStats || {};
      const gStats = {
        fti: { wins: 0, losses: 0, played: 0, ...rawStats.fti || {} },
        bluff: { wins: 0, losses: 0, played: 0, ...rawStats.bluff || {} },
        iq: { wins: 0, losses: 0, played: 0, ...rawStats.iq || {} },
        guess: { wins: 0, losses: 0, played: 0, ...rawStats.guess || {} },
        tower: { played: 0, highestFloor: 0, totalXpEarned: 0, ...rawStats.tower || {} },
        miino: { wins: 0, losses: 0, played: 0, bestReveal: 0, ...rawStats.miino || {} },
        sheeko: { wins: 0, losses: 0, played: 0, timesFooledAll: 0, ...rawStats.sheeko || {} }
      };
      let streakTitle = "\u2014";
      for (const tier of STREAK_TIERS) {
        if (player.currentStreak >= tier.wins) {
          streakTitle = `${tier.title} (${player.currentStreak})`;
          break;
        }
      }
      const unlockedAchievements = PERMANENT_ACHIEVEMENTS.filter((a) => a.check(gStats, player));
      const unlockedHidden = HIDDEN_ACHIEVEMENTS.filter((a) => a.check(gStats, player));
      const allUnlocked = [...unlockedAchievements, ...unlockedHidden];
      const unlockedTitles = COSMETIC_TITLES.filter((t) => allUnlocked.some((a) => a.id === t.unlock));
      const prestige = player.prestige || 0;
      const lvl = player.level;
      let profileColor;
      if (prestige >= 3) profileColor = 0xe91e8c;
      else if (prestige === 2) profileColor = 0x9b59b6;
      else if (prestige === 1) profileColor = 0xf1c40f;
      else if (lvl >= 40) profileColor = 0x3498db;
      else if (lvl >= 20) profileColor = 0x2ecc71;
      else profileColor = 0x95a5a6;
      const prestigeLabel = prestige > 0 ? ` \u2728P${prestige}` : "";
      const levelBadge = lvl >= 50 ? "\u{1F451}" : lvl >= 30 ? "\u{1F4AB}" : lvl >= 15 ? "\u2B50" : "\u{1F3AE}";
      const maxXP = 75 + lvl * 40 + lvl * lvl * 8;
      const xpPct = Math.min(1, player.xp / maxXP);
      const barLen = 12;
      const filled = Math.round(xpPct * barLen);
      const xpBar = "\u25B0".repeat(filled) + "\u25B1".repeat(barLen - filled);
      const winRate = player.gamesPlayed > 0 ? Math.round((player.wins / player.gamesPlayed) * 100) : 0;
      const winRateEmoji = winRate >= 70 ? "\u{1F525}" : winRate >= 50 ? "\u26A1" : "\u{1F4AA}";
      const xpBoostLabel = (player.xpBoost || 0) > 0 ? T.profile_xp_boost(player.xpBoost) : "";
      const dailyStreakLabel = (player.dailyStreak || 0) > 0 ? T.profile_daily_streak(player.dailyStreak) : "";
      const statusVal = (`${xpBoostLabel}${dailyStreakLabel}`).trim() || "\u2014";
      const profileOwnedTitles = Array.isArray(player.ownedTitles) ? player.ownedTitles : [];
      const limitedTitleDisplay = profileOwnedTitles.length > 0
        ? profileOwnedTitles.map(t => t === "observer_title" ? "👁️ Observer" : t).join(", ")
        : null;
      let achievementText = allUnlocked.length > 0 ? allUnlocked.map((a) => a.name).join("\n") : T.achv_none;
      const hiddenLocked = HIDDEN_ACHIEVEMENTS.filter((a) => !a.check(gStats, player)).length;
      if (hiddenLocked > 0) achievementText += `\n${T.achv_hidden_count(hiddenLocked)}`;
      const embed = new EmbedBuilder()
        .setTitle(`${levelBadge} ${displayName}${prestigeLabel}${isVerified ? ` ${VERIFY_BADGE}` : ""}`)
        .setThumbnail(target.displayAvatarURL())
        .setColor(profileColor)
        .setDescription(`${xpBar}\n${player.xp.toLocaleString()} / ${maxXP.toLocaleString()} XP`)
        .addFields(
          ...[
            { name: "\u2B50 Level", value: `**${lvl}**`, inline: true },
            { name: "\u{1F525} Streak", value: streakTitle, inline: true },
            { name: `${winRateEmoji} Win Rate`, value: `**${winRate}%**`, inline: true },
            { name: "\u{1F3C6} Wins", value: `**${player.wins}**`, inline: true },
            { name: "\u2620\uFE0F Losses", value: `**${player.losses}**`, inline: true },
            { name: "\u{1F3AE} Games", value: `**${player.gamesPlayed}**`, inline: true },
            { name: "\u{1F3C5} Best Streak", value: `**${player.highestStreak}**`, inline: true },
            ...(limitedTitleDisplay ? [{ name: "🏷️ Limited Titles", value: `**${limitedTitleDisplay}**`, inline: false }] : []),
            ...(isVerified ? [{ name: `${VERIFY_BADGE} Verified`, value: "Nasiib Verified Member", inline: false }] : [])
          ]
        )
        .setFooter({ text: "\u{1F447} Riix badhanka si aad u aragto faahfaahin dheeri" });
      const profBtns = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`prof_eco_${target.id}`).setLabel("\u{1F4B0} Economy").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`prof_game_${target.id}`).setLabel("\u{1F3AE} Game Stats").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`prof_achv_${target.id}`).setLabel("\u{1F3C5} Achievements").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`prof_inv_${target.id}`).setLabel("\u{1F4E6} Inventory").setStyle(ButtonStyle.Danger)
      );
      const eidProfileRes = await pool.query(
        `SELECT game_stats->>'eidCustomTitle' AS eid_title FROM players WHERE discord_id = $1`,
        [target.id]
      ).catch(() => null);
      const eidCustomTitle = eidProfileRes?.rows[0]?.eid_title;
      if (eidCustomTitle) {
        embed.addFields({
          name: "✨ Eid Title 2026",
          value: eidCustomTitle,
          inline: false,
        });
      }
      await message.reply({ embeds: [embed], components: [profBtns] });
      return;
    }
    if (message.content === "!start") {
      const embed = new EmbedBuilder().setTitle(T.hub_title).setDescription(T.hub_desc).setColor(10181046);
      await message.reply({ embeds: [embed] });
      return;
    }
    if (message.content === "!leaderboard" || message.content === "!lb") {
      const topPlayers = await storage.getTopPlayers();
      if (topPlayers.length === 0) {
        await message.reply({ embeds: [new EmbedBuilder().setTitle("🏆 Global Leaderboard").setDescription("Weli ciyaartoy ma jiraan — noqo qofkii ugu horeeyey!").setColor(0xf1c40f)] });
        return;
      }
      const guild = message.guild;
      const authorId = message.author.id;
      const _lbIds = topPlayers.map(p => p.discordId);
      const _lbVerified = _lbIds.length > 0
        ? await pool.query(`SELECT discord_id FROM players WHERE discord_id = ANY($1::text[]) AND is_verified = true`, [_lbIds])
            .then(r => new Set(r.rows.map(row => row.discord_id))).catch(() => new Set())
        : new Set();
      const resolvedNames = await Promise.all(topPlayers.map(async p => {
        const m = await guild?.members.fetch(p.discordId).catch(() => null);
        const badge = _lbVerified.has(p.discordId) ? ` ${VERIFY_BADGE}` : "";
        return { p, name: getDisplayName(m, p.username) + badge };
      }));

      const topMedals = ["🥇", "🥈", "🥉"];
      const lbEmbed = new EmbedBuilder()
        .setTitle("🏆 Global Leaderboard")
        .setColor(0xf1c40f);

      const topFields = resolvedNames.slice(0, 3).map(({ p, name }, i) => {
        const isYou = p.discordId === authorId ? " (You)" : "";
        return { name: `${topMedals[i]} #${i + 1} ${name}${isYou}`, value: `🏆 Wins: **${p.wins}**  ·  ⭐ Level **${p.level}**`, inline: false };
      });
      lbEmbed.addFields(...topFields);

      if (resolvedNames.length > 3) {
        const restLines = resolvedNames.slice(3).map(({ p, name }, i) => {
          const rank = i + 4;
          const isYou = p.discordId === authorId ? " (You)" : "";
          return `**#${rank}** ${name}${isYou} — 🏆 ${p.wins} · ⭐ ${p.level}`;
        }).join("\n");
        lbEmbed.addFields({ name: "📊 Kuwa Kale", value: restLines, inline: false });
      }

      const authorInTop = resolvedNames.findIndex(({ p }) => p.discordId === authorId);
      if (authorInTop === -1) {
        try {
          const allPlayersRaw = await pool.query(
            `SELECT discord_id, wins, level FROM players ORDER BY level DESC, xp DESC`
          );
          const rank = allPlayersRaw.rows.findIndex(r => r.discord_id === authorId) + 1;
          if (rank > 0) {
            const me = allPlayersRaw.rows[rank - 1];
            lbEmbed.addFields({ name: "👤 Adigu", value: `**#${rank}** — 🏆 ${me.wins} · ⭐ Level ${me.level}`, inline: false });
          }
        } catch {}
      }

      lbEmbed.setFooter({ text: "Ku kordhi winskaaga: !fti · !sheeko · !miino · !tower" });

      await message.reply({
        embeds: [lbEmbed],
        components: [new ActionRowBuilder().addComponents(makeCloseButton(message.author.id))],
      });
      return;
    }
    if (message.content.startsWith("!afk")) {
      if (message.author.id !== OWNER_ID || !isAdminSessionActive(message.author.id)) {
        await message.reply(T.afk_owner_only);
        return;
      }
      const reason = message.content.slice(5).trim() || "AFK";
      ownerAfk.active = true;
      ownerAfk.reason = reason;
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.afk_activated_title).setDescription(T.afk_activated_desc(reason)).setColor(16750848)] });
      return;
    }
    if (message.content === "!daily") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota database ayey cilad ka jirtaa. Mahadsanidiin vert waxba kama qaban karo so don't mention."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      let player = await storage.getPlayer(message.author.id);
      if (!player) {
        player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      }
      applyWalletIdleDecay(message.author.id).catch(() => {});
      const _dailyNwBlock = await nwCapBlocked(message.author.id, 355);
      if (_dailyNwBlock) {
        await message.reply({ embeds: [_dailyNwBlock] });
        return;
      }
      await withUserLock(message.author.id, async () => {
        const result = await storage.claimDaily(message.author.id);
        if (!result) {
          await message.reply({ embeds: [new EmbedBuilder().setTitle(T.daily_already_title).setDescription(T.daily_already_desc).setColor(16711731)] });
          return;
        }

        const _dTRes = await pool.query(
          `UPDATE bot_wallet SET coins = GREATEST(0, coins - $1) WHERE id = 1 AND coins >= $1 RETURNING coins`,
          [result.coinsEarned]
        );
        if (_dTRes.rows.length) {
          const { netAmount: _dNet } = await applyIncome(message.author.id, result.coinsEarned);
          const _dAdded = _dNet > 0 ? await storage.addCoins(message.author.id, _dNet) : null;
          if (_dAdded) result.player.coins = _dAdded.coins;
          console.log(`[TREASURY] -${result.coinsEarned} → daily for ${message.author.id}`);
        } else {
          console.log(`[TREASURY] Insufficient funds — daily coins skipped for ${message.author.id} (wanted ${result.coinsEarned})`);
          result.coinsEarned = 0;
        }
        logEconomy(message.author.id, "daily", result.xpEarned, "gain");
        if (result.diamondsEarned > 0) logEconomy(message.author.id, "daily-diamonds", result.diamondsEarned, "gain");
        checkNetWorthMilestone(message.author.id, client).catch(() => {});
        const streakBar = "\u{1F525}".repeat(Math.min(result.streak, 7));
        let desc2 = [
          `\u2728 **+${result.xpEarned} XP** waa lagugu daray!`,
          `\u{1F4A8} **+${result.diamondsEarned} Diamonds** waa lagugu daray!`,
          `\u{1F4B0} **+${result.coinsEarned} Coins** waa lagugu daray!`,
          ``,
          `\u{1F4C5} Streak: **${result.streak} maalmood** ${streakBar}`,
          `\u2B50 Level: **${result.player.level}** \u00B7 \u2728 XP: **${result.player.xp} / ${75 + result.player.level * 40 + result.player.level * result.player.level * 8}**`,
          `\u{1F4A8} Diamonds: **${result.player.diamonds}** \u00B7 \u{1F4B0} Coins: **${(result.player.coins || 0).toLocaleString()}**`
        ].join("\n");
        if (result.legendaryDay) {
          desc2 += `\n\n🏆 **30-DAY LEGEND REWARD!**\n🎁 Waxaad heshay:\n💰 **3,000 Coins** dheeri ah\n💎 **100 Diamonds** dheeri ah\n🎁 **1 Legendary Crate!**\n\nIsticmaal \`!fur legendary crate\` si aad u furto crate-kaaga!`;
        } else if (result.bonusDay) {
          desc2 += `\n\n${T.daily_bonus_7day}`;
        } else if (result.streak < 7) {
          const daysToBonus = 7 - result.streak % 7;
          desc2 += `\n\n${T.daily_days_left(daysToBonus)}`;
        }
        if (result.player.xpBoost > 0) {
          desc2 += `\n${T.daily_prestige_boost(result.player.xpBoost)}`;
        }
        if (result.shopBoostXP > 0) {
          desc2 += `\n\u26A1 **Shop XP Boost:** +${result.shopBoostXP} XP`;
        }
        if (result.shieldUsed) {
          desc2 += `\n\n\u{1F6E1}\uFE0F **Streak Shield** waa la isticmaalay! Streak-kaagii waa la badbaadiyay.`;
        }
        const dailyVoteRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🗳️ U codee Nasiib oo Hel abaalmarino!").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1448671256147787861/vote")
        );
        await message.reply({ embeds: [new EmbedBuilder().setTitle(T.daily_title).setDescription(desc2).setColor(65416)], components: [dailyVoteRow] });
        await checkLevel60(message.author.id, message.channel);
        const dmUserId = message.author.id;
        setTimeout(async () => {
          try {
            const dmUser = await client.users.fetch(dmUserId).catch(() => null);
            if (dmUser) {
              await dmUser.send({ embeds: [new EmbedBuilder().setTitle("\u{1F381} Hadiyaddaada waa diyaar!").setDescription("Fadlan tag server uu bot Nasiib ku jiro,\nkadibna qor `!daily` si aad u qaadato abaalmarintaada.\n\nWaad ku mahadsan tahay isticmaalka Nasiib Bot \u{1F499}").setColor(65416)] }).catch(() => null);
            }
          } catch (e) { }
        }, 864e5);
      });
      return;
    }


    if (message.content === "!loan" || message.content.startsWith("!loan ")) {
      if (!dbOnline) { await message.reply("⚠️ Economy system waa ku hawlanahay — isku day mar kale."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      let loanPlayer = await storage.getPlayer(message.author.id);
      if (!loanPlayer) loanPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      const loanArgs = message.content.slice("!loan".length).trim().split(/\s+/).filter(Boolean);
      await handleLoanCommand(message, loanPlayer, loanArgs);
      return;
    }


    if (message.content === "!loanpay") {
      if (!dbOnline) { await message.reply("⚠️ Economy system waa ku hawlanahay — isku day mar kale."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      let lpPlayer = await storage.getPlayer(message.author.id);
      if (!lpPlayer) lpPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      await handleLoanPay(message, lpPlayer);
      return;
    }

    if (message.content === "!vote") {
      const voteEmbed = new EmbedBuilder()
        .setTitle("\u{1F5F3}\uFE0F U Codee Nasiib Bot")
        .setDescription(
          "\u2728 **U codee Nasiib oo hel abaalmarinaha codaynta!**\n\n" +
          "\u{1F48E} Waxaad heli doontaa **diamonds**, **XP boost**, iyo **streak rewards** markaad codeysid.\n" +
          "\u23F0 Wakhti kasta oo 12-saac ah waad codayn kartaa.\n\n" +
          "\u{1F64F} **Waa ku mahadsan tahay taageeradaada!**"
        )
        .setImage("https://i.imgur.com/PYD84nK.png")
        .setColor(0xFFD700)
        .setFooter({ text: "Nasiib Bot \u00B7 Top.gg Vote Rewards" });
      const voteRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("U Codee Nasiib")
          .setEmoji("\u{1F5F3}\uFE0F")
          .setStyle(ButtonStyle.Link)
          .setURL("https://top.gg/bot/1448671256147787861/vote"),
        new ButtonBuilder()
          .setCustomId(`close_panel_${message.author.id}`)
          .setEmoji("\u{1F5D1}\uFE0F")
          .setStyle(ButtonStyle.Danger)
      );
      await safeSend(message.channel, { embeds: [voteEmbed], components: [voteRow] });
      return;
    }
    if (message.content === "!cd") {
      let cdPlayer = await storage.getPlayer(message.author.id);
      const now = Date.now();
      const cdGS = cdPlayer ? storage.ensureGameStats(cdPlayer.gameStats) : {};
      const lastVoteTime = await getLastVoteTime(message.author.id);
      const voteBoost = hasVoteBoost(lastVoteTime);
      const voteElapsed = lastVoteTime ? now - lastVoteTime : Infinity;
      const voteReady = voteElapsed >= VOTE_BOOST_WINDOW;
      const lastWorkTs = Math.max(workCooldowns.get(message.author.id) || 0, cdGS.lastWork || 0);
      const workCdMs = voteBoost ? WORK_CD_BOOSTED : WORK_CD_DEFAULT;
      const workElapsed = lastWorkTs ? now - lastWorkTs : Infinity;
      const workReady = workElapsed >= workCdMs;
      const lastDailyTs = cdPlayer?.lastDaily ? new Date(cdPlayer.lastDaily).getTime() : 0;
      const dailyElapsed = lastDailyTs ? now - lastDailyTs : Infinity;
      const dailyReady = dailyElapsed >= DAILY_CD;
      const lastRobTs = Math.max(robCooldowns.get(message.author.id) || 0, cdGS.lastRob || 0);
      const robElapsed = lastRobTs ? now - lastRobTs : Infinity;
      const robReady = robElapsed >= ROB_CD;
      const voteStr  = voteReady  ? "✅  Ready" : `⏳  ${fmtCdRemaining(voteElapsed,  VOTE_BOOST_WINDOW)}`;
      const workStr  = workReady  ? "✅  Ready" : `⏳  ${fmtCdRemaining(workElapsed,  workCdMs)}`;
      const dailyStr = dailyReady ? "✅  Ready" : `⏳  ${fmtCdRemaining(dailyElapsed, DAILY_CD)}`;
      const robStr   = robReady   ? "✅  Ready" : `⏳  ${fmtCdRemaining(robElapsed,   ROB_CD)}`;





      const LOAN_REAPPLY_CD = 6 * 60 * 60 * 1000;
      let loanStr = "✅  Ready";
      try {
        const loanRow = await pool.query(
          `SELECT repaid_at, last_repaid_at FROM loans WHERE borrower_id = $1`,
          [message.author.id]
        );
        if (loanRow.rows[0]) {
          const row = loanRow.rows[0];


          const repaidTs = Number(row.last_repaid_at || row.repaid_at || 0);
          if (repaidTs > 0) {
            const loanElapsed = now - repaidTs;
            loanStr = loanElapsed >= LOAN_REAPPLY_CD
              ? "✅  Ready"
              : `⏳  ${fmtCdRemaining(loanElapsed, LOAN_REAPPLY_CD)}`;
          }
        }
      } catch {  }


      const cdEntries = [
        { icon: "🗳️", label: "Vote",  value: voteStr  },
        { icon: "🎁", label: "Daily", value: dailyStr  },
        { icon: "💼", label: "Work",  value: workStr   },
        { icon: "🥷", label: "Rob",   value: robStr    },
        { icon: "💸", label: "Loan",  value: loanStr   },
      ];

      const containerParts = [
        { type: 10, content: `## ⏳ Cooldowns\n-# Waa kuwan dhammaan cooldownskaaga.` },
      ];

      for (let i = 0; i < cdEntries.length; i++) {
        const e = cdEntries[i];
        containerParts.push({ type: 14, divider: true, spacing: 1 });
        containerParts.push({ type: 10, content: `**${e.icon} ${e.label}**\n${e.value}` });
      }

      containerParts.push({ type: 14, divider: true, spacing: 1 });
      containerParts.push({
        type: 1,
        components: [makeCloseButton(message.author.id).toJSON()],
      });

      await message.reply({
        flags: 1 << 15,
        components: [
          {
            type: 17,
            accent_color: voteBoost ? 0xf1c40f : 0x9b59b6,
            components: containerParts,
          },
        ],
      });
      return;
    }
    if (message.content === "!work") {
      if (!dbOnline) { await message.reply("\u26A0\uFE0F Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota database ayey cilad ka jirtaa. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      const lastVoteTime = await getLastVoteTime(message.author.id);
      const voteBoost = hasVoteBoost(lastVoteTime);
      const workCooldownMs = voteBoost ? WORK_CD_BOOSTED : WORK_CD_DEFAULT;
      let workPlayer = await storage.getPlayer(message.author.id);
      if (!workPlayer) workPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      applyWalletIdleDecay(message.author.id).catch(() => {});
      const wGSCd = storage.ensureGameStats(workPlayer.gameStats);
      await withUserLock(message.author.id, async () => {
        const lastWork = Math.max(workCooldowns.get(message.author.id) || 0, wGSCd.lastWork || 0);
        if (Date.now() - lastWork < workCooldownMs) {
          const elapsed = Date.now() - lastWork;
          const timeStr = fmtCdRemaining(elapsed, workCooldownMs);
          const wcdRow = new ActionRowBuilder();
          let wcdDesc;
          if (voteBoost) {
            wcdDesc = `⏰ Sug: **${timeStr}**\n\n🔥 Vote boost way  shaqeynaysa — 4h CD`;
            wcdRow.addComponents(makeCloseButton(message.author.id));
          } else {
            wcdDesc = [
              `⏰ Sug: **${timeStr}**`,
              "",
              "⏳ waxaad ku jirtaa nasasho!",
              "",
              "🔥 ma rabtaa in degdeg oga baxdid?",
              "Hada u codee nasiib oo hel kaliya **4 hours** nasasho ah.",
              "",
              "💡 codynta sidoo kale faaiidooyin kle ayey leedahay.",
            ].join("\n");
            wcdRow.addComponents(
              new ButtonBuilder()
                .setLabel("🗳️ U codee Nasiib")
                .setStyle(ButtonStyle.Link)
                .setURL("https://top.gg/bot/1448671256147787861/vote"),
              makeCloseButton(message.author.id)
            );
          }
          await message.reply({
            embeds: [new EmbedBuilder()
              .setTitle("💼 Shaqo — Nasasho!")
              .setDescription(wcdDesc)
              .setColor(0xe67e22)],
            components: [wcdRow],
          });
          return;
        }
        const jobs = [
          { name: "Guri ayaa dhistay \u{1F3D7}\uFE0F", desc: "Waxaad u shaqeysay shirkad dhisme oo weyn", coins: [80, 135] },
          { name: "Macalin \u{1F4DA}", desc: "Waxaad wax baraysay arday maanta oo dhan", coins: [65, 115] },
          { name: "Ganacsi \u{1F4BC}", desc: "Waxaad iibisay alaab badan oo faa'iido fiican", coins: [55, 210] },
          { name: "Doctor \u{1F3E5}", desc: "Waxaad daryeeshay bukaan iyo qoyskooda", coins: [105, 180] },
          { name: "programmer \u{1F4BB}", desc: "Waxaad xalisay bug adag oo la xalinkarin", coins: [95, 165] },
          { name: "Farsamo \u231A", desc: "Waxaad hagaajisay mishiin xoogaa adkaa in la sameeyo", coins: [70, 125] },
          { name: "chef \u{1F373}", desc: "Waxaad karisay cunto macaan oo macaash fiican", coins: [60, 145] },
          { name: "Darawal xamuul  \u{1F69A}", desc: "Waxaad qaaday xamuul fog oo lagugu aaminay", coins: [75, 150] },
          { name: "Beeralay \u{1F33F}", desc: "Waxaad ka shaqeysay beeraha oo miro badan kasoo goosatay", coins: [60, 130] },
          { name: "Garoonka diyaarada \u2708\uFE0F", desc: "Waxaad caawisay meesha duulimaadyada rayidka", coins: [90, 170] },
        ];
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earned = Math.floor(Math.random() * (job.coins[1] - job.coins[0] + 1)) + job.coins[0];
        const _workNwBlock = await nwCapBlocked(message.author.id, earned);
        if (_workNwBlock) {
          checkNetWorthMilestone(message.author.id, client).catch(() => {});
          await message.reply({ embeds: [_workNwBlock] });
          return;
        }

        const _wTRes = await pool.query(
          `UPDATE bot_wallet SET coins = GREATEST(0, coins - $1) WHERE id = 1 AND coins >= $1 RETURNING coins`,
          [earned]
        );
        const _wActual = _wTRes.rows.length ? earned : 0;
        if (_wActual > 0) {
          console.log(`[TREASURY] -${_wActual} → work for ${message.author.id}`);
        } else {
          console.log(`[TREASURY] Insufficient funds — work coins skipped for ${message.author.id} (wanted ${earned})`);
        }
        const { netAmount: _wNet } = _wActual > 0 ? await applyIncome(message.author.id, _wActual) : { netAmount: 0 };
        const workAddResult = _wNet > 0 ? await storage.addCoins(message.author.id, _wNet) : null;
        const now = Date.now();
        workCooldowns.set(message.author.id, now);
        const wGS = storage.ensureGameStats(workPlayer.gameStats);
        wGS.lastWork = now;
        await db.update(players).set({ gameStats: wGS }).where(eq(players.discordId, message.author.id)).catch(() => {});
        logEconomy(message.author.id, "work", _wActual, "gain");
        const newBal = workAddResult?.coins ?? (workPlayer.coins || 0) + _wNet;
        const cdLabel = voteBoost ? "4h" : "8h";
        const workEmbed = new EmbedBuilder()
          .setTitle(`\u{1F4BC} Shaqo — ${job.name}`)
          .setDescription(`${job.desc}.\n\n\u{1F4B0} **+${_wActual.toLocaleString()} Coins** ayaad heshay!\n\u{1F4CA} Balance cusub: **${newBal.toLocaleString()} Coins**${voteBoost ? "\n\n🔥 *Vote boost active — 4h cooldown!*" : ""}`)
          .setColor(0x27ae60)
          .setFooter({ text: `⏰ ${cdLabel} ka dib ayaad dib u shaqayn kartaa · !work · !cd si aad u aragto cooldowns` });
        await message.reply({ embeds: [workEmbed] });
        trackQuest(message.author.id, "work", 1).catch(() => {});
        trackQuest(message.author.id, "earn_coins", earned).catch(() => {});
      });
      return;
    }
    if (message.content === "!quests") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, economy system waa ku hawlanahay hada."); return; }
      let qPlayer = await storage.getPlayer(message.author.id);
      if (!qPlayer) qPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      const today = new Date().toISOString().split("T")[0];
      const gQS = storage.ensureGameStats(qPlayer.gameStats);
      if (!gQS.quests || gQS.quests.date !== today) {
        gQS.quests = { date: today, q1: 0, q2: 0, q3: 0, claimed1: false, claimed2: false, claimed3: false };
      }
      const dailyQs = getDailyQuests();
      const pBar = (val, max) => { const f = Math.round(Math.min(1, val / max) * 10); return "\u2588".repeat(f) + "\u2591".repeat(10 - f); };
      const questLines = dailyQs.map((q, i) => {
        const val = gQS.quests[`q${i + 1}`] || 0;
        const claimed = gQS.quests[`claimed${i + 1}`];
        const done = val >= q.target;
        const icon = claimed ? "\u2705" : done ? "\uD83D\uDFE2" : "\u23F3";
        const status = claimed ? "*Waa la qaatay*" : done ? "\u2705 Ready! Riix Claim" : `${val}/${q.target}`;
        return `${icon} **${i + 1}. ${q.desc}**\n\`${pBar(val, q.target)}\` ${status}\n\uD83D\uDCB0 Abaalmarin: **${q.coins} Coins** + **${q.xp} XP**`;
      });
      const msToReset = 86400000 - (Date.now() % 86400000);
      const rH = Math.floor(msToReset / 3600000);
      const rM = Math.floor((msToReset % 3600000) / 60000);
      const questEmbed = new EmbedBuilder()
        .setTitle("\uD83D\uDCCB Daily Quests — Maanta")
        .setDescription(questLines.join("\n\n"))
        .setColor(0xf39c12)
        .setFooter({ text: `🔄 Quests cusub: ${rH}h ${rM}m · Maalin walba way isbedelaan` });
      const claimBtns = dailyQs.map((q, i) => {
        const val = gQS.quests[`q${i + 1}`] || 0;
        const claimed = gQS.quests[`claimed${i + 1}`];
        const done = val >= q.target;
        return new ButtonBuilder()
          .setCustomId(`quest_claim_${i + 1}_${message.author.id}`)
          .setLabel(`Claim ${i + 1}: ${q.coins}\uD83E\uDE99`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(!done || claimed);
      });
      await message.reply({
        embeds: [questEmbed],
        components: [
          new ActionRowBuilder().addComponents(...claimBtns),
          new ActionRowBuilder().addComponents(makeCloseButton(message.author.id)),
        ],
      });
      return;
    }
    if (message.content === "!networth" || message.content === "!nw") {
      if (!dbOnline) {
        await message.reply("⚠️ Database waa offline. Isku day mar kale.");
        return;
      }
      if (await checkRestricted(message.author.id, message)) return;

      try {
        const loadingMsg = await message.reply({
          embeds: [new EmbedBuilder()
            .setDescription("💎 **Nasiib Wealth Report loading...**\n\n⏳ Lacagta oo dhan la xisaabinayaa...")
            .setColor(0xf1c40f)
          ]
        });


        if (!nwCache.rows) await refreshNwCache();

        const allRows = nwCache.rows || [];
        const rows = allRows.slice(0, 10);
        if (!rows || rows.length === 0) {
          await loadingMsg.edit({
            embeds: [new EmbedBuilder()
              .setTitle("💎 Nasiib Wealth Report")
              .setDescription("Botka wuxuu heli la yahay lacag uu xisaabiyi.")
              .setColor(0x95a5a6)
            ],
            components: []
          });
          return;
        }

        const medals = ["🥇", "🥈", "🥉"];
        const authorIdx = allRows.findIndex(r => r.discord_id === message.author.id);
        const authorRank = authorIdx >= 0 ? authorIdx + 1 : null;
        const authorNetWorth = authorIdx >= 0 ? Number(allRows[authorIdx].net_worth) : 0;

        const embed = new EmbedBuilder()
          .setTitle("💎  N A S I I B   W E A L T H   R E P O R T")
          .setColor(0xf1c40f)
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 128 }))
          .setDescription(
            "🌍 **Nasiib World — Top 10 Dadka ugu hodansan nasiib**\n" +
            "Lacagta oo dhan: wallet + banks + investments + deposits\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━"
          )
          .setFooter({ text: `🔄 Updated daily at 12:00 AM EAT${nwCache.lastRefresh > 0 ? "  ·  Last: " + new Date(nwCache.lastRefresh).toLocaleDateString("en-GB", { timeZone: "Africa/Nairobi", day: "numeric", month: "short" }) : ""}  ·  Net Worth = Wallet + Bot Invest + Bank Deposits + Profit + Bank Investments` })
          .setTimestamp();

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const pos = i + 1;
          const medal = pos <= 3 ? medals[i] : "🔹";
          const fieldName = `${medal} #${pos} — ${r.username}${r.is_verified ? ` ${VERIFY_BADGE}` : ""}`;
          const wallet      = Number(r.wallet).toLocaleString();
          const botInvest   = Number(r.bot_invest).toLocaleString();
          const bankDep     = Number(r.bank_deposited).toLocaleString();
          const bankProfit  = Number(r.bank_profit).toLocaleString();
          const bankInvest  = Number(r.bank_invested).toLocaleString();
          const netWorth    = Number(r.net_worth).toLocaleString();
          embed.addFields({
            name: fieldName,
            value:
              `💎 **Hantida guud: ${netWorth} 🪙**\n` +
              `├ 💰 Wallet: ${wallet} 🪙\n` +
              `├ 🤖 Bot Invest: ${botInvest} 🪙\n` +
              `├ 🏦 Bank Deposits: ${bankDep} 🪙\n` +
              `├ 📈 Deposit Profit: ${bankProfit} 🪙\n` +
              `└ 💼 Bank Investments: ${bankInvest} 🪙`,
            inline: false
          });
        }

        embed.addFields({
          name: "━━━━━━━━━━━━━━━━━━���━━━━━",
          value:
            `📊 **Rankingkaaga:** ${authorRank ? `#${authorRank}` : "Unranked"}\n` +
            `💎 **Net Worthkaaga:** ${authorNetWorth.toLocaleString()} 🪙`,
          inline: false
        });

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`close_panel_${message.author.id}`)
            .setLabel("Close")
            .setEmoji("🗑️")
            .setStyle(ButtonStyle.Danger)
        );

        await loadingMsg.edit({
          embeds: [embed],
          components: [closeRow]
        });

      } catch (err) {
        console.error("[NETWORTH] Error:", err.message);
        await message.reply("❌ Khalad ayaa ka dhacay xisaabinta net worth. Isku day mar kale.");
      }
      return;
    }

    if (message.content === "!verify") {
      if (!dbOnline) { await message.reply("⚠️ Database waa offline. Isku day mar kale."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      try {
        const vPlayer = await storage.getPlayer(message.author.id);
        if (!vPlayer) {
          await message.reply("❌ Profile ma haysatid. Qor `!start` marka hore.");
          return;
        }
        const vVerified = await pool.query(
          `SELECT is_verified FROM players WHERE discord_id = $1`, [message.author.id]
        ).then(r => r.rows[0]?.is_verified || false).catch(() => false);
        if (vVerified) {
          await message.reply({ embeds: [new EmbedBuilder()
            .setTitle("✅ accountgaaga waa Verified")
            .setDescription("Accountgaaga horey ayaa loo verified gareeyey, verified badge waxaad ka arkaysaa `!p` profile-kaaga.")
            .setColor(0x2ecc71)
          ] });
          return;
        }

        const vNWRes = await pool.query(`
          SELECT
            COALESCE(p.coins, 0)                                                            AS wallet,
            COALESCE(CAST(p.game_stats->'invest'->>'amount' AS BIGINT), 0)                  AS bot_invest,
            COALESCE((SELECT SUM(deposited + profit) FROM bank_users WHERE user_id = $1), 0) AS bank_dep,
            COALESCE((SELECT SUM(amount) FROM bank_investments WHERE user_id = $1), 0)       AS bank_inv
          FROM players p WHERE p.discord_id = $1`, [message.author.id]).catch(() => null);
        if (vNWRes?.rows?.[0]) {
          const _r = vNWRes.rows[0];
          const vNetWorth = Number(_r.wallet) + Number(_r.bot_invest) + Number(_r.bank_dep) + Number(_r.bank_inv);
          if (vNetWorth < 950_000) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("🔐 !verify — Net Worth Required")
              .setDescription(
                "🇬🇧 You need your **Net Worth** to become **1,000,000** or near a million to use this command.\n\n" +
                "🇸🇴 Waxaad u baahan tahay in **hantidaadu** tagto **1,000,000** ama wax u dhaw si aad amarkan u isticmaasho."
              )
              .addFields({ name: "💰 Net Worthkaaga Hadda", value: `**${vNetWorth.toLocaleString()} 🪙**`, inline: true })
              .setColor(0xe74c3c)
              .setFooter({ text: "!verify — Available at 950,000+ net worth · Nasiib" })
            ] });
            return;
          }
        }
        const vMember = message.guild
          ? await message.guild.members.fetch(message.author.id).catch(() => null)
          : null;
        const vDisplayName = vMember?.displayName || vPlayer.username || message.author.username;
        const vEmbed = buildVerifyEmbed(vDisplayName);
        vEmbed.setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 128 }));
        const verifyRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`verify_accept_${message.author.id}`)
            .setLabel("✅ I Accept")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`verify_reject_${message.author.id}`)
            .setLabel("❌ I Reject")
            .setStyle(ButtonStyle.Danger)
        );
        await message.reply({ embeds: [vEmbed], components: [verifyRow] });
      } catch (err) {
        console.error("[VERIFY] !verify error:", err.message);
        await message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
      }
      return;
    }

    if (message.content === "!rich") {
      const richAuthorId = message.author.id;


      const prevRich = activeRichMessages.get(richAuthorId);
      if (prevRich) {
        try { await prevRich.delete(); } catch {}
        activeRichMessages.delete(richAuthorId);
      }


      const richLoadingMsg = await message.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0xF4C430,
          components: [{ type: 10, content: "⏳ Loading richest players...\n💰 Lacagta la tirinayaa...\n👑 almost there..." }],
        }],
      });

      activeRichMessages.set(richAuthorId, richLoadingMsg);

      try {
        const payload = await buildRichPayload(richAuthorId, message.guild);
        await richLoadingMsg.edit(payload);
      } catch (err) {
        console.error("[RICH] Error building rich list:", err);
        try {
          await richLoadingMsg.edit({
            flags: 1 << 15,
            components: [{ type: 17, components: [{ type: 10, content: "❌ Khalad ayaa dhacay. Isku day mar kale." }] }],
          });
        } catch {}
      }
      return;
    }
    if (message.content === "!invest") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, economy waa ku hawlanahay hada."); return; }
      let investPlayer = await storage.getPlayer(message.author.id);
      if (!investPlayer) investPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      const iGS = storage.ensureGameStats(investPlayer.gameStats);
      const inv = iGS.invest || { amount: 0, lastClaim: Date.now(), totalEarned: 0, depositedAt: 0 };
      const iLastVote = await getLastVoteTime(message.author.id);
      const iVoted = hasVoteBoost(iLastVote);
      const INVEST_CLAIM_CD = iVoted ? 6 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
      const INVEST_WITHDRAW_CD = iVoted ? 12 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const pendingProfit = calcInvestProfit(inv);
      const nextClaimMs = inv.amount > 0 ? Math.max(0, INVEST_CLAIM_CD - (Date.now() - (inv.lastClaim || Date.now()))) : 0;
      const nextH = Math.floor(nextClaimMs / 3600000);
      const nextM = Math.floor((nextClaimMs % 3600000) / 60000);
      const nextStr = inv.amount > 0 ? (nextClaimMs <= 0 ? "✅ Hadda oo dhan!" : `${nextH}h ${nextM > 0 ? `${nextM}m` : ""}`.trim()) : "—";
      const rateStr = inv.amount <= 0 ? "—" : inv.amount <= 25000 ? "+2.5% / 6h" : "+2.5%/+1.5% / 6h";
      const withdrawLocked = !!inv.depositedAt && (Date.now() - inv.depositedAt < INVEST_WITHDRAW_CD);
      const wLockRemMs = withdrawLocked ? Math.max(0, INVEST_WITHDRAW_CD - (Date.now() - inv.depositedAt)) : 0;
      const wLockH = Math.floor(wLockRemMs / 3600000);
      const wLockM = Math.floor((wLockRemMs % 3600000) / 60000);
      const wLockStr = wLockH > 0 ? `${wLockH}h ${wLockM > 0 ? `${wLockM}m` : ""}`.trim() : `${wLockM}m`;
      const profitLine = pendingProfit > 0 ? `✅ +${pendingProfit.toLocaleString()} Coins diyaar!` : `⏳ ${nextStr}`;
      const voteNote = iVoted ? "🔥 Vote boost active — Claim 6h · Withdraw 12h" : "🗳️ U codee: !vote — Claim 6h · Withdraw 12h";
      const investEmbed = new EmbedBuilder()
        .setTitle("📈 Nasiib Bot — Maalgashigaaga")
        .setDescription(voteNote + (withdrawLocked ? `\n🔒 Withdraw weli ma diyaar gashana — **${wLockStr}** ka dib` : ""))
        .addFields(
          { name: "💰 Maalgaliyeen",    value: `${(inv.amount || 0).toLocaleString()} Coins`, inline: true },
          { name: "📈 Rate",            value: rateStr,                                        inline: true },
          { name: "🏦 Xad ugu badan",   value: "50,000 Coins",                                 inline: true },
          { name: "⏳ Faa'iidada",      value: profitLine,                                      inline: true },
          { name: "📊 Faa'iido Guud",   value: `${(inv.totalEarned || 0).toLocaleString()} Coins`, inline: true },
        )
        .setColor(0x2ecc71)
        .setFooter({ text: `Claim: ${iVoted ? "6h" : "12h"} · Withdraw: ${iVoted ? "12h" : "24h"} · Xadka ugu badan: 50,000` });
      const investRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`inv_deposit_${message.author.id}`).setLabel("💰 Deposit").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`inv_withdraw_${message.author.id}`).setLabel("💸 Withdraw").setStyle(ButtonStyle.Danger).setDisabled(withdrawLocked || !inv.amount || inv.amount <= 0),
        new ButtonBuilder().setCustomId(`inv_claim_${message.author.id}`).setLabel(pendingProfit > 0 ? `📈 Claim (+${pendingProfit.toLocaleString()})` : "📈 Claim").setStyle(ButtonStyle.Primary).setDisabled(pendingProfit <= 0)
      );
      await message.reply({ embeds: [investEmbed], components: [investRow] });
      return;
    }
    if (message.content === "!wallet" || (message.content.startsWith("!wallet ") && message.mentions.users.size > 0)) {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      const walletTargetUser = message.mentions.users.first() || message.author;
      if (walletTargetUser.id === client.user?.id) {
        const botW = await storage.getBotWallet();
        const botCoins = Number(botW.coins).toLocaleString();
        const botDiamonds = Number(botW.diamonds).toLocaleString();
        await message.reply({ embeds: [new EmbedBuilder().setTitle("\uD83C\uDFE6 Bot Wallet Khasnadda botka").setDescription(`\uD83D\uDCB0 Coins: **${botCoins}**\n\uD83D\uDCAB Diamonds: **${botDiamonds}**\n\n\uD83D\uDD12 *Lacagtan waxay ka timaadaa: ciyaaraha, shop iyo dshop, iyo kuwa khasaaray lamana dhici karo.*`).setColor(0x2ecc71)] });
        return;
      }
      const isOwnWallet = walletTargetUser.id === message.author.id;
      let player = await storage.getPlayer(walletTargetUser.id);
      if (!player) {
        if (isOwnWallet) {
          player = await storage.createPlayer({ discordId: walletTargetUser.id, username: message.member?.displayName || walletTargetUser.username });
        } else {
          await message.reply(`❌ **${walletTargetUser.displayName || walletTargetUser.username}** profile ma haystaan weli.`);
          return;
        }
      }
      const coins = (player.coins || 0).toLocaleString();
      const diamonds = (player.diamonds || 0).toLocaleString();
      const crates = player.legendaryCrates || 0;
      const gStatsWallet = storage.ensureGameStats(player.gameStats);
      const walletTargetMember = message.guild ? await message.guild.members.fetch(walletTargetUser.id).catch(() => null) : null;
      const walletDisplayName = walletTargetMember?.displayName || walletTargetUser.username;
      const eidWalletRes = await pool.query(
        `SELECT (game_stats->>'eidWalletBadge')::boolean AS eid_badge FROM players WHERE discord_id = $1`,
        [walletTargetUser.id]
      ).catch(() => null);
      const hasEidBadge = eidWalletRes?.rows[0]?.eid_badge === true;
      const walletIcon = hasEidBadge ? "<:wallet:1506302078119706755>" : "💼";
      const walletTitle = isOwnWallet ? `${walletIcon} Wallet` : `${walletIcon} ${walletDisplayName}'s Wallet`;

      const walletHasDog = await isDogGuardActive(walletTargetUser.id);


      let walletText = `## ${walletTitle}\n\n• <:Nasiibcoin:1506547787708366929> **Coins:** ${coins}\n• 💎 **Diamonds:** ${diamonds}`;

      if (walletHasDog) {
        walletText += `\n• 🐕 **Guard Dog:** Dog Guardian — Wallet Protected`;
      }
      if (crates > 0) {
        walletText += `\n• 🎁 **Legendary Crates:** ${crates} — \`!fur legendary crate\``;
      }
      const activeItems = [];
      if (gStatsWallet.streakShield) activeItems.push("🛡️ Streak Shield");
      if (gStatsWallet.xpBoostDays > 0) activeItems.push(`⚡ XP Boost (${gStatsWallet.xpBoostDays} maalmood)`);
      if (gStatsWallet.robShieldEnd && Date.now() < gStatsWallet.robShieldEnd) {
        const rsHours = Math.ceil((gStatsWallet.robShieldEnd - Date.now()) / 3600000);
        activeItems.push(`🛡️ Rob Shield (${rsHours}h)`);
      }
      if (activeItems.length > 0) {
        walletText += `\n• ✨ **Active Items:** ${activeItems.join(" · ")}`;
      }
      const eventItemsLine = await buildEventItemsWalletLine(walletTargetUser.id);
      if (eventItemsLine) walletText += eventItemsLine;

      await message.reply({
        flags: 1 << 15,
        components: [
          {
            type: 17,
            accent_color: 0xf1c40f,
            components: [
              { type: 10, content: walletText },
              { type: 14, divider: true, spacing: 1 },
              {
                type: 1,
                components: [makeCloseButton(message.author.id).toJSON()],
              },
            ],
          },
        ],
      });
      return;
    }
    if (message.content === "!coinflip" || message.content === "!cf") {
      await message.reply({ embeds: [usageEmbed("!cf <lacag> <x/m>", "!cf 500 x", "🪙 `x` = Xarash (Tails)  ·  `m` = Madax (Heads)")] });
      return;
    }
    if (message.content.startsWith("!coinflip ") || message.content.startsWith("!cf ")) {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      if (economyProcessing.has(message.author.id + "_cf")) return;
      if (isShuttingDown) { await message.reply("⚠️ Bot ayaa dib loo bilaabayaa — isku day daqiiqad gudahood."); return; }
      let player = await storage.getPlayer(message.author.id);
      if (!player) player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      applyWalletIdleDecay(message.author.id).catch(() => {});
      const args = message.content.split(" ");
      let bet = null, choiceArg = null, wasCorrected = false;
      for (let i = 1; i < args.length; i++) {
        const low = args[i].toLowerCase();
        if (low === "x" || low === "m") { choiceArg = low; }
        else {
          const n = parseInt(args[i].replace(/,/g, ""), 10);
          if (!isNaN(n) && isFinite(n) && bet === null) bet = n;
        }
      }
      if (args[1] && (args[1].toLowerCase() === "x" || args[1].toLowerCase() === "m") && bet !== null) {
        wasCorrected = true;
      }
      if (bet === null) {
        await message.reply({ embeds: [usageEmbed("!cf <lacag> <x/m>", "!cf 500 x", "🪙 `x` = Xarash (Tails)  ·  `m` = Madax (Heads)\n\n💡 Ugu yaraan **10 Coins** baad ku ciyaari kartaa.")] });
        return;
      }
      if (bet < 10) {
        await message.reply({ embeds: [smartEmbed(["❌ **Ugu yaraan 10 Coins baad ku ciyaari kartaa**", "", "📝 **Tusaale:**", "`!cf 10 x`"])] });
        return;
      }
      if (bet > 50000) { await message.reply({ embeds: [smartEmbed(["❌ **Max bet waa 50,000 Coins**", "", "💡 **Isku day:**", "`!cf 50000 x`"])] }); return; }
      if ((player.coins || 0) < bet) { await message.reply({ embeds: [notEnoughEmbed(player.coins || 0, "!cf", 10)] }); return; }
      await withUserLock(message.author.id, async () => {
        const lastFlip = coinflipCooldowns.get(message.author.id) || 0;
        if (Date.now() - lastFlip < 30000) {
          const secs = Math.ceil((30000 - (Date.now() - lastFlip)) / 1000);
          await message.reply(T.coinflip_cooldown(secs)); return;
        }
        if (!choiceArg) {
          await message.reply({ embeds: [smartEmbed([
            "❌ **Dooro dhinaca**",
            "",
            "🪙 `x` = Xarash (Tails)",
            "👑 `m` = Madax (Heads)",
            "",
            "📝 **Tusaale:**",
            `\`!cf ${bet} x\`  ama  \`!cf ${bet} m\``,
          ])] });
          return;
        }
        if (wasCorrected) {
          await message.channel.send({ embeds: [correctedEmbed(`!cf ${bet} ${choiceArg}`)] });
        }
        if (!await checkTreasury(bet, 2)) {
          await message.reply({ embeds: [new EmbedBuilder().setTitle("🪙 Coinflip").setDescription("😅 **Nasiib lacag ma hayo hadda.** Isku day mar kale!").setColor(0xe74c3c)] });
          return;
        }
        const _cfNwBlock = await nwCapBlocked(message.author.id, bet);
        if (_cfNwBlock) { await message.reply({ embeds: [_cfNwBlock] }); return; }
        economyProcessing.add(message.author.id + "_cf");
        coinflipCooldowns.set(message.author.id, Date.now());
        try {
        const coinLandsOnXarash = Math.random() < 0.48;
        const userPickedXarash = choiceArg === "x";
        const cfWon = coinLandsOnXarash === userPickedXarash;
        const cfResult = coinLandsOnXarash ? "Xarash 🪙" : "Madax 👑";
        const userChoice = userPickedXarash ? "Xarash 🪙" : "Madax 👑";
        trackQuest(message.author.id, "play_cf", 1).catch(() => {});
        trackQuest(message.author.id, "spend_coins", bet).catch(() => {});
        if (cfWon) {
          const cfPayout = bet >= 5000 ? Math.floor(bet * 0.95) : bet;
          await storage.spendBotCoins(cfPayout);
          const { netAmount: _cfNet } = await applyIncome(message.author.id, cfPayout);
          const updatedCf = await storage.addCoins(message.author.id, _cfNet);
          logEconomy(message.author.id, "coinflip", cfPayout, "gain");
          const newBal = updatedCf.coins;
          await message.reply({ embeds: [new EmbedBuilder()
            .setTitle("🪙  Coin Flip")
            .setDescription(`✨  **GUUL!**\n🔄  Coinka: **${cfResult}**\n🎯  Adiga: **${userChoice}**`)
            .addFields(
              { name: "💰 Abaal",         value: `**+${cfPayout.toLocaleString()}** Coins`, inline: true },
              { name: "Wallet cusub",  value: `**${newBal.toLocaleString()}** Coins`,    inline: true },
            )
            .setColor(0xf1c40f)
            .setFooter({ text: "Nasiib Bot  ·  !cf <lacag> <x/m>" })] });
          trackQuest(message.author.id, "win_games", 1).catch(() => {});
          trackQuest(message.author.id, "earn_coins", cfPayout).catch(() => {});
          checkNetWorthMilestone(message.author.id, client).catch(() => {});
        } else {
          const updatedCf = await storage.spendCoins(message.author.id, bet);


          if (!updatedCf) {
            const freshCf = await storage.getPlayer(message.author.id);
            await message.reply({ embeds: [notEnoughEmbed(freshCf?.coins || 0, "!cf", 10)] });
            return;
          }
          await storage.addBotCoins(bet);
          logEconomy(message.author.id, "coinflip", bet, "loss");
          const newBal = updatedCf.coins;
          await message.reply({ embeds: [new EmbedBuilder()
            .setTitle("🪙  Coin Flip")
            .setDescription(`💸  **KHASAARO!**\n🔄  Coinka: **${cfResult}**\n🎯  Adiga: **${userChoice}**`)
            .addFields(
              { name: "❌ Khasaaro",       value: `**-${bet.toLocaleString()}** Coins`,      inline: true },
              { name: "🏦 Wallet cusub",  value: `**${newBal.toLocaleString()}** Coins`,     inline: true },
            )
            .setColor(0xe74c3c)
            .setFooter({ text: "Nasiib Bot  ·  !cf <lacag> <x/m>" })] });
          trackBehavior(message.author.id, "cf_loss");
          await maybeSendTip(message.author.id, message.channel);
        }
        } finally {
          economyProcessing.delete(message.author.id + "_cf");
        }
      });
      return;
    }
    if (message.content === "!slots") {
      await message.reply({ embeds: [usageEmbed("!slots <lacag>", "!slots 10", "🎰 Ugu yaraan **10 Coins** · Max **50,000 Coins**")] });
      return;
    }
    if (message.content.startsWith("!slots ")) {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      if (economyProcessing.has(message.author.id + "_slots")) return;
      if (isShuttingDown) { await message.reply("⚠️ Botka restart ayaa lagu sameenayaa, isku day daqiiqado yar kadib."); return; }
      let player = await storage.getPlayer(message.author.id);
      if (!player) player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      applyWalletIdleDecay(message.author.id).catch(() => {});
      const args = message.content.split(" ");
      const rawBet = (args[1] || "").replace(/,/g, "");
      const bet = parseInt(rawBet, 10);
      if (isNaN(bet) || !isFinite(bet)) {
        await message.reply({ embeds: [usageEmbed("!slots <lacag>", "!slots 10", "🎰 Ugu yaraan **10 Coins** baad ku ciyaari kartaa.")] });
        return;
      }
      if (bet < 10) {
        await message.reply({ embeds: [smartEmbed(["❌ **Ugu yaraan 10 Coins baad ku ciyaari kartaa**", "", "📝 **Tusaale:**", "`!slots 10`"])] });
        return;
      }
      if (bet > 50000) { await message.reply({ embeds: [smartEmbed(["❌ **Max bet waa 50,000 Coins**", "", "💡 **Isku day:**", "`!slots 50000`"])] }); return; }
      if ((player.coins || 0) < bet) { await message.reply({ embeds: [notEnoughEmbed(player.coins || 0, "!slots", 10)] }); return; }
      let _slotsApproved = false;
      let _slotsFastMode = false;
      await withUserLock(message.author.id, async () => {
        const lastSpin = slotsCooldowns.get(message.author.id) || 0;
        if (Date.now() - lastSpin < 15000) {
          const secs = Math.ceil((15000 - (Date.now() - lastSpin)) / 1000);
          await message.reply(T.slots_cooldown(secs)); return;
        }
        if (!await checkTreasury(bet, 10)) {
          await message.reply({ embeds: [new EmbedBuilder().setTitle("🎰 Slots").setDescription("😅 **Nasiib lacag ma hayo hadda.** Isku day mar dambe!").setColor(0xe74c3c)] });
          return;
        }
        const _slotsNwBlock = await nwCapBlocked(message.author.id, bet);
        if (_slotsNwBlock) { await message.reply({ embeds: [_slotsNwBlock] }); return; }
        economyProcessing.add(message.author.id + "_slots");
        slotsCooldowns.set(message.author.id, Date.now());
        _slotsFastMode = isChannelBusy(message.channel.id);
        _slotsApproved = true;
      });
      if (!_slotsApproved) return;
      try {
        bumpActiveGames(message.channel.id);
        const LOSS_POOL = ["\uD83C\uDF4B", "\uD83C\uDF4A", "\uD83C\uDF4D", "\uD83D\uDD14", "\uD83C\uDF22", "\uD83C\uDF5C"];
        function genLossReels() {
          let r1, r2, r3;
          do {
            r1 = LOSS_POOL[Math.floor(Math.random() * LOSS_POOL.length)];
            r2 = LOSS_POOL[Math.floor(Math.random() * LOSS_POOL.length)];
            r3 = LOSS_POOL[Math.floor(Math.random() * LOSS_POOL.length)];
          } while (r1 === r2 && r2 === r3);
          return [r1, r2, r3];
        }
        const roll = Math.random();
        let reels, multiplier, winProfit, outcome;
        if (roll < 0.76) {
          reels = genLossReels(); multiplier = 0; outcome = "lose";
        } else if (roll < 0.96) {
          reels = ["\uD83C\uDF52", "\uD83C\uDF52", "\uD83C\uDF52"]; multiplier = 2; winProfit = bet * 1; outcome = "cherry";
        } else if (roll < 0.99) {
          reels = ["\u2B50", "\u2B50", "\u2B50"]; multiplier = 5; winProfit = bet * 4; outcome = "star";
        } else {
          reels = ["\uD83D\uDC8E", "\uD83D\uDC8E", "\uD83D\uDC8E"]; multiplier = 10; winProfit = bet * 9; outcome = "jackpot";
        }
        const spinEmbed = new EmbedBuilder()
          .setTitle("\uD83C\uDFB0 Slots")
          .setDescription(`\u2753  \u2753  \u2753\n\n\u23F3 *Reels spinning...*`)
          .addFields(
            { name: "\uD83D\uDCB0 Bet", value: `${bet.toLocaleString()} Coins`, inline: true },
            { name: "\uD83D\uDCB0 Balance", value: `${(player.coins || 0).toLocaleString()} Coins`, inline: true },
          )
          .setColor(0x9b59b6);
        let spinMsg = null;
        if (!_slotsFastMode) {
          spinMsg = await message.reply({ embeds: [spinEmbed] });
          await new Promise(r => setTimeout(r, 1800));
        }
        let embed;
        if (outcome === "lose") {
          const updatedSlots = await storage.spendCoins(message.author.id, bet);


          if (!updatedSlots) {
            const freshSlots = await storage.getPlayer(message.author.id);
            const drainedEmbed = new EmbedBuilder()
              .setTitle("🎰 Slots")
              .setDescription(`⚠️ Lacagta kuguma filna , waxaa dhacday in lacagtaada isbeddesho intaad ciyaaraysey.\n💰 Balance: **${(freshSlots?.coins || 0).toLocaleString()} Coins**`)
              .setColor(0xe74c3c);
            const sendDrained = spinMsg
              ? spinMsg.edit({ embeds: [drainedEmbed] })
              : message.reply({ embeds: [drainedEmbed] });
            await sendDrained.catch(async () => {
              await message.channel.send({ embeds: [notEnoughEmbed(freshSlots?.coins || 0, "!slots", 10)] }).catch(() => {});
            });
            return;
          }
          await storage.addBotCoins(bet);
          logEconomy(message.author.id, "slots", bet, "loss");
          const newBal = updatedSlots.coins;

          let insRefund = 0;
          try {
            const insP = await storage.getPlayer(message.author.id);
            const insGS = storage.ensureGameStats(insP?.gameStats);
            if (insGS.slotInsurance) {
              insRefund = Math.floor(bet * 0.30);
              insGS.slotInsurance = false;
              await db.update(players).set({ gameStats: insGS }).where(eq(players.discordId, message.author.id));
              if (insRefund > 0) {
                await storage.addCoins(message.author.id, insRefund);
                await storage.spendBotCoins(insRefund).catch(() => {});
                logEconomy(message.author.id, "slot-insurance-refund", insRefund, "gain");
              }
              await pool.query(
                `DELETE FROM heist_inventory WHERE user_id=$1 AND item_id='slotinsurance' AND quantity <= 0`,
                [message.author.id]
              ).catch(() => {});
            }
          } catch (insErr) { console.error("[SLOT-INS] refund error:", insErr); }

          const finalBal = insRefund > 0 ? newBal + insRefund : newBal;
          const netLoss = insRefund > 0 ? bet - insRefund : bet;
          embed = new EmbedBuilder()
            .setTitle(insRefund > 0 ? "🎰 Slots — 🛡️ Insurance!" : "🎰 Slots")
            .setDescription(
              `${reels[0]}  ${reels[1]}  ${reels[2]}\n\n` +
              (insRefund > 0
                ? `😤 *Waad guuldaraysatay ,laakiin 🛡️ Insurancegaagu wuu shaqeeyay!*\n🛡️ **30%** bet kaaga ayaa lagugu soo celiyay.`
                : `😤 *Waad guuldaraysatay — isku day mar kale?*`)
            )
            .addFields(
              { name: "💸 Khasaaro",  value: `**-${bet.toLocaleString()} Coins**`,                                    inline: true },
              ...(insRefund > 0 ? [
                { name: "🛡️ Insurance Refund", value: `**+${insRefund.toLocaleString()} Coins** (30%)`,               inline: true },
                { name: "📉 Net Khasaaro",      value: `**-${netLoss.toLocaleString()} Coins**`,                      inline: true },
              ] : []),
              { name: "💰 Balance",   value: `${finalBal.toLocaleString()} Coins`,                                    inline: true },
            )
            .setColor(insRefund > 0 ? 0xe67e22 : 0xe74c3c);
          trackQuest(message.author.id, "spend_coins", bet).catch(() => {});
        } else if (outcome === "cherry") {
          await storage.spendBotCoins(winProfit);
          const { netAmount: _sNet_ch } = await applyIncome(message.author.id, winProfit);
          const updatedSlots = await storage.addCoins(message.author.id, _sNet_ch);
          logEconomy(message.author.id, "slots", winProfit, "gain");
          checkNetWorthMilestone(message.author.id, client).catch(() => {});
          const newBal = updatedSlots.coins;
          embed = new EmbedBuilder()
            .setTitle("\uD83C\uDF52 Slots — Win!")
            .setDescription(`\uD83C\uDF52  \uD83C\uDF52  \uD83C\uDF52\n\n\uD83C\uDF89 *Waad ku guulaysatay!*`)
            .addFields(
              { name: "\u2728 Won", value: `**+${winProfit.toLocaleString()} Coins** (2\u00D7)`, inline: true },
              { name: "\uD83D\uDCB0 Balance", value: `${newBal.toLocaleString()} Coins`, inline: true },
            )
            .setColor(0x2ecc71);
          trackQuest(message.author.id, "win_games", 1).catch(() => {});
          trackQuest(message.author.id, "earn_coins", winProfit).catch(() => {});
          trackQuest(message.author.id, "spend_coins", bet).catch(() => {});
        } else if (outcome === "star") {
          await storage.spendBotCoins(winProfit);
          const { netAmount: _sNet_st } = await applyIncome(message.author.id, winProfit);
          const updatedSlots = await storage.addCoins(message.author.id, _sNet_st);
          logEconomy(message.author.id, "slots", winProfit, "gain");
          checkNetWorthMilestone(message.author.id, client).catch(() => {});
          const newBal = updatedSlots.coins;
          embed = new EmbedBuilder()
            .setTitle("\u2B50 Slots — Big Win!!")
            .setDescription(`\u2B50  \u2B50  \u2B50\n\n\uD83D\uDCAB *Nasiib weyn • adiga iyo nasiibkaaga!*`)
            .addFields(
              { name: "\uD83D\uDD25 Won", value: `**+${winProfit.toLocaleString()} Coins** (5\u00D7)`, inline: true },
              { name: "\uD83D\uDCB0 Balance", value: `${newBal.toLocaleString()} Coins`, inline: true },
            )
            .setColor(0xe67e22);
          trackQuest(message.author.id, "win_games", 1).catch(() => {});
          trackQuest(message.author.id, "earn_coins", winProfit).catch(() => {});
          trackQuest(message.author.id, "spend_coins", bet).catch(() => {});
        } else {
          await storage.spendBotCoins(winProfit);
          const { netAmount: _sNet_jp } = await applyIncome(message.author.id, winProfit);
          const updatedSlots = await storage.addCoins(message.author.id, _sNet_jp);
          logEconomy(message.author.id, "slots", winProfit, "gain");
          checkNetWorthMilestone(message.author.id, client).catch(() => {});
          const newBal = updatedSlots.coins;
          embed = new EmbedBuilder()
            .setTitle("\uD83D\uDC8E JACKPOT!! \uD83D\uDC8E")
            .setDescription(`\u2728  \uD83D\uDC8E  \uD83D\uDC8E  \uD83D\uDC8E  \u2728\n\n\uD83D\uDD25 *NO WAYYY!! Adiga iyo nasiibkaaga!!*`)
            .addFields(
              { name: "\uD83D\uDC8E Won", value: `**+${winProfit.toLocaleString()} Coins** (10\u00D7)`, inline: true },
              { name: "\uD83D\uDCB0 Balance", value: `${newBal.toLocaleString()} Coins`, inline: true },
            )
            .setColor(0xf1c40f);
          trackQuest(message.author.id, "win_games", 1).catch(() => {});
          trackQuest(message.author.id, "earn_coins", winProfit).catch(() => {});
          trackQuest(message.author.id, "spend_coins", bet).catch(() => {});
        }
        trackQuest(message.author.id, "play_slots", 1).catch(() => {});
        const finalSend = spinMsg
          ? spinMsg.edit({ embeds: [embed] })
          : message.reply({ embeds: [embed] });
        await finalSend.catch(async () => { await message.channel.send({ embeds: [embed] }).catch(() => {}); });
        } finally {
          economyProcessing.delete(message.author.id + "_slots");
          dropActiveGames(message.channel.id);
        }
      return;
    }
    if (message.content === "!shop") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      let player = await storage.getPlayer(message.author.id);
      if (!player) player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      const uid = message.author.id;

      const prevShop = activeShopPanels.get(uid);
      if (prevShop) { try { await prevShop.delete(); } catch {} activeShopPanels.delete(uid); }
      const shopMx = await getShopPriceMultiplier().catch(() => 1.0);
      const shopMsg = await message.reply({
        embeds: [buildShopMainEmbed(player.coins || 0, player.diamonds || 0, shopMx)],
        components: buildShopMainRows(uid),
      });
      activeShopPanels.set(uid, shopMsg);
      setTimeout(() => { if (activeShopPanels.get(uid) === shopMsg) activeShopPanels.delete(uid); }, 10 * 60 * 1000);
      return;
    }
    if (message.content === "!give") {
      await message.reply({ embeds: [usageEmbed("!give @user <lacag>", "!give @Mudug 10", "💸 Ugu yaraan **10 Coins** · Max **100,000 Coins**")] });
      return;
    }
    if (message.content.startsWith("!give ")) {

      const _grRawArgs = message.content.trim().split(/\s+/);
      const _grRoleIdArg = _grRawArgs.find(a => /^\d{17,20}$/.test(a));
      if (message.mentions.roles.size > 0 || _grRoleIdArg) {
        if (message.author.id !== OWNER_ID) return;
        if (!message.guild) return;
        if (!dbOnline) { await safeSend(message.channel, "⚠️ Database offline, try again shortly."); return; }
        const _grCooldownMs = 30_000;
        const _grLast = giveRoleCooldown.get("lock") || 0;
        if (Date.now() - _grLast < _grCooldownMs) {
          await message.reply({ embeds: [new EmbedBuilder().setDescription(`\u23F3 Sug **${Math.ceil((_grCooldownMs - (Date.now() - _grLast)) / 1000)}** ilbiriqsi ka hor intaadan mar kale isticmaalin \`!give\` role.`).setColor(0xE67E22)] });
          return;
        }
        const _grRole = message.mentions.roles.first()
          || (_grRoleIdArg ? (message.guild.roles.cache.get(_grRoleIdArg) || await message.guild.roles.fetch(_grRoleIdArg).catch(() => null)) : null);
        if (!_grRole) {
          await message.reply({ embeds: [new EmbedBuilder().setDescription("❌ **Role lama helin.**\n\n📌 Qaabka: `!give <amount> @role` ama `!give <roleID> <amount>`").setColor(0xE74C3C)] });
          return;
        }
        const _grArgs = message.content.trim().split(/\s+/);
        let _grAmount = null;
        for (const a of _grArgs) {
          const n = parseInt(a.replace(/,/g, ""), 10);
          if (!isNaN(n) && isFinite(n)) { _grAmount = n; break; }
        }
        if (!_grAmount || _grAmount < 1) {
          await message.reply({ embeds: [new EmbedBuilder().setDescription("❌ **Amount sax ah geli.**\n\n📌 Qaabka: `!give <amount> @role`\n📝 Tusaale: `!give 500 @nasiibplayers`").setColor(0xE74C3C)] });
          return;
        }
        if (_grAmount > 50_000) {
          await message.reply({ embeds: [new EmbedBuilder().setDescription("❌ **Ugu badan 50,000 coins** ayaa hal qof loogu bixin karaa.").setColor(0xE74C3C)] });
          return;
        }
        giveRoleCooldown.set("lock", Date.now());
        const _grStatusMsg = await message.channel.send({ embeds: [new EmbedBuilder().setTitle("\u{1F504} Processing...").setDescription(`Soo qabanaya xubnaha **${_grRole.name}** role-ka...`).setColor(0x3498DB)] });

        try { await message.guild.members.fetch(); } catch {}
        const _grMembers = _grRole.members.filter(m => !m.user.bot);
        const _grCount = _grMembers.size;
        if (_grCount === 0) {
          await _grStatusMsg.edit({ embeds: [new EmbedBuilder().setDescription(`❌ **${_grRole.name}** role-ka xubno kuma jiraan ama bot uun ayaa ku jira.`).setColor(0xE74C3C)] });
          return;
        }
        const _grTotalCost = _grAmount * _grCount;
        const _grWallet = await pool.query(`SELECT coins FROM bot_wallet WHERE id = 1`);
        const _grTreasury = Number(_grWallet.rows[0]?.coins || 0);
        if (_grTreasury < _grTotalCost) {
          await _grStatusMsg.edit({ embeds: [new EmbedBuilder()
            .setTitle("\u274C Treasury-ga ma filna")
            .addFields(
              { name: "\u{1F4B0} Loo baahan yahay", value: `**${_grTotalCost.toLocaleString()}** coins`, inline: true },
              { name: "\u{1F3E6} Hadda jira", value: `**${_grTreasury.toLocaleString()}** coins`, inline: true }
            )
            .setColor(0xE74C3C)
          ] });
          return;
        }

        let _grSuccess = 0;
        let _grFail = 0;
        for (const [, member] of _grMembers) {
          try {
            let _grPlayer = await storage.getPlayer(member.user.id);
            if (!_grPlayer) {
              _grPlayer = await storage.createPlayer({ discordId: member.user.id, username: member.displayName || member.user.username });
            }
            const _grNwBlock = await nwCapBlocked(member.user.id, _grAmount);
            if (!_grNwBlock) {
              await storage.addCoins(member.user.id, _grAmount);
              _grSuccess++;
            }
          } catch (err) {
            console.error(`[GIVE ROLE] Failed for ${member.user.id}:`, err.message);
            _grFail++;
          }
        }

        const _grTotalPaid = _grSuccess * _grAmount;
        if (_grTotalPaid > 0) {
          await pool.query(`UPDATE bot_wallet SET coins = GREATEST(0, coins - $1) WHERE id = 1`, [_grTotalPaid]);
          console.log(`[GIVE ROLE] -${_grTotalPaid} treasury → ${_grRole.name} (${_grSuccess} members)`);
        }
        const _grNewTreasury = Number((await pool.query(`SELECT coins FROM bot_wallet WHERE id = 1`)).rows[0]?.coins || 0);
        await _grStatusMsg.edit({ embeds: [new EmbedBuilder()
          .setTitle("\u{1F381} Role Giveaway Completed")
          .addFields(
            { name: "\u{1F465} Role", value: `<@&${_grRole.id}>`, inline: true },
            { name: "\u{1F4B0} Qofkiiba wuxuu helay", value: `**${_grAmount.toLocaleString()}** coins`, inline: true },
            { name: "\u{1F4CA} Inta qof ee qaatay", value: `**${_grSuccess.toLocaleString()}**${_grFail > 0 ? ` (${_grFail} failed)` : ""}`, inline: true },
            { name: "\u{1F4B8} Total la qaybiyey", value: `**${_grTotalPaid.toLocaleString()}** coins`, inline: true },
            { name: "\u{1F3E6} Halka ay ka timid", value: "Walletka Nasiib Bot", inline: true },
            { name: "\u{1F4B3} Treasury remaining", value: `**${_grNewTreasury.toLocaleString()}** coins`, inline: true }
          )
          .setColor(0x2ECC71)
          .setTimestamp()
        ] });
        return;
      }

      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      if (pendingGives.has(message.author.id)) { await message.reply("⚠️ Waxaad haysataa wareejin sugaysa xaqiijin. Dhamee taas marka hore."); return; }
      if (economyProcessing.has(message.author.id + "_give")) return;
      const giveArgsParsed = parseUserAndAmount(message.content.split(" ").slice(1), message);
      const giveTarget = giveArgsParsed.user;
      const giveAmount = giveArgsParsed.amount;
      if (!giveTarget) { await message.reply({ embeds: [usageEmbed("!give @user <lacag>", "!give @Mudug 10", "💡 Waa inaad mention-garayso qofka aad rabto inaad siiso.")] }); return; }
      if (giveTarget.id === message.author.id) { await message.reply(T.give_self); return; }
      if (giveTarget.bot) { await message.reply("❌ Botka coins ma siin kartid."); return; }
      if (!giveAmount || isNaN(giveAmount) || giveAmount < 10) {
        await message.reply({ embeds: [smartEmbed(["❌ **Lacag sax ah geli**", "", "📌 Ugu yaraan **10 Coins**", "", "📝 **Tusaale:**", `\`!give @${giveTarget.username} 10\``])] });
        return;
      }
      if (giveAmount > 100000) { await message.reply({ embeds: [smartEmbed(["❌ **Max waa 100,000 Coins**", "", "💡 **Isku day:**", `\`!give @${giveTarget.username} 100000\``])] }); return; }
      if (giveArgsParsed.corrected) {
        await message.channel.send({ embeds: [correctedEmbed(`!give @${giveTarget.username} ${giveAmount}`)] });
      }
      let giver = await storage.getPlayer(message.author.id);
      if (!giver) giver = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      if ((giver.coins || 0) < giveAmount) { await message.reply({ embeds: [notEnoughEmbed(giver.coins || 0, `!give @${giveTarget.username}`, 10)] }); return; }
      const giveId = `${message.author.id}_${Date.now()}`;
      const senderName = message.member?.displayName || message.author.username;
      const receiverMember = message.guild ? await message.guild.members.fetch(giveTarget.id).catch(() => null) : null;
      const receiverName = receiverMember ? (receiverMember.displayName || giveTarget.username) : giveTarget.username;
      const giveRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`give_confirm_${giveId}`).setLabel("✅ 0").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`give_cancel_${giveId}`).setLabel("❌").setStyle(ButtonStyle.Danger)
      );
      const giveMsg = await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`\uD83D\uDCB8 Give Confirmation | ${senderName} \u2192 ${receiverName}`)
          .setDescription(`<@${message.author.id}> waxay rabaan inay kuu diraan **${giveAmount.toLocaleString()} Coins**!\n\nLabada qof waa inay riixaan \u2705 si loo xaqiijiyo.`)
          .setColor(0xf1c40f)],
        components: [giveRow]
      });
      economyProcessing.add(message.author.id + "_give");
      const giveTimeout = setTimeout(async () => {
        if (!pendingGives.has(message.author.id)) return;
        pendingGives.delete(message.author.id);
        economyProcessing.delete(message.author.id + "_give");
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`give_confirm_${giveId}`).setLabel("✅ 0").setStyle(ButtonStyle.Success).setDisabled(true),
          new ButtonBuilder().setCustomId(`give_cancel_${giveId}`).setLabel("❌").setStyle(ButtonStyle.Danger).setDisabled(true)
        );
        await giveMsg.edit({ embeds: [new EmbedBuilder().setTitle(`\u274C Give Cancelled | ${senderName} \u2192 ${receiverName}`).setDescription("\u23F1\uFE0F Waqtigii wuu dhacay. Wareejinta waa la joojiyay.").setColor(15158332)], components: [disabledRow] }).catch(() => {});
      }, 30000);
      pendingGives.set(message.author.id, { giveId, senderId: message.author.id, receiverId: giveTarget.id, amount: giveAmount, senderName, receiverName, confirmedBy: new Set(), msg: giveMsg, timeout: giveTimeout });
      return;
    }
    if (message.content === "!rob") {
      await message.reply({ embeds: [usageEmbed("!rob @user", "!rob @Rashy", "🦹 Isku day inaad qof kale xadid coinskiisa!")] });
      return;
    }
    if (message.content.startsWith("!rob ")) {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      if (economyProcessing.has(message.author.id + "_rob")) return;
      if (isShuttingDown) { await message.reply("⚠️ Bot ayaa dib loo bilaabayaa — isku day daqiiqad gudahood."); return; }
      const robTarget = message.mentions.users.first();
      if (!robTarget) { await message.reply({ embeds: [usageEmbed("!rob @user", "!rob @Rashy", "💡 Waa inaad mention-garayso qofka aad rabto inaad xadid.")] }); return; }
      if (robTarget.id === message.author.id) { await message.reply(T.rob_self); return; }
      if (robTarget.bot) { await message.reply("❌ Botka ma dhici kartid."); return; }
      const robCooldownMs = 30 * 60 * 1000;
      let robber = await storage.getPlayer(message.author.id);
      if (!robber) robber = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      applyWalletIdleDecay(message.author.id).catch(() => {});
      const robGSCd = storage.ensureGameStats(robber.gameStats);
      const lastRob = Math.max(robCooldowns.get(message.author.id) || 0, robGSCd.lastRob || 0);
      if (Date.now() - lastRob < robCooldownMs) {
        const minsLeft = Math.ceil((robCooldownMs - (Date.now() - lastRob)) / 60000);
        await message.reply(T.rob_cooldown(minsLeft)); return;
      }
      let victim = await storage.getPlayer(robTarget.id);
      if (!victim) victim = await storage.createPlayer({ discordId: robTarget.id, username: robTarget.username });
      if ((victim.coins || 0) < 100) { await message.reply(T.rob_poor_target); return; }
      const victimGStatsRob = storage.ensureGameStats(victim.gameStats);
      if (victimGStatsRob.robShieldEnd && Date.now() < victimGStatsRob.robShieldEnd) {
        await message.reply(T.rob_shielded(robTarget.displayName || robTarget.username));
        return;
      }


      if (await hasActiveTempShield(robTarget.id)) {
        const ts = await getActiveTempShield(robTarget.id);
        const remainingTxt = ts ? formatShieldRemaining(Math.max(0, ts.expiresAt - Date.now())) : "muddo";
        await message.reply(
          `${TEMP_SHIELD_EMOJI} **${robTarget.displayName || robTarget.username}** waxay haystaan protection ku meel gaar ah (${remainingTxt} ayaa hadhay). Isku day mar dambe.`
        );
        return;
      }


      if (await isDogGuardActive(robTarget.id)) {
        const robberCoins = robber.coins || 0;
        const dogBite = Math.floor(robberCoins * 0.10);
        if (dogBite > 0) {
          await storage.spendCoins(message.author.id, dogBite);
          await storage.addBotCoins(dogBite);
        }
        const robberAfter = Math.max(0, robberCoins - dogBite);
        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("🐕 Ouf Ouf!")
              .setDescription(
                [
                  "━━━━━━━━━━━━━━━━━━━━━━━━",
                  "",
                  "🐕 **Ayga waardiyaha ah ayaa ku qabtay!**",
                  `Waxa uu kaa qaaday **${dogBite.toLocaleString()} 🪙** (10% walletkaaga).`,
                  "",
                  "💸 The stolen amount has been sent to the treasury.",
                  "",
                  "─────────────────────────",
                  `💼 Balance:  **${robberAfter.toLocaleString()} 🪙**`,
                  "─────────────────────────",
                ].join("\n")
              )
              .setColor(0xe67e22),
          ],
        }).catch(() => {});
        return;
      }
      const robNow = Date.now();
      const robGSPersist = storage.ensureGameStats(robber.gameStats);

      let robStartTs = robNow;
      if (robGSPersist.liinPendingReductionMs && robGSPersist.liinPendingReductionMs > 0) {
        robStartTs = robNow - robGSPersist.liinPendingReductionMs;
        robGSPersist.liinPendingReductionMs = 0;
      }
      robCooldowns.set(message.author.id, robStartTs);
      robGSPersist.lastRob = robStartTs;
      await db.update(players).set({ gameStats: robGSPersist }).where(eq(players.discordId, message.author.id)).catch(() => {});
      economyProcessing.add(message.author.id + "_rob");
      bumpActiveGames(message.channel.id);
      try {
        const robberName = message.member?.displayName || message.author.username;
        const victimMember = message.guild ? await message.guild.members.fetch(robTarget.id).catch(() => null) : null;
        const victimName = victimMember ? (victimMember.displayName || robTarget.username) : robTarget.username;


        const _robNwBlock = await nwCapBlocked(message.author.id, 1);
        if (_robNwBlock) { await message.reply({ embeds: [_robNwBlock] }); return; }
        let robSuccess = false;
        let stolen = 0, fine = 0, robberBal, victimBal;
        await withDualUserLock(message.author.id, robTarget.id, async () => {

          const freshVictim = await storage.getPlayer(robTarget.id);
          const freshVictimCoins = (freshVictim?.coins || 0);
          if (freshVictimCoins < 100) {


            robberBal = robber.coins || 0;
            return;
          }
          robSuccess = Math.random() < 0.4;
          if (robSuccess) {
            const pct = 0.15 + Math.random() * 0.15;
            stolen = Math.floor(freshVictimCoins * pct);

            const victimRes = await storage.spendCoins(robTarget.id, stolen);
            if (!victimRes) {


              stolen = 0;
              robSuccess = false;
              robberBal = robber.coins || 0;
              return;
            }
            const { netAmount: _robNet } = await applyIncome(message.author.id, stolen);
            const updatedRobber = await storage.addCoins(message.author.id, _robNet);
            logEconomy(message.author.id, `rob←${robTarget.id}`, stolen, "gain");
              checkNetWorthMilestone(message.author.id, client).catch(() => {});
            logEconomy(robTarget.id, `robbed-by-${message.author.id}`, stolen, "loss");
            robberBal = updatedRobber.coins;
          } else {
            fine = Math.min(Math.floor((robber.coins || 0) * 0.2), robber.coins || 0);
            if (fine > 0) {
              const upd = await storage.spendCoins(message.author.id, fine);
              if (upd) {
                await storage.addBotCoins(fine);
                logEconomy(message.author.id, "rob-fine", fine, "loss");
                robberBal = upd.coins;
              } else {
                fine = 0;
                robberBal = robber.coins || 0;
              }
            } else {
              robberBal = robber.coins || 0;
            }
          }
        });
        if (robSuccess) {
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `<:DhacGuulaystay:1508000302597410836> Waxaa si toos ah <@${robTarget.id}> oga dhacday **${stolen.toLocaleString()} \uD83E\uDE99**  balance gaaga cusub **${robberBal.toLocaleString()} \uD83E\uDE99**`
                )
                .setColor(0x27ae60),
            ],
          }).catch(() => {});
          trackBehavior(robTarget.id, "rob_received");
        } else {
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `<:DhacFashilmay:1508000305453727855> Waxaad ku guuldaraystay in aad dhacdo <@${robTarget.id}>\nYou got fined **${fine.toLocaleString()} \uD83E\uDE99** balance gaaga cusub waa **${robberBal.toLocaleString()} \uD83E\uDE99**`
                )
                .setColor(0xe74c3c),
            ],
          }).catch(() => {});
        }
        trackQuest(message.author.id, "rob_attempt", 1).catch(() => {});
      } finally {
        economyProcessing.delete(message.author.id + "_rob");
        dropActiveGames(message.channel.id);
      }
      return;
    }
    if (message.content === "!dshop") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      let dshopPlayer = await storage.getPlayer(message.author.id);
      if (!dshopPlayer) dshopPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      const dsUid = message.author.id;
      const prevDShop = activeDShopPanels.get(dsUid);
      if (prevDShop) { try { await prevDShop.delete(); } catch {} activeDShopPanels.delete(dsUid); }
      const dshopMsg = await message.reply({
        embeds: [buildDShopMainEmbed(dshopPlayer.diamonds || 0)],
        components: buildDShopMainRows(dsUid),
      });
      activeDShopPanels.set(dsUid, dshopMsg);
      setTimeout(() => { if (activeDShopPanels.get(dsUid) === dshopMsg) activeDShopPanels.delete(dsUid); }, 10 * 60 * 1000);
      return;
    }
    if (message.content === "!myitems") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, system waa offline."); return; }
      try {
        const invRes = await pool.query(
          `SELECT item_id, quantity FROM heist_inventory WHERE user_id=$1 ORDER BY acquired_at DESC`,
          [message.author.id]
        );
        const rows = invRes.rows;
        const displayName = message.member?.displayName || message.author.username;
        if (!rows.length) {
          const emptyEmbed = new EmbedBuilder()
            .setTitle("🎒 My Items")
            .setDescription(`**${displayName}** — inventory waa faaruq.\n\nTag \`!shop\` oo dooro **🧪 Boosts** si aad u iibsato **🍋 Liin Dhanaan**\nAma dooro **🗡️ Heist** si aad heist items u iibsato.`)
            .setColor(0x95a5a6)
            .setFooter({ text: "Boost items: !use liin · !use xpabsorb · !use slotinsurance  ·  Heist: used in !heist" });
          return message.reply({ embeds: [emptyEmbed], components: [new ActionRowBuilder().addComponents(makeCloseButton(message.author.id))] });
        }
        const embed = new EmbedBuilder()
          .setTitle(`🎒 My Items — ${displayName}`)
          .setColor(0xe67e22)
          .setFooter({ text: `${rows.length} item type${rows.length > 1 ? "s" : ""} · Boost: !use liin/xpabsorb/slotinsurance  ·  Heist: used in !heist` });
        for (const row of rows) {
          if (row.item_id === "liin") {
            embed.addFields({
              name: `🍋 Liin Dhanaan  ×${row.quantity}  🧪 Boost`,
              value: `📊 Hoos u dhig rob cooldown **10%** mar kasta (stacks!)\n💡 Isticmaal: \`!use liin\` ama \`!use liin 3\`\n*Liin dhanaan asal ahaan caan ku ah in lagu cuno cuntooyinka sidoo kale loo isticmaalo in ay soo celiso energyga qofka marka uu daalo.*`,
            });
            continue;
          }
          const hi = HEIST_ITEMS[row.item_id];
          if (!hi) continue;
          embed.addFields({
            name: `${hi.label}  ×${row.quantity}  ${hi.rarity}`,
            value: `📊 ${hi.stat}\n🎯 Phase: **${hi.phase}**\n*${hi.flavor}*`,
          });
        }
        return message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(makeCloseButton(message.author.id))] });
      } catch (e) {
        console.error("[MYITEMS] error:", e);
        return message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
      }
    }
    if (message.content.startsWith("!use ")) {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, system waa offline."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      const useArgs = message.content.split(" ").slice(1);
      const useItem = useArgs[0]?.toLowerCase();
      if (!useItem) {
        await message.reply({ embeds: [new EmbedBuilder()
          .setTitle("❌ Waa inaad sheegta item-ka")
          .setDescription("**Qaab:** `!use <item>`\n**Tusaale:**\n• `!use liin`\n• `!use xpabsorb`\n• `!use slotinsurance`\n\nIsticmaal `!myitems` si aad u aragto inventorygaaga.")
          .setColor(0xe74c3c)] });
        return;
      }
      if (useItem === "liin") {
        if (economyProcessing.has(message.author.id + "_useliin")) return;
        economyProcessing.add(message.author.id + "_useliin");
        try {

          const rawAmt = useArgs[1];
          const useAmount = rawAmt !== undefined ? parseInt(rawAmt, 10) : 1;
          const amtInvalid = rawAmt !== undefined &&
            (!Number.isInteger(useAmount) || useAmount <= 0 || isNaN(useAmount) || String(parseInt(rawAmt, 10)) !== rawAmt);
          if (amtInvalid) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("❌ Tiro Khaldan")
              .setDescription("**Qaab:** `!use liin [tiro]`\n**Tusaale:** `!use liin` ama `!use liin 3`\n\nTiradu waa inay tiro buuxda oo ka weyn 0 tahay.")
              .setColor(0xe74c3c)] });
            return;
          }


          const checkRes = await pool.query(
            `SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id='liin'`,
            [message.author.id]
          );
          const owned = Number(checkRes.rows[0]?.quantity || 0);
          if (owned <= 0) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("❌ Ma Haysatid Liin Dhanaan")
              .setDescription("Kuma haysatid **🍋 Liin Dhanaan** inventory-gaaga.\n\nTag `!shop` → **🧪 Boosts** si aad u iibsato (100 Coins cadaan ah).")
              .setColor(0xe74c3c)] });
            return;
          }
          if (useAmount > owned) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("❌ Tiro Aad u Badan")
              .setDescription(`Waxaad haysataa **${owned} 🍋 Liin** oo keliya.\n\nKuma isticmaali kartid **${useAmount}** mar isla markiiba.\n💡 Isku day: \`!use liin ${owned}\``)
              .setColor(0xe74c3c)] });
            return;
          }


          const decrRes = await pool.query(
            `UPDATE heist_inventory SET quantity = quantity - $2
             WHERE user_id=$1 AND item_id='liin' AND quantity >= $2
             RETURNING quantity`,
            [message.author.id, useAmount]
          );
          if (!decrRes.rows[0]) {

            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("❌ Ma Haysatid Liin Dhanaan")
              .setDescription("Liin Dhanaan kuguma filna inventorygaaga. Isku day mar kale.")
              .setColor(0xe74c3c)] });
            return;
          }
          const newQty = Number(decrRes.rows[0].quantity);

          if (newQty <= 0) {
            await pool.query(`DELETE FROM heist_inventory WHERE user_id=$1 AND item_id='liin' AND quantity <= 0`, [message.author.id]).catch(() => {});
          }

          const ROB_CD_MS    = 30 * 60 * 1000;
          const LIIN_MIN_CD  = 60 * 1000;

          let liinPlayer = await storage.getPlayer(message.author.id);
          if (!liinPlayer) liinPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
          const liinGS = storage.ensureGameStats(liinPlayer.gameStats);
          const lastRobRaw = Math.max(robCooldowns.get(message.author.id) || 0, liinGS.lastRob || 0);
          const now = Date.now();
          const elapsed = lastRobRaw ? now - lastRobRaw : ROB_CD_MS;
          const remaining = Math.max(0, ROB_CD_MS - elapsed);


          let newRemaining = remaining;
          for (let i = 0; i < useAmount; i++) {
            newRemaining = Math.floor(newRemaining * 0.9);
          }
          newRemaining = Math.max(newRemaining, remaining > 0 ? LIIN_MIN_CD : 0);

          const savedMs   = remaining - newRemaining;
          const savedMins = Math.floor(savedMs / 60000);
          const savedSecs = Math.floor((savedMs % 60000) / 1000);

          console.log(`[LIIN] User ${message.author.id} used ${useAmount}`);
          console.log(`[LIIN] Old CD remaining: ${remaining}ms`);
          console.log(`[LIIN] New CD remaining: ${newRemaining}ms`);

          if (remaining > 0) {

            const newLastRob = lastRobRaw - (remaining - newRemaining);
            robCooldowns.set(message.author.id, newLastRob);
            liinGS.lastRob = newLastRob;
            await db.update(players).set({ gameStats: liinGS }).where(eq(players.discordId, message.author.id)).catch(() => {});
          } else {


            let futureRemaining = ROB_CD_MS;
            for (let i = 0; i < useAmount; i++) {
              futureRemaining = Math.floor(futureRemaining * 0.9);
            }
            futureRemaining = Math.max(futureRemaining, LIIN_MIN_CD);
            const futureReductionMs = ROB_CD_MS - futureRemaining;
            const prev = liinGS.liinPendingReductionMs || 0;
            liinGS.liinPendingReductionMs = Math.min(prev + futureReductionMs, ROB_CD_MS - LIIN_MIN_CD);
            await db.update(players).set({ gameStats: liinGS }).where(eq(players.discordId, message.author.id)).catch(() => {});
          }


          let resultDesc;
          const amtLabel = useAmount === 1
            ? `hambalyo waxaad cabtay liin dhanaan 🍋`
            : `hambalyo waxaad isticmaashay **${useAmount}** liin dhanaan ah🍋`;

          if (remaining > 0) {
            const newRemMins = Math.floor(newRemaining / 60000);
            const newRemSecs = Math.floor((newRemaining % 60000) / 1000);
            resultDesc = [
              `✅ **${amtLabel}**`,
              ``,
              useAmount === 1
                ? `waxaa 10% hoos loo dhigay cooldown kaaga dhicista`
                : `cooldown kaaga si tartiib ah ayaa loo dhimay (10% mar kasta)`,
              ``,
              `⏳ **Rob Cooldown-gaaga:**`,
              `• inta la dhimay: **${savedMins}m ${savedSecs}s**`,
              `• inta hadhay: **${newRemMins}m ${newRemSecs}s**`,
              ``,
              `📦 Inventory: **${newQty}** liin ah ayaa hadhay`,
            ].join("\n");
          } else {

            let futureRemForDisplay = ROB_CD_MS;
            for (let i = 0; i < useAmount; i++) futureRemForDisplay = Math.floor(futureRemForDisplay * 0.9);
            futureRemForDisplay = Math.max(futureRemForDisplay, LIIN_MIN_CD);
            const futureMins = Math.floor(futureRemForDisplay / 60000);
            const futureSecs = Math.floor((futureRemForDisplay % 60000) / 1000);
            resultDesc = [
              `✅ **${amtLabel}**`,
              ``,
              useAmount === 1
                ? `waxaa 10% hoos loo dhigay cooldown kaaga dhicista`
                : `cooldown kaaga si tartiib ah ayaa loo dhimay (10% mar kasta)`,
              ``,
              `⚡ Rob-gaaga waa diyaar yahay.`,
              `📌 Cooldownkaaga xiga wuxuu noqon doonaa: **${futureMins}m ${futureSecs}s** (halkii **30m** ahaan jiray)`,
              ``,
              `📦 Inventory: **${newQty}** liin ah ayaa hadhay`,
            ].join("\n");
          }

          const useEmbed = new EmbedBuilder()
            .setTitle("🍋 Liin Dhanaan — Isticmaalay")
            .setDescription(resultDesc)
            .setColor(0xf1c40f);

          await message.author.send({ embeds: [useEmbed] }).catch(async () => {
            await message.reply({ embeds: [useEmbed] });
          });
          try { await message.delete(); } catch {}
        } catch (e) {
          console.error("[USE LIIN] error:", e);
          await message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
        } finally {
          economyProcessing.delete(message.author.id + "_useliin");
        }
        return;
      }

      if (useItem === "xpabsorb") {
        if (economyProcessing.has(message.author.id + "_usexpa")) return;
        economyProcessing.add(message.author.id + "_usexpa");
        try {
          const xpaRes = await pool.query(
            `SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id='xpabsorb'`,
            [message.author.id]
          );
          const xpaOwned = Number(xpaRes.rows[0]?.quantity || 0);
          if (xpaOwned <= 0) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("❌ Ma Haysatid XP Absorb")
              .setDescription("Kuma haysatid **🧲 XP Absorb** inventory gaaga.\n\nTag `!shop` → **🧪 Boosts** si aad u iibsato.")
              .setColor(0xe74c3c)] });
            return;
          }
          let xpaPlayer = await storage.getPlayer(message.author.id);
          if (!xpaPlayer) xpaPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
          const xpaGS = storage.ensureGameStats(xpaPlayer.gameStats);
          if (xpaGS.xpAbsorb) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("⚠️ XP Absorb ayaa daaran")
              .setDescription("**🧲 XP Absorb** horay ayuu active u yahay  ciyaar marka hore!\n\nKuma dari kartid mid cusub.")
              .setColor(0xf39c12)] });
            return;
          }
          const xpaDecr = await pool.query(
            `UPDATE heist_inventory SET quantity = quantity - 1
             WHERE user_id=$1 AND item_id='xpabsorb' AND quantity >= 1
             RETURNING quantity`,
            [message.author.id]
          );
          if (!xpaDecr.rows[0]) {
            await message.reply({ embeds: [new EmbedBuilder().setTitle("❌ Ma Haysatid XP Absorb").setDescription("Isku day mar kale or just buy.").setColor(0xe74c3c)] });
            return;
          }
          const xpaNewQty = Number(xpaDecr.rows[0].quantity);
          if (xpaNewQty <= 0) await pool.query(`DELETE FROM heist_inventory WHERE user_id=$1 AND item_id='xpabsorb' AND quantity <= 0`, [message.author.id]).catch(() => {});
          xpaGS.xpAbsorb = true;
          await db.update(players).set({ gameStats: xpaGS }).where(eq(players.discordId, message.author.id));
          await message.reply({ embeds: [new EmbedBuilder()
            .setTitle("🧲 XP Absorb Activated!")
            .setDescription(
              `✅ **XP Absorb active waaye!**\n\n` +
              `🎮 **Ciyaarta xigta** (FTI, Miino, Sheeko, Tower)\n` +
              `XP-ga aad heshid **×2 (laba jibaar)** ayaa lagu dari doonaa.\n\n` +
              `⚠️ **Hal ciyaar** kaliya ayay shaqaynaysaa  ka dib Wuu is xiraya gado mid kale.\n` +
              `📦 Inventory: **${xpaNewQty}** XP Absorb ah ayaa ku hartay`
            )
            .setColor(0x9b59b6)
            .setFooter({ text: "Nasiib Boosts • Xoogaa caqli ah + nasiib = guul" })] });
        } catch (e) {
          console.error("[USE XPABSORB] error:", e);
          await message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
        } finally {
          economyProcessing.delete(message.author.id + "_usexpa");
        }
        return;
      }

      if (useItem === "slotinsurance") {
        if (economyProcessing.has(message.author.id + "_usesi")) return;
        economyProcessing.add(message.author.id + "_usesi");
        try {
          const siRes = await pool.query(
            `SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id='slotinsurance'`,
            [message.author.id]
          );
          const siOwned = Number(siRes.rows[0]?.quantity || 0);
          if (siOwned <= 0) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("❌ Ma Haysatid Slot Insurance")
              .setDescription("Kuma haysatid **🎰 Slot Insurance** inventorygaaga.\n\nTag `!shop` → **🧪 Boosts** si aad u iibsato.")
              .setColor(0xe74c3c)] });
            return;
          }
          let siPlayer = await storage.getPlayer(message.author.id);
          if (!siPlayer) siPlayer = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
          const siGS = storage.ensureGameStats(siPlayer.gameStats);
          if (siGS.slotInsurance) {
            await message.reply({ embeds: [new EmbedBuilder()
              .setTitle("⚠️ Slot Insurance Wuu Socday active ayuu ahaa")
              .setDescription("**🎰 Slot Insurance** horaa active ah ciyaar `!slots` marka hore!\n\nKuma darsamin mid cusub.")
              .setColor(0xf39c12)] });
            return;
          }
          const siDecr = await pool.query(
            `UPDATE heist_inventory SET quantity = quantity - 1
             WHERE user_id=$1 AND item_id='slotinsurance' AND quantity >= 1
             RETURNING quantity`,
            [message.author.id]
          );
          if (!siDecr.rows[0]) {
            await message.reply({ embeds: [new EmbedBuilder().setTitle("❌ Ma Haysatid Slot Insurance").setDescription("Isku day mar kale or just buy.").setColor(0xe74c3c)] });
            return;
          }
          const siNewQty = Number(siDecr.rows[0].quantity);
          if (siNewQty <= 0) await pool.query(`DELETE FROM heist_inventory WHERE user_id=$1 AND item_id='slotinsurance' AND quantity <= 0`, [message.author.id]).catch(() => {});
          siGS.slotInsurance = true;
          await db.update(players).set({ gameStats: siGS }).where(eq(players.discordId, message.author.id));
          await message.reply({ embeds: [new EmbedBuilder()
            .setTitle("🎰 Slot Insurance Activated!")
            .setDescription(
              `📜 Nasiibku mar walba ma fiicna… laakiin maanta saas maaha!\n\n` +
              `🛡️ Haddii spinkaaga xiga ee !slots ku guuldareystato,\n` +
              `waxaad dib u heli doontaa **30%** lacagta aad gelisay.\n\n` +
              `🛡️ Haddii aad khasaarto, 30% lacagta waa lagu soo celinayaa.\n` +
              `⚠️ Waxay shaqaynaysaa hal spin oo kaliya.\n` +
              `📦 Inventory: **${siNewQty}** Slot Insurance ah ku hadhay`
            )
            .setColor(0xe67e22)
            .setFooter({ text: "Nasiib Boosts • Xoogaa caqli ah + nasiib = guul" })] });
        } catch (e) {
          console.error("[USE SLOTINS] error:", e);
          await message.reply("❌ Khalad ayaa dhacay. Isku day mar kale.");
        } finally {
          economyProcessing.delete(message.author.id + "_usesi");
        }
        return;
      }
      await message.reply({ embeds: [new EmbedBuilder().setTitle("❌ Item aan la garanayn").setDescription(`Item **\`${useItem}\`** lama heli.\n\nIsticmaal \`!myitems\` si aad u aragto inventory-gaaga.`).setColor(0xe74c3c)] });
      return;
    }
    if (message.content === "!duel" || message.content.startsWith("!duel ")) {
      const _duelNow = Date.now();
      const _duelLast = duelDisabledCooldown.get(message.author.id) || 0;
      if (_duelNow - _duelLast < 60_000) {
        try { await message.delete(); } catch {}
        return;
      }
      duelDisabledCooldown.set(message.author.id, _duelNow);
      try {
        const _duelNotice = await message.channel.send(`<@${message.author.id}> \u2694\uFE0F Gameka **duel** si ku meel gaar ah ayaa loo joojiyey... coming soon with more features later.`);
        setTimeout(() => { _duelNotice.delete().catch(() => {}); }, 8000);
      } catch {}
      try { await message.delete(); } catch {}
      return;
    }
    if (message.content === "!duel") {
      await message.reply({ embeds: [usageEmbed("!duel @user <lacag>", "!duel @MC 1000", "⚔️ Ugu yaraan **100 Coins** · Max **100,000 Coins**")] });
      return;
    }
    if (message.content.startsWith("!duel ")) {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, qayb walba oo economy iyo XP la xiriirta farsamo ayaa ku socota. Mahadsanidiin."); return; }
      if (await checkRestricted(message.author.id, message)) return;
      const duelArgs = message.content.split(" ").slice(1);
      const duelParsed = parseUserAndAmount(duelArgs, message);
      const duelTarget = duelParsed.user;
      const duelAmount = duelParsed.amount;
      if (!duelTarget && duelAmount === null) {
        await message.reply({ embeds: [usageEmbed("!duel @user <lacag>", "!duel @MC 1000", "⚔️ Ugu yaraan **100 Coins** · Max **100,000 Coins**")] });
        return;
      }
      if (!duelTarget) { await message.reply({ embeds: [usageEmbed("!duel @user <lacag>", "!duel @MC 1000", "💡 Waa inaad mention-garayso qofka aad rabto inaad la dagaalanto.")] }); return; }
      if (duelTarget.id === message.author.id) { await message.reply(T.duel_self); return; }
      if (duelTarget.bot) { await message.reply("❌ Botka lama dagaali kartid."); return; }
      if (duelAmount === null) {
        await message.reply({ embeds: [usageEmbed("!duel @user <lacag>", `!duel @${duelTarget.username} 1000`, "⚔️ Ugu yaraan **100 Coins** · Max **100,000 Coins**")] });
        return;
      }
      if (duelAmount < 100) {
        await message.reply({ embeds: [smartEmbed(["❌ **Ugu yaraan 100 Coins baad ku ciyaari kartaa**", "", "📝 **Tusaale:**", `\`!duel @${duelTarget.username} 1000\``])] });
        return;
      }
      if (duelAmount > 100000) { await message.reply({ embeds: [smartEmbed(["❌ **Max duel waa 100,000 Coins**", "", "💡 **Isku day:**", `\`!duel @${duelTarget.username} 100000\``])] }); return; }
      if (duelParsed.corrected) {
        await message.channel.send({ embeds: [correctedEmbed(`!duel @${duelTarget.username} ${duelAmount}`)] });
      }
      let duelChallenger = await storage.getPlayer(message.author.id);
      if (!duelChallenger) duelChallenger = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      let duelVictim = await storage.getPlayer(duelTarget.id);
      if (!duelVictim) duelVictim = await storage.createPlayer({ discordId: duelTarget.id, username: duelTarget.username });
      if ((duelChallenger.coins || 0) < duelAmount) { await message.reply({ embeds: [notEnoughEmbed(duelChallenger.coins || 0, `!duel @${duelTarget.username}`, 100)] }); return; }
      if ((duelVictim.coins || 0) < duelAmount) {
        await message.reply({ embeds: [smartEmbed([`❌ **${duelTarget.displayName || duelTarget.username}** may haystaan **${duelAmount.toLocaleString()} Coins**`, "", "💡 Lacag yar ku isku day."])] });
        return;
      }
      const duelKey = `${message.author.id}_${duelTarget.id}`;
      if (activeDuels.has(duelKey)) { await message.reply(T.duel_already); return; }
      const duelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`duel_accept_${message.author.id}_${duelTarget.id}_${duelAmount}`).setLabel("⚔️ Aqbal").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`duel_decline_${message.author.id}_${duelTarget.id}_${duelAmount}`).setLabel("❌ Diid").setStyle(ButtonStyle.Danger)
      );
      const challengerName = message.member?.displayName || message.author.username;
      const targetMemberD = message.guild ? await message.guild.members.fetch(duelTarget.id).catch(() => null) : null;
      const targetNameD = targetMemberD ? (targetMemberD.displayName || duelTarget.username) : duelTarget.username;
      const duelChallengeEmbed = new EmbedBuilder()
        .setTitle("\u2694\uFE0F Duel Challenge!")
        .setDescription(`\uD83D\uDDE1\uFE0F **${challengerName}** ayaa balansadeen \u2694\uFE0F **${targetNameD}**\n\n\uD83D\uDD25 *Qofka badiya ayaa lacagta dhan qaadanaya!*\n\n<@${duelTarget.id}> — **ma aqbashay?**`)
        .addFields(
          { name: "\uD83D\uDCB0 Lacag la dhigtay", value: `${duelAmount.toLocaleString()} Coins`, inline: true },
          { name: "\uD83C\uDFC6 Total Prize", value: `${(duelAmount * 2).toLocaleString()} Coins`, inline: true },
        )
        .setColor(0xe67e22);
      const duelMsg = await message.channel.send({ content: `<@${duelTarget.id}>`, embeds: [duelChallengeEmbed], components: [duelRow] });
      const duelTimeout = setTimeout(async () => {
        activeDuels.delete(duelKey);
        try { await duelMsg.edit({ embeds: [new EmbedBuilder().setTitle("⚔️ Coin Duel — Waa Dhammaatay").setDescription(T.duel_expired).setColor(8421504)], components: [] }); } catch (_) {}
      }, 60000);
      activeDuels.set(duelKey, { challengerId: message.author.id, targetId: duelTarget.id, amount: duelAmount, msgId: duelMsg.id, timeout: duelTimeout });
      return;
    }
    if (message.content.toLowerCase().startsWith("!fur legendary crate")) {
      let player = await storage.getPlayer(message.author.id);
      if (!player || (player.legendaryCrates || 0) < 1) {
        await message.reply({ embeds: [new EmbedBuilder().setTitle("🎁 Legendary Crate").setDescription("Ma haysatid Legendary Crate.\n\nGaar **streak 30-maalmood** ah si aad u hesho!").setColor(15158332)] });
        return;
      }

      await storage.openLegendaryCrate(message.author.id);


      const roll = Math.random() * 100;
      let rewardType;
      if (roll < 40) rewardType = "coins";
      else if (roll < 80) rewardType = "diamonds";
      else rewardType = "shield";

      let rewardDesc = "";

      if (rewardType === "coins") {
        const _crateNwBlock = await nwCapBlocked(message.author.id, 5000);
        if (!_crateNwBlock) {
          await storage.addCoins(message.author.id, 5000);
          storage.spendBotCoins(5000).catch(() => {});
        }
        rewardDesc = "Waxaad heshay 5000 Coins, thanks for playing Nasiib.";

      } else if (rewardType === "diamonds") {
        await storage.addDiamonds(message.author.id, 50);
        rewardDesc = "Waxaad heshay 50 Diamonds, thanks for playing Nasiib.";

      } else {

        const gStats = storage.ensureGameStats(player.gameStats);
        const shieldActive = gStats.robShieldEnd && Date.now() < gStats.robShieldEnd;

        if (shieldActive) {

          await storage.addDiamonds(message.author.id, 35);
          rewardDesc = "Waxaad heshay Rob Shield, maadama Rob Shield horey active kuugu ahaa, waxaa lagugu badalay 35 Diamonds. Thanks for playing Nasiib.";
        } else {

          gStats.robShieldEnd = Date.now() + 12 * 3600 * 1000;
          await pool.query(
            `UPDATE players SET game_stats = $1 WHERE discord_id = $2`,
            [JSON.stringify(gStats), message.author.id]
          );
          rewardDesc = "Waxaad heshay 12h Rob Shield, thanks for playing Nasiib.";
        }
      }

      await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("Congratulations 🎊")
          .setDescription(rewardDesc)
          .setColor(0xFFD700)]
      });
      return;
    }

    if (message.content === "!limited") {
      if (!dbOnline) { await message.reply("⚠️ Fadlan noo dulqaado, system waa offline."); return; }
      const limitRes = await pool.query("SELECT * FROM limited_shop WHERE id = 1");
      const limitRow = limitRes.rows[0];
      const now = Date.now();
      let expiresAt = Number(limitRow?.expires_at || 0);
      if (expiresAt === 0 || expiresAt < now) {
        expiresAt = now + 72 * 60 * 60 * 1000;
        await pool.query("UPDATE limited_shop SET expires_at = $1 WHERE id = 1", [expiresAt]);
      }
      const msLeft = expiresAt - now;
      const hoursLeft = Math.floor(msLeft / 3600000);
      const minsLeft  = Math.floor((msLeft % 3600000) / 60000);
      const timeStr   = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;
      const limitPlayer = await storage.getPlayer(message.author.id);
      const ownedTitles = Array.isArray(limitPlayer?.ownedTitles) ? limitPlayer.ownedTitles : [];
      const alreadyOwned = ownedTitles.includes("observer_title");
      const limitEmbed = new EmbedBuilder()
        .setTitle("🏪 Limited Shop")
        .setColor(0xf1c40f)
        .addFields(
          { name: "👁️ Observer Title", value: "Marka FTI game bilaabmo, waxaad heli doontaa **DM qarsoodi ah**: hal qof oo aan imposter ahayn.", inline: false },
          { name: "💰 Price", value: "6,000 🪙 coins", inline: true },
          { name: "⏳ Expires In", value: timeStr, inline: true },
          { name: "📦 Status", value: alreadyOwned ? "✅ Leedahay" : "🔓 Available", inline: true },
          { name: "ℹ️ Ability", value: "FTI game kasta oo aad ku jirto ayaad helaysaa **1 hint** qarsoodi ah bilaa kharash.", inline: false }
        )
        .setFooter({ text: "Limited items waxay is-beddelaan 72 saacadood kaddib" });
      const limitRow2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`limited_buy_observer_${message.author.id}`)
          .setLabel(alreadyOwned ? "✅ Hore u leedahay" : "🛒 Gado — 6,000 🪙")
          .setStyle(alreadyOwned ? ButtonStyle.Secondary : ButtonStyle.Success)
          .setDisabled(alreadyOwned),
        new ButtonBuilder()
          .setCustomId(`close_panel_${message.author.id}`)
          .setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      );
      await message.reply({ embeds: [limitEmbed], components: [limitRow2] });
      return;
    }

    if (message.content === "!prestige") {
      if (await checkRestricted(message.author.id, message)) return;
      let player = await storage.getPlayer(message.author.id);
      if (!player) {
        await message.reply(T.prestige_not_played);
        return;
      }
      if (player.level < 50) {
        const needed = 50 - player.level;
        await message.reply({ embeds: [new EmbedBuilder().setTitle(T.prestige_info_title).setDescription(T.prestige_info_desc(player.level, needed)).setColor(10181046)] });
        return;
      }
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirm_prestige").setLabel(T.prestige_btn).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cancel_prestige").setLabel(T.prestige_cancel_btn).setStyle(ButtonStyle.Danger)
      );
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.prestige_ready_title).setDescription(T.prestige_ready_desc(player.level, player.prestige)).setColor(16766720)], components: [confirmRow] });
      return;
    }
    if (message.content === "!caawin") {
      const level = await getPermissionLevel(message.author.id);
      let desc2 = T.help_games + "\n\n" + T.help_profile + "\n\n" + T.help_rewards + "\n\n" + T.help_economy + "\n\n" + T.help_other;
      if (level === "OWNER") {
        desc2 += "\n\n" + T.help_owner;
      } else if (level === "ADMIN") {
        desc2 += "\n\n" + T.help_admin;
      } else if (level === "MOD") {
        desc2 += "\n\n" + T.help_mod;
      }
      desc2 += "\n\n💡 **Faahfaahin dheeraad ah:**\n`!caawin <command>` — Tusaale: `!caawin bank`";
      await message.reply({
        embeds: [new EmbedBuilder().setTitle(T.help_title).setDescription(desc2).setColor(3447003)],
        components: [new ActionRowBuilder().addComponents(makeCloseButton(message.author.id))],
      });
      return;
    }
    if (message.content === "!miino" || message.content.startsWith("!miino ")) {
      const restriction = await storage.isPlayerRestricted(message.author.id);
      if (restriction.banned || restriction.muted || restriction.onHold) {
        await message.reply(T.cant_play_now);
        return;
      }
      if (isPlayerBusyMiino(message.author.id)) {
        await message.reply(T.miino_already_playing);
        return;
      }
      let player = await storage.getPlayer(message.author.id);
      if (!player) {
        player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      }
      const mentionedUser = message.mentions.users.first();
      if (mentionedUser) {
        if (mentionedUser.id === message.author.id) {
          await message.reply("\u26A0\uFE0F Naftaada ma casuumi kartid!");
          return;
        }
        if (mentionedUser.bot) {
          await message.reply("\u26A0\uFE0F Botka ma ciyaari karo!");
          return;
        }
        if (isPlayerBusyMiino(mentionedUser.id)) {
          await message.reply(T.miino_v2_already_playing);
          return;
        }
        const challengerName = getDisplayName(message.member, message.author.username);
        const inviteRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`mv2_accept_${message.author.id}_${mentionedUser.id}`).setLabel(T.miino_v2_accept_btn).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`mv2_decline_${message.author.id}_${mentionedUser.id}`).setLabel(T.miino_v2_decline_btn).setStyle(ButtonStyle.Danger)
        );
        const inviteMsg = await message.reply({ content: T.miino_v2_invite(challengerName, mentionedUser.id), components: [inviteRow] });
        const mv2InviteKey = `${message.author.id}_${mentionedUser.id}`;
        miinoV2Invites.set(mv2InviteKey, { inviteMsgId: inviteMsg.id, channelId: message.channel.id, inviterId: message.author.id, inviteeId: mentionedUser.id });
        setTimeout(() => {

          if (!miinoV2Invites.has(mv2InviteKey)) return;
          miinoV2Invites.delete(mv2InviteKey);
          inviteMsg.edit({ content: "\u23F0 Casuumadda waqtigeeda wuu dhacay.", components: [] }).catch(() => {});
        }, 60000);
        return;
      }

      const miinoGrid = Array(20).fill(null);
      const minePositions = new Set();
      while (minePositions.size < 4) minePositions.add(Math.floor(Math.random() * 20));
      for (let i = 0; i < 20; i++) {
        if (minePositions.has(i)) {
          miinoGrid[i] = "mine";
        } else {
          miinoGrid[i] = Math.floor(Math.random() * 8) + 3;
        }
      }
      const miinoGame = {
        playerId: message.author.id,
        grid: miinoGrid,
        revealed: Array(20).fill(false),
        accumulatedXP: 0,
        tilesRevealed: 0,
        inactivityTimer: null
      };
      activeMiinoGames.set(message.author.id, miinoGame);
      const miinoEmbed = buildMiinoEmbed(miinoGame);
      const miinoButtons = buildMiinoButtons(miinoGame);
      await message.reply({ embeds: [miinoEmbed], components: [...miinoButtons] });
      resetMiinoTimer(message.author.id, message.channel);
      return;
    }
    if (message.content === "!sheeko") {
      const channelId = message.channel.id;
      for (const [gId, g] of activeShekoGames) {
        if (g.channelId === channelId && g.phase !== "finished") {
          await message.reply(T.sheeko_channel_active);
          return;
        }
      }
      const restriction = await storage.isPlayerRestricted(message.author.id);
      if (restriction.banned || restriction.muted || restriction.onHold) {
        await message.reply(T.cant_play_now);
        return;
      }
      let player = await storage.getPlayer(message.author.id);
      if (!player) {
        player = await storage.createPlayer({ discordId: message.author.id, username: message.member?.displayName || message.author.username });
      }
      const gameId = `sheeko_${channelId}_${Date.now()}`;
      const displayName = getDisplayName(message.member, message.author.username);
      const game = {
        channelId,
        players: [{ id: message.author.id, username: displayName, score: 0 }],
        currentStoryteller: 0,
        statements: [],
        lieIndex: -1,
        votes: /* @__PURE__ */ new Map(),
        phase: "lobby",
        host: message.author.id,
        inactivityTimer: null,
        messageId: null,
        fooledAllCounts: /* @__PURE__ */ new Map(),
        isProcessing: false
      };
      activeShekoGames.set(gameId, game);
      const embed = new EmbedBuilder().setTitle(T.sheeko_lobby_title).addFields(
        { name: `\u{1F465} Players (1/8)`, value: `1\uFE0F\u20E3 ${displayName}`, inline: false },
        { name: "\u2139\uFE0F Info", value: T.sheeko_lobby_info, inline: false }
      ).setColor(15277667);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sheeko_join_${gameId}`).setLabel(T.sheeko_join_btn).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sheeko_leave_${gameId}`).setLabel(T.sheeko_leave_btn).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`sheeko_start_${gameId}`).setLabel(T.sheeko_start_btn).setStyle(ButtonStyle.Primary)
      );
      const msg = await message.reply({ embeds: [embed], components: [row] });
      game.messageId = msg.id;
      return;
    }
    if (message.content === "!update") {
      if (message.author.id !== OWNER_ID || !isAdminSessionActive(message.author.id)) {
        await message.reply("\u274C Owner keliya.");
        return;
      }
      const embed = new EmbedBuilder().setTitle("\u{1F4E2} UPDATE ANNOUNCEMENT \u{1F4E2}").setDescription(`\u{1F31F} **Nasiib Bot Update - MAXAA KUSOO KORDHAY?** \u{1F31F}

\u{1F3AD} **Taraq**
Amarkan cusub wuxuu kuu ogolaanayaa in dad badan ay ku biiraan âboxâ, kadibna botku si random ah iskugu qaso, oo u soo saaro ka qaybgalayaasha.
Marka aad ku biirto, waxaad si toos ah u helaysaa role-ka **Taraq**.

\u{1F6E1}\uFE0F ð¡ï¸ **!wallet**
Amarka **!wallet** wuxuu kuu furayaa khasnadaada, adiga oo arki kara:
- ð° Coins-kaaga
- ð Diamonds-kaaga

Waxaadna ka heli kartaa:
!daily iyo Level up.

ð Diamonds hadda waxaad u isticmaali kartaa gameka **Guess Number (Qabso Tiro)**, adiga oo awood u leh inaad beddesho lambarka aad dooratay ka hor inta ciyaartu bilaaban.
â¡ï¸ Qiimaha: **5 Diamonds**

â Haddii aadan haysan diamonds kugu filan, botku wuu kuu sheegi doonaa.


\u{1F3C6} **!drop disable #channel**
Amarkan cusub wuxuu kaa caawinayaa in channel gaar ah, aad ka xirtid in botka uu wax ku soo diro sida hadiyada, Adiga oo !drop enable #channel ugu furaya channel kale.
â ï¸ Fiiro gaar ah: Waxaa jiri kara xaalado yar oo wali botku ku soo diro channel la xiray,  arrintan waa la hagaajin doonaa maalmaha soo socda.


\u{1F381} ð **!fur legendry crate**
kadib marka aad gaartid 30days streak botka waxa uu ku siin doona hadiyad legendry ah, oo ka koobnaan doonaan hadiyado kle. nasiib wacan.

\u{1F6E0}\uFE0F **CAAWINAAD / BUGS**
Fadlan isticmaal \`!cilad\` kadib oo soo gudbi cilada aad aragtid ama errors. waad ku mahadsan tahay isticmaalka nasiib bot.`).setColor(16766720).setFooter({ text: "Nasiib Bot Administration", iconURL: client.user?.displayAvatarURL() }).setTimestamp();
      await message.channel.send({ embeds: [embed] });
      return;
    }
    if (message.content === "!grab") {
      const drop = activeDrops.get(message.channel.id);
      if (!drop) {
        await message.reply(T.drop_nothing);
        return;
      }
      clearTimeout(drop.timer);
      activeDrops.delete(message.channel.id);
      let player = await storage.getPlayer(message.author.id);
      if (!player) player = await storage.createPlayer({ discordId: message.author.id, username: message.author.username });
      const oldLevel = player.level;
      const updated = await storage.updatePlayerXP(message.author.id, drop.xp);
      const name = getDisplayName(message.member, message.author.username);
      await message.channel.send({ embeds: [new EmbedBuilder().setTitle("\u{1F381}").setDescription(T.drop_claimed(name, drop.xp)).setColor(65416)] });
      if (updated && updated.level > oldLevel && message.guild) {
        await announceLevelUp(message.author.id, oldLevel, updated.level, message.guild, message.channel);
      }
      if (updated) await checkLevel60(message.author.id, message.channel);
      return;
    }
    if (message.content.startsWith("!drop disable") || message.content.startsWith("!drop enable")) {
      if (!message.guild) return;
      const isAdmin = message.member?.permissions.has("Administrator") || message.guild.ownerId === message.author.id;
      if (!isAdmin) {
        await message.reply({ embeds: [new EmbedBuilder().setDescription("\u{1F512} Admin ama Owner kaliya ayaa amarkan isticmaali kara.").setColor(15158332)] });
        return;
      }
      const mentionedChannel = message.mentions.channels.first();
      if (!mentionedChannel) {
        await message.reply({ embeds: [new EmbedBuilder().setDescription("\u26A0\uFE0F Fadlan ku shaqee channel-ka, tusaale: `!drop disable #channel`").setColor(15844367)] });
        return;
      }
      const chId = mentionedChannel.id;
      const isDisableCmd = message.content.startsWith("!drop disable");
      if (isDisableCmd) {
        if (chatDropDisabled.has(chId)) {
          await message.reply({ embeds: [new EmbedBuilder().setDescription(`\u26A0\uFE0F <#${chId}> horey ayuu u joojinmay. **Already disabled.**`).setColor(15844367)] });
        } else {
          chatDropDisabled.add(chId);
          await safeQuery(
            `INSERT INTO drop_disabled_channels (channel_id, guild_id) VALUES ($1, $2) ON CONFLICT (channel_id) DO NOTHING`,
            [chId, message.guild.id]
          );
          await message.reply({ embeds: [new EmbedBuilder().setTitle("\u{1F6AB} Drop-yada Waa La Joojiyay").setDescription(`Drops \u{1F381} channel <#${chId}> gudihiisa mar dambe laguma soo diri doono.`).setColor(15158332)] });
        }
      } else {
        if (!chatDropDisabled.has(chId)) {
          await message.reply({ embeds: [new EmbedBuilder().setDescription(`\u26A0\uFE0F <#${chId}> horey ayuu u shaqaynayay. **Already enabled.**`).setColor(15844367)] });
        } else {
          chatDropDisabled.delete(chId);
          await safeQuery(`DELETE FROM drop_disabled_channels WHERE channel_id = $1`, [chId]);
          await message.reply({ embeds: [new EmbedBuilder().setTitle("\u2705 Drop-yada Waa La Shaqaaleeyay").setDescription(`Drops \u{1F381} hadda waxay ku soo dhici karaan channel <#${chId}>.`).setColor(3066993)] });
        }
      }
      return;
    }
    if (message.content === "!invites" || message.content.startsWith("!invites ")) {
      if (!message.guild) return;
      const target = message.mentions.users.first() || message.author;
      const guildInvites = inviteCache.get(message.guild.id) || /* @__PURE__ */ new Map();
      const count = guildInvites.get(target.id) || 0;
      const name = target.id === message.author.id ? message.author.username : target.username;
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.invites_title(name)).setDescription(T.invites_count(count)).setColor(5793266)] });
      return;
    }
    if (message.content === "!topinvites") {
      if (!message.guild) return;
      const guildInvites = inviteCache.get(message.guild.id) || /* @__PURE__ */ new Map();
      const sorted = [...guildInvites.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (sorted.length === 0) {
        await message.reply(T.invites_empty);
        return;
      }
      const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
      const lines = sorted.map(([id, count], i) => `${medals[i] || `${i + 1}.`} <@${id}> \u2014 **${count}** invites`);
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.invites_top_title).setDescription(lines.join("\n")).setColor(16766720)] });
      return;
    }
    if (message.content.startsWith("!giveaway ")) {
      const level = await getPermissionLevel(message.author.id);
      if (level === "USER" || level === "MOD") {
        await message.reply(T.admin_no_permission);
        return;
      }
      const parts = message.content.slice(10).trim();
      const match = parts.match(/^(\d+)(m|h)\s+(.+)$/i);
      if (!match) {
        await message.reply(T.giveaway_usage);
        return;
      }
      const duration = parseInt(match[1]) * (match[2].toLowerCase() === "h" ? 36e5 : 6e4);
      const prize = match[3];
      const timeStr = match[2].toLowerCase() === "h" ? `${match[1]} saacadood` : `${match[1]} daqiiqo`;
      const name = getDisplayName(message.member, message.author.username);
      const msg = await message.channel.send({ embeds: [new EmbedBuilder().setTitle(T.giveaway_title).setDescription(T.giveaway_desc(prize, timeStr, name)).setColor(16739179)] });
      await msg.react("\u{1F389}");
      const giveawayId = msg.id;
      const timer = setTimeout(async () => {
        try {
          const fetched = await msg.fetch();
          const reaction = fetched.reactions.cache.get("\u{1F389}");
          const users = reaction ? await reaction.users.fetch() : null;
          const entries = users ? [...users.values()].filter((u) => !u.bot) : [];
          activeGiveaways.delete(giveawayId);
          if (entries.length === 0) {
            await msg.edit({ embeds: [new EmbedBuilder().setTitle(T.giveaway_end_title).setDescription(T.giveaway_no_entries(prize)).setColor(6710886)] });
          } else {
            const winner = entries[Math.floor(Math.random() * entries.length)];
            await msg.edit({ embeds: [new EmbedBuilder().setTitle(T.giveaway_end_title).setDescription(T.giveaway_winner(winner.id, prize)).setColor(16766720)] });
          }
        } catch (err) {
          console.error("Giveaway end error:", err);
        }
      }, duration);
      activeGiveaways.set(giveawayId, { prize, hostId: message.author.id, messageId: msg.id, channelId: message.channel.id, timer });
      return;
    }
    if (message.content.startsWith("!poll ")) {
      const parts = message.content.slice(6).split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) {
        await message.reply(T.poll_too_few);
        return;
      }
      if (parts.length > 7) {
        await message.reply(T.poll_too_many);
        return;
      }
      const question = parts[0];
      const options = parts.slice(1);
      const emojis = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3"];
      const optionsText = options.map((o, i) => `${emojis[i]} ${o}`).join("\n\n");
      const msg = await message.channel.send({ embeds: [new EmbedBuilder().setTitle(`${T.poll_title} \u2014 ${question}`).setDescription(optionsText).setColor(5793266).setFooter({ text: `Poll by ${message.author.username}` })] });
      for (let i = 0; i < options.length; i++) await msg.react(emojis[i]);
      return;
    }
    if (message.content === "!server") {
      if (!message.guild) return;
      const g = message.guild;
      const owner = await g.fetchOwner().catch(() => null);
      const created = `<t:${Math.floor(g.createdTimestamp / 1e3)}:R>`;
      const boostLevel = g.premiumTier;
      const boostCount = g.premiumSubscriptionCount || 0;
      const online = g.members.cache.filter((m) => m.presence?.status !== "offline").size;
      await message.reply({ embeds: [new EmbedBuilder().setTitle(`${T.server_title} \u2014 ${g.name}`).setThumbnail(g.iconURL() || "").addFields(
        { name: "\u{1F465} Members", value: `${g.memberCount}`, inline: true },
        { name: "\u{1F7E2} Online", value: `${online}`, inline: true },
        { name: "\u{1F451} Owner", value: owner ? `${owner.user.username}` : "Unknown", inline: true },
        { name: "\u{1F4C5} Created", value: created, inline: true },
        { name: "\u{1F48E} Boosts", value: `${boostCount} (Tier ${boostLevel})`, inline: true },
        { name: "\u{1F4FA} Channels", value: `${g.channels.cache.size}`, inline: true },
        { name: "\u{1F3AD} Roles", value: `${g.roles.cache.size}`, inline: true }
      ).setColor(5793266)] });
      return;
    }
    if (message.content === "!setup") {
      const level = await getPermissionLevel(message.author.id);
      if (level === "USER" || level === "MOD") {
        await message.reply(T.admin_no_permission);
        return;
      }
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.setup_title).setDescription(T.setup_desc).setColor(5793266)] });
      return;
    }
    if (message.content.startsWith("!setup ")) {
      const level = await getPermissionLevel(message.author.id);
      if (level === "USER" || level === "MOD") {
        await message.reply(T.admin_no_permission);
        return;
      }
      const args = message.content.slice(7).trim().split(/\s+/);
      const feature = args[0]?.toLowerCase();
      const value = args[1];
      if (!message.guild) return;
      if (feature === "welcome") {
        const ch = message.mentions.channels.first();
        if (ch) {
          await storage.upsertGuildConfig(message.guild.id, { welcomeChannelId: ch.id });
          await message.reply(T.welcome_set(ch.id));
        } else if (value === "off") {
          await storage.upsertGuildConfig(message.guild.id, { welcomeChannelId: null });
          await message.reply(T.welcome_removed);
        }
        return;
      }
      if (feature === "levelup") {
        const ch = message.mentions.channels.first();
        if (ch) {
          await storage.upsertGuildConfig(message.guild.id, { levelUpChannelId: ch.id });
          await message.reply(T.levelup_set(ch.id));
        } else if (value === "off") {
          await storage.upsertGuildConfig(message.guild.id, { levelUpChannelId: null });
          await message.reply(T.levelup_removed);
        }
        return;
      }
      if (feature === "starboard") {
        const ch = message.mentions.channels.first();
        if (ch) {
          await storage.upsertGuildConfig(message.guild.id, { starboardChannelId: ch.id });
          await message.reply(T.starboard_set(ch.id));
        } else if (value === "off") {
          await storage.upsertGuildConfig(message.guild.id, { starboardChannelId: null });
          await message.reply(T.starboard_removed);
        }
        return;
      }
      if (feature === "starthreshold") {
        const n = parseInt(value);
        if (!isNaN(n) && n >= 1 && n <= 20) {
          await storage.upsertGuildConfig(message.guild.id, { starboardThreshold: n });
          await message.reply(T.starboard_threshold_set(n));
        }
        return;
      }
      if (feature === "counting") {
        const ch = message.mentions.channels.first();
        if (ch) {
          await storage.upsertGuildConfig(message.guild.id, { countingChannelId: ch.id, countingCurrent: 0, countingLastUser: null });
          await message.reply(T.counting_set(ch.id));
        } else if (value === "off") {
          await storage.upsertGuildConfig(message.guild.id, { countingChannelId: null });
          await message.reply(T.counting_removed);
        }
        return;
      }
      if (feature === "automod") {
        if (value === "on") {
          await storage.upsertGuildConfig(message.guild.id, { automodEnabled: true });
          await message.reply(T.automod_enabled);
        } else if (value === "off") {
          await storage.upsertGuildConfig(message.guild.id, { automodEnabled: false });
          await message.reply(T.automod_disabled);
        }
        return;
      }
      if (feature === "antilink") {
        if (value === "on") {
          await storage.upsertGuildConfig(message.guild.id, { automodAntiLink: true });
          await message.reply(T.automod_antilink_on);
        } else if (value === "off") {
          await storage.upsertGuildConfig(message.guild.id, { automodAntiLink: false });
          await message.reply(T.automod_antilink_off);
        }
        return;
      }
      await message.reply(T.setup_usage);
      return;
    }
    if (message.content === "!rr list") {
      if (!message.guild) return;
      const config = await storage.getGuildConfig(message.guild.id);
      const rrs = config?.reactionRoles || [];
      if (rrs.length === 0) {
        await message.reply(T.rr_none);
        return;
      }
      const lines = rrs.map((r) => `${r.emoji} \u2192 <@&${r.roleId}> (msg: \`${r.messageId}\`)`);
      await message.reply({ embeds: [new EmbedBuilder().setTitle(T.rr_list_title).setDescription(lines.join("\n")).setColor(5793266)] });
      return;
    }
    if (message.content.startsWith("!rr remove ")) {
      const level = await getPermissionLevel(message.author.id);
      if (level === "USER" || level === "MOD") {
        await message.reply(T.admin_no_permission);
        return;
      }
      if (!message.guild) return;
      const args = message.content.slice(11).trim().split(/\s+/);
      const msgId = args[0];
      const emoji = args[1];
      if (!msgId || !emoji) {
        await message.reply(T.rr_usage);
        return;
      }
      const config = await storage.getGuildConfig(message.guild.id);
      const rrs = config?.reactionRoles || [];
      const filtered = rrs.filter((r) => !(r.messageId === msgId && r.emoji === emoji));
      await storage.upsertGuildConfig(message.guild.id, { reactionRoles: filtered });
      await message.reply(T.rr_removed(emoji));
      return;
    }
    if (message.content.startsWith("!rr ")) {
      const level = await getPermissionLevel(message.author.id);
      if (level === "USER" || level === "MOD") {
        await message.reply(T.admin_no_permission);
        return;
      }
      if (!message.guild) return;
      const args = message.content.slice(4).trim().split(/\s+/);
      if (args.length < 3) {
        await message.reply(T.rr_usage);
        return;
      }
      const msgId = args[0];
      const emoji = args[1];
      const role = message.mentions.roles.first();
      if (!role) {
        await message.reply(T.rr_usage);
        return;
      }
      const config = await storage.getGuildConfig(message.guild.id);
      const rrs = config?.reactionRoles || [];
      rrs.push({ messageId: msgId, emoji, roleId: role.id });
      await storage.upsertGuildConfig(message.guild.id, { reactionRoles: rrs });
      try {
        const targetMsg = await message.channel.messages.fetch(msgId);
        await targetMsg.react(emoji);
      } catch {
      }
      await message.reply(T.rr_added(emoji, role.id));
      return;
    }
    if (message.content.startsWith("!admin addcoins ") || message.content.startsWith("!admin adddiamonds ")) {
      if (message.author.id !== OWNER_ID || !isAdminSessionActive(message.author.id)) {
        await message.reply({ embeds: [new EmbedBuilder().setTitle("\u274C Permission Denied").setDescription("Amarka waxaa isticmaali kara **Owner** keliya.\n\n\u{1F512} Marka hore orod `!admin` si aad u shiddo admin mode.").setColor(15158332)] });
        return;
      }
      const parts = message.content.split(" ");
      const isCoins = parts[1] === "addcoins";
      const targetUser = message.mentions.users.first();
      const amount = parseInt(parts[parts.length - 1]);
      if (!targetUser || isNaN(amount) || amount <= 0) {
        await message.reply({ embeds: [new EmbedBuilder().setTitle("\u274C Khalad").setDescription(`Habka saxda ah: \`!admin ${isCoins ? "addcoins" : "adddiamonds"} @user <amount>\``).setColor(15158332)] });
        return;
      }
      let targetPlayer = await storage.getPlayer(targetUser.id);
      if (!targetPlayer) {
        const m = await message.guild?.members.fetch(targetUser.id).catch(() => null);
        targetPlayer = await storage.createPlayer({ discordId: targetUser.id, username: getDisplayName(m, targetUser.username) });
      }
      if (isCoins) {
        await storage.addCoins(targetUser.id, amount);
        await message.reply({ embeds: [new EmbedBuilder().setTitle("\u2705 Coins Waa La Diray").setDescription(`\u{1F4B0} **${amount.toLocaleString()} Coins** ayaa loogu daray <@${targetUser.id}>.\nBalance cusub: **${((targetPlayer.coins || 0) + amount).toLocaleString()} Coins**`).setColor(5763719)] });
      } else {
        await storage.addDiamonds(targetUser.id, amount);
        await message.reply({ embeds: [new EmbedBuilder().setTitle("\u2705 Diamonds Waa La Diray").setDescription(`\u{1F4A8} **${amount} Diamonds** ayaa loogu daray <@${targetUser.id}>.\nBalance cusub: **${((targetPlayer.diamonds || 0) + amount)} Diamonds**`).setColor(5763719)] });
      }
      return;
    }
    if (message.content === "!admin") {
      const level = await getPermissionLevel(message.author.id);
      if (level === "USER") {
        await message.reply(T.admin_no_permission);
        return;
      }
      activateAdminSession(message.author.id);
      const rows = [];
      if (level === "OWNER" || level === "ADMIN") {
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("admin_announce").setLabel("\u{1F4E2} Announce").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("admin_force_unlock").setLabel("\u{1F513} Unlock Channel").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("admin_force_end").setLabel("\u{1F6D1} Force End Game").setStyle(ButtonStyle.Danger)
        ));
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("admin_add_xp").setLabel("\u2795 Add XP").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("admin_remove_xp").setLabel("\u2796 Remove XP").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("admin_view_player").setLabel("\u{1F50D} View Player").setStyle(ButtonStyle.Secondary)
        ));
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("admin_warn").setLabel("\u26A0\uFE0F Warn").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("admin_mute").setLabel("\u{1F507} Mute").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("admin_ban").setLabel("\u{1F528} Ban").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("admin_unban").setLabel("\u{1F513} Unban").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("admin_unhold").setLabel("🔓 Unhold").setStyle(ButtonStyle.Primary)
        ));
      }
      if (level === "OWNER") {
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("admin_add_staff").setLabel("\u{1F465} Add Staff").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("admin_remove_staff").setLabel("\u274C Remove Staff").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("admin_view_staff").setLabel("\u{1F4CB} View Staff").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("admin_reset_lb").setLabel("\u{1F4CA} Reset Leaderboard").setStyle(ButtonStyle.Danger)
        ));
      }
      if (level === "MOD") {
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("admin_force_end").setLabel("\u{1F6D1} Force End Game").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("admin_force_unlock").setLabel("\u{1F513} Unlock Channel").setStyle(ButtonStyle.Secondary)
        ));
      }
      rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("admin_debug_games").setLabel("\u{1F9EA} Active Games").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("admin_emergency_unlock").setLabel("\u{1F6A8} Emergency Unlock All").setStyle(ButtonStyle.Danger)
      ));
      const panelTitle = level === "OWNER" ? "\u{1F451} Owner Panel" : level === "ADMIN" ? "\u{1F948} Admin Panel" : "\u{1F949} Mod Panel";
      await message.reply({ embeds: [new EmbedBuilder().setTitle(panelTitle).setDescription(T.admin_panel_desc).setColor(3066993)], components: rows });
      return;
    }
    if (message.content.startsWith("!q ")) {
      if (await checkRestricted(message.author.id, message)) return;
      const target = message.mentions.users.first();
      if (!target) {
        await message.reply(T.guess_mention_needed);
        return;
      }
      if (target.id === message.author.id) {
        await message.reply(T.guess_cant_self);
        return;
      }
      if (target.bot) {
        await message.reply(T.guess_cant_bot);
        return;
      }
      if (findPlayerGuessGame(message.author.id)) {
        await message.reply(T.guess_already_playing);
        return;
      }
      if (findPlayerGuessGame(target.id)) {
        await message.reply(T.guess_target_playing);
        return;
      }
      const pairKey = [message.author.id, target.id].sort().join("-");
      const lastChallenge = recentChallenges.get(pairKey);
      if (lastChallenge && Date.now() - lastChallenge < 15e3) {
        await message.reply(T.guess_cooldown);
        return;
      }
      const challengerMember = await message.guild?.members.fetch(message.author.id).catch(() => null);
      const challengerName = getDisplayName(challengerMember, message.author.username);
      const gameId = `g${Date.now().toString(36)}`;
      const embed = new EmbedBuilder().setTitle(T.guess_title).setDescription(T.guess_challenge_desc(target.id, challengerName)).setColor(3447003);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`guess_accept_${gameId}`).setLabel(T.guess_accept_btn).setEmoji("\u{1F7E2}").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`guess_decline_${gameId}`).setLabel(T.guess_decline_btn).setEmoji("\u{1F534}").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`guess_info_${gameId}`).setLabel(T.guess_info_btn).setStyle(ButtonStyle.Secondary)
      );
      await message.channel.send({ embeds: [embed], components: [row] });
      activeGuessGames.set(gameId, {
        channelId: message.channel.id,
        player1Id: message.author.id,
        player2Id: target.id,
        player1Number: null,
        player2Number: null,
        player1Guesses: [],
        player2Guesses: [],
        player1Found: false,
        player2Found: false,
        currentTurn: "",
        phase: "picking",
        createdAt: Date.now(),
        lastActivity: Date.now(),
        inactivityTimer: null,
        messageId: null
      });
      setTimeout(async () => {
        const g = activeGuessGames.get(gameId);
        if (g && g.phase === "picking") {
          activeGuessGames.delete(gameId);
          try {
            const ch = await client.channels.fetch(g.channelId);
            if (ch) await ch.send({ embeds: [new EmbedBuilder().setTitle(T.guess_timeout_title).setDescription(T.guess_timeout_desc).setColor(15158332)] });
          } catch {
          }
        }
      }, 12e4);
      return;
    }
    if (message.content.startsWith("!sug")) {
      const args = message.content.trim().split(/\s+/);
      if (args.length < 2 || !["fti", "sheeko"].includes(args[1].toLowerCase())) {
        await message.reply(T.sug_usage);
        return;
      }
      const gameType = args[1].toLowerCase();
      const channelId = message.channel.id;
      const sugKey = `${gameType}_${channelId}`;
      const userId = message.author.id;
      if (gameType === "fti") {
        const hasActiveGame = activeFtiChannels.has(channelId);
        if (!hasActiveGame) {
          if (!sugQueue.has(sugKey)) sugQueue.set(sugKey, /* @__PURE__ */ new Set());
          if (sugQueue.get(sugKey).has(userId)) {
            await message.reply(T.sug_already_fti);
          } else {
            sugQueue.get(sugKey).add(userId);
            await message.reply(T.sug_no_fti);
          }
          return;
        }
        if (!sugQueue.has(sugKey)) sugQueue.set(sugKey, /* @__PURE__ */ new Set());
        if (sugQueue.get(sugKey).has(userId)) {
          await message.reply(T.sug_already_fti);
        } else {
          sugQueue.get(sugKey).add(userId);
          await message.reply(T.sug_fti_registered);
        }
      } else if (gameType === "sheeko") {
        const hasActiveSheeko = Array.from(activeShekoGames.values()).some((g) => g.channelId === channelId && g.phase !== "finished");
        if (!hasActiveSheeko) {
          if (!sugQueue.has(sugKey)) sugQueue.set(sugKey, /* @__PURE__ */ new Set());
          if (sugQueue.get(sugKey).has(userId)) {
            await message.reply(T.sug_already_sheeko);
          } else {
            sugQueue.get(sugKey).add(userId);
            await message.reply(T.sug_no_sheeko);
          }
          return;
        }
        if (!sugQueue.has(sugKey)) sugQueue.set(sugKey, /* @__PURE__ */ new Set());
        if (sugQueue.get(sugKey).has(userId)) {
          await message.reply(T.sug_already_sheeko);
        } else {
          sugQueue.get(sugKey).add(userId);
          await message.reply(T.sug_sheeko_registered);
        }
      }
      return;
    }
    if (message.content === "!fti") {
      if (await checkRestricted(message.author.id, message)) return;
      if (activeFtiChannels.has(message.channel.id)) {
        await message.reply(T.fti_active_in_channel);
        return;
      }
      const isAlreadyInGame = Array.from(activeGames.values()).some((g) => g.players.some((p) => p.id === message.author.id)) || Array.from(lobbies.values()).some((l) => l.players.some((p) => p.id === message.author.id));
      if (isAlreadyInGame) {
        await message.reply(T.fti_already_in_game);
        return;
      }
      let numPlayers = 0;
      await message.reply(T.fti_enter_players);
      while (true) {
        const collected = await message.channel.awaitMessages({ filter: (m) => m.author.id === message.author.id, max: 1, time: 3e4 }).catch(() => null);
        if (!collected || !collected.first()) return;
        const n = parseInt(collected.first().content);
        if (!isNaN(n) && n >= 3 && n <= 25) {
          numPlayers = n;
          break;
        }
        await message.reply(T.fti_invalid_number);
      }
      const lobbyId = `${message.channel.id}-${Date.now()}`;
      const numImposters = numPlayers >= 19 ? 4 : numPlayers >= 12 ? 3 : numPlayers >= 7 ? 2 : 1;
      const hostMember = await message.guild?.members.fetch(message.author.id).catch(() => null);
      const hostName = getDisplayName(hostMember, message.author.username);
      lobbies.set(lobbyId, { host: message.author.id, maxPlayers: numPlayers, players: [message.author], channelId: message.channel.id });
      activeFtiChannels.add(message.channel.id);
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("join_lobby").setLabel("Ku biir").setEmoji("\u{1F7E2}").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("leave_lobby").setLabel("Ka bax").setEmoji("\u{1F534}").setStyle(ButtonStyle.Danger)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("desc_game").setLabel("Faahfaahin").setEmoji("\u{1F4D6}").setStyle(ButtonStyle.Secondary)
      );
      const embed = new EmbedBuilder().setTitle(T.fti_lobby_title).addFields(
        { name: T.fti_game_status, value: T.fti_lobby_status(1, numPlayers, hostName), inline: false },
        { name: T.fti_players_label, value: `1\uFE0F\u20E3 ${hostName}`, inline: false },
        { name: "\u2139\uFE0F Info", value: T.fti_lobby_info(numImposters), inline: false }
      ).setColor(39423);
      await message.channel.send({ embeds: [embed], components: [row1, row2] });
      setTimeout(async () => {
        if (lobbies.has(lobbyId)) {
          lobbies.delete(lobbyId);
          activeFtiChannels.delete(message.channel.id);
          await message.channel.send(T.fti_lobby_timeout);
        }
      }, 6e4);
    }
    if (message.content === "!taraq") {
      const gameId = `taraq_${message.channel.id}`;
      if (taraqGames.has(gameId)) {
        await message.reply({ content: "\u26A0\uFE0F Taraq shuffle horey ayaa ka socota channel-kan.", ephemeral: false });
        return;
      }
      const hostMember = await message.guild?.members.fetch(message.author.id).catch(() => null);
      const hostName = hostMember?.displayName || message.author.username;
      taraqGames.set(gameId, {
        hostId: message.author.id,
        hostName,
        channelId: message.channel.id,
        players: [{ id: message.author.id, username: hostName }],
        phase: "lobby"
      });
      const taraqRole = message.guild?.roles.cache.find((r) => r.name.toLowerCase() === "taraq");
      if (taraqRole && message.member) {
        await message.member.roles.add(taraqRole).catch(() => {});
      }
      const buildTaraqEmbed = (players2) => {
        const playerList = players2.map((p, i) => `\`${i + 1}.\` <@${p.id}>`).join("\n") || "\u200B";
        return new EmbedBuilder()
          .setTitle("\u{1F500} Taraq Shuffle \u2014 Lobby")
          .setDescription(
            `\u{1F3AE} **Ku soo dhawoow Taraq Shuffle!**\n\nFadlan taabo buttonka **Kubiir** si aad ugu biirtid shuffleka.\nama ka bax\u2019si aad oga baxdid shuffleka \u2014 laakiin n.\n\n\u200B`
          )
          .addFields(
            { name: `\u{1F465} Ciyaartoyda (\`${players2.length}\`)`, value: playerList, inline: false }
          )
          .setColor(0x7c3aed)
          .setFooter({ text: `Host: ${hostName}` })
          .setTimestamp();
      };
      const taraqRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`taraq_join_${gameId}`).setLabel("Kubiir").setEmoji("\u2705").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`taraq_start_${gameId}`).setLabel("Bilow").setEmoji("\u{1F500}").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`taraq_leave_${gameId}`).setLabel("Bax").setEmoji("\uD83D\uDEAA").setStyle(ButtonStyle.Danger)
      );
      await message.channel.send({ embeds: [buildTaraqEmbed(taraqGames.get(gameId).players)], components: [taraqRow] });
    }
  });
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("pick_number_")) {
        const gameId = interaction.customId.replace("pick_number_", "");
        const game2 = activeGuessGames.get(gameId);
        if (!game2) {
          await interaction.reply({ content: T.guess_no_game, ephemeral: true });
          return;
        }
        const input = interaction.fields.getTextInputValue("secret_number");
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 100) {
          await interaction.reply({ content: T.guess_invalid_number, ephemeral: true });
          return;
        }
        const isP1 = interaction.user.id === game2.player1Id;
        const alreadyPicked = isP1 ? game2.player1Number !== null : game2.player2Number !== null;
        if (alreadyPicked && game2.phase === "playing") {
          await interaction.reply({ content: T.guess_already_picked, ephemeral: true });
          return;
        }
        if (alreadyPicked) {
          const pSpend = await storage.spendDiamonds(interaction.user.id, 5);
          if (!pSpend) {
            await interaction.reply({ content: "\u274C Ma haysatid diamond kugu filan.\nFadlan isticmaal `!daily` si aad u hesho diamonds.", ephemeral: true });
            return;
          }
          if (isP1) game2.player1Number = num;
          else game2.player2Number = num;
          await interaction.reply({ content: `ð Tiradaada waa la beddelay! **${num}** waaye tiradaada cusub. (-5 \u{1F4A8} Diamonds)`, ephemeral: true });
          return;
        }
        if (isP1) game2.player1Number = num;
        else game2.player2Number = num;
        await interaction.reply({ content: T.guess_number_saved(num), ephemeral: true });
        if (game2.player1Number !== null && game2.player2Number !== null) {
          game2.phase = "playing";
          game2.currentTurn = Math.random() < 0.5 ? game2.player1Id : game2.player2Id;
          const opponentId = game2.currentTurn === game2.player1Id ? game2.player2Id : game2.player1Id;
          const channel = await client.channels.fetch(game2.channelId);
          if (channel) {
            resetInactivityTimer(gameId, channel);
            await channel.send({ embeds: [new EmbedBuilder().setTitle(T.guess_start_title).setDescription(T.guess_start_desc(game2.currentTurn, opponentId)).setColor(3447003)] });
          }
        }
        return;
      }
      if (interaction.customId.startsWith("sheeko_modal_")) {
        const gameId = interaction.customId.replace("sheeko_modal_", "");
        const game2 = activeShekoGames.get(gameId);
        if (!game2 || game2.phase !== "waiting_story" || game2.isProcessing) {
          await interaction.reply({ content: T.game_not_found, ephemeral: true });
          return;
        }
        game2.isProcessing = true;
        const storyteller = game2.players[game2.currentStoryteller];
        if (interaction.user.id !== storyteller.id) {
          game2.isProcessing = false;
          await interaction.reply({ content: T.sheeko_not_your_turn, ephemeral: true });
          return;
        }
        const s1 = interaction.fields.getTextInputValue("s1");
        const s2 = interaction.fields.getTextInputValue("s2");
        const s3 = interaction.fields.getTextInputValue("s3");
        const lieInput = interaction.fields.getTextInputValue("lie").trim();
        const lieNum = parseInt(lieInput);
        if (isNaN(lieNum) || lieNum < 1 || lieNum > 3) {
          game2.isProcessing = false;
          await interaction.reply({ content: T.sheeko_modal_invalid_lie, ephemeral: true });
          return;
        }
        game2.statements = [s1, s2, s3];
        game2.lieIndex = lieNum - 1;
        game2.votes = /* @__PURE__ */ new Map();
        game2.phase = "voting";
        await interaction.reply({ content: T.sheeko_modal_submitted, ephemeral: true });
        const channel = interaction.channel;
        const voteRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`sheeko_vote_1_${gameId}`).setLabel("1\uFE0F\u20E3").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`sheeko_vote_2_${gameId}`).setLabel("2\uFE0F\u20E3").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`sheeko_vote_3_${gameId}`).setLabel("3\uFE0F\u20E3").setStyle(ButtonStyle.Secondary)
        );
        await channel.send({ embeds: [new EmbedBuilder().setTitle(T.sheeko_statements_title(storyteller.username)).setDescription(
          `1\uFE0F\u20E3 "${s1}"

2\uFE0F\u20E3 "${s2}"

3\uFE0F\u20E3 "${s3}"

` + T.sheeko_which_lie
        ).setColor(15277667)], components: [voteRow] });
        if (game2.inactivityTimer) clearTimeout(game2.inactivityTimer);
        game2.isProcessing = false;
        const voteRound = game2.currentStoryteller;
        game2.inactivityTimer = setTimeout(async () => {
          const g = activeShekoGames.get(gameId);
          if (!g || g.phase !== "voting" || g.currentStoryteller !== voteRound) return;
          await revealShekoResults(gameId, channel);
        }, 3e4);
        return;
      }
      if (interaction.customId === "modal_announce") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const title = interaction.fields.getTextInputValue("announce_title");
        const desc2 = interaction.fields.getTextInputValue("announce_desc");
        await interaction.reply({ content: T.admin_announce_sent, ephemeral: true });
        const channel = interaction.channel;
        await channel.send({ embeds: [new EmbedBuilder().setTitle(`\u{1F4E2} ${title}`).setDescription(desc2).setColor(3447003).setTimestamp()] });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4E2} **Admin Announce** by <@${interaction.user.id}>: ${title}`);
        return;
      }
      if (interaction.customId === "modal_add_xp") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        const amount = parseInt(interaction.fields.getTextInputValue("xp_amount"));
        if (isNaN(amount) || amount <= 0) {
          await interaction.reply({ content: T.admin_invalid_number, ephemeral: true });
          return;
        }
        const updated = await storage.updatePlayerXP(userId, amount);
        if (!updated) {
          await interaction.reply({ content: T.admin_player_not_found, ephemeral: true });
          return;
        }
        await interaction.reply({ content: T.admin_xp_added(amount, userId, updated.xp), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u2795 **XP Added** by <@${interaction.user.id}>: +${amount} XP to <@${userId}>`);
        return;
      }
      if (interaction.customId === "modal_remove_xp") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        const amount = parseInt(interaction.fields.getTextInputValue("xp_amount"));
        if (isNaN(amount) || amount <= 0) {
          await interaction.reply({ content: T.admin_invalid_number, ephemeral: true });
          return;
        }
        const updated = await storage.updatePlayerXP(userId, -amount);
        if (!updated) {
          await interaction.reply({ content: T.admin_player_not_found, ephemeral: true });
          return;
        }
        await interaction.reply({ content: T.admin_xp_removed(amount, userId, updated.xp), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u2796 **XP Removed** by <@${interaction.user.id}>: -${amount} XP from <@${userId}>`);
        return;
      }
      if (interaction.customId === "modal_view_player") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        const player = await storage.getPlayer(userId);
        if (!player) {
          await interaction.reply({ content: T.admin_player_not_found, ephemeral: true });
          return;
        }
        const restriction = await storage.isPlayerRestricted(userId);
        await interaction.reply({ content: T.admin_view_player_info(userId, player.xp, player.level, player.wins, player.losses, player.warnings, restriction.muted, player.banned, restriction.onHold, restriction.onHoldReason), ephemeral: true });
        return;
      }
      if (interaction.customId === "modal_invest_deposit") {
        if (!dbOnline) { await interaction.reply({ content: "\u26A0\uFE0F Economy waa ku hawlanahay.", ephemeral: true }); return; }
        const rawAmt = interaction.fields.getTextInputValue("invest_amount").trim().replace(/,/g, "");
        const depositAmt = parseInt(rawAmt);
        if (isNaN(depositAmt) || depositAmt <= 0) {
          await interaction.reply({ content: "\u274C Xad sax ah geli (tusaale: 5000).", ephemeral: true });
          return;
        }
        if (depositAmt < 100) {
          await interaction.reply({ content: "\u274C Ugu yaraan **100 Coins** ayaad maalgashan kartaa.", ephemeral: true });
          return;
        }
        await withUserLock(interaction.user.id, async () => {
          const dPlayer = await storage.getPlayer(interaction.user.id);
          if (!dPlayer) { await interaction.reply({ content: "\u274C Profile ma jiro.", ephemeral: true }); return; }
          const dGS = storage.ensureGameStats(dPlayer.gameStats);
          const dInv = dGS.invest || { amount: 0, lastClaim: Date.now(), totalEarned: 0, depositedAt: 0 };
          const INVEST_CAP = 100000;
          const roomLeft = INVEST_CAP - (dInv.amount || 0);
          if (roomLeft <= 0) {
            await interaction.reply({ content: `\u274C Xadka ugu badan (${INVEST_CAP.toLocaleString()} Coins) ayaad gaartay.`, ephemeral: true });
            return;
          }
          const actualDeposit = Math.min(depositAmt, roomLeft);
          if ((dPlayer.coins || 0) < actualDeposit) {
            await interaction.reply({ content: `\u274C Coins kugu filan ma haysatid.\n\uD83D\uDCB0 Wallet: **${(dPlayer.coins || 0).toLocaleString()}** \u00B7 Deposit: **${actualDeposit.toLocaleString()}**`, ephemeral: true });
            return;
          }
          const existingProfit = calcInvestProfit(dInv);
          let _depAutoProfit = 0;
          if (existingProfit > 0) {
            const _depUserProfit = Math.floor(existingProfit * 0.75);
            const _depTax       = existingProfit - _depUserProfit;
            const _depProfitBlock = await nwCapBlocked(interaction.user.id, _depUserProfit);
            if (!_depProfitBlock) {
              await storage.addCoins(interaction.user.id, _depUserProfit);
              await pool.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [_depTax]);
              console.log(`[TREASURY] +${_depTax} ← invest-deposit auto-claim tax from ${interaction.user.id}`);
              logEconomy(interaction.user.id, "invest-profit", _depUserProfit, "gain");
              _depAutoProfit = _depUserProfit;
            }
            dInv.totalEarned = (dInv.totalEarned || 0) + existingProfit;
          }
          const spentResult = await storage.spendCoins(interaction.user.id, actualDeposit);
          if (!spentResult) {
            await interaction.reply({ content: "\u274C Coins kugu filan ma haysatid.", ephemeral: true });
            return;
          }
          dGS.invest = { amount: (dInv.amount || 0) + actualDeposit, lastClaim: Date.now(), totalEarned: dInv.totalEarned || 0, depositedAt: Date.now() };
          await db.update(players).set({ gameStats: dGS }).where(eq(players.discordId, interaction.user.id));
          logEconomy(interaction.user.id, "invest-deposit", actualDeposit, "loss");
          const newInvAmt = dGS.invest.amount;
          const newRate = newInvAmt <= 25000 ? "+2.5% / 6h" : "+2.5%/+1.5% / 6h";
          const _depVoteLast = await getLastVoteTime(interaction.user.id);
          const _depVoted    = hasVoteBoost(_depVoteLast);
          const _depLockLabel = _depVoted ? "12 saacadood" : "24 saacadood";
          await interaction.reply({ content: `\u2705 **${actualDeposit.toLocaleString()} Coins** ayaad maalgashatay!\n\uD83D\uDCC8 Maalgashi guud: **${newInvAmt.toLocaleString()} / ${INVEST_CAP.toLocaleString()} Coins**\n\uD83D\uDCCA Faaiidada: **${newRate}**\n\uD83D\uDCD1 Canshuurta: **25% profit**\n\uD83D\uDD12 Withdraw waxaa la samayn karaa **${_depLockLabel}** ka dib.${_depAutoProfit > 0 ? `\n\uD83D\uDCB8 Faa\u2019iido hore oo si toos ah loo qaatay: +${_depAutoProfit.toLocaleString()} Coins` : ""}`, ephemeral: true });
        });
        return;
      }
      if (interaction.customId === "modal_warn") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        const updated = await storage.warnPlayer(userId);
        if (!updated) {
          await interaction.reply({ content: T.admin_player_not_found, ephemeral: true });
          return;
        }
        let msg = T.admin_warned(userId, updated.warnings);
        if (updated.warnings >= 3) msg += "\n" + T.admin_warn_suggestion;
        await interaction.reply({ content: msg, ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u26A0\uFE0F **Warn** by <@${interaction.user.id}>: <@${userId}> (Total: ${updated.warnings})`);
        return;
      }
      if (interaction.customId === "modal_mute") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        const hours = parseInt(interaction.fields.getTextInputValue("mute_hours"));
        if (isNaN(hours) || hours <= 0) {
          await interaction.reply({ content: T.admin_invalid_hours, ephemeral: true });
          return;
        }
        const until = new Date(Date.now() + hours * 36e5).toISOString();
        await storage.mutePlayer(userId, until);
        await interaction.reply({ content: T.admin_muted(userId, hours), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F507} **Mute** by <@${interaction.user.id}>: <@${userId}> for ${hours}h`);
        return;
      }
      if (interaction.customId === "modal_ban") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        if (userId === OWNER_ID) {
          await interaction.reply({ content: T.admin_cant_ban_owner, ephemeral: true });
          return;
        }
        await storage.banPlayer(userId);
        await interaction.reply({ content: T.admin_banned(userId), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F528} **Ban** by <@${interaction.user.id}>: <@${userId}>`);
        return;
      }
      if (interaction.customId === "modal_unban") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        await storage.unbanPlayer(userId);
        await interaction.reply({ content: T.admin_unbanned(userId), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F513} **Unban** by <@${interaction.user.id}>: <@${userId}>`);
        return;
      }
      if (interaction.customId === "modal_unhold") {
        const level = await getPermissionLevel(interaction.user.id);
        if (level === "USER" || level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        await storage.unholdPlayer(userId);
        await interaction.reply({ content: `🔓 <@${userId}> accountgooda waa la sii daayay (unhold).`, ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `🔓 **Unhold** by <@${interaction.user.id}>: <@${userId}>`);
        return;
      }
      if (interaction.customId === "modal_add_staff") {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        const role = interaction.fields.getTextInputValue("staff_role").trim().toLowerCase();
        if (role !== "admin" && role !== "mod") {
          await interaction.reply({ content: T.admin_invalid_role, ephemeral: true });
          return;
        }
        await storage.addStaff(userId, role, interaction.user.id);
        await interaction.reply({ content: T.admin_staff_added(userId, role), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F465} **Staff Added** by <@${interaction.user.id}>: <@${userId}> as ${role}`);
        return;
      }
      if (interaction.customId === "modal_remove_staff") {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
          return;
        }
        const userId = interaction.fields.getTextInputValue("target_user_id").trim();
        await storage.removeStaff(userId);
        await interaction.reply({ content: T.admin_staff_removed(userId), ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u274C **Staff Removed** by <@${interaction.user.id}>: <@${userId}>`);
        return;
      }
    }
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    if (interaction.customId.startsWith("close_panel_")) {
      const panelAuthorId = interaction.customId.replace("close_panel_", "");
      if (interaction.user.id !== panelAuthorId) {
        return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      }
      try {
        if ((interaction.message?.flags?.bitfield ?? 0) & 64) {
          await interaction.update({ content: " ", embeds: [], components: [] });
        } else {
          await interaction.message.delete();
          await interaction.deferUpdate();
        }
      } catch { try { await interaction.deferUpdate(); } catch {} }
      return;
    }


    if (interaction.customId.startsWith("rich_close_")) {
      const richOwnerId = interaction.customId.replace("rich_close_", "");
      if (interaction.user.id !== richOwnerId) {
        return interaction.reply({ content: "❌ buttonkaaga ma ahan", ephemeral: true });
      }

      try { await interaction.deferUpdate(); } catch {}
      try {
        await interaction.message.delete();
        activeRichMessages.delete(richOwnerId);
      } catch {}
      return;
    }


    if (interaction.customId.startsWith("rich_refresh_")) {
      const richOwnerId = interaction.customId.replace("rich_refresh_", "");
      if (interaction.user.id !== richOwnerId) {
        return interaction.reply({ content: "❌ buttonkaaga ma ahan", ephemeral: true });
      }
      const now = Date.now();
      const RICH_REFRESH_CD = 15_000;
      const lastRefresh = richRefreshCooldowns.get(richOwnerId) || 0;
      if (now - lastRefresh < RICH_REFRESH_CD) {
        const secLeft = Math.ceil((RICH_REFRESH_CD - (now - lastRefresh)) / 1000);
        return interaction.reply({ content: `⏱️ Sug **${secLeft}s** ka hor intaadan mar kale cusboonaynin.`, ephemeral: true });
      }
      richRefreshCooldowns.set(richOwnerId, now);
      await interaction.deferUpdate();
      try {
        const payload = await buildRichPayload(richOwnerId, interaction.guild);
        await interaction.message.edit(payload);
      } catch (err) {
        console.error("[RICH] Refresh error:", err);
      }
      return;
    }

    if (interaction.customId.startsWith("prof_eco_") || interaction.customId.startsWith("prof_game_") || interaction.customId.startsWith("prof_achv_") || interaction.customId.startsWith("prof_inv_")) {
      const profSection = interaction.customId.startsWith("prof_eco_") ? "eco" : interaction.customId.startsWith("prof_game_") ? "game" : interaction.customId.startsWith("prof_achv_") ? "achv" : "inv";
      const profTargetId = interaction.customId.replace(`prof_${profSection}_`, "");
      const profPlayer = await storage.getPlayer(profTargetId);
      if (!profPlayer) {
        await interaction.reply({ content: "\u274C Profile-kaas ma jiro.", ephemeral: true });
        return;
      }
      const profGStats = storage.ensureGameStats(profPlayer.gameStats);
      const profMember = await interaction.guild?.members.fetch(profTargetId).catch(() => null);
      const profName = profMember ? (profMember.displayName || profPlayer.username) : profPlayer.username;
      if (profSection === "eco") {
        const hasShield = profGStats.streakShield || false;
        const hasRobShield = profGStats.robShieldEnd && Date.now() < profGStats.robShieldEnd;
        const robHours = hasRobShield ? Math.ceil((profGStats.robShieldEnd - Date.now()) / 3600000) : 0;
        const xpBoostDays = profGStats.xpBoostDays || 0;
        const ecoEmbed = new EmbedBuilder()
          .setTitle(`\u{1F4B0} Economy \u2014 ${profName}`)
          .setColor(0xf1c40f)
          .addFields(
            { name: "\u{1F4B0} Coins", value: `**${(profPlayer.coins || 0).toLocaleString()}**`, inline: true },
            { name: "\u{1F48E} Diamonds", value: `**${(profPlayer.diamonds || 0).toLocaleString()}**`, inline: true },
            { name: "\u{1F381} Legendary Crates", value: `**${profPlayer.legendaryCrates || 0}**`, inline: true },
            { name: "\u{1F4C5} Daily Streak", value: `**${profPlayer.dailyStreak || 0}** maalmood`, inline: true },
            { name: "\u26A1 XP Boost", value: xpBoostDays > 0 ? `**${xpBoostDays}** maalmood ka hadhay` : "Inactive", inline: true },
            { name: "\u{1F6E1}\uFE0F Streak Shield", value: hasShield ? "\u2705 Active" : "\u274C Inactive", inline: true },
            { name: "\u{1F6E1}\uFE0F Rob Shield", value: hasRobShield ? `\u2705 ${robHours}h ka hadhay` : "\u274C Inactive", inline: true }
          )
          .setFooter({ text: "\u{1F4B0} Hel coins: !work \u00B7 !daily \u00B7 !slots \u00B7 !duel \u00B7 !vote" });
        await interaction.reply({ embeds: [ecoEmbed], ephemeral: true });
      } else if (profSection === "game") {
        const gameEmbed = new EmbedBuilder()
          .setTitle(`\u{1F3AE} Game Stats \u2014 ${profName}`)
          .setColor(0x2ecc71)
          .addFields(
            { name: "\u{1F3AD} Find The Imposter", value: `\u{1F3C6} ${profGStats.fti.wins}W \u00B7 \u2620\uFE0F ${profGStats.fti.losses}L \u00B7 \u{1F3AE} ${profGStats.fti.played} ciyaar`, inline: false },
            { name: "\u{1F3AF} Qabso Tiro", value: `\u{1F3C6} ${profGStats.guess.wins}W \u00B7 \u2620\uFE0F ${profGStats.guess.losses}L \u00B7 \u{1F3AE} ${profGStats.guess.played} ciyaar`, inline: false },
            { name: "\u{1F9D7} Tower Climb", value: `\u{1F3AE} ${profGStats.tower.played} ciyaar \u00B7 \u{1F3C6} Floor ugu sareeya: **${profGStats.tower.highestFloor}** \u00B7 \u{1F4B0} ${profGStats.tower.totalXpEarned} XP total`, inline: false },
            { name: "\u{1F4A3} Miino", value: `\u{1F3C6} ${profGStats.miino.wins}W \u00B7 \u2620\uFE0F ${profGStats.miino.losses}L \u00B7 \u{1F3AE} ${profGStats.miino.played} ciyaar \u00B7 \u{1F3C5} Best: ${profGStats.miino.bestReveal}/16`, inline: false },
            { name: "\u{1F3AD} Sheeko Been ah", value: `\u{1F3C6} ${profGStats.sheeko.wins}W \u00B7 \u2620\uFE0F ${profGStats.sheeko.losses}L \u00B7 \u{1F3AE} ${profGStats.sheeko.played} ciyaar \u00B7 \u{1F3A9} Fooled All: ${profGStats.sheeko.timesFooledAll}x`, inline: false }
          );
        await interaction.reply({ embeds: [gameEmbed], ephemeral: true });
      } else if (profSection === "achv") {
        const profUnlockedAchv = PERMANENT_ACHIEVEMENTS.filter((a) => a.check(profGStats, profPlayer));
        const profUnlockedHidden = HIDDEN_ACHIEVEMENTS.filter((a) => a.check(profGStats, profPlayer));
        const profAllUnlocked = [...profUnlockedAchv, ...profUnlockedHidden];
        const profTitles = COSMETIC_TITLES.filter((t) => profAllUnlocked.some((a) => a.id === t.unlock));
        const profHiddenLocked = HIDDEN_ACHIEVEMENTS.filter((a) => !a.check(profGStats, profPlayer)).length;
        let profAchvText = profAllUnlocked.length > 0 ? profAllUnlocked.map((a) => `\u2705 ${a.name}`).join("\n") : T.achv_none;
        if (profHiddenLocked > 0) profAchvText += `\n\u{1F512} ${T.achv_hidden_count(profHiddenLocked)}`;
        const achvEmbed = new EmbedBuilder()
          .setTitle(`\u{1F3C5} Achievements \u2014 ${profName}`)
          .setColor(0xf39c12)
          .addFields(
            { name: `\u{1F396} Achievements (${profAllUnlocked.length})`, value: profAchvText, inline: false },
            { name: "\u{1F3F7}\uFE0F Titles", value: profTitles.length > 0 ? profTitles.map((t) => t.name).join(" \u00B7 ") : T.titles_none, inline: false }
          );
        await interaction.reply({ embeds: [achvEmbed], ephemeral: true });
      } else {
        const profCrates = profPlayer.legendaryCrates || 0;
        const hasStreakShield = profGStats.streakShield || false;
        const hasRobShieldInv = profGStats.robShieldEnd && Date.now() < profGStats.robShieldEnd;
        const xpBoostDaysInv = profGStats.xpBoostDays || 0;
        const activeTitle = profPlayer.activeTitle || "\u2014";
        const invOwnedTitles = Array.isArray(profPlayer.ownedTitles) ? profPlayer.ownedTitles : [];
        const invLimitedDisplay = invOwnedTitles.length > 0
          ? invOwnedTitles.map(t => t === "observer_title" ? "👁️ Observer — FTI secret hint" : t).join("\n")
          : "Waxba ma haysatid";
        const invEmbed = new EmbedBuilder()
          .setTitle(`\u{1F4E6} Inventory \u2014 ${profName}`)
          .setColor(0xe74c3c)
          .addFields(
            { name: "\u{1F381} Legendary Crates", value: profCrates > 0 ? `**${profCrates}** crate${profCrates > 1 ? "s" : ""} \u00B7 isticmaal \`!fur legendary crate\`` : "Waxba ma haysatid", inline: false },
            { name: "\u{1F3F7}\uFE0F Active Title", value: activeTitle, inline: true },
            { name: "\u{1F6E1}\uFE0F Streak Shield", value: hasStreakShield ? "\u2705 Active" : "\u274C None", inline: true },
            { name: "\u{1F6E1}\uFE0F Rob Shield", value: hasRobShieldInv ? "\u2705 Active" : "\u274C None", inline: true },
            { name: "\u26A1 XP Boost", value: xpBoostDaysInv > 0 ? `${xpBoostDaysInv} maalmood` : "\u274C None", inline: true },
            { name: "🏷️ Limited Titles", value: invLimitedDisplay, inline: false },
            { name: "\u{1F4DD} Bio", value: profPlayer.bio || T.profile_no_bio, inline: false }
          );
        await interaction.reply({ embeds: [invEmbed], ephemeral: true });
      }
      return;
    }
    if (interaction.customId.startsWith("quest_claim_")) {
      const qParts = interaction.customId.split("_");
      const qNum = parseInt(qParts[2]);
      const qOwnerId = qParts[3];
      if (interaction.user.id !== qOwnerId) {
        await interaction.reply({ content: "❌ Questkan adiga ma galin.", ephemeral: true });
        return;
      }
      const qPlayer = await storage.getPlayer(interaction.user.id);
      if (!qPlayer) { await interaction.reply({ content: "❌ Profile ma jiro.", ephemeral: true }); return; }
      const today = new Date().toISOString().split("T")[0];
      const qGS = storage.ensureGameStats(qPlayer.gameStats);
      if (!qGS.quests || qGS.quests.date !== today) {
        await interaction.reply({ content: "❌ Questgan data kama jirto. Isku day !quests mar kale.", ephemeral: true }); return;
      }
      const claimKey = `claimed${qNum}`;
      const valKey = `q${qNum}`;
      if (qGS.quests[claimKey]) {
        await interaction.reply({ content: "✅ Questkan horay ayaad u qaadatay!", ephemeral: true }); return;
      }
      const dailyQs = getDailyQuests();
      const q = dailyQs[qNum - 1];
      if (!q) { await interaction.reply({ content: "❌ Quest ma jirto.", ephemeral: true }); return; }
      if ((qGS.quests[valKey] || 0) < q.target) {
        await interaction.reply({ content: `⏳ Quest weli ma dhammaystirna! (${qGS.quests[valKey] || 0}/${q.target})`, ephemeral: true }); return;
      }
      qGS.quests[claimKey] = true;
      await db.update(players).set({ gameStats: qGS }).where(eq(players.discordId, interaction.user.id));
      const _questNwBlock = await nwCapBlocked(interaction.user.id, q.coins);
      if (_questNwBlock) {
        await interaction.reply({ embeds: [_questNwBlock], ephemeral: true }); return;
      }

      const _qTRes = await pool.query(
        `UPDATE bot_wallet SET coins = GREATEST(0, coins - $1) WHERE id = 1 AND coins >= $1 RETURNING coins`,
        [q.coins]
      );
      const _qActual = _qTRes.rows.length ? q.coins : 0;
      if (_qActual > 0) {
        console.log(`[TREASURY] -${_qActual} → quest-claim for ${interaction.user.id}`);
      } else {
        console.log(`[TREASURY] Insufficient funds — quest coins skipped for ${interaction.user.id} (wanted ${q.coins})`);
      }
      const updQ = _qActual > 0 ? await storage.addCoins(interaction.user.id, _qActual) : await storage.getPlayer(interaction.user.id);
      await db.update(players).set({ xp: Math.min((qPlayer.xp || 0) + q.xp, 999999) }).where(eq(players.discordId, interaction.user.id));
      logEconomy(interaction.user.id, "quest-claim", _qActual, "gain");
      const newBal = updQ?.coins ?? (qPlayer.coins || 0);
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("\uD83C\uDF81 Quest Abaal \u2014 Hambalyo!")
          .setDescription([
            `\u2705 **${q.desc}** \u2014 dhammaystirtay!`,
            "",
            `\uD83D\uDCB0 **+${_qActual.toLocaleString()} Coins** ayaad heshay!`,
            `\u2728 **+${q.xp} XP** ayaad heshay!`,
            `\uD83D\uDCB5 Balance cusub: **${newBal.toLocaleString()} Coins**`,
          ].join("\n"))
          .setColor(0x2ecc71)],
        ephemeral: true,
      });
      return;
    }
    if (interaction.customId.startsWith("inv_deposit_")) {
      const invOwnerId = interaction.customId.replace("inv_deposit_", "");
      if (interaction.user.id !== invOwnerId) {
        await interaction.reply({ content: "\u274C Maalgashigaas kama faa\u2019iidaysan kartid!", ephemeral: true });
        return;
      }
      const invModal = new ModalBuilder().setCustomId("modal_invest_deposit").setTitle("\uD83D\uDCB0 Maalgashiga \u2014 Deposit");
      invModal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("invest_amount").setLabel("Xaddiga aad maalgashanayso (Coins)").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Tusaale: 5000")
        )
      );
      await interaction.showModal(invModal);
      return;
    }
    if (interaction.customId.startsWith("inv_withdraw_")) {
      const invOwnerId = interaction.customId.replace("inv_withdraw_", "");
      if (interaction.user.id !== invOwnerId) {
        await interaction.reply({ content: "❌ Badhanka kaaga ma ahan.", ephemeral: true }); return;
      }
      try {
        await withUserLock(interaction.user.id, async () => {
          const wLastVote = await getLastVoteTime(interaction.user.id);
          const wVoted = hasVoteBoost(wLastVote);
          const W_WITHDRAW_CD = wVoted ? 12 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
          const wPlayer = await storage.getPlayer(interaction.user.id);
          if (!wPlayer) { await interaction.reply({ content: "❌ Profile ma jiro.", ephemeral: true }); return; }
          const wGS = storage.ensureGameStats(wPlayer.gameStats);
          const wInv = wGS.invest || { amount: 0, lastClaim: Date.now(), totalEarned: 0, depositedAt: 0 };
          if (!wInv.amount || wInv.amount <= 0) {
            await interaction.reply({ content: "❌ Lacag la maalgeliyay ma jirto.", ephemeral: true }); return;
          }
          if (wInv.depositedAt && (Date.now() - wInv.depositedAt < W_WITHDRAW_CD)) {
            const wRemMs = W_WITHDRAW_CD - (Date.now() - wInv.depositedAt);
            const wRemH = Math.floor(wRemMs / 3600000);
            const wRemM = Math.floor((wRemMs % 3600000) / 60000);
            const wRemStr = wRemH > 0 ? `${wRemH}h ${wRemM > 0 ? `${wRemM}m` : ""}`.trim() : `${wRemM}m`;
            const voteHint = wVoted ? "" : "\n💡 U codee (`!vote`) si aad ugu qaato 12h kaliya!";
            await interaction.reply({ content: `🔒 Lacagta weli ma qaadan kartid. **${wRemStr}** ka dib ka qaado.${voteHint}`, ephemeral: true }); return;
          }
          const wProfit     = calcInvestProfit(wInv);

          const wUserProfit = wProfit > 0 ? Math.floor(wProfit * 0.75) : 0;
          const wTax        = wProfit > 0 ? (wProfit - wUserProfit) : 0;
          const wReturn     = wInv.amount + wUserProfit;
          if (wUserProfit > 0) {
            const _wInvNwBlock = await nwCapBlocked(interaction.user.id, wUserProfit);
            if (_wInvNwBlock) {
              await interaction.reply({ embeds: [_wInvNwBlock], ephemeral: true }); return;
            }
          }
          const withdrawResult = await storage.addCoins(interaction.user.id, wReturn);
          if (wTax > 0) {
            await pool.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [wTax]);
            console.log(`[TREASURY] +${wTax} ← invest-withdraw tax from ${interaction.user.id} (gross profit ${wProfit})`);
          }
          if (wProfit > 0) logEconomy(interaction.user.id, "invest-profit", wUserProfit, "gain");
          logEconomy(interaction.user.id, "invest-withdraw", wInv.amount, "gain");
          wGS.invest = { amount: 0, lastClaim: Date.now(), totalEarned: (wInv.totalEarned || 0) + wProfit, depositedAt: 0 };
          await db.update(players).set({ gameStats: wGS }).where(eq(players.discordId, interaction.user.id));
          const wNewBal = withdrawResult?.coins ?? (wPlayer.coins || 0) + wReturn;
          await interaction.reply({
            content: [
              `✅ **${wReturn.toLocaleString()} Coins** wallet-kaaga waa lagu celiyay!`,
              wProfit > 0 ? `📈 Faa'iido (75%): +${wUserProfit.toLocaleString()} Coins` : "",
              wTax > 0    ? `📑 Canshuur (25%): -${wTax.toLocaleString()} Coins` : "",
              `💰 Balance cusub: **${wNewBal.toLocaleString()} Coins**`,
            ].filter(Boolean).join("\n"),
            ephemeral: true,
          });
        });
      } catch (err) {
        console.error("[ERROR] inv_withdraw handler:", err);
        try { await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true }); } catch {}
      }
      return;
    }
    if (interaction.customId.startsWith("inv_claim_")) {
      const invOwnerId = interaction.customId.replace("inv_claim_", "");
      if (interaction.user.id !== invOwnerId) {
        await interaction.reply({ content: "❌ Badhanka kaaga ma ahan.", ephemeral: true }); return;
      }
      try {
        await withUserLock(interaction.user.id, async () => {
          const cLastVote = await getLastVoteTime(interaction.user.id);
          const cVoted = hasVoteBoost(cLastVote);
          const C_CLAIM_CD = cVoted ? 6 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
          const cPlayer = await storage.getPlayer(interaction.user.id);
          if (!cPlayer) { await interaction.reply({ content: "❌ Profile ma jiro.", ephemeral: true }); return; }
          const cGS = storage.ensureGameStats(cPlayer.gameStats);
          const cInv = cGS.invest || { amount: 0, lastClaim: Date.now(), totalEarned: 0, depositedAt: 0 };
          const timeSinceLastClaim = Date.now() - (cInv.lastClaim || Date.now());
          if (timeSinceLastClaim < C_CLAIM_CD) {
            const cRemMs = C_CLAIM_CD - timeSinceLastClaim;
            const cRemH = Math.floor(cRemMs / 3600000);
            const cRemM = Math.floor((cRemMs % 3600000) / 60000);
            const cRemStr = cRemH > 0 ? `${cRemH}h ${cRemM > 0 ? `${cRemM}m` : ""}`.trim() : `${cRemM}m`;
            const cVoteHint = cVoted ? "" : "\n💡 U codee (`!vote`) si aad ugu qaadato 6h kaliya!";
            await interaction.reply({ content: `⏳ Faa'iido weli ma diyaar gashana. **${cRemStr}** ka dib.${cVoteHint}`, ephemeral: true }); return;
          }
          const cProfit = calcInvestProfit(cInv);
          if (cProfit <= 0) {
            await interaction.reply({ content: "⏳ Faa'iido ma jirto weli — Dhig lacag marka hore.", ephemeral: true }); return;
          }

          const cUserProfit = Math.floor(cProfit * 0.75);
          const cTax        = cProfit - cUserProfit;
          const _claimNwBlock = await nwCapBlocked(interaction.user.id, cUserProfit);
          if (_claimNwBlock) {
            await interaction.reply({ embeds: [_claimNwBlock], ephemeral: true }); return;
          }
          await storage.addCoins(interaction.user.id, cUserProfit);
          await pool.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [cTax]);
          console.log(`[TREASURY] +${cTax} ← invest-claim tax from ${interaction.user.id} (gross profit ${cProfit})`);
          logEconomy(interaction.user.id, "invest-profit", cUserProfit, "gain");
          cGS.invest = { ...cInv, lastClaim: Date.now(), totalEarned: (cInv.totalEarned || 0) + cProfit };
          await db.update(players).set({ gameStats: cGS }).where(eq(players.discordId, interaction.user.id));
          const cNewBal = (cPlayer.coins || 0) + cUserProfit;
          await interaction.reply({
            content: `📈 **+${cUserProfit.toLocaleString()} Coins** faa'iido waa la qaatay!\n📑 Canshuur (25%): **-${cTax.toLocaleString()} Coins**\n💰 Balance cusub: **${cNewBal.toLocaleString()} Coins**\n⏱️ Claim-ka xiga: ${cVoted ? "6h" : "12h"}`,
            ephemeral: true,
          });
        });
      } catch (err) {
        console.error("[ERROR] inv_claim handler:", err);
        try { await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true }); } catch {}
      }
      return;
    }
    if (interaction.customId.startsWith("give_confirm_") || interaction.customId.startsWith("give_cancel_")) {
      const isGiveConfirm = interaction.customId.startsWith("give_confirm_");
      const giveIdFromBtn = interaction.customId.replace(isGiveConfirm ? "give_confirm_" : "give_cancel_", "");
      let pendingEntry = null;
      let pendingSenderId = null;
      for (const [sid, entry] of pendingGives.entries()) {
        if (entry.giveId === giveIdFromBtn) { pendingEntry = entry; pendingSenderId = sid; break; }
      }
      if (!pendingEntry) {
        await interaction.reply({ content: "⚠️ Wareejintani ma jirto ama way dhammaatay.", ephemeral: true });
        return;
      }
      if (interaction.user.id !== pendingEntry.senderId && interaction.user.id !== pendingEntry.receiverId) {
        await interaction.reply({ content: "❌ Meel walpa ha isku dhex tuurin.", ephemeral: true });
        return;
      }
      if (!isGiveConfirm) {
        clearTimeout(pendingEntry.timeout);
        pendingGives.delete(pendingSenderId);
        economyProcessing.delete(pendingSenderId + "_give");
        const canceledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`give_confirm_${giveIdFromBtn}`).setLabel("✅ 0").setStyle(ButtonStyle.Success).setDisabled(true),
          new ButtonBuilder().setCustomId(`give_cancel_${giveIdFromBtn}`).setLabel("❌").setStyle(ButtonStyle.Danger).setDisabled(true)
        );
        await interaction.update({ embeds: [new EmbedBuilder().setTitle(`\u274C Give Cancelled | ${pendingEntry.senderName} \u2192 ${pendingEntry.receiverName}`).setDescription(`<@${interaction.user.id}> waxay joojiyeen wareejinta. Coins ma wareegsamin.`).setColor(15158332)], components: [canceledRow] });
        return;
      }
      if (pendingEntry.confirmedBy.has(interaction.user.id)) {
        await interaction.reply({ content: "✅ Horey ayaad u xaqiijisay.", ephemeral: true });
        return;
      }
      pendingEntry.confirmedBy.add(interaction.user.id);
      const giveConfirmCount = pendingEntry.confirmedBy.size;
      if (giveConfirmCount < 2) {
        const updatedGiveRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`give_confirm_${giveIdFromBtn}`).setLabel(`✅ ${giveConfirmCount}`).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`give_cancel_${giveIdFromBtn}`).setLabel("❌").setStyle(ButtonStyle.Danger)
        );
        await interaction.update({ components: [updatedGiveRow] });
        return;
      }
      clearTimeout(pendingEntry.timeout);
      pendingGives.delete(pendingSenderId);
      economyProcessing.delete(pendingSenderId + "_give");
      if (!(await storage.getPlayer(pendingEntry.receiverId))) {
        const rUser = await interaction.client.users.fetch(pendingEntry.receiverId).catch(() => null);
        await storage.createPlayer({ discordId: pendingEntry.receiverId, username: rUser?.username || pendingEntry.receiverName }).catch(() => {});
      }
      await withDualUserLock(pendingEntry.senderId, pendingEntry.receiverId, async () => {
        const updatedGiver = await storage.spendCoins(pendingEntry.senderId, pendingEntry.amount);
        if (!updatedGiver) {
          await interaction.reply({ content: "❌ Wareejin istaagtay walletkaaga kuma jirto lacag kugu filan.", ephemeral: true });
          return;
        }
        const _giveNwBlock = await nwCapBlocked(pendingEntry.receiverId, pendingEntry.amount);
        if (_giveNwBlock) {
          await storage.addCoins(pendingEntry.senderId, pendingEntry.amount);
          try { await interaction.message.delete(); } catch {}
          await interaction.deferUpdate().catch(() => {});
          await interaction.channel.send({ content: `\u274C **Give Blocked** | <@${pendingEntry.receiverId}> xadkooda Net Worth darteed coins ma heli karaan. Lacagta waxaa loo celiyay <@${pendingEntry.senderId}>.`, embeds: [_giveNwBlock] });
          return;
        }
        await storage.addCoins(pendingEntry.receiverId, pendingEntry.amount);
        logEconomy(pendingEntry.senderId, `give→${pendingEntry.receiverId}`, pendingEntry.amount, "loss");
        logEconomy(pendingEntry.receiverId, `give←${pendingEntry.senderId}`, pendingEntry.amount, "gain");
        try { await interaction.message.delete(); } catch {}
        await interaction.deferUpdate().catch(() => {});
        await interaction.channel.send(`<a:tick:1490266261916225646> **Give Success 💸 | ${pendingEntry.senderName} -> ${pendingEntry.receiverName}**\n<@${pendingEntry.senderId}> ayaa **${pendingEntry.amount.toLocaleString()} Coins** u direen <@${pendingEntry.receiverId}>!`);
      });
      return;
    }

    if (interaction.customId.startsWith("shopv2_close_")) {
      const oid = interaction.customId.replace("shopv2_close_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      activeShopPanels.delete(oid);
      try {
        if ((interaction.message?.flags?.bitfield ?? 0) & 64) {
          await interaction.update({ content: " ", embeds: [], components: [] });
        } else {
          await interaction.deferUpdate();
          await interaction.message.delete().catch(() => {});
        }
      } catch { try { await interaction.deferUpdate(); } catch {} }
      return;
    }

    if (interaction.customId.startsWith("shopv2_main_")) {
      const oid = interaction.customId.replace("shopv2_main_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      try {
        let p = await storage.getPlayer(oid);
        if (!p) p = { coins: 0, diamonds: 0 };
        const mx = await getShopPriceMultiplier().catch(() => 1.0);
        await interaction.update({ embeds: [buildShopMainEmbed(p.coins || 0, p.diamonds || 0, mx)], components: buildShopMainRows(oid) });
      } catch (e) { console.error("[SHOP] shopv2_main error:", e); try { await interaction.deferUpdate(); } catch {} }
      return;
    }

    if (interaction.customId.startsWith("shopv2_cat_")) {
      const rest = interaction.customId.replace("shopv2_cat_", "");
      const sepIdx = rest.lastIndexOf("_");
      const cat = rest.slice(0, sepIdx);
      const oid = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      if (cat === "heist") {
        try {
          let p = await storage.getPlayer(oid);
          if (!p) p = { coins: 0 };
          const rotData = await getHeistRotations(HEIST_COIN_IDS);
          await interaction.update({ embeds: [buildHeistCoinEmbed(rotData, p.coins || 0)], components: buildHeistCoinRows(rotData, oid) });
        } catch (e) { console.error("[SHOP] heist cat error:", e); try { await interaction.deferUpdate(); } catch {} }
        return;
      }
      try {
        let p = await storage.getPlayer(oid);
        if (!p) p = { coins: 0 };
        const catMx = await getShopPriceMultiplier().catch(() => 1.0);
        await interaction.update({ embeds: [buildShopCatEmbed(cat, p.coins || 0, catMx)], components: buildShopCatRows(cat, oid) });
      } catch (e) { console.error("[SHOP] shopv2_cat error:", e); try { await interaction.deferUpdate(); } catch {} }
      return;
    }

    if (interaction.customId.startsWith("shopv2_hsel_")) {
      const oid = interaction.customId.replace("shopv2_hsel_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      const item = interaction.values?.[0];
      const hi = HEIST_ITEMS[item];
      if (!hi) return interaction.update({ content: "❌ Itemkas lama halin.", embeds: [], components: [] });
      try {
        const rotData = await getHeistRotations([item]);
        const rot = rotData[item];
        if (!rot || rot.stock <= 0) {
          return interaction.update({ content: `❌ **${hi.label}** waa sold out. Dib u eeg marka stock dib u cusboonaaday.`, embeds: [], components: [] });
        }
        const p = await storage.getPlayer(oid);
        if (!p) return interaction.update({ content: "❌ Profile lama helin. Qor `!start`.", embeds: [], components: [] });
        const userCoins = p.coins || 0;
        const canAfford = userCoins >= hi.price;
        const confirmEmbed = new EmbedBuilder()
          .setTitle("🗡️  Confirm Purchase")
          .setColor(0xe67e22)
          .setDescription(`### ${hi.label}\n${hi.rarity}\n\n*${hi.flavor}*`)
          .addFields(
            { name: "📊 Stat",        value: hi.stat,                                                inline: true },
            { name: "🎯 Phase",       value: hi.phase,                                               inline: true },
            { name: "💸 Price",       value: `**${hi.price.toLocaleString()} 🪙**`,                  inline: true },
            { name: "📦 Stock",       value: `${rot.stock} left`,                                    inline: true },
            { name: "💰 Haysatid",    value: `${userCoins.toLocaleString()} 🪙 ${canAfford ? "✅" : "❌"}`, inline: true },
            { name: "⚠️ 1-Time Use", value: "Consumed on next `!heist` use",                        inline: true },
          )
          .setFooter({ text: "Guji Xaqiiji si aad u iibsato, ama Jooji si aad u noqoto." });
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`shopv2_hconfirm_${item}_${oid}`).setLabel("✅ Xaqiiji").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`shopv2_cat_heist_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
        );
        return interaction.update({ embeds: [confirmEmbed], components: [confirmRow] });
      } catch (e) {
        console.error("[SHOP] hsel error:", e);
        return interaction.update({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
      }
    }

    if (interaction.customId.startsWith("shopv2_buy_")) {
      const rest = interaction.customId.replace("shopv2_buy_", "");
      const sepIdx = rest.lastIndexOf("_");
      const item = rest.slice(0, sepIdx);
      const oid  = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });

      if (item.startsWith("h_")) {
        const hi = HEIST_ITEMS[item];
        if (!hi) return;
        try {
          const rotData = await getHeistRotations([item]);
          const rot = rotData[item];
          if (!rot || rot.stock <= 0) {
            return interaction.update({ content: `❌ **${hi.label}** waa sold out. Dib u eeg marka stock dib u cusboonaado.`, embeds: [], components: [] });
          }
          const p = await storage.getPlayer(oid);
          if (!p) return interaction.update({ content: "❌ Profile lama helin. Qor `!start`.", embeds: [], components: [] });
          if ((p.coins || 0) < hi.price) {
            return interaction.update({ content: `❌ Coins kuguma filna.\n💰 Haysatid: **${(p.coins||0).toLocaleString()}** · Lagaa rabo: **${hi.price.toLocaleString()}**`, embeds: [], components: [] });
          }
          const invCheck = await pool.query(`SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id=$2`, [oid, item]);
          if ((invCheck.rows[0]?.quantity || 0) >= 1) {
            return interaction.update({ content: `❌ **${hi.label}** horaa u haysataa inventory-gaaga!\n\nIsticmaal \`!myitems\` si aad u aragto.`, embeds: [], components: [] });
          }
          const confirmEmbed = new EmbedBuilder()
            .setTitle("🗡️ Xaqiiji Iibsashada — Heist Item")
            .setColor(0xe67e22)
            .setDescription(`**${hi.label}**\n${hi.rarity}\n\n*${hi.flavor}*`)
            .addFields(
              { name: "📊 Stat",           value: hi.stat,                             inline: true },
              { name: "🎯 Phase",          value: hi.phase,                            inline: true },
              { name: "💸 Qiimaha",        value: `**${hi.price.toLocaleString()} 🪙 Coins**`, inline: true },
              { name: "📦 Stock Remaining",value: `${rot.stock} left`,                 inline: true },
              { name: "⚠️ 1-Time Use",    value: "Item will be consumed when used in `!heist`", inline: false }
            )
            .setFooter({ text: "Guji Xaqiiji si aad u sii wado." });
          const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`shopv2_hconfirm_${item}_${oid}`).setLabel("✅ Xaqiiji — Iibso").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`shopv2_cat_heist_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
          );
          return interaction.update({ embeds: [confirmEmbed], components: [confirmRow] });
        } catch (e) {
          console.error("[SHOP] heist buy error:", e);
          return interaction.update({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
        }
      }
      const shopPrices = { xpboost: 500, luckycrate: 750, shield: 1200, title: 2000, liin: 100, xpabsorb: 250, slotinsurance: 600 };
      const shopNames  = { xpboost: "⚡ XP Boost", luckycrate: "🍀 Lucky Crate", shield: "🛡️ Streak Shield", title: "🏅 Coin Lord Title", liin: "🍋 Liin Dhanaan", xpabsorb: "🧲 XP Absorb", slotinsurance: "🎰 Slot Insurance" };
      const shopDescs  = { xpboost: "+10 XP/maalin × 7 maalmood", luckycrate: "waxaad ka heli kartaa: Coins, Diamonds, ama XP Boost", shield: "Streakgaaga daily hal mar badbaadi", title: "Hel title \"💰 Coin Lord\"", liin: "Hoos u dhig rob cooldown 10% (stacks!) mar kasta oo aad isticmaasho", xpabsorb: "Labo jibaar XP ciyaarta xigta", slotinsurance: "30% khasaaraha waa laguu soo celinayaa" };
      const buyMx = await getShopPriceMultiplier().catch(() => 1.0);
      const basePrice = shopPrices[item];
      const price = Math.floor((basePrice || 0) * buyMx);
      const label = shopNames[item];
      if (!basePrice || !label) return;

      if (item === "xpabsorb") {
        const xpaEmbed = new EmbedBuilder()
          .setTitle("🧲  XP Absorb")
          .setDescription(
            `📜 Waxaad labo jibaartaa expgaaga (XP) ciyaarta xigta…

` +
            `⚡ Ciyaartaada xigta **(FTI, Miino, Sheeko, Tower)**
` +
            `waxaa laba jibaarmaya exp ga aad hesho.

` +
            `🎯 Fursad fiican oo aad si degdeg ah u badin karto levelkaaga!

` +
            `━━━━━━━━━━━━━━━
` +
            `💰 **Qiimaha:** ${price.toLocaleString()} 🪙
` +
            `🧪 **Nooc:** Hal mar la isticmaal

❓ Ma xaqiijinaysaa iibsashada?`
          )
          .addFields(
            { name: "🧲 XP Absorb", value: `💰 ${price.toLocaleString()} 🪙`, inline: true },
            { name: "📈 Saamaynta", value: "Ciyaartaada xigta XP-ga waa la labanlaabi doonaa.", inline: true },
          )
          .setColor(0x9b59b6)
          .setFooter({ text: "Nasiib Boosts • Xoogaa caqli ah + nasiib = guul" });
        return interaction.update({ embeds: [xpaEmbed], components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`shopv2_confirm_xpabsorb_${oid}`).setLabel("✅ Xaqiiji").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`shopv2_cat_boosts_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
        )] });
      }

      if (item === "slotinsurance") {
        const siEmbed = new EmbedBuilder()
          .setTitle("🎰  Slot Insurance")
          .setDescription(
            `📜 Nasiibku mar walba ma fiicna… laakiin maanta waa saas maaha!

` +
            `🛡️ Haddii spinkaaga xiga ee !slots ku guuldareystato,
` +
            `waxaad dib u heli doontaa **30%** lacagta aad gelisay.

` +
            `🎲 Qamaar badan? Khasaaro yar!

` +
            `━━━━━━━━━━━━━━━
` +
            `💰 **Qiimaha:** ${price.toLocaleString()} 🪙
` +
            `🧪 **Nooc:** Hal mar la isticmaal

❓ Ma xaqiijinaysaa iibsashada?`
          )
          .addFields(
            { name: "🎰 Slot Insurance",        value: `💰 ${price.toLocaleString()} 🪙`, inline: true },
            { name: "🛡️ Haddii aad khasaarto", value: "30% lacagta waa laguu soo celinayaa.", inline: true },
          )
          .setColor(0xe67e22)
          .setFooter({ text: "Nasiib Boosts • Xoogaa caqli ah + nasiib = guul" });
        return interaction.update({ embeds: [siEmbed], components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`shopv2_confirm_slotinsurance_${oid}`).setLabel("✅ Xaqiiji").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`shopv2_cat_boosts_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
        )] });
      }

      let confirmEmbed;
      const buyPriceStr = buyMx > 1.01
        ? `~~${basePrice.toLocaleString()}~~ → **${price.toLocaleString()} Coins** 📈`
        : buyMx < 0.99
        ? `~~${basePrice.toLocaleString()}~~ → **${price.toLocaleString()} Coins** 📉`
        : `**${price.toLocaleString()} Coins**`;
      if (item === "liin") {
        confirmEmbed = new EmbedBuilder()
          .setTitle("🍋 Liin Dhanaan")
          .setDescription(
            `Cabitaan yar oo energy leh 🍋\n` +
            `Waxay hoos u dhigtaa cooldown ka dhicista (rob) **10%** mar kasta oo aad isticmaasho.\n\n` +
            `*Sir yar — isticmaal dhowr mar si aad u kororsato saamaynta!*`
          )
          .addFields({ name: "💸 Qiimaha", value: buyPriceStr, inline: true })
          .setColor(0xf1c40f)
          .setFooter({ text: "Guji Xaqiiji si aad u sii wado ama jooji si aad u joojiso." });
      } else {
        confirmEmbed = new EmbedBuilder()
          .setTitle("🛍️ Xaqiiji Iibsashada")
          .setDescription(`Ma hubtaa in aad iib sanayso?\n\n**${label}**\n📝 ${shopDescs[item]}`)
          .addFields({ name: "💸 Qiimaha", value: buyPriceStr, inline: true })
          .setColor(0xf39c12)
          .setFooter({ text: "Guji Xaqiiji si aad u sii wado ama jooji si aad u joojiso." });
      }
      const shopItemCat = { xpboost: "boosts", luckycrate: "boosts", shield: "items", title: "items", liin: "boosts", xpabsorb: "boosts", slotinsurance: "boosts" }[item] || "boosts";
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`shopv2_confirm_${item}_${oid}`).setLabel("✅ Xaqiiji").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`shopv2_cat_${shopItemCat}_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
      );
      return interaction.update({ embeds: [confirmEmbed], components: [confirmRow] });
    }

    if (interaction.customId.startsWith("shopv2_confirm_")) {
      const rest = interaction.customId.replace("shopv2_confirm_", "");
      const sepIdx = rest.lastIndexOf("_");
      const item = rest.slice(0, sepIdx);
      const oid  = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      await interaction.deferUpdate();
      let shopPlayer = await storage.getPlayer(oid);
      if (!shopPlayer) return interaction.editReply({ content: "❌ Profile lama helin, qor `!start`.", embeds: [], components: [] });
      const shopBasePrices = { xpboost: 500, luckycrate: 750, shield: 1200, title: 2000, liin: 100, xpabsorb: 250, slotinsurance: 600 };
      const shopBasePrice = shopBasePrices[item];
      if (!shopBasePrice) return interaction.editReply({ content: "❌ Itemkas lama helin.", embeds: [], components: [] });
      const confirmMx = await getShopPriceMultiplier().catch(() => 1.0);
      const shopPrice = Math.floor(shopBasePrice * confirmMx);
      const dismissRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`shopv2_main_${oid}`).setLabel("🛒 Dib ugu noqo shopka").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`shopv2_dismiss_${oid}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Secondary),
      );
      const makeShopSuccessEmbed = (label, price, detail) => new EmbedBuilder()
        .setTitle("✅ Iibsi guulaystay!")
        .setDescription(`🛍️ **${label}** waad iibsatay!`)
        .addFields(
          { name: "💸 Lacagta La Bixiyey", value: `${price.toLocaleString()} Coins`, inline: true },
          { name: "🎁 Abaalmarinta",        value: detail || "—",                    inline: true },
        )
        .setColor(0x27ae60)
        .setTimestamp();
      if ((shopPlayer.coins || 0) < shopPrice) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("❌ Iibsi Fashilmay").setDescription(`Coins kuguma filna.\n💰 Haysatid: **${(shopPlayer.coins || 0).toLocaleString()}** ·Lagaa rabo: **${shopPrice.toLocaleString()}**`).setColor(0xe74c3c)],
          components: [dismissRow],
        });
      }
      const shopGStats = storage.ensureGameStats(shopPlayer.gameStats);
      if (item === "xpboost") {
        const spentXp = await storage.spendCoins(oid, shopPrice);
        if (!spentXp) return interaction.editReply({ content: "❌ Lacag kuguma filna.", embeds: [], components: [] });
        shopGStats.xpBoostDays = (shopGStats.xpBoostDays || 0) + 7;
        await db.update(players).set({ gameStats: shopGStats }).where(eq(players.discordId, oid));
        await storage.addBotCoins(shopPrice);
        return interaction.editReply({ embeds: [makeShopSuccessEmbed("⚡ XP Boost", shopPrice, "+10 XP/maalin × 7 maalmood")], components: [dismissRow] });
      } else if (item === "luckycrate") {
        await storage.spendCoins(oid, shopPrice);
        await storage.addBotCoins(shopPrice);
        const crateRoll = Math.random();
        let crateReward;
        if (crateRoll < 0.50) {
          const crateCoins = Math.floor(Math.random() * 451) + 50;
          if (!(await nwCapBlocked(oid, crateCoins))) {
            await storage.addCoins(oid, crateCoins);
            storage.spendBotCoins(crateCoins).catch(() => {});
            logEconomy(oid, "shop-luckycrate", crateCoins, "gain");
            crateReward = `+${crateCoins.toLocaleString()} Coins`;
          } else {
            crateReward = `+${crateCoins.toLocaleString()} Coins \\u{1F512} (NW xad)`;
          }
        } else if (crateRoll < 0.80) {
          const crateDias = Math.floor(Math.random() * 16) + 10;
          await storage.addDiamonds(oid, crateDias);
          logEconomy(oid, "shop-luckycrate-dias", crateDias, "gain");
          crateReward = `+${crateDias} 💎 Diamonds`;
        } else {
          shopGStats.xpBoostDays = (shopGStats.xpBoostDays || 0) + 3;
          await db.update(players).set({ gameStats: shopGStats }).where(eq(players.discordId, oid));
          crateReward = `⚡ XP Boost (3 maalmood)`;
        }
        return interaction.editReply({ embeds: [makeShopSuccessEmbed("🍀 Lucky Crate", shopPrice, crateReward)], components: [dismissRow] });
      } else if (item === "shield") {
        if (shopGStats.streakShield) return interaction.editReply({ content: "🛡️ Horaa u haysataa Streak Shield!", embeds: [], components: [] });
        const spentShield = await storage.spendCoins(oid, shopPrice);
        if (!spentShield) return interaction.editReply({ content: "❌ Lacag kuguma filna.", embeds: [], components: [] });
        shopGStats.streakShield = true;
        await db.update(players).set({ gameStats: shopGStats }).where(eq(players.discordId, oid));
        await storage.addBotCoins(shopPrice);
        return interaction.editReply({ embeds: [makeShopSuccessEmbed("🛡️ Streak Shield", shopPrice, "Streak-kaaga waa badbaadday!")], components: [dismissRow] });
      } else if (item === "title") {
        if (shopPlayer.activeTitle === "💰 Coin Lord") return interaction.editReply({ content: "🏅 Horaa u haysataa Coin Lord title!", embeds: [], components: [] });
        await storage.spendCoins(oid, shopPrice);
        await storage.addBotCoins(shopPrice);
        await storage.updateTitle(oid, "💰 Coin Lord");
        return interaction.editReply({ embeds: [makeShopSuccessEmbed("🏅 Coin Lord Title", shopPrice, "\"💰 Coin Lord\" profile-kaaga ayaa lagu daray")], components: [dismissRow] });
      } else if (item === "liin") {
        const spentLiin = await storage.spendCoins(oid, shopPrice);
        if (!spentLiin) return interaction.editReply({ content: "❌ Lacag kuguma filna.", embeds: [], components: [] });
        await storage.addBotCoins(shopPrice);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1, 'liin', 1, $2)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at = $2`,
          [oid, Date.now()]
        );
        logEconomy(oid, "shop-liin", shopPrice, "spend");
        return interaction.editReply({ embeds: [new EmbedBuilder()
          .setTitle("✅ Iibsi guulaystay!")
          .setDescription(`🛍�� **🍋 Liin Dhanaan** ayaad iibsatay!\n\nIsticmaal \`!use liin\` si aad rob CD-gaaga 10% hoos uga dhigto.`)
          .addFields(
            { name: "💸 Lacagta La Bixiyey", value: `100 Coins`, inline: true },
            { name: "🎁 Abaalmarinta",        value: `🍋 Liin Dhanaan × 1`, inline: true },
          )
          .setColor(0x27ae60)
          .setTimestamp()], components: [dismissRow] });
      }
      if (item === "xpabsorb") {
        const xpaSpent = await storage.spendCoins(oid, shopPrice);
        if (!xpaSpent) return interaction.editReply({ content: "❌ Lacag kuguma filna.", embeds: [], components: [] });
        await storage.addBotCoins(shopPrice);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1, 'xpabsorb', 1, $2)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at = $2`,
          [oid, Date.now()]
        );
        logEconomy(oid, "shop-xpabsorb", shopPrice, "spend");
        return interaction.editReply({ embeds: [new EmbedBuilder()
          .setTitle("✅ Iibsi guulaystay!")
          .setDescription(`🛍️ **🧲 XP Absorb** ayaad iibsatay!\n\nIsticmaal \`!use xpabsorb\` si aad u shiddo — ciyaartaada xigta XP-ga waa la labanlaabi doonaa.`)
          .addFields(
            { name: "💸 Lacagta La Bixiyey", value: `${shopPrice.toLocaleString()} Coins`, inline: true },
            { name: "🎁 Abaalmarinta",        value: `🧲 XP Absorb × 1`, inline: true },
          )
          .setColor(0x9b59b6).setFooter({ text: "Nasiib Boosts • Xoogaa caqli ah + nasiib = guul" }).setTimestamp()], components: [dismissRow] });
      }
      if (item === "slotinsurance") {
        const siSpent = await storage.spendCoins(oid, shopPrice);
        if (!siSpent) return interaction.editReply({ content: "❌ Lacag kuguma filna.", embeds: [], components: [] });
        await storage.addBotCoins(shopPrice);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1, 'slotinsurance', 1, $2)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at = $2`,
          [oid, Date.now()]
        );
        logEconomy(oid, "shop-slotinsurance", shopPrice, "spend");
        return interaction.editReply({ embeds: [new EmbedBuilder()
          .setTitle("✅ Iibsi guulaystay!")
          .setDescription(`🛍️ **🎰 Slot Insurance** ayaad iibsatay!\n\nIsticmaal \`!use slotinsurance\` kahor \`!slots\` — haddii aad khasaarto, 30% waa lagugu soo celinayaa.`)
          .addFields(
            { name: "💸 Lacagta La Bixiyey", value: `${shopPrice.toLocaleString()} Coins`, inline: true },
            { name: "🎁 Abaalmarinta",        value: `🎰 Slot Insurance × 1`, inline: true },
          )
          .setColor(0xe67e22).setFooter({ text: "Nasiib Boosts • Xoogaa caqli ah + nasiib = guul" }).setTimestamp()], components: [dismissRow] });
      }
      return;
    }

    if (interaction.customId.startsWith("shopv2_cancel_")) {
      const oid = interaction.customId.replace("shopv2_cancel_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      try {
        let p = await storage.getPlayer(oid);
        if (!p) p = { coins: 0, diamonds: 0 };
        const mx = await getShopPriceMultiplier().catch(() => 1.0);
        await interaction.update({ embeds: [buildShopMainEmbed(p.coins || 0, p.diamonds || 0, mx)], components: buildShopMainRows(oid) });
      } catch (e) {
        console.error("[SHOP] cancel error:", e?.message);
        try { await interaction.deferUpdate(); } catch {}
      }
      return;
    }
    if (interaction.customId.startsWith("shopv2_dismiss_")) {
      try {
        if ((interaction.message?.flags?.bitfield ?? 0) & 64) {
          await interaction.update({ content: " ", embeds: [], components: [] });
        } else {
          await interaction.deferUpdate();
          await interaction.message.delete().catch(() => {});
        }
      } catch (e) {
        console.error("[SHOP] dismiss error:", e?.message);
        try { await interaction.deferUpdate(); } catch {}
      }
      return;
    }


    if (interaction.customId.startsWith("dshopv2_close_")) {
      const oid = interaction.customId.replace("dshopv2_close_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      activeDShopPanels.delete(oid);
      try {
        if ((interaction.message?.flags?.bitfield ?? 0) & 64) {
          await interaction.update({ content: " ", embeds: [], components: [] });
        } else {
          await interaction.deferUpdate();
          await interaction.message.delete().catch(() => {});
        }
      } catch { try { await interaction.deferUpdate(); } catch {} }
      return;
    }

    if (interaction.customId.startsWith("dshopv2_main_")) {
      const oid = interaction.customId.replace("dshopv2_main_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      try {
        let p = await storage.getPlayer(oid);
        if (!p) p = { diamonds: 0 };
        await interaction.update({ embeds: [buildDShopMainEmbed(p.diamonds || 0)], components: buildDShopMainRows(oid) });
      } catch (e) { console.error("[DSHOP] dshopv2_main error:", e); try { await interaction.deferUpdate(); } catch {} }
      return;
    }

    if (interaction.customId.startsWith("dshopv2_cat_")) {
      const rest = interaction.customId.replace("dshopv2_cat_", "");
      const sepIdx = rest.lastIndexOf("_");
      const cat = rest.slice(0, sepIdx);
      const oid = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      if (cat === "heist") {
        try {
          let p = await storage.getPlayer(oid);
          if (!p) p = { diamonds: 0 };
          const rotData = await getHeistRotations(HEIST_DIA_IDS);
          await interaction.update({ embeds: [buildHeistDiaEmbed(rotData, p.diamonds || 0)], components: buildHeistDiaRows(rotData, oid) });
        } catch (e) { console.error("[DSHOP] heist cat error:", e); try { await interaction.deferUpdate(); } catch {} }
        return;
      }
      try {
        let p = await storage.getPlayer(oid);
        if (!p) p = { diamonds: 0 };
        await interaction.update({ embeds: [buildDShopCatEmbed(cat, p.diamonds || 0)], components: buildDShopCatRows(cat, oid) });
      } catch (e) { console.error("[DSHOP] dshopv2_cat error:", e); try { await interaction.deferUpdate(); } catch {} }
      return;
    }

    if (interaction.customId.startsWith("dshopv2_hsel_")) {
      const oid = interaction.customId.replace("dshopv2_hsel_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      const dshopItem = interaction.values?.[0];
      const hi = HEIST_ITEMS[dshopItem];
      if (!hi) return interaction.update({ content: "❌ Item la heli waayay.", embeds: [], components: [] });
      try {
        const rotData = await getHeistRotations([dshopItem]);
        const rot = rotData[dshopItem];
        if (!rot || rot.stock <= 0) {
          return interaction.update({ content: `❌ **${hi.label}** waa sold out. Dib u eeg marka stock dib u cusboonaado.`, embeds: [], components: [] });
        }
        const p = await storage.getPlayer(oid);
        if (!p) return interaction.update({ content: "❌ Profile lama helin. Qor `!start`.", embeds: [], components: [] });
        const userDias = p.diamonds || 0;
        const canAfford = userDias >= hi.price;
        const dConfirmEmbed = new EmbedBuilder()
          .setTitle("🗡️  Confirm Purchase")
          .setColor(0x9b59b6)
          .setDescription(`### ${hi.label}\n${hi.rarity}\n\n*${hi.flavor}*`)
          .addFields(
            { name: "📊 Stat",        value: hi.stat,                                          inline: true },
            { name: "🎯 Phase",       value: hi.phase,                                          inline: true },
            { name: "💎 Price",       value: `**${hi.price} 💎**`,                              inline: true },
            { name: "📦 Stock",       value: `${rot.stock} left`,                               inline: true },
            { name: "💎 Haysatid",    value: `${userDias} 💎 ${canAfford ? "✅" : "❌"}`,       inline: true },
            { name: "⚠️ 1-Time Use", value: "Consumed on next `!heist` use",                   inline: true },
          )
          .setFooter({ text: "Guji Xaqiiji si aad u iibsato, ama Jooji si aad u noqoto." });
        const dConfirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`dshopv2_hconfirm_${dshopItem}_${oid}`).setLabel("✅ Xaqiiji").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`dshopv2_cat_heist_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
        );
        return interaction.update({ embeds: [dConfirmEmbed], components: [dConfirmRow] });
      } catch (e) {
        console.error("[DSHOP] hsel error:", e);
        return interaction.update({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
      }
    }

    if (interaction.customId.startsWith("dshopv2_buy_")) {
      const rest = interaction.customId.replace("dshopv2_buy_", "");
      const sepIdx = rest.lastIndexOf("_");
      const dshopItem = rest.slice(0, sepIdx);
      const oid = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });

      if (dshopItem.startsWith("h_")) {
        const hi = HEIST_ITEMS[dshopItem];
        if (!hi) return;
        try {
          const rotData = await getHeistRotations([dshopItem]);
          const rot = rotData[dshopItem];
          if (!rot || rot.stock <= 0) {
            return interaction.update({ content: `❌ **${hi.label}** waa sold out. Dib u eeg marka stock dib u cusboonaado.`, embeds: [], components: [] });
          }
          const p = await storage.getPlayer(oid);
          if (!p) return interaction.update({ content: "❌ Profile lama helin. Qor `!start`.", embeds: [], components: [] });
          if ((p.diamonds || 0) < hi.price) {
            return interaction.update({ content: `❌ Diamonds kuguma filna.\n💎 Haysatid: **${(p.diamonds||0)}** · Lagaa rabo: **${hi.price} 💎**`, embeds: [], components: [] });
          }
          const invCheck = await pool.query(`SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id=$2`, [oid, dshopItem]);
          if ((invCheck.rows[0]?.quantity || 0) >= 1) {
            return interaction.update({ content: `❌ **${hi.label}** horaa u haysataa inventory-gaaga!\n\nIsticmaal \`!myitems\` si aad u aragto.`, embeds: [], components: [] });
          }
          const dConfirmEmbed = new EmbedBuilder()
            .setTitle("🗡️ Xaqiiji Iibsashada — Heist Item")
            .setColor(0x9b59b6)
            .setDescription(`**${hi.label}**\n${hi.rarity}\n\n*${hi.flavor}*`)
            .addFields(
              { name: "📊 Stat",           value: hi.stat,                   inline: true },
              { name: "🎯 Phase",          value: hi.phase,                  inline: true },
              { name: "💎 Qiimaha",        value: `**${hi.price} 💎 Diamonds**`, inline: true },
              { name: "📦 Stock Remaining",value: `${rot.stock} left`,       inline: true },
              { name: "⚠️ 1-Time Use",    value: "Item will be consumed when used in `!heist`", inline: false }
            )
            .setFooter({ text: "Guji Xaqiiji si aad u sii wado." });
          const dConfirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dshopv2_hconfirm_${dshopItem}_${oid}`).setLabel("✅ Xaqiiji — Iibso").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dshopv2_cat_heist_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
          );
          return interaction.update({ embeds: [dConfirmEmbed], components: [dConfirmRow] });
        } catch (e) {
          console.error("[DSHOP] heist buy error:", e);
          return interaction.update({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
        }
      }
      const dshopCosts = { xpsurge: 50, diacrate: 60, robshield: 35, legendtitle: 100, coinshower: 150 };
      const dshopNames = { xpsurge: "⚡ XP Surge", diacrate: "🎲 Diamond Crate", robshield: "🛡️ Rob Shield", legendtitle: "👑 Legend Title", coinshower: "💰 Coin Shower" };
      const dshopDescs = { xpsurge: "+250 XP si toos ah", diacrate: "500–1,500 Coins ama 8–20 Diamonds", robshield: "12h laguma dhici karo", legendtitle: "Dooro title-kaaga gaar ah", coinshower: "800–2,000 oo Coins ku rid wallet-kaaga" };
      const cost = dshopCosts[dshopItem];
      const dlabel = dshopNames[dshopItem];
      if (!cost || !dlabel) return;
      const dConfirmEmbed = new EmbedBuilder()
        .setTitle("💎 Xaqiiji Iibsashada")
        .setDescription(`Ma hubtaa in aad iib sanayso?\n\n**${dlabel}**\n📝 ${dshopDescs[dshopItem]}`)
        .addFields({ name: "💎 Qiimaha", value: `**${cost} Diamonds**`, inline: true })
        .setColor(0x5865f2)
        .setFooter({ text: "Guji Xaqiiji si aad u sii wado ama jooji si aad u joojiso." });
      const dshopItemCat = { xpsurge: "power", diacrate: "power", robshield: "defense", legendtitle: "premium", coinshower: "premium" }[dshopItem] || "power";
      const dConfirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dshopv2_confirm_${dshopItem}_${oid}`).setLabel("✅ Xaqiiji").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`dshopv2_cat_${dshopItemCat}_${oid}`).setLabel("⬅️").setStyle(ButtonStyle.Secondary),
      );
      return interaction.update({ embeds: [dConfirmEmbed], components: [dConfirmRow] });
    }

    if (interaction.customId.startsWith("dshopv2_confirm_")) {
      const rest = interaction.customId.replace("dshopv2_confirm_", "");
      const sepIdx = rest.lastIndexOf("_");
      const dshopItem = rest.slice(0, sepIdx);
      const oid = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      await interaction.deferUpdate();
      let dshopP = await storage.getPlayer(oid);
      if (!dshopP) return interaction.editReply({ content: "❌ Profile lama helin.", embeds: [], components: [] });
      const dshopCosts = { xpsurge: 50, diacrate: 60, robshield: 35, legendtitle: 100, coinshower: 150 };
      const dshopCost = dshopCosts[dshopItem];
      if (!dshopCost) return interaction.editReply({ content: "❌ Itemkas lama helin.", embeds: [], components: [] });
      const dDismissRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dshopv2_main_${oid}`).setLabel("💎 Dib ugu noqo dshop").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`dshopv2_dismiss_${oid}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Secondary),
      );
      const makeDShopSuccessEmbed = (label, cost, detail) => new EmbedBuilder()
        .setTitle("✅ Iibsi guulaystay!")
        .setDescription(`🛍️ **${label}** waad iibsatay!`)
        .addFields(
          { name: "💎 Lacagta La Bixiyey", value: `${cost} Diamonds`, inline: true },
          { name: "🎁 Abaalmarinta",        value: detail || "—",      inline: true },
        )
        .setColor(0x5865f2)
        .setTimestamp();
      if ((dshopP.diamonds || 0) < dshopCost) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setTitle("❌ Iibsi fashilmay").setDescription(`Diamonds kuguma filna.\n💎 Haysatid: **${(dshopP.diamonds || 0).toLocaleString()}** ·Lagaa rabo: **${dshopCost}**`).setColor(0xe74c3c)],
          components: [dDismissRow],
        });
      }
      const dshopGS = storage.ensureGameStats(dshopP.gameStats);
      const newDias = (dshopP.diamonds || 0) - dshopCost;
      if (dshopItem === "xpsurge") {
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, oid));
        await storage.addBotDiamonds(dshopCost);
        await storage.updatePlayerXP(oid, 250);
        return interaction.editReply({ embeds: [makeDShopSuccessEmbed("⚡ XP Surge", dshopCost, "+250 XP si toos ah")], components: [dDismissRow] });
      } else if (dshopItem === "diacrate") {
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, oid));
        await storage.addBotDiamonds(dshopCost);
        const dcRoll = Math.random();
        let dcReward;
        if (dcRoll < 0.60) {
          const dcCoins = Math.floor(Math.random() * 1001) + 500;
          if (!(await nwCapBlocked(oid, dcCoins))) {
            await storage.addCoins(oid, dcCoins);
            storage.spendBotCoins(dcCoins).catch(() => {});
            dcReward = `+${dcCoins.toLocaleString()} Coins`;
          } else {
            dcReward = `+${dcCoins.toLocaleString()} Coins \u{1F512} (NW xad)`;
          }
        } else {
          const dcDias = Math.floor(Math.random() * 13) + 8;
          await storage.addDiamonds(oid, dcDias);
          dcReward = `+${dcDias} 💎 Diamonds — wax kaa soo noqday!`;
        }
        return interaction.editReply({ embeds: [makeDShopSuccessEmbed("🎲 Diamond Crate", dshopCost, dcReward)], components: [dDismissRow] });
      } else if (dshopItem === "robshield") {
        if (dshopGS.robShieldEnd && Date.now() < dshopGS.robShieldEnd) return interaction.editReply({ content: "🛡️ Rob Shield horay ayuu u  shaqeynayaa!", embeds: [], components: [] });
        dshopGS.robShieldEnd = Date.now() + 12 * 3600 * 1000;
        await db.update(players).set({ diamonds: newDias, gameStats: dshopGS }).where(eq(players.discordId, oid));
        await storage.addBotDiamonds(dshopCost);
        return interaction.editReply({ embeds: [makeDShopSuccessEmbed("🛡️ Rob Shield", dshopCost, "12h laguma dhici karo")], components: [dDismissRow] });
      } else if (dshopItem === "legendtitle") {
        const legendTitles = ["🌙 Night Lord", "⚔️ Boqorka waydow", "🌊 Ocean Ruler", "🔥 Firestarter"];
        const ltRow = new ActionRowBuilder().addComponents(
          ...legendTitles.map((lt, i) => new ButtonBuilder().setCustomId(`dshop_settitle_${i}`).setLabel(lt).setStyle(ButtonStyle.Secondary))
        );
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, oid));
        await storage.addBotDiamonds(dshopCost);
        return interaction.editReply({ embeds: [makeDShopSuccessEmbed("👑 Legend Title", dshopCost, "Dooro title-kaaga:")], components: [ltRow] });
      } else if (dshopItem === "coinshower") {
        const showerCoins = Math.floor(Math.random() * 1201) + 800;
        const _showerNwBlock = await nwCapBlocked(oid, showerCoins);
        if (_showerNwBlock) return interaction.editReply({ embeds: [_showerNwBlock], components: [dDismissRow] });
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, oid));
        await storage.addBotDiamonds(dshopCost);
        await storage.addCoins(oid, showerCoins);
        storage.spendBotCoins(showerCoins).catch(() => {});
        logEconomy(oid, "dshop-coinshower", showerCoins, "gain");
        return interaction.editReply({ embeds: [makeDShopSuccessEmbed("\uD83D\uDCB0 Coin Shower", dshopCost, `+${showerCoins.toLocaleString()} Coins`)], components: [dDismissRow] });
      }
      return;
    }

    if (interaction.customId.startsWith("dshopv2_cancel_")) {
      const oid = interaction.customId.replace("dshopv2_cancel_", "");
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      try {
        let p = await storage.getPlayer(oid);
        if (!p) p = { diamonds: 0 };
        await interaction.update({ embeds: [buildDShopMainEmbed(p.diamonds || 0)], components: buildDShopMainRows(oid) });
      } catch (e) {
        console.error("[DSHOP] cancel error:", e?.message);
        try { await interaction.deferUpdate(); } catch {}
      }
      return;
    }
    if (interaction.customId.startsWith("dshopv2_dismiss_")) {
      try {
        if ((interaction.message?.flags?.bitfield ?? 0) & 64) {
          await interaction.update({ content: " ", embeds: [], components: [] });
        } else {
          await interaction.deferUpdate();
          await interaction.message.delete().catch(() => {});
        }
      } catch (e) {
        console.error("[DSHOP] dismiss error:", e?.message);
        try { await interaction.deferUpdate(); } catch {}
      }
      return;
    }


    if (interaction.customId.startsWith("shopv2_hconfirm_")) {
      const rest = interaction.customId.replace("shopv2_hconfirm_", "");
      const sepIdx = rest.lastIndexOf("_");
      const item = rest.slice(0, sepIdx);
      const oid  = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      await interaction.deferUpdate();
      const hi = HEIST_ITEMS[item];
      if (!hi) return interaction.editReply({ content: "❌ Item la heli waayay.", embeds: [], components: [] });
      const dismissRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`shopv2_main_${oid}`).setLabel("🛒 Dib ugu noqo Dukaanka").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`shopv2_dismiss_${oid}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Secondary),
      );
      try {
        const p = await storage.getPlayer(oid);
        if (!p) return interaction.editReply({ content: "❌ Profile lama helin.", embeds: [], components: [] });
        if ((p.coins || 0) < hi.price) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("❌ Iibsi Fashilmay").setDescription(`Coins kuguma filna.\n💰 Haysatid: **${(p.coins||0).toLocaleString()}** · Lagaa rabo: **${hi.price.toLocaleString()}**`).setColor(0xe74c3c)],
            components: [dismissRow],
          });
        }
        const invCheck = await pool.query(`SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id=$2`, [oid, item]);
        if ((invCheck.rows[0]?.quantity || 0) >= 1) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("❌ Horaa u Haysataa").setDescription(`**${hi.label}** horaa u haysataa inventory-gaaga!\n\nIsticmaal \`!myitems\` si aad u aragto.`).setColor(0xe74c3c)],
            components: [dismissRow],
          });
        }
        const rotRes = await pool.query(`SELECT stock, reset_at FROM heist_shop_rotation WHERE item_id=$1`, [item]);
        const rot = rotRes.rows[0];
        const nowTs = Date.now();
        if (!rot || Number(rot.stock) <= 0 || Number(rot.reset_at) < nowTs) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("❌ Sold Out").setDescription(`**${hi.label}** stock ayaa dhacay.\nDib u eeg marka stock cusub yimaado.`).setColor(0xe74c3c)],
            components: [dismissRow],
          });
        }
        const spent = await storage.spendCoins(oid, hi.price);
        if (!spent) return interaction.editReply({ content: "❌ Lacag kugu filan ma haysatid.", embeds: [], components: [] });
        await storage.addBotCoins(hi.price);
        await pool.query(`UPDATE heist_shop_rotation SET stock = GREATEST(stock - 1, 0) WHERE item_id=$1`, [item]);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1,$2,1,$3)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at=$3`,
          [oid, item, nowTs]
        );
        logEconomy(oid, `heist-buy-${item}`, hi.price, "spend");
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle("✅ Iibsi Guulaystay!")
            .setDescription(`🗡️ **${hi.label}** waad iibsatay!\n\n*${hi.flavor}*`)
            .addFields(
              { name: "📊 Stat",  value: hi.stat,                              inline: true },
              { name: "🎯 Phase", value: hi.phase,                             inline: true },
              { name: "💸 Bixiyay", value: `${hi.price.toLocaleString()} 🪙`, inline: true },
              { name: "📦 Inventory", value: "Isticmaal `!myitems` si aad u aragto.", inline: false },
            )
            .setColor(0x27ae60)
            .setTimestamp()],
          components: [dismissRow],
        });
      } catch (e) {
        console.error("[SHOP] hconfirm error:", e);
        return interaction.editReply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
      }
    }


    if (interaction.customId.startsWith("dshopv2_hconfirm_")) {
      const rest = interaction.customId.replace("dshopv2_hconfirm_", "");
      const sepIdx = rest.lastIndexOf("_");
      const item = rest.slice(0, sepIdx);
      const oid  = rest.slice(sepIdx + 1);
      if (interaction.user.id !== oid) return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      await interaction.deferUpdate();
      const hi = HEIST_ITEMS[item];
      if (!hi) return interaction.editReply({ content: "❌ Item la heli waayay.", embeds: [], components: [] });
      const dDismissRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dshopv2_main_${oid}`).setLabel("💎 Dib ugu noqo Dukaanka").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`dshopv2_dismiss_${oid}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Secondary),
      );
      try {
        const p = await storage.getPlayer(oid);
        if (!p) return interaction.editReply({ content: "❌ Profile lama helin.", embeds: [], components: [] });
        if ((p.diamonds || 0) < hi.price) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("❌ Iibsi Fashilmay").setDescription(`Diamonds kuguma filna.\n💎 Haysatid: **${p.diamonds||0}** · Lagaa rabo: **${hi.price} 💎**`).setColor(0xe74c3c)],
            components: [dDismissRow],
          });
        }
        const invCheck = await pool.query(`SELECT quantity FROM heist_inventory WHERE user_id=$1 AND item_id=$2`, [oid, item]);
        if ((invCheck.rows[0]?.quantity || 0) >= 1) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("❌ Horaa u Haysataa").setDescription(`**${hi.label}** horaa u haysataa inventory-gaaga!\n\nIsticmaal \`!myitems\` si aad u aragto.`).setColor(0xe74c3c)],
            components: [dDismissRow],
          });
        }
        const rotRes = await pool.query(`SELECT stock, reset_at FROM heist_shop_rotation WHERE item_id=$1`, [item]);
        const rot = rotRes.rows[0];
        const nowTs = Date.now();
        if (!rot || Number(rot.stock) <= 0 || Number(rot.reset_at) < nowTs) {
          return interaction.editReply({
            embeds: [new EmbedBuilder().setTitle("❌ Sold Out").setDescription(`**${hi.label}** stock ayaa dhacay.\nDib u eeg marka stock cusub yimaado.`).setColor(0xe74c3c)],
            components: [dDismissRow],
          });
        }
        const newDias = (p.diamonds || 0) - hi.price;
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, oid));
        await storage.addBotDiamonds(hi.price);
        await pool.query(`UPDATE heist_shop_rotation SET stock = GREATEST(stock - 1, 0) WHERE item_id=$1`, [item]);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1,$2,1,$3)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at=$3`,
          [oid, item, nowTs]
        );
        logEconomy(oid, `heist-buy-${item}`, hi.price, "spend");
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle("✅ Iibsi Guulaystay!")
            .setDescription(`🗡️ **${hi.label}** waad iibsatay!\n\n*${hi.flavor}*`)
            .addFields(
              { name: "📊 Stat",  value: hi.stat,             inline: true },
              { name: "🎯 Phase", value: hi.phase,            inline: true },
              { name: "💎 Bixiyay", value: `${hi.price} 💎`, inline: true },
              { name: "📦 Inventory", value: "Isticmaal `!myitems` si aad u aragto.", inline: false },
            )
            .setColor(0x5865f2)
            .setTimestamp()],
          components: [dDismissRow],
        });
      } catch (e) {
        console.error("[DSHOP] hconfirm error:", e);
        return interaction.editReply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
      }
    }


    if (interaction.customId.startsWith("limited_buy_observer_")) {
      const uid = interaction.customId.replace("limited_buy_observer_", "");
      if (interaction.user.id !== uid) {
        return interaction.reply({ content: "❌ panelkaaga ma ahan", ephemeral: true });
      }
      const lbPlayer = await storage.getPlayer(uid);
      if (!lbPlayer) {
        return interaction.reply({ content: "❌ Profile kuma lihid, qor `!start` marka hore.", ephemeral: true });
      }
      const ownedTitles = Array.isArray(lbPlayer.ownedTitles) ? lbPlayer.ownedTitles : [];
      if (ownedTitles.includes("observer_title")) {
        return interaction.reply({ content: "❌ Hore ayaad u gadatay **Observer Title**.", ephemeral: true });
      }
      const OBSERVER_PRICE = 6000;
      if ((lbPlayer.coins || 0) < OBSERVER_PRICE) {
        return interaction.reply({ content: `❌ Lacag kugu filan ma haysatid. Waxaad u baahan tahay **${OBSERVER_PRICE.toLocaleString()} 🪙 coins**.`, ephemeral: true });
      }
      await storage.addCoins(uid, -OBSERVER_PRICE);
      const newTitles = [...ownedTitles, "observer_title"];
      await pool.query("UPDATE players SET owned_titles = $1 WHERE discord_id = $2", [JSON.stringify(newTitles), uid]);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle("✅ Observer Title — Iibsatay!")
          .setColor(0x2ecc71)
          .addFields(
            { name: "👁️ Observer", value: "Markasta oo FTI game ku biirto, waxaad heli doontaa **DM qarsoodi ah** oo kugu sheegaysa hal qof oo aan imposter ahayn.", inline: false },
            { name: "���� Lacagta baxday", value: `${OBSERVER_PRICE.toLocaleString()} 🪙 coins`, inline: true },
            { name: "📌 Talo", value: "Waa lifetime title — hal mar ayaad u baahan tahay!", inline: true }
          )
        ],
        ephemeral: true
      });
    }

    if (interaction.customId.startsWith("shop_buy_")) {
      const item = interaction.customId.replace("shop_buy_", "");
      let shopPlayer = await storage.getPlayer(interaction.user.id);
      if (!shopPlayer) {
        await interaction.reply({ content: "\u274C Profile kuma lihid nasiib, qor `!start` marka hore.", ephemeral: true });
        return;
      }
      const shopLegacyBasePrices = { xpboost: 500, luckycrate: 750, shield: 1200, title: 2000, liin: 100, xpabsorb: 250, slotinsurance: 600 };
      const shopLegacyBase = shopLegacyBasePrices[item];
      if (!shopLegacyBase) return;
      const legacyMx = await getShopPriceMultiplier().catch(() => 1.0);
      const shopPrice = Math.floor(shopLegacyBase * legacyMx);
      if ((shopPlayer.coins || 0) < shopPrice) {
        await interaction.reply({ content: T.shop_no_coins(shopPrice, shopPlayer.coins || 0), ephemeral: true });
        return;
      }
      const shopGStats = storage.ensureGameStats(shopPlayer.gameStats);
      if (item === "xpboost") {
        const spentXp = await storage.spendCoins(interaction.user.id, shopPrice);
        if (!spentXp) { await interaction.reply({ content: "❌ Lacag kuguma filna.", ephemeral: true }); return; }
        shopGStats.xpBoostDays = (shopGStats.xpBoostDays || 0) + 7;
        await db.update(players).set({ gameStats: shopGStats }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotCoins(shopPrice);
        await interaction.reply({ content: T.shop_bought_xpboost, ephemeral: true });
      } else if (item === "luckycrate") {
        await storage.spendCoins(interaction.user.id, shopPrice);
        await storage.addBotCoins(shopPrice);
        const crateRoll = Math.random();
        let crateReward;
        if (crateRoll < 0.50) {
          const crateCoins = Math.floor(Math.random() * 451) + 50;
          if (!(await nwCapBlocked(interaction.user.id, crateCoins))) {
            await storage.addCoins(interaction.user.id, crateCoins);
            storage.spendBotCoins(crateCoins).catch(() => {});
            logEconomy(interaction.user.id, "shop-luckycrate", crateCoins, "gain");
            crateReward = `\u{1F4B0} **${crateCoins.toLocaleString()} Coins**`;
          } else {
            crateReward = `\u{1F512} **${crateCoins.toLocaleString()} Coins** (NW xad)`;
          }
        } else if (crateRoll < 0.80) {
          const crateDias = Math.floor(Math.random() * 16) + 10;
          await storage.addDiamonds(interaction.user.id, crateDias);
          logEconomy(interaction.user.id, "shop-luckycrate-dias", crateDias, "gain");
          crateReward = `\u{1F4A8} **${crateDias} Diamonds**`;
        } else {
          shopGStats.xpBoostDays = (shopGStats.xpBoostDays || 0) + 3;
          await db.update(players).set({ gameStats: shopGStats }).where(eq(players.discordId, interaction.user.id));
          crateReward = `\u26A1 **XP Boost** (3 maalmood)`;
        }
        await interaction.reply({ content: T.shop_bought_luckycrate(crateReward), ephemeral: true });
      } else if (item === "shield") {
        if (shopGStats.streakShield) {
          await interaction.reply({ content: T.shop_already_shield, ephemeral: true });
          return;
        }
        shopGStats.streakShield = true;
        const spentShield = await storage.spendCoins(interaction.user.id, shopPrice);
        if (!spentShield) { await interaction.reply({ content: "❌ Lacag kuguma filna.", ephemeral: true }); return; }
        await db.update(players).set({ gameStats: shopGStats }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotCoins(shopPrice);
        await interaction.reply({ content: T.shop_bought_shield, ephemeral: true });
      } else if (item === "title") {
        if (shopPlayer.activeTitle === "\u{1F4B0} Coin Lord") {
          await interaction.reply({ content: T.shop_already_title, ephemeral: true });
          return;
        }
        await storage.spendCoins(interaction.user.id, shopPrice);
        await storage.addBotCoins(shopPrice);
        await storage.updateTitle(interaction.user.id, "\u{1F4B0} Coin Lord");
        await interaction.reply({ content: T.shop_bought_title, ephemeral: true });
      } else if (item === "liin") {
        const spentLiin2 = await storage.spendCoins(interaction.user.id, shopPrice);
        if (!spentLiin2) { await interaction.reply({ content: "❌ Lacag kuguma filna.", ephemeral: true }); return; }
        await storage.addBotCoins(shopPrice);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1, 'liin', 1, $2)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at = $2`,
          [interaction.user.id, Date.now()]
        );
        logEconomy(interaction.user.id, "shop-liin", shopPrice, "spend");
        await interaction.reply({ content: `✅ **🍋 Liin Dhanaan** waad iibsatay!\n\nIsticmaal \`!use liin\` si aad rob CD-gaaga 8% uga dhimato.`, ephemeral: true });
      } else if (item === "xpabsorb") {
        const lxSpent = await storage.spendCoins(interaction.user.id, shopPrice);
        if (!lxSpent) { await interaction.reply({ content: "❌ Lacag kuguma filna.", ephemeral: true }); return; }
        await storage.addBotCoins(shopPrice);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1, 'xpabsorb', 1, $2)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at = $2`,
          [interaction.user.id, Date.now()]
        );
        logEconomy(interaction.user.id, "shop-xpabsorb", shopPrice, "spend");
        await interaction.reply({ content: `✅ **🧲 XP Absorb** waad iibsatay! Isticmaal \`!use xpabsorb\` si aad u shiddo.`, ephemeral: true });
      } else if (item === "slotinsurance") {
        const lsSpent = await storage.spendCoins(interaction.user.id, shopPrice);
        if (!lsSpent) { await interaction.reply({ content: "❌ Lacag kuguma filna.", ephemeral: true }); return; }
        await storage.addBotCoins(shopPrice);
        await pool.query(
          `INSERT INTO heist_inventory (user_id, item_id, quantity, acquired_at) VALUES ($1, 'slotinsurance', 1, $2)
           ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = heist_inventory.quantity + 1, acquired_at = $2`,
          [interaction.user.id, Date.now()]
        );
        logEconomy(interaction.user.id, "shop-slotinsurance", shopPrice, "spend");
        await interaction.reply({ content: `✅ **🎰 Slot Insurance** waad iibsatay! Isticmaal \`!use slotinsurance\` kahor !slots.`, ephemeral: true });
      }
      return;
    }
    if (interaction.customId.startsWith("dshop_buy_")) {
      const dshopItem = interaction.customId.replace("dshop_buy_", "");
      let dshopP = await storage.getPlayer(interaction.user.id);
      if (!dshopP) {
        await interaction.reply({ content: "❌ Profile kuma lihid nasiiv, qor `!start` marka hore.", ephemeral: true });
        return;
      }
      const dshopCosts = { xpsurge: 50, diacrate: 60, robshield: 35, legendtitle: 100, coinshower: 150 };
      const dshopCost = dshopCosts[dshopItem];
      if (!dshopCost) return;
      if ((dshopP.diamonds || 0) < dshopCost) {
        await interaction.reply({ content: T.dshop_no_dias(dshopCost, dshopP.diamonds || 0), ephemeral: true });
        return;
      }
      const dshopGS = storage.ensureGameStats(dshopP.gameStats);
      const newDias = (dshopP.diamonds || 0) - dshopCost;
      if (dshopItem === "xpsurge") {
        const surgeXP = 250;
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotDiamonds(dshopCost);
        await storage.updatePlayerXP(interaction.user.id, surgeXP);
        await interaction.reply({ content: T.dshop_bought_xpsurge(surgeXP), ephemeral: true });
      } else if (dshopItem === "diacrate") {
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotDiamonds(dshopCost);
        const dcRoll = Math.random();
        let dcReward;
        if (dcRoll < 0.60) {
          const dcCoins = Math.floor(Math.random() * 1001) + 500;
          if (!(await nwCapBlocked(interaction.user.id, dcCoins))) {
            await storage.addCoins(interaction.user.id, dcCoins);
            storage.spendBotCoins(dcCoins).catch(() => {});
            dcReward = `\uD83D\uDCB0 **${dcCoins.toLocaleString()} Coins**`;
          } else {
            dcReward = `\uD83D\uDD12 **${dcCoins.toLocaleString()} Coins** (NW xad)`;
          }
        } else {
          const dcDias = Math.floor(Math.random() * 13) + 8;
          await storage.addDiamonds(interaction.user.id, dcDias);
          dcReward = `💎 **${dcDias} Diamonds** — wax kaa soo noqday!`;
        }
        await interaction.reply({ content: T.dshop_bought_diacrate(dcReward), ephemeral: true });
      } else if (dshopItem === "robshield") {
        if (dshopGS.robShieldEnd && Date.now() < dshopGS.robShieldEnd) {
          await interaction.reply({ content: T.dshop_already_robshield, ephemeral: true });
          return;
        }
        dshopGS.robShieldEnd = Date.now() + 12 * 3600 * 1000;
        await db.update(players).set({ diamonds: newDias, gameStats: dshopGS }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotDiamonds(dshopCost);
        await interaction.reply({ content: T.dshop_bought_robshield, ephemeral: true });
      } else if (dshopItem === "legendtitle") {
        const legendTitles = ["🌙 Night Lord", "⚔️Boqorka waydown", "🌊 Ocean Ruler", "🔥 Firestarter"];
        const ltRow = new ActionRowBuilder().addComponents(
          ...legendTitles.map((lt, i) => new ButtonBuilder().setCustomId(`dshop_settitle_${i}`).setLabel(lt).setStyle(ButtonStyle.Secondary))
        );
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotDiamonds(dshopCost);
        await interaction.reply({ content: T.dshop_bought_title_menu, components: [ltRow], ephemeral: true });
      } else if (dshopItem === "coinshower") {
        const showerCoins = Math.floor(Math.random() * 1201) + 800;
        const _showerNwBlock2 = await nwCapBlocked(interaction.user.id, showerCoins);
        if (_showerNwBlock2) { await interaction.reply({ embeds: [_showerNwBlock2], ephemeral: true }); return; }
        await db.update(players).set({ diamonds: newDias }).where(eq(players.discordId, interaction.user.id));
        await storage.addBotDiamonds(dshopCost);
        await storage.addCoins(interaction.user.id, showerCoins);
        storage.spendBotCoins(showerCoins).catch(() => {});
        logEconomy(interaction.user.id, "dshop-coinshower", showerCoins, "gain");
        await interaction.reply({ content: T.dshop_bought_coinshower(showerCoins), ephemeral: true });
      }
      return;
    }
    if (interaction.customId.startsWith("dshop_settitle_")) {
      const ltIdx = parseInt(interaction.customId.replace("dshop_settitle_", ""));
      const legendTitles = ["🌙 Night Lord", "⚔️Boqorka waydow", "🌊 Ocean Ruler", "🔥 Firestarter"];
      const chosenTitle = legendTitles[ltIdx];
      if (!chosenTitle) return;
      await storage.updateTitle(interaction.user.id, chosenTitle);
      await interaction.update({ content: T.dshop_bought_title_done(chosenTitle), components: [] });
      return;
    }
    if (interaction.customId.startsWith("duel_accept_") || interaction.customId.startsWith("duel_decline_")) {
      const duelParts = interaction.customId.split("_");
      const duelAction = duelParts[1];
      const duelChallengerId = duelParts[2];
      const duelTargetId = duelParts[3];
      const duelAmount = parseInt(duelParts[4]);
      const duelKey = `${duelChallengerId}_${duelTargetId}`;
      if (interaction.user.id !== duelTargetId) {
        await interaction.reply({ content: "❌ Adiga kuuma diyaarsana duelkaan.", ephemeral: true });
        return;
      }
      const duelData = activeDuels.get(duelKey);
      if (!duelData) {
        await interaction.reply({ content: "⏰ Duelku wuu baaqday ama horay ayaa loo xaliyay.", ephemeral: true });
        return;
      }
      clearTimeout(duelData.timeout);
      activeDuels.delete(duelKey);
      if (duelAction === "decline") {
        await interaction.update({ embeds: [new EmbedBuilder().setTitle("⚔️ Duel — Diidmo").setDescription(T.duel_declined(duelTargetId)).setColor(8421504)], components: [] });
        return;
      }
      let duelC = await storage.getPlayer(duelChallengerId);
      let duelV = await storage.getPlayer(duelTargetId);
      if (!duelC || !duelV || (duelC.coins || 0) < duelAmount || (duelV.coins || 0) < duelAmount) {
        await interaction.update({ embeds: [new EmbedBuilder().setTitle("⚔️ Duel — Baaqday").setDescription("❌ Mid ka mid ah labada ciyaartoy ma haystaan Coins ku filan — duelku wuu baaqday.").setColor(8421504)], components: [] });
        return;
      }
      if (isShuttingDown) {
        await interaction.update({ embeds: [new EmbedBuilder().setTitle("⚔️ Duel — Joojiyay").setDescription("⚠️ Bot ayaa dib loo bilaabayaa. Lacagtaada waa badnaatay — isku day daqiiqad gudahood.").setColor(8421504)], components: [] });
        return;
      }
      const duelProcessKey = `duel_${duelChallengerId}_${duelTargetId}`;
      economyProcessing.add(duelProcessKey);
      try {
      const cMember = interaction.guild ? await interaction.guild.members.fetch(duelChallengerId).catch(() => null) : null;
      const vMember = interaction.guild ? await interaction.guild.members.fetch(duelTargetId).catch(() => null) : null;
      const cName = cMember ? (cMember.displayName || duelC.username) : (duelC.username || "Player 1");
      const vName = vMember ? (vMember.displayName || duelV.username) : (duelV.username || "Player 2");
      const cHasAura = !!(storage.ensureGameStats(duelC.gameStats).aura);
      const vHasAura = !!(storage.ensureGameStats(duelV.gameStats).aura);
      const pot = duelAmount * 2;
      let hp1 = 100, hp2 = 100;
      const battleLog = [];
      const maxRounds = 4 + Math.floor(Math.random() * 3);
      await interaction.update({ embeds: [new EmbedBuilder().setTitle("\u2694\uFE0F  D U E L  \u2014  Dagaalku wuu bilowday!").setDescription(buildDuelBattleEmbed(hp1, hp2, cName, vName, duelAmount * 2, 0, null, 0xe67e22)).setColor(0xe67e22)], components: [] });
      await new Promise(r => setTimeout(r, 1200));
      for (let round = 1; round <= maxRounds && hp1 > 0 && hp2 > 0; round++) {
        const attackerIsC = round % 2 === 1;
        const attackerName = attackerIsC ? cName : vName;
        const defenderName = attackerIsC ? vName : cName;
        const hasAura = attackerIsC ? cHasAura : vHasAura;
        const { dmg, effect, emoji, label } = calcDuelDamage(hasAura);
        const auraNote = hasAura && effect !== "heal" && effect !== "dodge" ? ` (+5 aura)` : "";
        if (effect === "heal") {
          if (attackerIsC) hp1 = Math.min(100, hp1 + 10); else hp2 = Math.min(100, hp2 + 10);
        } else {
          if (attackerIsC) hp2 = Math.max(0, hp2 - dmg); else hp1 = Math.max(0, hp1 - dmg);
        }
        const logEntry = { round, attackerName, defenderName, dmg, effect, emoji, label: label + auraNote, hasAura: hasAura && effect !== "heal" && effect !== "dodge" };
        battleLog.push(logEntry);
        const roundColor = round <= 2 ? 0xe67e22 : round <= 4 ? 0xe74c3c : 0x8e44ad;
        try { await interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`\u2694\uFE0F  D U E L  \u2014  Round ${round}`).setDescription(buildDuelBattleEmbed(hp1, hp2, cName, vName, duelAmount * 2, round, logEntry, roundColor)).setColor(roundColor)] }); } catch (_) {}
        await new Promise(r => setTimeout(r, 1100));
      }
      const winnerId = hp1 > hp2 ? duelChallengerId : hp2 > hp1 ? duelTargetId : (Math.random() < 0.5 ? duelChallengerId : duelTargetId);
      const loserId = winnerId === duelChallengerId ? duelTargetId : duelChallengerId;
      const winnerName = winnerId === duelChallengerId ? cName : vName;
      const loserName = loserId === duelChallengerId ? cName : vName;
      let winnerNewBal;
      try {
        await storage.spendCoins(loserId, duelAmount);
        const _duelNwBlock = await nwCapBlocked(winnerId, duelAmount);
        if (_duelNwBlock) {
          await storage.addBotCoins(duelAmount).catch(() => {});
          logEconomy(winnerId, `duel-win-nwcap-vs-${loserId}`, duelAmount, "nwcap");
          winnerNewBal = 0;
        } else {
          const updatedWinner = await storage.addCoins(winnerId, duelAmount);
          logEconomy(winnerId, `duel-win-vs-${loserId}`, duelAmount, "gain");
          winnerNewBal = updatedWinner.coins;
        }
        logEconomy(loserId, `duel-loss-vs-${winnerId}`, duelAmount, "loss");
      } catch (duelTxErr) {
        console.error("[DUEL] coin transfer error — attempting refund:", duelTxErr);
        await storage.addCoins(loserId, duelAmount).catch(() => {});
        try { await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("⚔️ Duel — Khalad").setDescription("⚠️ Khalad ayaa dhacay lacagta wareejintiisa — lacagta labada qof waa la soo celiyay. Isku day mar kale.").setColor(0xe74c3c)] }); } catch (_) {}
        return;
      }
      const finalDesc = [
        "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
        `\uD83D\uDC51  **WINNER: ${winnerName}**`,
        "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
        "",
        `\uD83C\uDFC6  Won:  **+${duelAmount.toLocaleString()} \uD83E\uDE99**`,
        `\uD83D\uDCBC  Balance cusub:  **${winnerNewBal.toLocaleString()} \uD83E\uDE99**`,
        "",
        "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
        "",
        `\uD83D\uDE35  Loser:  **${loserName}**`,
        `\uD83D\uDCB8  **-${duelAmount.toLocaleString()} \uD83E\uDE99**`,
        "",
        "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
        "\uD83D\uDD25  *!duel si aad uga aarsatid!*",
      ].join("\n");
      try { await interaction.editReply({ embeds: [new EmbedBuilder().setTitle("\uD83C\uDFC6  N A T I I J A D A  D U E L K A").setDescription(finalDesc).setColor(0xf1c40f)] }); } catch (_) {}
      trackQuest(winnerId, "win_games", 1).catch(() => {});
      trackQuest(winnerId, "earn_coins", duelAmount).catch(() => {});
      } finally {
        economyProcessing.delete(duelProcessKey);
      }
      return;
    }
    if (interaction.customId.startsWith("admin_")) {
      const level = await getPermissionLevel(interaction.user.id);
      if (level === "USER") {
        await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
        return;
      }
      if (interaction.customId === "admin_announce") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_announce").setTitle("\u{1F4E2} Send Announcement");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("announce_title").setLabel("Title").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("announce_desc").setLabel("Description").setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_force_unlock") {
        const channelId = interaction.channel?.id;
        if (!channelId) {
          await interaction.reply({ content: "\u274C Channel error.", ephemeral: true });
          return;
        }
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
        });
        activeFtiChannels.delete(channelId);
        for (const [lobbyId2, lobby2] of lobbies) {
          if (lobby2.channelId === channelId) lobbies.delete(lobbyId2);
        }
        for (const [gameId, game2] of activeGames) {
          if (game2.channelId === channelId) activeGames.delete(gameId);
        }
        await interaction.reply({ content: T.admin_channel_unlocked, ephemeral: true });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F513} **Force Unlock** by <@${interaction.user.id}> in #${channel.name}`);
        return;
      }
      if (interaction.customId === "admin_force_end") {
        const channelId = interaction.channel?.id;
        if (!channelId) {
          await interaction.reply({ content: "\u274C Channel error.", ephemeral: true });
          return;
        }
        const channel = interaction.channel;
        const activeInChannel = [];
        for (const [lobbyId2, game2] of activeGames) {
          if (game2.channelId === channelId || lobbyId2.startsWith(channelId)) activeInChannel.push({ type: "FTI", id: lobbyId2 });
        }
        for (const [lobbyId2, lobby2] of lobbies) {
          if (lobby2.channelId === channelId) activeInChannel.push({ type: "Lobby", id: lobbyId2 });
        }
        for (const [gId, g] of activeGuessGames) {
          if (g.channelId === channelId && g.phase !== "finished") activeInChannel.push({ type: "Guess", id: gId });
        }
        for (const [pId, g] of activeTowerGames) {
          if (g.channelId === channelId) activeInChannel.push({ type: "Tower", id: pId });
        }
        for (const [pId, g] of activeMiinoGames) {
          if (g.channelId === channelId) activeInChannel.push({ type: "Miino", id: pId });
        }
        for (const [gId, g] of activeShekoGames) {
          if (g.channelId === channelId && g.phase !== "finished") activeInChannel.push({ type: "Sheeko", id: gId });
        }
        if (activeInChannel.length === 0) {
          await interaction.reply({ content: T.admin_no_games_in_channel, ephemeral: true });
          return;
        }
        const rows = [];
        const row = new ActionRowBuilder();
        row.addComponents(
          new ButtonBuilder().setCustomId("force_end_all").setLabel(T.admin_force_end_all_btn).setStyle(ButtonStyle.Danger)
        );
        for (const g of activeInChannel) {
          row.addComponents(
            new ButtonBuilder().setCustomId(`force_end_${g.type}_${g.id}`).setLabel(`\u274C ${g.type}`).setStyle(ButtonStyle.Secondary)
          );
        }
        rows.push(row);
        await interaction.reply({ content: T.admin_force_end_prompt(activeInChannel.length, activeInChannel.map((g) => `\u2022 ${g.type}`).join("\n")), components: rows, ephemeral: true });
        return;
      }
      if (interaction.customId === "force_end_all" || interaction.customId.startsWith("force_end_")) {
        const channelId = interaction.channel?.id;
        if (!channelId) return;
        const channel = interaction.channel;
        if (interaction.customId === "force_end_all") {
          for (const [lobbyId2, game2] of activeGames) {
            if (game2.channelId === channelId || lobbyId2.startsWith(channelId)) {
              try {
                await endFTIGame(lobbyId2, channel, "Force End");
              } catch {
              }
            }
          }
          for (const [lobbyId2, lobby2] of lobbies) {
            if (lobby2.channelId === channelId) {
              lobbies.delete(lobbyId2);
              activeFtiChannels.delete(channelId);
            }
          }
          for (const [gId, g] of activeGuessGames) {
            if (g.channelId === channelId) {
              g.phase = "finished";
              if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
              activeGuessGames.delete(gId);
            }
          }
          for (const [pId, g] of activeTowerGames) {
            if (g.channelId === channelId) {
              if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
              activeTowerGames.delete(pId);
            }
          }
          for (const [pId, g] of activeMiinoGames) {
            if (g.channelId === channelId) {
              if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
              activeMiinoGames.delete(pId);
            }
          }
          for (const [gId, g] of activeShekoGames) {
            if (g.channelId === channelId) {
              g.phase = "finished";
              if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
              activeShekoGames.delete(gId);
            }
          }
          await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
          });
          activeFtiChannels.delete(channelId);
          await interaction.update({ content: T.admin_all_ended, components: [] });
        } else {
          const parts = interaction.customId.replace("force_end_", "").split("_");
          const gameType = parts[0];
          const gameId = parts.slice(1).join("_");
          if (gameType === "FTI") {
            if (activeGames.has(gameId)) {
              try {
                await endFTIGame(gameId, channel, "Force End");
              } catch {
              }
            }
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
            });
            activeFtiChannels.delete(channelId);
          } else if (gameType === "Lobby") {
            lobbies.delete(gameId);
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
            });
            activeFtiChannels.delete(channelId);
          } else if (gameType === "Guess") {
            const gg = activeGuessGames.get(gameId);
            if (gg) {
              gg.phase = "finished";
              if (gg.inactivityTimer) clearTimeout(gg.inactivityTimer);
              activeGuessGames.delete(gameId);
            }
          } else if (gameType === "Tower") {
            const tg = activeTowerGames.get(gameId);
            if (tg) {
              if (tg.inactivityTimer) clearTimeout(tg.inactivityTimer);
              activeTowerGames.delete(gameId);
            }
          } else if (gameType === "Miino") {
            const mg = activeMiinoGames.get(gameId);
            if (mg) {
              if (mg.inactivityTimer) clearTimeout(mg.inactivityTimer);
              activeMiinoGames.delete(gameId);
            }
          } else if (gameType === "Sheeko") {
            const sg = activeShekoGames.get(gameId);
            if (sg) {
              sg.phase = "finished";
              if (sg.inactivityTimer) clearTimeout(sg.inactivityTimer);
              activeShekoGames.delete(gameId);
            }
          }
          await interaction.update({ content: T.admin_game_ended(gameType), components: [] });
        }
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F6D1} **Force End** by <@${interaction.user.id}> in #${channel.name}`);
        return;
      }
      if (interaction.customId === "admin_add_xp") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_add_xp").setTitle("\u2795 Add XP");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("xp_amount").setLabel("XP Amount").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_remove_xp") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_remove_xp").setTitle("\u2796 Remove XP");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("xp_amount").setLabel("XP Amount").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_view_player") {
        const modal = new ModalBuilder().setCustomId("modal_view_player").setTitle("\u{1F50D} View Player");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_warn") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_warn").setTitle("\u26A0\uFE0F Warn Player");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_mute") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_mute").setTitle("\u{1F507} Mute Player");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("mute_hours").setLabel("Saacadood (hours)").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_ban") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_ban").setTitle("\u{1F528} Ban Player");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_unban") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_unban").setTitle("\u{1F513} Unban Player");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_unhold") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_no_permission, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_unhold").setTitle("🔓 Unhold Player");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_add_staff") {
        if (interaction.user.id !== OWNER_ID || !isAdminSessionActive(interaction.user.id)) {
          await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_add_staff").setTitle("\u{1F465} Add Staff");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("staff_role").setLabel("Role (admin / mod)").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_remove_staff") {
        if (interaction.user.id !== OWNER_ID || !isAdminSessionActive(interaction.user.id)) {
          await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
          return;
        }
        const modal = new ModalBuilder().setCustomId("modal_remove_staff").setTitle("\u274C Remove Staff");
        modal.addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("target_user_id").setLabel("User Discord ID").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
        return;
      }
      if (interaction.customId === "admin_view_staff") {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
          return;
        }
        const staffList = await storage.getStaff();
        if (staffList.length === 0) {
          await interaction.reply({ content: T.admin_staff_empty, ephemeral: true });
          return;
        }
        const lines = staffList.map((s) => `<@${s.discordId}> \u2014 ${s.role.toUpperCase()} (Added by: <@${s.addedBy}>)`);
        await interaction.reply({ content: `\u{1F4CB} **Staff List:**
${lines.join("\n")}`, ephemeral: true });
        return;
      }
      if (interaction.customId === "admin_reset_lb") {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
          return;
        }
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("confirm_reset_lb").setLabel(T.admin_reset_yes).setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("cancel_reset_lb").setLabel(T.admin_reset_no).setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({ content: T.admin_reset_confirm, components: [confirmRow], ephemeral: true });
        return;
      }
      if (interaction.customId === "admin_debug_games") {
        const ftiCount = activeGames.size;
        const guessCount = activeGuessGames.size;
        const towerCount = activeTowerGames.size;
        const miinoCount = activeMiinoGames.size + activeMiinoV2Games.size;
        const shekoCount = activeShekoGames.size;
        const lobbyCount = lobbies.size;
        const lockedChannels = Array.from(activeFtiChannels).map((c) => `<#${c}>`).join(", ") || "Maya";
        await interaction.reply({ content: [
          "\u{1F9EA} **Debug Info:**",
          `\u{1F3AD} Active FTI Games: ${ftiCount}`,
          `\u{1F3AF} Active Guess Games: ${guessCount}`,
          `\u{1F9D7} Active Tower Games: ${towerCount}`,
          `\u{1F4A3} Active Miino Games: ${miinoCount}`,
          `\u{1F3AD} Active Sheeko Games: ${shekoCount}`,
          `\u{1F4CB} Open Lobbies: ${lobbyCount}`,
          `\u{1F512} Locked Channels: ${lockedChannels}`
        ].join("\n"), ephemeral: true });
        return;
      }
      if (interaction.customId === "admin_emergency_unlock") {
        if (level === "MOD") {
          await interaction.reply({ content: T.admin_emergency_admin_only, ephemeral: true });
          return;
        }
        const guild = interaction.guild;
        if (!guild) {
          await interaction.reply({ content: "\u274C Guild error.", ephemeral: true });
          return;
        }
        for (const channelId of activeFtiChannels) {
          try {
            const ch = await guild.channels.fetch(channelId);
            if (ch) await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true }).catch(() => {
            });
          } catch {
          }
        }
        activeFtiChannels.clear();
        activeGames.clear();
        lobbies.clear();
        for (const [gId, g] of activeGuessGames) {
          if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
        }
        activeGuessGames.clear();
        for (const [pId, g] of activeTowerGames) {
          if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
        }
        activeTowerGames.clear();
        for (const [pId, g] of activeMiinoGames) {
          if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
        }
        activeMiinoGames.clear();
        for (const [gId, g] of activeMiinoV2Games) {
          if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
        }
        activeMiinoV2Games.clear();
        miinoV2Invites.clear();
        for (const [gId, g] of activeShekoGames) {
          if (g.inactivityTimer) clearTimeout(g.inactivityTimer);
        }
        activeShekoGames.clear();
        sugQueue.clear();
        await interaction.reply({ content: T.admin_emergency_done, ephemeral: true });
        if (guild) await logToFtiLogs(guild, `\u{1F6A8} **Emergency Unlock All** by <@${interaction.user.id}>`);
        return;
      }
      return;
    }
    if (interaction.customId === "confirm_prestige") {
      const result = await storage.prestige(interaction.user.id);
      if (!result) {
        await interaction.update({ content: T.prestige_failed, embeds: [], components: [] });
        return;
      }
      await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.prestige_complete_title).setDescription(T.prestige_complete_desc(result.prestige)).setColor(16766720)], components: [] });
      if (interaction.guild) await logToFtiLogs(interaction.guild, `\u2728 **Prestige!** <@${interaction.user.id}> \u2192 Prestige **${result.prestige}**`);
      return;
    }
    if (interaction.customId === "cancel_prestige") {
      await interaction.update({ content: T.prestige_cancelled, embeds: [], components: [] });
      return;
    }
    if (interaction.customId === "confirm_reset_lb") {
      if (interaction.user.id !== OWNER_ID || !isAdminSessionActive(interaction.user.id)) {
        await interaction.reply({ content: T.admin_owner_only, ephemeral: true });
        return;
      }
      await storage.resetAllXP();
      await interaction.update({ content: T.admin_reset_done, components: [] });
      if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4CA} **Leaderboard Reset** by <@${interaction.user.id}>`);
      return;
    }
    if (interaction.customId === "cancel_reset_lb") {
      await interaction.update({ content: T.admin_reset_cancelled, components: [] });
      return;
    }
    if (interaction.customId.startsWith("mv2_accept_") || interaction.customId.startsWith("mv2_decline_")) {
      const isAccept = interaction.customId.startsWith("mv2_accept_");
      const rest = interaction.customId.replace(isAccept ? "mv2_accept_" : "mv2_decline_", "");
      const [inviterId, inviteeId] = rest.split("_");
      if (interaction.user.id !== inviteeId) {
        await interaction.reply({ content: T.miino_v2_not_invited, ephemeral: true });
        return;
      }
      const inviteKey = `${inviterId}_${inviteeId}`;
      const inviteData = miinoV2Invites.get(inviteKey);
      if (!inviteData) {
        await interaction.reply({ content: "\u23F0 Casuumadda waqtigeeda wuu dhacay.", ephemeral: true });
        return;
      }
      miinoV2Invites.delete(inviteKey);
      if (!isAccept) {
        await interaction.update({ content: T.miino_v2_declined, components: [] });
        return;
      }
      if (findMiinoV2GameByPlayer(inviterId) || activeMiinoGames.has(inviterId) || findMiinoV2GameByPlayer(inviteeId) || activeMiinoGames.has(inviteeId)) {
        await interaction.update({ content: T.miino_v2_already_playing, components: [] });
        return;
      }
      const diffRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`mv2_diff_easy_${inviterId}_${inviteeId}`).setLabel(T.miino_v2_easy_btn).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`mv2_diff_medium_${inviterId}_${inviteeId}`).setLabel(T.miino_v2_medium_btn).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`mv2_diff_extreme_${inviterId}_${inviteeId}`).setLabel(T.miino_v2_extreme_btn).setStyle(ButtonStyle.Danger)
      );
      await interaction.update({ content: `\u2705 <@${inviteeId}> waa aqbalay! <@${inviterId}> \u2014 ${T.miino_v2_select_difficulty}`, components: [diffRow] });
      return;
    }
    if (interaction.customId.startsWith("mv2_diff_")) {
      const rest = interaction.customId.replace("mv2_diff_", "");
      const parts2 = rest.split("_");
      const difficulty = parts2[0];
      const hostId = parts2[1];
      const guestId = parts2.length > 2 ? parts2.slice(2).join("_") : null;
      if (interaction.user.id !== hostId) {
        await interaction.reply({ content: "\u274C Adiga host-ku ma ahan.", ephemeral: true });
        return;
      }
      if (findMiinoV2GameByPlayer(hostId) || activeMiinoGames.has(hostId) || (guestId && (findMiinoV2GameByPlayer(guestId) || activeMiinoGames.has(guestId)))) {
        await interaction.update({ content: T.miino_v2_already_playing, components: [] });
        return;
      }
      const mineCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 7;
      const xpReward = difficulty === "easy" ? 20 : difficulty === "medium" ? 30 : 50;
      const gameId = `mv2_${hostId}_${Date.now()}`;
      const grid = createMiinoV2Grid(mineCount);
      const game = {
        gameId,
        player1Id: hostId,
        player2Id: guestId || null,
        currentTurn: (guestId && Math.random() < 0.5) ? guestId : hostId,
        difficulty,
        mineCount,
        xpReward,
        grid,
        revealed: Array(20).fill(false),
        moves: 0,
        startTime: Date.now(),
        channelId: interaction.channel.id,
        messageId: null,
        inactivityTimer: null,
        processing: false
      };
      activeMiinoV2Games.set(gameId, game);
      const embed = buildMiinoV2Embed(game);
      const rows = buildMiinoV2Buttons(game);
      const controlRow = buildMiinoV2ControlRow(game);
      await interaction.update({ content: null, embeds: [embed], components: [controlRow, ...rows] });
      const msg = await interaction.fetchReply();
      game.messageId = msg.id;
      resetMiinoV2Timer(game, interaction.channel);
      return;
    }
    if (interaction.customId.startsWith("mv2_end_") || interaction.customId.startsWith("mv2_restart_") || interaction.customId.startsWith("mv2_mode_")) {
      const parts2 = interaction.customId.split("_");
      const action2 = parts2[1];
      const gameId = parts2.slice(2).join("_");
      const game = activeMiinoV2Games.get(gameId);
      if (!game) {
        await interaction.reply({ content: T.game_not_found, ephemeral: true });
        return;
      }
      if (action2 === "mode") {
        await interaction.reply({ content: "\u{1F50D} Mode: Reveal (only mode available)", ephemeral: true });
        return;
      }
      if (interaction.user.id !== game.player1Id) {
        await interaction.reply({ content: T.miino_v2_cant_restart, ephemeral: true });
        return;
      }
      if (action2 === "end") {
        if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
        activeMiinoV2Games.delete(gameId);
        const embed = buildMiinoV2Embed(game);
        embed.setTitle("\u{1F6D1} " + T.miino_v2_title + " \u2014 Dhammaad");
        embed.setDescription(T.miino_v2_end_no_reward);
        embed.setColor(9807270);
        const disabledRows = buildMiinoV2Buttons(game).map(row => {
          row.components.forEach(b => b.setDisabled(true));
          return row;
        });
        const disabledControl = buildMiinoV2ControlRow(game, true);
        await interaction.update({ embeds: [embed], components: [disabledControl, ...disabledRows] });
        return;
      }
      if (action2 === "restart") {
        if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
        const newGrid = createMiinoV2Grid(game.mineCount);
        game.grid = newGrid;
        game.revealed = Array(20).fill(false);
        game.moves = 0;
        game.startTime = Date.now();
        game.currentTurn = game.player1Id;
        const embed = buildMiinoV2Embed(game);
        const rows = buildMiinoV2Buttons(game);
        const controlRow = buildMiinoV2ControlRow(game);
        await interaction.update({ embeds: [embed], components: [controlRow, ...rows] });
        return;
      }
      return;
    }
    if (interaction.customId.startsWith("mv2_") && !interaction.customId.startsWith("mv2_accept_") && !interaction.customId.startsWith("mv2_decline_") && !interaction.customId.startsWith("mv2_diff_") && !interaction.customId.startsWith("mv2_end_") && !interaction.customId.startsWith("mv2_restart_") && !interaction.customId.startsWith("mv2_mode_")) {
      const parts2 = interaction.customId.split("_");
      const tileIdx = parseInt(parts2[1]);
      const gameId = parts2.slice(2).join("_");
      const game = activeMiinoV2Games.get(gameId);
      if (!game) {
        await interaction.reply({ content: T.game_not_found, ephemeral: true });
        return;
      }
      if (interaction.user.id !== game.currentTurn) {
        await interaction.reply({ content: T.miino_v2_not_your_turn, ephemeral: true });
        return;
      }
      if (game.revealed[tileIdx]) {
        await interaction.reply({ content: T.miino_tile_already, ephemeral: true });
        return;
      }
      if (game.processing) return;
      game.processing = true;
      try {
      game.revealed[tileIdx] = true;
      game.moves += 1;
      if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
      if (game.grid[tileIdx] === "mine") {
        for (let i = 0; i < 20; i++) game.revealed[i] = true;
        const loserMember = await interaction.guild?.members.fetch(game.currentTurn).catch(() => null);
        const loserName = getDisplayName(loserMember, "Player");
        const winnerId = game.player2Id && game.currentTurn === game.player1Id ? game.player2Id : (game.player2Id && game.currentTurn === game.player2Id ? game.player1Id : null);
        activeMiinoV2Games.delete(gameId);
        const embed = buildMiinoV2Embed(game);
        embed.setTitle("\u{1F4A3}\u{1F4A5} " + T.miino_v2_title + " \u2014 Qarax!");
        embed.setColor(16711680);
        let desc = T.miino_v2_bomb_hit(loserName);
        if (winnerId) {
          const winnerMember = await interaction.guild?.members.fetch(winnerId).catch(() => null);
          const winnerName = getDisplayName(winnerMember, "Player");
          const duoBombResult = await storage.updateMiinoStats(winnerId, "win", game.moves, game.xpReward);
          const duoBombXP = duoBombResult?.xpAwarded ?? game.xpReward;
          await storage.updateMiinoStats(game.currentTurn, "loss", game.moves, 0);
          trackQuest(winnerId,         "play_miino", 1).catch(() => {});
          trackQuest(game.currentTurn, "play_miino", 1).catch(() => {});
          desc += "\n\n" + T.miino_v2_win(winnerName, duoBombXP);
          await checkLevel60(winnerId, interaction.channel);
        } else {
          await storage.updateMiinoStats(game.currentTurn, "loss", game.moves, 0);
          trackQuest(game.currentTurn, "play_miino", 1).catch(() => {});
        }
        embed.setDescription(desc);
        const disabledRows = buildMiinoV2Buttons(game).map(row => {
          row.components.forEach(b => b.setDisabled(true));
          return row;
        });
        const disabledControl = buildMiinoV2ControlRow(game, true);
        await interaction.update({ embeds: [embed], components: [disabledControl, ...disabledRows] });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4A3} **Miino** <@${game.currentTurn}> hit a mine (${game.difficulty}) \u2014 ${winnerId ? `winner <@${winnerId}>` : "solo"}`);
        return;
      }
      const safeTilesLeft = game.grid.filter((v, i) => v === "safe" && !game.revealed[i]).length;
      if (safeTilesLeft === 0) {
        for (let i = 0; i < 20; i++) game.revealed[i] = true;
        const winnerMember = await interaction.guild?.members.fetch(game.currentTurn).catch(() => null);
        const winnerName = getDisplayName(winnerMember, "Player");
        let duoPerfXP = game.xpReward;
        if (game.player2Id) {
          const loserId = game.currentTurn === game.player1Id ? game.player2Id : game.player1Id;
          const duoPerfResult = await storage.updateMiinoStats(game.currentTurn, "win", game.moves, game.xpReward);
          duoPerfXP = duoPerfResult?.xpAwarded ?? game.xpReward;
          await storage.updateMiinoStats(loserId, "loss", game.moves, 0);
          trackQuest(game.currentTurn, "play_miino", 1).catch(() => {});
          trackQuest(loserId,          "play_miino", 1).catch(() => {});
        } else {
          const duoPerfResult = await storage.updateMiinoStats(game.currentTurn, "win", game.moves, game.xpReward);
          duoPerfXP = duoPerfResult?.xpAwarded ?? game.xpReward;
          trackQuest(game.currentTurn, "play_miino", 1).catch(() => {});
        }
        activeMiinoV2Games.delete(gameId);
        const embed = buildMiinoV2Embed(game);
        embed.setTitle("\u{1F3C6} " + T.miino_v2_title + " \u2014 Perfect Clear!");
        embed.setColor(16766720);
        embed.setDescription(T.miino_v2_win(winnerName, duoPerfXP));
        const disabledRows = buildMiinoV2Buttons(game).map(row => {
          row.components.forEach(b => b.setDisabled(true));
          return row;
        });
        const disabledControl = buildMiinoV2ControlRow(game, true);
        await interaction.update({ embeds: [embed], components: [disabledControl, ...disabledRows] });
        await checkLevel60(game.currentTurn, interaction.channel);
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4A3}\u{1F3C6} **Miino** <@${game.currentTurn}> PERFECT CLEAR (${game.difficulty}) \u2014 +${duoPerfXP} XP`);
        return;
      }
      if (game.player2Id) {
        game.currentTurn = game.currentTurn === game.player1Id ? game.player2Id : game.player1Id;
        resetMiinoV2Timer(game, interaction.channel);
      }
      const embed = buildMiinoV2Embed(game);
      const rows = buildMiinoV2Buttons(game);
      const controlRow = buildMiinoV2ControlRow(game);
      await interaction.update({ embeds: [embed], components: [controlRow, ...rows] });
      } catch (err) {
        console.error("[MIINO-V2] tile handler error:", err);
      } finally {
        game.processing = false;
      }
      return;
    }
    if (interaction.customId.startsWith("miino_")) {
      const parts = interaction.customId.split("_");
      const channel = interaction.channel;
      if (parts[1] === "cashout") {
        const playerId2 = parts.slice(2).join("_");
        if (interaction.user.id !== playerId2) {
          await interaction.reply({ content: T.not_this_game, ephemeral: true });
          return;
        }
        const game3 = activeMiinoGames.get(playerId2);
        if (!game3) {
          await interaction.reply({ content: T.game_not_found, ephemeral: true });
          return;
        }
        if (game3.inactivityTimer) clearTimeout(game3.inactivityTimer);
        let minoSoloCashXP = game3.accumulatedXP;
        if (game3.accumulatedXP > 0) {
          const minoSoloCashResult = await storage.updateMiinoStats(playerId2, "win", game3.tilesRevealed, game3.accumulatedXP);
          minoSoloCashXP = minoSoloCashResult?.xpAwarded ?? game3.accumulatedXP;
        }
        activeMiinoGames.delete(playerId2);
        trackQuest(playerId2, "play_miino", 1).catch(() => {});
        await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.miino_cashout_title).setDescription(T.miino_cashout_desc(minoSoloCashXP, game3.tilesRevealed)).setColor(65416)], components: [] });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4A3} **Miino** <@${playerId2}> cashed out \u2014 +${minoSoloCashXP} XP (${game3.tilesRevealed} tiles)`);
        await checkLevel60(playerId2, channel);
        return;
      }
      const tileIdx = parseInt(parts[1]);
      const playerId = parts.slice(2).join("_");
      if (interaction.user.id !== playerId) {
        await interaction.reply({ content: T.not_this_game, ephemeral: true });
        return;
      }
      const game2 = activeMiinoGames.get(playerId);
      if (!game2) {
        await interaction.reply({ content: T.game_not_found, ephemeral: true });
        return;
      }
      if (game2.revealed[tileIdx]) {
        await interaction.reply({ content: T.miino_tile_already, ephemeral: true });
        return;
      }
      game2.revealed[tileIdx] = true;
      if (game2.grid[tileIdx] === "mine") {
        if (game2.inactivityTimer) clearTimeout(game2.inactivityTimer);
        const lostXP = game2.accumulatedXP;
        for (let i = 0; i < 20; i++) game2.revealed[i] = true;
        await storage.updateMiinoStats(playerId, "loss", game2.tilesRevealed, 0);
        activeMiinoGames.delete(playerId);
        trackQuest(playerId, "play_miino", 1).catch(() => {});
        const embed = buildMiinoEmbed(game2);
        embed.setTitle(T.miino_mine_title);
        embed.setDescription(embed.data.description + T.miino_mine_lost(lostXP));
        embed.setColor(16711680);
        await interaction.update({ embeds: [embed], components: [] });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4A3}\u{1F4A5} **Miino** <@${playerId}> hit a mine \u2014 lost ${lostXP} XP`);
        return;
      }
      game2.accumulatedXP += game2.grid[tileIdx];
      game2.tilesRevealed += 1;
      resetMiinoTimer(playerId, channel);
      if (game2.tilesRevealed >= 16) {
        if (game2.inactivityTimer) clearTimeout(game2.inactivityTimer);
        const bonusXP = 30;
        game2.accumulatedXP += bonusXP;
        const minoResult2 = await storage.updateMiinoStats(playerId, "win", game2.tilesRevealed, game2.accumulatedXP);
        const displayMiinoXP2 = minoResult2?.xpAwarded ?? game2.accumulatedXP;
        for (let i = 0; i < 20; i++) game2.revealed[i] = true;
        activeMiinoGames.delete(playerId);
        trackQuest(playerId, "play_miino", 1).catch(() => {});
        const embed = buildMiinoEmbed(game2);
        embed.setTitle(T.miino_perfect_title);
        embed.setDescription(embed.data.description + T.miino_perfect_desc(bonusXP, displayMiinoXP2));
        embed.setColor(16766720);
        await interaction.update({ embeds: [embed], components: [] });
        if (interaction.guild) await logToFtiLogs(interaction.guild, `\u{1F4A3}\u{1F3C6} **Miino** <@${playerId}> PERFECT CLEAR! +${displayMiinoXP2} XP`);
        return;
      }
      const rows = buildMiinoButtons(game2);
      await interaction.update({ embeds: [buildMiinoEmbed(game2)], components: [...rows] });
      return;
    }
    if (interaction.customId.startsWith("sheeko_join_")) {
      const gameId = interaction.customId.replace("sheeko_join_", "");
      const game2 = activeShekoGames.get(gameId);
      if (!game2 || game2.phase !== "lobby") {
        await interaction.reply({ content: T.lobby_not_found, ephemeral: true });
        return;
      }
      if (game2.players.find((p) => p.id === interaction.user.id)) {
        await interaction.reply({ content: T.already_joined, ephemeral: true });
        return;
      }
      if (game2.players.length >= 8) {
        await interaction.reply({ content: T.lobby_full, ephemeral: true });
        return;
      }
      const restriction = await storage.isPlayerRestricted(interaction.user.id);
      if (restriction.banned || restriction.muted || restriction.onHold) {
        await interaction.reply({ content: T.cant_join, ephemeral: true });
        return;
      }
      const m = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
      const name = getDisplayName(m, interaction.user.username);
      game2.players.push({ id: interaction.user.id, username: name, score: 0 });
      const numberEmojis = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3"];
      const list = game2.players.map((p, i) => `${numberEmojis[i]} ${p.username}`).join("\n");
      await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.sheeko_lobby_title).addFields(
        { name: `\u{1F465} Players (${game2.players.length}/8)`, value: list, inline: false },
        { name: "\u2139\uFE0F Info", value: T.sheeko_lobby_info, inline: false }
      ).setColor(15277667)] });
      return;
    }
    if (interaction.customId.startsWith("sheeko_leave_")) {
      const gameId = interaction.customId.replace("sheeko_leave_", "");
      const game2 = activeShekoGames.get(gameId);
      if (!game2 || game2.phase !== "lobby") {
        await interaction.reply({ content: T.lobby_not_found, ephemeral: true });
        return;
      }
      game2.players = game2.players.filter((p) => p.id !== interaction.user.id);
      if (game2.players.length === 0) {
        activeShekoGames.delete(gameId);
        await interaction.update({ content: T.sheeko_lobby_empty, embeds: [], components: [] });
        return;
      }
      if (game2.host === interaction.user.id) game2.host = game2.players[0].id;
      const numberEmojis = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3"];
      const list = game2.players.map((p, i) => `${numberEmojis[i]} ${p.username}`).join("\n");
      await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.sheeko_lobby_title).addFields(
        { name: `\u{1F465} Players (${game2.players.length}/8)`, value: list, inline: false },
        { name: "\u2139\uFE0F Info", value: T.sheeko_lobby_info, inline: false }
      ).setColor(15277667)] });
      return;
    }
    if (interaction.customId.startsWith("sheeko_start_")) {
      const gameId = interaction.customId.replace("sheeko_start_", "");
      const game2 = activeShekoGames.get(gameId);
      if (!game2 || game2.phase !== "lobby") {
        await interaction.reply({ content: T.lobby_not_found, ephemeral: true });
        return;
      }
      if (interaction.user.id !== game2.host) {
        await interaction.reply({ content: T.sheeko_host_only_start, ephemeral: true });
        return;
      }
      if (game2.players.length < 3) {
        await interaction.reply({ content: T.sheeko_min_players, ephemeral: true });
        return;
      }
      game2.phase = "waiting_story";
      game2.currentStoryteller = 0;
      await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.sheeko_started_title).setDescription(T.sheeko_started_desc(game2.players.length)).setColor(15277667)], components: [] });
      const channel = interaction.channel;
      await startShekoRound(gameId, channel);
      return;
    }
    if (interaction.customId.startsWith("sheeko_tell_")) {
      const gameId = interaction.customId.replace("sheeko_tell_", "");
      const game2 = activeShekoGames.get(gameId);
      if (!game2 || game2.phase !== "waiting_story") {
        await interaction.reply({ content: T.sheeko_cant_tell_now, ephemeral: true });
        return;
      }
      const storyteller = game2.players[game2.currentStoryteller];
      if (interaction.user.id !== storyteller.id) {
        await interaction.reply({ content: T.sheeko_not_your_turn, ephemeral: true });
        return;
      }
      const modal = new ModalBuilder().setCustomId(`sheeko_modal_${gameId}`).setTitle(T.sheeko_modal_title);
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("s1").setLabel(T.sheeko_modal_s1).setStyle(TextInputStyle.Short).setMaxLength(200).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("s2").setLabel(T.sheeko_modal_s2).setStyle(TextInputStyle.Short).setMaxLength(200).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("s3").setLabel(T.sheeko_modal_s3).setStyle(TextInputStyle.Short).setMaxLength(200).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("lie").setLabel(T.sheeko_modal_lie).setStyle(TextInputStyle.Short).setMaxLength(1).setRequired(true)
        )
      );
      await interaction.showModal(modal);
      return;
    }
    if (interaction.customId.startsWith("sheeko_vote_")) {
      const parts = interaction.customId.split("_");
      const voteChoice = parseInt(parts[2]);
      const gameId = parts.slice(3).join("_");
      const game2 = activeShekoGames.get(gameId);
      if (!game2 || game2.phase !== "voting") {
        await interaction.reply({ content: T.sheeko_voting_ended, ephemeral: true });
        return;
      }
      const storyteller = game2.players[game2.currentStoryteller];
      if (interaction.user.id === storyteller.id) {
        await interaction.reply({ content: T.sheeko_cant_vote_storyteller, ephemeral: true });
        return;
      }
      if (!game2.players.some((p) => p.id === interaction.user.id)) {
        await interaction.reply({ content: T.sheeko_not_in_game, ephemeral: true });
        return;
      }
      if (game2.votes.has(interaction.user.id)) {
        await interaction.reply({ content: T.sheeko_already_voted, ephemeral: true });
        return;
      }
      game2.votes.set(interaction.user.id, voteChoice);
      const totalVoters = game2.players.length - 1;
      const votedCount = game2.votes.size;
      await interaction.reply({ content: T.sheeko_vote_recorded(votedCount, totalVoters), ephemeral: true });
      if (votedCount >= totalVoters) {
        if (game2.inactivityTimer) clearTimeout(game2.inactivityTimer);
        const channel = interaction.channel;
        if (game2.phase === "voting") {
          await revealShekoResults(gameId, channel);
        }
      }
      return;
    }
    if (interaction.customId.startsWith("guess_accept_")) {
      const gameId = interaction.customId.replace("guess_accept_", "");
      const game2 = activeGuessGames.get(gameId);
      if (!game2) {
        await interaction.reply({ content: T.game_ended, ephemeral: true });
        return;
      }
      if (interaction.user.id !== game2.player2Id) {
        await interaction.reply({ content: T.guess_not_invited, ephemeral: true });
        return;
      }
      recentChallenges.set([game2.player1Id, game2.player2Id].sort().join("-"), Date.now());
      for (const pid of [game2.player1Id, game2.player2Id]) {
        let p = await storage.getPlayer(pid);
        if (!p) {
          const m = await interaction.guild?.members.fetch(pid).catch(() => null);
          await storage.createPlayer({ discordId: pid, username: getDisplayName(m, "Unknown") });
        }
      }
      const pickRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pick_btn_${gameId}_${game2.player1Id}`).setLabel(T.guess_pick_btn).setEmoji("\u{1F522}").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`pick_btn_${gameId}_${game2.player2Id}`).setLabel(T.guess_pick_btn).setEmoji("\u{1F522}").setStyle(ButtonStyle.Primary)
      );
      await interaction.update({
        embeds: [new EmbedBuilder().setTitle(T.guess_pick_title).setDescription(T.guess_pick_desc).setColor(3447003)],
        components: [pickRow]
      });
      return;
    }
    if (interaction.customId.startsWith("guess_decline_")) {
      const gameId = interaction.customId.replace("guess_decline_", "");
      const game2 = activeGuessGames.get(gameId);
      if (!game2) {
        await interaction.reply({ content: T.game_ended, ephemeral: true });
        return;
      }
      if (interaction.user.id !== game2.player2Id) {
        await interaction.reply({ content: T.guess_not_invited, ephemeral: true });
        return;
      }
      activeGuessGames.delete(gameId);
      await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.guess_title).setDescription(T.guess_declined).setColor(15158332)], components: [] });
      return;
    }
    if (interaction.customId.startsWith("guess_info_")) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setTitle(T.guess_info_title).setDescription(T.guess_info_desc).setColor(3447003)],
        ephemeral: true
      });
      return;
    }
    if (interaction.customId.startsWith("pick_btn_")) {
      const parts = interaction.customId.split("_");
      const gameId = parts.slice(2, -1).join("_");
      const targetUserId = parts[parts.length - 1];
      if (interaction.user.id !== targetUserId) {
        await interaction.reply({ content: T.guess_not_your_btn, ephemeral: true });
        return;
      }
      const game2 = activeGuessGames.get(gameId);
      if (!game2) {
        await interaction.reply({ content: T.game_ended, ephemeral: true });
        return;
      }
      const modal = new ModalBuilder().setCustomId(`pick_number_${gameId}`).setTitle(T.guess_pick_modal_title);
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("secret_number").setLabel(T.guess_pick_modal_label).setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(3).setRequired(true)
        )
      );
      await interaction.showModal(modal);
      return;
    }
    const lobbyId = Array.from(lobbies.keys()).find((k) => k.startsWith(interaction.channel?.id || ""));
    const lobby = lobbyId ? lobbies.get(lobbyId) : null;
    const gameChannel = interaction.channel?.id || "";
    const activeGameId = Array.from(activeGames.keys()).find((k) => k.startsWith(gameChannel));
    const game = activeGameId ? activeGames.get(activeGameId) : null;
    if (interaction.customId === "desc_game") {
      await interaction.reply({
        embeds: [new EmbedBuilder().setTitle(T.fti_desc_title).setDescription(T.fti_desc_text).setColor(10181046)],
        ephemeral: true
      });
      return;
    }
    if (interaction.customId.startsWith("vote_")) {
      if (!game || game.phase !== "voting") return;
      const voteRestriction = await storage.isPlayerRestricted(interaction.user.id);
      if (voteRestriction.muted || voteRestriction.banned) {
        await interaction.reply({ content: T.cant_vote_mute_ban, ephemeral: true });
        return;
      }
      if (game.votes.has(interaction.user.id)) {
        await interaction.reply({ content: T.already_voted_fti, ephemeral: true });
        return;
      }
      if (!game.alive.some((a) => a.id === interaction.user.id)) {
        await interaction.reply({ content: T.not_alive, ephemeral: true });
        return;
      }
      if (game.revoteCandidates && game.revoteCandidates.includes(interaction.user.id)) {
        await interaction.reply({ content: T.revote_candidate, ephemeral: true });
        return;
      }
      const targetId = interaction.customId.split("_")[1];
      if (game.revoteCandidates && !game.revoteCandidates.includes(targetId)) {
        await interaction.reply({ content: T.revote_invalid, ephemeral: true });
        return;
      }
      game.votes.set(interaction.user.id, targetId);
      await interaction.reply({ content: T.voted_fti, ephemeral: true });
      return;
    }
    if (interaction.customId === "join_lobby" && lobby) {
      if (lobby.players.find((p) => p.id === interaction.user.id)) {
        await interaction.reply({ content: T.already_joined_lobby, ephemeral: true });
        return;
      }
      const restriction = await storage.isPlayerRestricted(interaction.user.id);
      if (restriction.banned) {
        await interaction.reply({ content: T.restricted_banned, ephemeral: true });
        return;
      }
      if (restriction.muted) {
        await interaction.reply({ content: T.restricted_muted(restriction.mutedUntil), ephemeral: true });
        return;
      }
      lobby.players.push(interaction.user);
      const numImposters = lobby.maxPlayers >= 19 ? 4 : lobby.maxPlayers >= 12 ? 3 : lobby.maxPlayers >= 7 ? 2 : 1;
      const hostMember = await interaction.guild?.members.fetch(lobby.host).catch(() => null);
      const hostName = getDisplayName(hostMember, "Host");
      const numberEmojis = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3", "9\uFE0F\u20E3", "\u{1F51F}"];
      const list = await Promise.all(lobby.players.map(async (p, i) => {
        const m = await interaction.guild?.members.fetch(p.id).catch(() => null);
        return `${numberEmojis[i] || `${i + 1}.`} ${getDisplayName(m, p.username)}`;
      }));
      const embed = new EmbedBuilder().setTitle(T.fti_lobby_title).addFields(
        { name: T.fti_game_status, value: T.fti_lobby_status(lobby.players.length, lobby.maxPlayers, hostName), inline: false },
        { name: T.fti_players_label, value: list.join("\n"), inline: false },
        { name: "\u2139\uFE0F Info", value: T.fti_lobby_info(numImposters), inline: false }
      ).setColor(39423);
      if (lobby.players.length >= lobby.maxPlayers) {
        lobbies.delete(lobbyId);
        await interaction.update({ embeds: [embed], components: [] });
        await startFTIGame(lobby.players, interaction.channel, lobbyId);
      } else {
        await interaction.update({ embeds: [embed] });
      }
      return;
    }
    if (interaction.customId === "leave_lobby" && lobby) {
      const idx = lobby.players.findIndex((p) => p.id === interaction.user.id);
      if (idx === -1) {
        await interaction.reply({ content: T.not_in_lobby, ephemeral: true });
        return;
      }
      lobby.players.splice(idx, 1);
      if (lobby.players.length === 0) {
        lobbies.delete(lobbyId);
        activeFtiChannels.delete(interaction.channel?.id || "");
        await interaction.update({ embeds: [new EmbedBuilder().setTitle(T.fti_lobby_title).setDescription(T.fti_lobby_closed).setColor(9807270)], components: [] });
        return;
      }
      const numImposters = lobby.maxPlayers >= 19 ? 4 : lobby.maxPlayers >= 12 ? 3 : lobby.maxPlayers >= 7 ? 2 : 1;
      const hostMember = await interaction.guild?.members.fetch(lobby.host).catch(() => null);
      const hostName = getDisplayName(hostMember, "Host");
      const numberEmojis = ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3", "7\uFE0F\u20E3", "8\uFE0F\u20E3", "9\uFE0F\u20E3", "\u{1F51F}"];
      const list = await Promise.all(lobby.players.map(async (p, i) => {
        const m = await interaction.guild?.members.fetch(p.id).catch(() => null);
        return `${numberEmojis[i] || `${i + 1}.`} ${getDisplayName(m, p.username)}`;
      }));
      const embed = new EmbedBuilder().setTitle(T.fti_lobby_title).addFields(
        { name: T.fti_game_status, value: T.fti_lobby_status(lobby.players.length, lobby.maxPlayers, hostName), inline: false },
        { name: T.fti_players_label, value: list.length > 0 ? list.join("\n") : T.fti_nobody, inline: false },
        { name: "\u2139\uFE0F Info", value: T.fti_lobby_info(numImposters), inline: false }
      ).setColor(39423);
      await interaction.update({ embeds: [embed] });
    }
    if (interaction.isButton() && interaction.customId.startsWith("taraq_join_")) {
      const gameId = interaction.customId.replace("taraq_join_", "");
      const game = taraqGames.get(gameId);
      if (!game || game.phase !== "lobby") {
        await interaction.reply({ content: "\u26A0\uFE0F Lobby-gan ma furan.", ephemeral: true });
        return;
      }
      if (game.players.find((p) => p.id === interaction.user.id)) {
        await interaction.reply({ content: "horey ayaad ugu biirtay", ephemeral: true });
        return;
      }
      const leaveCooldownEnd = taraqLeaveCooldowns.get(interaction.user.id);
      if (leaveCooldownEnd && Date.now() < leaveCooldownEnd) {
        const secsLeft = Math.ceil((leaveCooldownEnd - Date.now()) / 1000);
        await interaction.reply({ content: `⏳ ${secsLeft}s kadib ayaad dib ugu biiri kartaa.`, ephemeral: true });
        return;
      }
      const member = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
      const displayName = member?.displayName || interaction.user.username;
      const allRoles = await interaction.guild?.roles.fetch().catch(() => null);
      const taraqRole = allRoles?.find((r) => r.name.toLowerCase() === "taraq");
      if (taraqRole && member) {
        await member.roles.add(taraqRole).catch(() => {});
      }
      game.players.push({ id: interaction.user.id, username: displayName });
      const playerList = game.players.map((p, i) => `\`${i + 1}.\` <@${p.id}>`).join("\n") || "\u200B";
      const updatedEmbed = new EmbedBuilder()
        .setTitle("\u{1F500} Taraq Shuffle \u2014 Lobby")
        .setDescription(
          `\u{1F3AE} **Ku soo dhawoow Taraq Shuffle!**\n\nFadlan taabo buttonka **Kubiir** si aad ugu biirtid shuffleka.\nWaxa uu go\u2019aamin doonaa qaabka iskugugu xigsanaysaan oo kaliya \u2014 waxaana loo tuurayaa si **random** ah, Roleka taraq ayaana helaysaa.\n\n\u200B`
        )
        .addFields({ name: `\u{1F465} Ciyaartoyda (\`${game.players.length}\`)`, value: playerList, inline: false })
        .setColor(0x7c3aed)
        .setFooter({ text: `Host: ${game.hostName}` })
        .setTimestamp();
      const taraqRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`taraq_join_${gameId}`).setLabel("Kubiir").setEmoji("\u2705").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`taraq_start_${gameId}`).setLabel("Bilow").setEmoji("\u{1F500}").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`taraq_leave_${gameId}`).setLabel("Bax").setEmoji("\uD83D\uDEAA").setStyle(ButtonStyle.Danger)
      );
      await interaction.update({ embeds: [updatedEmbed], components: [taraqRow] });
      return;
    }
    if (interaction.isButton() && interaction.customId.startsWith("taraq_start_")) {
      const gameId = interaction.customId.replace("taraq_start_", "");
      const game = taraqGames.get(gameId);
      if (!game || game.phase !== "lobby") {
        await interaction.reply({ content: "\u26A0\uFE0F Lobby-gan ma furna.", ephemeral: true });
        return;
      }
      if (interaction.user.id !== game.hostId) {
        await interaction.reply({ content: "kaliya host ayaa bilaabi kara", ephemeral: true });
        return;
      }
      if (game.players.length < 2) {
        await interaction.reply({ content: "\u26A0\uFE0F Ugu yaraan 2 ciyaartoy ayaa loo baahan yahay.", ephemeral: true });
        return;
      }
      game.phase = "shuffling";
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`taraq_join_${gameId}`).setLabel("Kubiir").setEmoji("\u2705").setStyle(ButtonStyle.Success).setDisabled(true),
        new ButtonBuilder().setCustomId(`taraq_start_${gameId}`).setLabel("Bilow").setEmoji("\u{1F500}").setStyle(ButtonStyle.Primary).setDisabled(true)
      );
      const shufflingEmbed = (stage) => {
        const stages = ["\u{1F500} Shuffling \u{1F504}", "\u{1F500}\u{1F500} Shuffling \u{1F504}\u{1F504}", "\u{1F500}\u{1F500}\u{1F500} Shuffling \u{1F504}\u{1F504}\u{1F504}"];
        return new EmbedBuilder()
          .setTitle("\u{1F500} Taraq Shuffle \u2014 Socota...")
          .setDescription(`**${stages[stage]}**\n\n\`Sugso...\``)
          .setColor(0xfbbf24)
          .setFooter({ text: `Host: ${game.hostName}` })
          .setTimestamp();
      };
      await interaction.update({ embeds: [shufflingEmbed(0)], components: [disabledRow] });
      const msg = await interaction.fetchReply();
      await new Promise((res) => setTimeout(res, 1200));
      await msg.edit({ embeds: [shufflingEmbed(1)], components: [disabledRow] }).catch(() => {});
      await new Promise((res) => setTimeout(res, 1200));
      await msg.edit({ embeds: [shufflingEmbed(2)], components: [disabledRow] }).catch(() => {});
      await new Promise((res) => setTimeout(res, 1200));
      const shuffled = [...game.players].sort(() => Math.random() - 0.5);
      const resultList = shuffled.map((p, i) => `\`${i + 1}.\` <@${p.id}>`).join("\n");
      const resultEmbed = new EmbedBuilder()
        .setTitle("\u{1F3C6} Taraq Shuffle \u2014 Natiijada!")
        .setDescription(
          `\u2728 **Shuffleka wuu soo dhammaaday!**\n\nSidan ayay isku xigsanaan doonaan:\n\n${resultList}`
        )
        .setColor(0x10b981)
        .setFooter({ text: `Host: ${game.hostName} \u2022 ${shuffled.length} ciyaartood` })
        .setTimestamp();
      await msg.edit({ embeds: [resultEmbed], components: [] }).catch(() => {});
      await interaction.channel.send({
        embeds: [new EmbedBuilder().setDescription("❤️ Mahadsanid ciyaartooy! U codee Nasiib oo hel **+100 🪙 · +10 💎 · +20 ⭐** abaal marin ah!").setColor(0x2ecc71)],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("🗳️ U codee Nasiib").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1448671256147787861/vote"))]
      }).catch(() => {});
      taraqGames.delete(gameId);
      return;
    }
    if (interaction.isButton() && interaction.customId.startsWith("taraq_leave_")) {
      const gameId = interaction.customId.replace("taraq_leave_", "");
      const game = taraqGames.get(gameId);
      if (!game || game.phase !== "lobby") {
        await interaction.reply({ content: "\u26A0\uFE0F Lobby-gan ma furan.", ephemeral: true });
        return;
      }

      if (interaction.user.id === game.hostId) {
        await interaction.reply({ content: "Host kama bixi karo \uD83D\uDE1D", ephemeral: true });
        return;
      }

      const idx = game.players.findIndex((p) => p.id === interaction.user.id);
      if (idx === -1) {
        await interaction.reply({ content: "\u26A0\uFE0F Ma jirtid lobby-gan.", ephemeral: true });
        return;
      }

      game.players.splice(idx, 1);

      taraqLeaveCooldowns.set(interaction.user.id, Date.now() + 60_000);
      setTimeout(() => taraqLeaveCooldowns.delete(interaction.user.id), 60_000);

      const updatedPlayerList = game.players.map((p, i) => `\`${i + 1}.\` <@${p.id}>`).join("\n") || "\u200B";
      const updatedEmbed = new EmbedBuilder()
        .setTitle("\u{1F500} Taraq Shuffle \u2014 Lobby")
        .setDescription(
          `\u{1F3AE} **Ku soo dhawoow Taraq Shuffle!**\n\nFadlan taabo buttonka **Kubiir** si aad ugu biirtid shuffleka.\nWaxa uu go\u2019aamin doonaa qaabka iskugugu xigsanaysaan oo kaliya \u2014 waxaana loo tuurayaa si **random** ah, Roleka taraq ayaana helaysaa.\n\n\u200B`
        )
        .addFields({ name: `\u{1F465} Ciyaartoyda (\`${game.players.length}\`)`, value: updatedPlayerList, inline: false })
        .setColor(0x7c3aed)
        .setFooter({ text: `Host: ${game.hostName}` })
        .setTimestamp();
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`taraq_join_${gameId}`).setLabel("Kubiir").setEmoji("\u2705").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`taraq_start_${gameId}`).setLabel("Bilow").setEmoji("\u{1F500}").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`taraq_leave_${gameId}`).setLabel("Bax").setEmoji("\uD83D\uDEAA").setStyle(ButtonStyle.Danger)
      );
      await interaction.update({ embeds: [updatedEmbed], components: [updatedRow] });
      return;
    }


    const _loanPfxs = ["loan_confirm_", "loan_cancel_", "loan_close_", "loanpay_confirm_", "loanpay_cancel_", "loanunban_confirm_", "loanunban_cancel_"];
    if (_loanPfxs.some(p => interaction.customId.startsWith(p))) {
      await handleLoanInteraction(interaction, storage);
      return;
    }
  });
  async function resolveGuessGame(gameId, channel) {
    const game = activeGuessGames.get(gameId);
    if (!game) return;
    game.phase = "finished";
    if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
    const p1Guesses = game.player1Guesses.length;
    const p2Guesses = game.player2Guesses.length;
    const totalTurns = p1Guesses + p2Guesses;
    const validForXP = totalTurns >= 3 && p1Guesses >= 1 && p2Guesses >= 1;
    let result;
    if (game.player1Found && game.player2Found) {
      result = "draw";
    } else if (game.player1Found && !game.player2Found) {
      result = "p1";
    } else if (!game.player1Found && game.player2Found) {
      result = "p2";
    } else {
      result = "draw";
    }
    const p1Member = await channel.guild.members.fetch(game.player1Id).catch(() => null);
    const p2Member = await channel.guild.members.fetch(game.player2Id).catch(() => null);
    const p1Name = getDisplayName(p1Member, "Player 1");
    const p2Name = getDisplayName(p2Member, "Player 2");
    let desc2 = "";
    if (result === "draw") {
      desc2 = T.guess_draw(p1Name, p2Name, p1Guesses, p2Guesses);
    } else {
      const winnerName = result === "p1" ? p1Name : p2Name;
      desc2 = T.guess_winner(winnerName, p1Name, p2Name, p1Guesses, p2Guesses, game.player1Found, game.player2Found);
    }
    if (validForXP) {
      if (result === "p1") {
        await storage.updateGuessStats(game.player1Id, "win", p1Guesses);
        await storage.updateGuessStats(game.player2Id, "loss", p2Guesses);
      } else if (result === "p2") {
        await storage.updateGuessStats(game.player2Id, "win", p2Guesses);
        await storage.updateGuessStats(game.player1Id, "loss", p1Guesses);
      } else {
        await storage.updateGuessStats(game.player1Id, "draw", p1Guesses);
        await storage.updateGuessStats(game.player2Id, "draw", p2Guesses);
      }
    }
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.guess_result_title).setDescription(desc2 + T.guess_numbers_reveal(p1Name, game.player1Number, p2Name, game.player2Number)).setColor(result === "draw" ? 15844367 : 3066993)] });
    activeGuessGames.delete(gameId);
  }
  async function startFTIGame(players2, channel, lobbyId) {
    let numImposters = players2.length >= 19 ? 4 : players2.length >= 12 ? 3 : players2.length >= 7 ? 2 : 1;
    const shuffled = [...players2].sort(() => 0.5 - Math.random());
    const imposters = shuffled.slice(0, numImposters).map((p) => p.id);
    const citizens = shuffled.slice(numImposters).map((p) => p.id);
    activeGames.set(lobbyId, {
      players: players2,
      alive: [...players2],
      imposters,
      citizens,
      phase: "discussion",
      day: 1,
      votes: /* @__PURE__ */ new Map(),
      missedVotes: /* @__PURE__ */ new Map(),
      criticalPhase: false,
      correctVoters: /* @__PURE__ */ new Set(),
      eliminatedByImposter: /* @__PURE__ */ new Map(),
      isProcessing: false,
      revoteCandidates: null,
      channelId: channel.id,
      startTime: Date.now()
    });
    if (channel.guild) await logToFtiLogs(channel.guild, `\u{1F3AE} **FTI Game Started** in #${channel.name} with ${players2.length} players`);
    for (const p of players2) {
      const isImp = imposters.includes(p.id);
      const others = isImp ? imposters.filter((id) => id !== p.id) : [];
      let msg = T.fti_role_msg(isImp);
      if (others.length > 0) {
        const names = await Promise.all(others.map(async (id) => {
          const m = await channel.guild.members.fetch(id).catch(() => null);
          return getDisplayName(m, "Unknown");
        }));
        msg += T.fti_other_imps(names.join(", "));
      }
      await p.send(msg).catch(() => {
      });
      let existing = await storage.getPlayer(p.id);
      if (!existing) {
        const m = await channel.guild.members.fetch(p.id).catch(() => null);
        await storage.createPlayer({ discordId: p.id, username: getDisplayName(m, p.username) });
      }
    }

    for (const p of players2) {
      const pData = await storage.getPlayer(p.id);
      const pTitles = Array.isArray(pData?.ownedTitles) ? pData.ownedTitles : [];
      if (!pTitles.includes("observer_title")) continue;
      const possibleSafe = players2.filter(pl => !imposters.includes(pl.id) && pl.id !== p.id);
      if (possibleSafe.length === 0) continue;
      const safeTarget = possibleSafe[Math.floor(Math.random() * possibleSafe.length)];
      const safeMember = await channel.guild.members.fetch(safeTarget.id).catch(() => null);
      const safeName = getDisplayName(safeMember, safeTarget.username || "Player");
      await p.send(`👁️ **Observer Hint** (qarsoodi ah)\n\n**${safeName}** waa **citizen** — imposter ma ahan.\n\n*Hintgan waxaad ka heshay Observer Title-kaaga.*`).catch(() => {});
    }
    try {
      startFTIRound(lobbyId, channel);
    } catch (err) {
      console.error("FTI game start error:", err);
      await safeCleanup(lobbyId, channel);
    }
  }
  async function safeCleanup(lobbyId, channel) {
    try {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
      });
    } catch {
    }
    activeFtiChannels.delete(channel.id);
    activeGames.delete(lobbyId);
    for (const [lid] of lobbies) {
      if (lid.startsWith(channel.id)) lobbies.delete(lid);
    }
  }
  async function startFTIRound(lobbyId, channel) {
    const game = activeGames.get(lobbyId);
    if (!game) return;
    const aliveImps = game.imposters.filter((id) => game.alive.some((a) => a.id === id)).length;
    const aliveCits = game.alive.length - aliveImps;
    if (!game.criticalPhase && aliveCits <= aliveImps + 1 && game.day > 1) {
      game.criticalPhase = true;
      const aliveMentions2 = game.alive.map((p) => `<@${p.id}>`).join(" ");
      await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_final_stand_title).setDescription(T.fti_final_stand_desc(aliveMentions2)).setColor(16711680)] });
    }
    game.phase = "discussion";
    game.votes.clear();
    game.revoteCandidates = null;
    game.roundMessages = [];
    let time = game.criticalPhase ? 120 : Math.max(30, Math.min(200, game.alive.length * 10));
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
    });
    const aliveMentions = game.alive.map((p) => `<@${p.id}>`).join(" ");
    const mentionMsg = await channel.send(aliveMentions);
    game.roundMessages.push(mentionMsg.id);
    const embed = new EmbedBuilder().setTitle(T.fti_discussion_title(game.day)).setDescription(T.fti_discussion_desc(time, aliveMentions)).setColor(16753920);
    const msg = await channel.send({ embeds: [embed] });
    game.roundMessages.push(msg.id);
    const timer = setInterval(async () => {
      time -= 10;
      if (time <= 0) {
        clearInterval(timer);
        try {
          for (const msgId of game.roundMessages || []) {
            try {
              const m = await channel.messages.fetch(msgId);
              await m.delete();
            } catch {
            }
          }
          game.roundMessages = [];
          await startFTIVoting(lobbyId, channel);
        } catch (err) {
          console.error("FTI voting error:", err);
          await safeCleanup(lobbyId, channel);
        }
      } else if (time <= 10 || time % 30 === 0) {
        await msg.edit({ embeds: [new EmbedBuilder().setTitle(T.fti_discussion_title(game.day)).setDescription(T.fti_discussion_desc(time, aliveMentions)).setColor(time <= 10 ? 16711680 : 16753920)] }).catch(() => {
        });
      }
    }, 1e4);
  }
  async function startFTIVoting(lobbyId, channel) {
    const game = activeGames.get(lobbyId);
    if (!game) return;
    game.phase = "voting";
    game.votes.clear();
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false }).catch(() => {
    });
    const rows = [];
    let currentRow = new ActionRowBuilder();
    for (let i = 0; i < game.alive.length; i++) {
      const p = game.alive[i];
      const m = await channel.guild.members.fetch(p.id).catch(() => null);
      currentRow.addComponents(new ButtonBuilder().setCustomId(`vote_${p.id}`).setLabel(getDisplayName(m, p.username)).setStyle(ButtonStyle.Primary));
      if ((i + 1) % 5 === 0) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    }
    if (currentRow.components.length > 0) rows.push(currentRow);
    const aliveMentions = game.alive.map((p) => `<@${p.id}>`).join(" ");
    await channel.send(aliveMentions);
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_vote_title).setDescription(T.fti_vote_desc).setColor(16711680)], components: rows });
    setTimeout(() => {
      try {
        resolveFTIVotes(lobbyId, channel);
      } catch (err) {
        console.error("Vote resolve error:", err);
        safeCleanup(lobbyId, channel);
      }
    }, 6e4);
  }
  async function resolveFTIVotes(lobbyId, channel, isRevote = false) {
    const game = activeGames.get(lobbyId);
    if (!game) return;
    if (game.isProcessing) return;
    game.isProcessing = true;
    try {
      if (!isRevote) {
        const aliveCopy = [...game.alive];
        for (const p of aliveCopy) {
          if (!game.votes.has(p.id)) {
            game.missedVotes.set(p.id, (game.missedVotes.get(p.id) || 0) + 1);
            if (game.missedVotes.get(p.id) >= 2) {
              game.alive = game.alive.filter((a) => a.id !== p.id);
              const isImp = game.imposters.includes(p.id);
              const aliveMentions = game.alive.map((a) => `<@${a.id}>`).join(" ");
              const m = await channel.guild.members.fetch(p.id).catch(() => null);
              const name = getDisplayName(m, p.username);
              await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_inactivity_title).setDescription(T.fti_inactivity_desc(aliveMentions, name, isImp)).setColor(15158332)] });
              if (channel.guild) await logToFtiLogs(channel.guild, `\u26A0\uFE0F **Inactivity Removal**: ${name} removed from game in #${channel.name}`);
            }
          } else {
            game.missedVotes.set(p.id, 0);
          }
        }
      }
      const voteLines = [];
      const counts = /* @__PURE__ */ new Map();
      for (const [voterId, targetId] of game.votes.entries()) {
        counts.set(targetId, (counts.get(targetId) || 0) + 1);
        if (game.imposters.includes(targetId) && !game.imposters.includes(voterId)) {
          game.correctVoters.add(voterId);
        }
        const voterM = await channel.guild.members.fetch(voterId).catch(() => null);
        const targetM = await channel.guild.members.fetch(targetId).catch(() => null);
        voteLines.push(`${getDisplayName(voterM, "?")} \u279C ${getDisplayName(targetM, "?")}`);
      }
      if (voteLines.length > 0) {
        await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_vote_results_title).setDescription(voteLines.join("\n")).setColor(9807270)] });
      }
      let max = 0, targets = [];
      counts.forEach((c, id) => {
        if (c > max) {
          max = c;
          targets = [id];
        } else if (c === max) targets.push(id);
      });
      if (targets.length === 1 && max > 0) {
        const eliminatedId = targets[0];
        const eliminated = game.players.find((a) => a.id === eliminatedId);
        game.alive = game.alive.filter((a) => a.id !== eliminatedId);
        const isImp = game.imposters.includes(eliminatedId);
        const m = await channel.guild.members.fetch(eliminatedId).catch(() => null);
        const name = getDisplayName(m, eliminated?.username || "Unknown");
        await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_eliminated_title).setDescription(T.fti_eliminated_role(name, isImp)).setColor(isImp ? 3066993 : 15158332)] });
      } else if (targets.length > 1 && !isRevote) {
        const tiedNames = await Promise.all(targets.map(async (id) => {
          const m = await channel.guild.members.fetch(id).catch(() => null);
          return getDisplayName(m, "?");
        }));
        await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_tie_title).setDescription(T.fti_tie_names(tiedNames.join(", "))).setColor(15844367)] });
        game.isProcessing = false;
        startFTIRevote(lobbyId, channel, targets);
        return;
      } else if (targets.length > 1 && isRevote) {
        await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_tie_again).setDescription(T.fti_tie_again_desc).setColor(15844367)] });
      } else {
        await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_no_votes).setDescription(T.fti_no_votes_desc).setColor(9807270)] });
      }
      const aliveImps = game.imposters.filter((id) => game.alive.some((a) => a.id === id)).length;
      const aliveCits = game.alive.length - aliveImps;
      game.isProcessing = false;
      if (aliveImps === 0) await endFTIGame(lobbyId, channel, "Citizens");
      else if (aliveImps >= aliveCits) await endFTIGame(lobbyId, channel, "Imposters");
      else {
        game.day++;
        startFTIRound(lobbyId, channel);
      }
    } catch (err) {
      console.error("Vote resolution error:", err);
      game.isProcessing = false;
      await safeCleanup(lobbyId, channel);
    }
  }
  async function startFTIRevote(lobbyId, channel, tiedPlayerIds) {
    const game = activeGames.get(lobbyId);
    if (!game) return;
    game.phase = "voting";
    game.votes.clear();
    game.revoteCandidates = tiedPlayerIds;
    const voters = game.alive.filter((p) => !tiedPlayerIds.includes(p.id));
    if (voters.length === 0) {
      await channel.send({ embeds: [new EmbedBuilder().setDescription(T.fti_revote_no_voters).setColor(9807270)] });
      game.day++;
      startFTIRound(lobbyId, channel);
      return;
    }
    const rows = [];
    let currentRow = new ActionRowBuilder();
    for (let i = 0; i < tiedPlayerIds.length; i++) {
      const m = await channel.guild.members.fetch(tiedPlayerIds[i]).catch(() => null);
      currentRow.addComponents(new ButtonBuilder().setCustomId(`vote_${tiedPlayerIds[i]}`).setLabel(getDisplayName(m, "?")).setStyle(ButtonStyle.Danger));
      if ((i + 1) % 5 === 0) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    }
    if (currentRow.components.length > 0) rows.push(currentRow);
    const voterMentions = voters.map((v) => `<@${v.id}>`).join(" ");
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_revote_title).setDescription(T.fti_revote_desc_fn(voterMentions)).setColor(16737792)], components: rows });
    setTimeout(() => {
      try {
        resolveFTIVotes(lobbyId, channel, true);
      } catch (err) {
        console.error("Revote error:", err);
        safeCleanup(lobbyId, channel);
      }
    }, 3e4);
  }
  async function endFTIGame(lobbyId, channel, winner) {
    const game = activeGames.get(lobbyId);
    if (!game) return;
    const impNames = await Promise.all(game.imposters.map(async (id) => {
      const m = await channel.guild.members.fetch(id).catch(() => null);
      return getDisplayName(m, "Unknown");
    }));
    const citNames = await Promise.all(game.citizens.map(async (id) => {
      const m = await channel.guild.members.fetch(id).catch(() => null);
      return getDisplayName(m, "Unknown");
    }));
    await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_game_over_title).setDescription(T.fti_winner(winner)).addFields(
      { name: "\u{1F52A} Imposters", value: impNames.join(", "), inline: false },
      { name: "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1} Citizens", value: citNames.join(", "), inline: false }
    ).setColor(winner === "Citizens" ? 3066993 : 15158332)] });
    if (winner !== "Force End") {
      const xpLines = [];
      for (const p of game.players) {
        const isImp = game.imposters.includes(p.id);
        const win = winner === "Imposters" && isImp || winner === "Citizens" && !isImp;
        const survived = game.alive.some((a) => a.id === p.id);
        const correctVote = game.correctVoters.has(p.id);
        const clutchWin = game.criticalPhase && win;
        const elimCount = isImp ? game.eliminatedByImposter.get(p.id) || 0 : 0;
        let baseXP = win ? 35 : 10;
        let bonusXP = 0;
        if (isImp) {
          if (survived) bonusXP += 12;
          bonusXP += elimCount * 8;
        } else {
          if (correctVote) bonusXP += 6;
          if (survived) bonusXP += 8;
        }
        if (clutchWin) bonusXP += 15;
        const earnedXP = baseXP + bonusXP;
        const pMember = await channel.guild.members.fetch(p.id).catch(() => null);
        const pName = getDisplayName(pMember, p.username || "Player");
        const ftiResult = await storage.updatePlayerStats(p.id, {
          win,
          role: isImp ? "imposter" : "citizen",
          survived,
          correctVote,
          clutchWin,
          eliminatedPlayerCount: elimCount,
          numPlayers: game.players.length
        });
        const ftiXP = ftiResult?.xpAwarded ?? earnedXP;
        xpLines.push(`${win ? "\u{1F3C6}" : "\u{1F494}"} **${pName}**: +${ftiXP} \u2B50 XP`);
        if (game.imposters.length >= 2) {
          trackQuest(p.id, "play_fti", 1).catch(() => {});
        }
      }
      await channel.send({ embeds: [new EmbedBuilder().setTitle(T.fti_xp_distributed_title).setDescription(xpLines.join("\n")).setColor(16766720)] });
      for (const p of game.players) {
        await checkLevel60(p.id, channel);
      }
    }
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
    });
    if (channel.guild) await logToFtiLogs(channel.guild, `\u{1F3C1} **FTI Game Ended** in #${channel.name} \u2014 Winner: ${winner}`);
    activeFtiChannels.delete(channel.id);
    activeGames.delete(lobbyId);
    const ftiSugKey = `fti_${channel.id}`;
    const ftiSugUsers = sugQueue.get(ftiSugKey);
    const playerMentions = game.players.map((p) => `<@${p.id}>`).join(" ");
    if (ftiSugUsers && ftiSugUsers.size > 0) {
      const sugMentions = Array.from(ftiSugUsers).map((id) => `<@${id}>`).join(" ");
      await channel.send({ embeds: [new EmbedBuilder().setTitle("\u{1F514} Game Reminder").setDescription(T.sug_fti_ended(playerMentions, sugMentions)).setColor(3447003)] });
      sugQueue.delete(ftiSugKey);
    } else {
      await channel.send({ embeds: [new EmbedBuilder().setTitle("\u{1F514} Game Reminder").setDescription(T.sug_fti_ended_no_sug(playerMentions)).setColor(3447003)] });
    }
    if (winner !== "Force End") {
      await channel.send({
        embeds: [new EmbedBuilder().setDescription("❤️ Mahadsanid ciyaartooy! U codee Nasiib oo hel **+100coins 🪙 · +10 💎 · +20 ⭐**oo abaal marin ah!").setColor(0x2ecc71)],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel("🗳️ U codee Nasiib").setStyle(ButtonStyle.Link).setURL("https://top.gg/bot/1448671256147787861/vote"))]
      });
    }
    setTimeout(async () => {
      try {
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true }).catch(() => {
        });
      } catch {
      }
    }, 1e4);
  }
  await setupBankSystem(client);
  await setupBankLevel4(client);
  await setupEventSystem(client);

  await setupBankSlashCommands(client);
  await setupTicketSystem(client);

  setupVault(client);
  setupServerBoost(client);
  await setupLoanSystem(client);
  await setupCoinflipPvp(client);
  setupTowerSystem(client, storage, trackQuest);
  setupBankTransfer(client);
  setupSomaliHelp(client);
  setupVerifyInteractions(client, storage, pool, logEconomy);
  setupPermissionSystem(client);
  setupCiladSystem(client);
  await refreshNwCache();
  scheduleNwDailyRefresh();
  await client.login(process.env.DISCORD_TOKEN);
}


import express from "express";
async function main() {
  globalThis._ciladManagedByApp = true;
  console.log("Starting Discord Bot...");
  if (!process.env.DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN is missing!");
    process.exit(1);
  }



  process.on("unhandledRejection", (reason, promise) => {
    console.error("[ERROR] Unhandled Rejection at:", promise, "reason:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("[ERROR] Uncaught Exception:", err);
  });

  const app = express();
  const port = process.env.PORT || 5e3;

  app.use(express.json());


  app.get("/", (_req, res) => res.send("Bot is running!"));


  app.post("/api/topgg", async (req, res) => {
    const topggAuth = process.env.TOPGG_AUTH;
    const incoming  = req.headers["authorization"];

    if (topggAuth && incoming !== topggAuth) {
      console.warn("[Webhook] Unauthorized request — wrong auth header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { user, type } = req.body;

    if (type === "test") {
      console.log("[Webhook] Test ping from Top.gg — ignored");
      return res.status(200).json({ ok: true });
    }

    if (!user) {
      console.warn("[Webhook] Missing user in payload:", req.body);
      return res.status(400).json({ error: "Missing user" });
    }

    const userId   = String(user);
    const lastVote = Date.now();

    try {
      await pool.query(
        `INSERT INTO votes (user_id, last_vote, processed)
         VALUES ($1, $2, false)
         ON CONFLICT (user_id)
         DO UPDATE SET last_vote = EXCLUDED.last_vote, processed = false`,
        [userId, lastVote]
      );
      console.log(`[Webhook] Vote recorded for user ${userId} at ${new Date(lastVote).toISOString()}`);
      voteTimeCache.set(userId, { lastVote, ts: Date.now() });
      await pool.query(
        `INSERT INTO players (discord_id, username) VALUES ($1, $2) ON CONFLICT (discord_id) DO NOTHING`,
        [userId, `voter_${userId.slice(-4)}`]
      ).catch(() => {});
      await pool.query(
        `UPDATE players SET last_vote_time = $1 WHERE discord_id = $2`,
        [lastVote, userId]
      ).catch(() => {});
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[Webhook] DB error:", err.message);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.listen(port, () => console.log(`Keep-alive server on port ${port}`));

  try {
    await setupBot();
    console.log("Bot initialization complete.");
  } catch (err) {
    console.error("Failed to start bot:", err.message);






    console.error("[FATAL] Bot startup failed — exiting for clean restart by process manager.");
    process.exit(1);
  }
}
main();
