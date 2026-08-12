import { createRequire } from "module"; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};


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
  legendaryCrates: integer("legendary_crates").notNull().default(0)
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
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });
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
      CREATE TABLE IF NOT EXISTS eid_spins (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        last_spin_date TEXT NOT NULL DEFAULT '',
        spins_today INTEGER NOT NULL DEFAULT 0
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
    if (restriction.muted || restriction.banned) return player;
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
    const earned = Math.floor((baseXP + bonusXP) * (1 + streakBonus)) + prestigeBoost;
    const result = this.applyXPAndLevel(xp, player.level, earned);
    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level, wins, losses, gamesPlayed, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateGuessStats(discordId, result, guessCount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned) return player;
    let { xp, wins, losses, gamesPlayed, currentStreak, highestStreak } = player;
    const gStats = this.ensureGameStats(player.gameStats);
    gamesPlayed += 1;
    gStats.guess.played += 1;
    let earnedXP = 0;
    if (result === "win") {
      wins += 1;
      gStats.guess.wins += 1;
      earnedXP = 25;
      currentStreak += 1;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
      if (guessCount <= 3) earnedXP += 8;
    } else if (result === "loss") {
      losses += 1;
      gStats.guess.losses += 1;
      earnedXP = 5;
      currentStreak = 0;
    } else {
      earnedXP = 12;
    }
    const streakBonus = this.getStreakBonus(currentStreak);
    const prestigeBoost = (player.prestige || 0) * 5;
    const earned = Math.floor(earnedXP * (1 + streakBonus)) + prestigeBoost;
    const lvlResult = this.applyXPAndLevel(xp, player.level, earned);
    const [updated] = await db.update(players).set({ xp: lvlResult.xp, level: lvlResult.level, wins, losses, gamesPlayed, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateBluffStats(discordId, result, numPlayers) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    if (numPlayers < 3) return player;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned) return player;
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
    if (restriction.muted || restriction.banned) return player;
    const gStats = this.ensureGameStats(player.gameStats);
    gStats.tower.played += 1;
    if (floorsClimbed > gStats.tower.highestFloor) gStats.tower.highestFloor = floorsClimbed;
    gStats.tower.totalXpEarned += xpEarned;
    const prestigeBoost = (player.prestige || 0) * 5;
    const totalXP = xpEarned + prestigeBoost;
    const result = this.applyXPAndLevel(player.xp, player.level, totalXP);
    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level, gamesPlayed: player.gamesPlayed + 1, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateMiinoStats(discordId, result, tilesRevealed, xpEarned) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned) return player;
    const gStats = this.ensureGameStats(player.gameStats);
    gStats.miino.played += 1;
    if (result === "win") gStats.miino.wins += 1;
    else gStats.miino.losses += 1;
    if (tilesRevealed > gStats.miino.bestReveal) gStats.miino.bestReveal = tilesRevealed;
    const prestigeBoost = (player.prestige || 0) * 5;
    const totalXP = xpEarned + prestigeBoost;
    const lvlResult = this.applyXPAndLevel(player.xp, player.level, totalXP);
    const [updated] = await db.update(players).set({ xp: lvlResult.xp, level: lvlResult.level, gamesPlayed: player.gamesPlayed + 1, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async updateShekoStats(discordId, result, fooledAllCount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const restriction = await this.isPlayerRestricted(discordId);
    if (restriction.muted || restriction.banned) return player;
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
    const earned = Math.floor(earnedXP * (1 + streakBonus)) + prestigeBoost;
    const lvlResult = this.applyXPAndLevel(player.xp, player.level, earned);
    const [updated] = await db.update(players).set({ xp: lvlResult.xp, level: lvlResult.level, wins, losses, gamesPlayed: player.gamesPlayed + 1, currentStreak, highestStreak, gameStats: gStats }).where(eq(players.discordId, discordId)).returning();
    return updated;
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
    let streak = player.lastDaily === yesterday ? player.dailyStreak + 1 : 1;
    const bonusDay = streak % 7 === 0;
    const legendaryDay = streak % 30 === 0;
    let dailyXP = 15 + Math.min(streak * 3, 30);
    if (bonusDay) dailyXP += 25;
    const totalXP = dailyXP + player.xpBoost;
    const result = this.applyXPAndLevel(player.xp, player.level, totalXP);
    let diamondsEarned = 3;
    let cratesEarned = 0;
    if (legendaryDay) { diamondsEarned += 75; cratesEarned = 1; }
    const newDiamonds = Math.max(0, (player.diamonds || 0) + diamondsEarned);
    const newCrates = (player.legendaryCrates || 0) + cratesEarned;
    const [updated] = await db.update(players).set({ xp: result.xp, level: result.level, dailyStreak: streak, lastDaily: today, diamonds: newDiamonds, legendaryCrates: newCrates }).where(eq(players.discordId, discordId)).returning();
    return { player: updated, xpEarned: totalXP, streak, bonusDay, legendaryDay, diamondsEarned, cratesEarned };
  }
  async addDiamonds(discordId, amount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const newDiamonds = Math.max(0, (player.diamonds || 0) + amount);
    const [updated] = await db.update(players).set({ diamonds: newDiamonds }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async addCoins(discordId, amount) {
    const player = await this.getPlayer(discordId);
    if (!player) return null;
    const newCoins = Math.max(0, (player.coins || 0) + amount);
    const [updated] = await db.update(players).set({ coins: newCoins }).where(eq(players.discordId, discordId)).returning();
    return updated;
  }
  async spendDiamonds(discordId, amount) {
    const player = await this.getPlayer(discordId);
    if (!player || (player.diamonds || 0) < amount) return null;
    const newDiamonds = (player.diamonds || 0) - amount;
    const [updated] = await db.update(players).set({ diamonds: newDiamonds }).where(eq(players.discordId, discordId)).returning();
    return updated;
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
  async isPlayerRestricted(discordId) {
    const player = await this.getPlayer(discordId);
    if (!player) return { muted: false, banned: false, mutedUntil: null };
    let muted = false;
    if (player.mutedUntil) {
      if (new Date(player.mutedUntil) > /* @__PURE__ */ new Date()) {
        muted = true;
      } else {
        await db.update(players).set({ mutedUntil: null }).where(eq(players.discordId, discordId));
      }
    }
    return { muted, banned: player.banned, mutedUntil: player.mutedUntil };
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
var storage = new DatabaseStorage();

export { pool, db, autoMigrate, players, botSettings, staff, guildConfigs, insertPlayerSchema, schema_exports, DatabaseStorage, storage };
