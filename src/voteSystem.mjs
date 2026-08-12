import pg from 'pg';
const { Pool } = pg;

const POLL_INTERVAL_MS = 60_000;
const TWELVE_HOURS_MS  = 12 * 60 * 60 * 1000;
const ONE_DAY_MS       = 24 * 60 * 60 * 1000;

const BASE_COINS       = 100;
const BASE_DIAMONDS    = 10;
const BASE_XP          = 20;
const STREAK3_COINS    = 150;
const STREAK3_DIAMONDS = 15;
const STREAK7_COINS    = 250;
const STREAK7_DIAMONDS = 25;

const TOP_GG_VOTE_URL  = 'Meeshaan gali linkigaaga top.gg ee rabtid in botka looga cadeeyo';
const DISCORD_API      = 'https://discord.com/api/v10';
const DM_DELAY_MS      = 2_000;

if (!process.env.DATABASE_URL) {
  console.error('[VoteSystem] DATABASE_URL is not set — vote processing disabled.');
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const scheduledReminders = new Map();
const dmChannelCache     = new Map();
const dmQueue            = [];
let   dmQueueRunning     = false;

async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vote_settings (
        user_id           TEXT PRIMARY KEY,
        reminders_enabled BOOLEAN NOT NULL DEFAULT true
      )
    `);
    console.log('[VoteSystem] ✅ vote_settings table ready.');
  } catch (err) {
    console.warn('[VoteSystem] Could not create vote_settings table:', err.message);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function discordFetch(path, method, body, retries = 3) {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.warn('[VoteSystem] DISCORD_TOKEN not set — skipping DM');
    return null;
  }
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(`${DISCORD_API}${path}`, {
        method,
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 429) {
        let retryAfter = 2000;
        try {
          const json = await res.json();
          retryAfter = (json.retry_after ?? 2) * 1000;
        } catch (_) {}
        console.warn(`[VoteSystem] Rate limited — retrying in ${retryAfter}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(retryAfter + 500);
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        console.warn(`[VoteSystem] Discord ${method} ${path} → ${res.status}: ${txt}`);
        return null;
      }

      return await res.json();
    } catch (err) {
      console.warn(`[VoteSystem] Discord fetch error (attempt ${attempt + 1}/${retries}):`, err.message);
      if (attempt < retries - 1) await sleep(1000);
    }
  }
  return null;
}

async function openDm(userId) {
  if (dmChannelCache.has(userId)) return dmChannelCache.get(userId);
  const data = await discordFetch('/users/@me/channels', 'POST', { recipient_id: userId });
  const channelId = data?.id ?? null;
  if (channelId) dmChannelCache.set(userId, channelId);
  return channelId;
}

async function sendDmDirect(userId, payload) {
  await sleep(DM_DELAY_MS);
  const channelId = await openDm(userId);
  if (!channelId) return false;
  await sleep(DM_DELAY_MS);
  const result = await discordFetch(`/channels/${channelId}/messages`, 'POST', payload);
  return result !== null;
}

async function processDmQueue() {
  if (dmQueueRunning) return;
  dmQueueRunning = true;
  while (dmQueue.length > 0) {
    const { userId, payload, resolve } = dmQueue.shift();
    try {
      const ok = await sendDmDirect(userId, payload);
      resolve(ok);
    } catch (err) {
      console.warn(`[VoteSystem] DM queue error for ${userId}:`, err.message);
      resolve(false);
    }
  }
  dmQueueRunning = false;
}

function sendDm(userId, payload) {
  return new Promise(resolve => {
    dmQueue.push({ userId, payload, resolve });
    processDmQueue();
  });
}

function getStreakRewards(streak) {
  if (streak >= 7) return { coins: STREAK7_COINS, diamonds: STREAK7_DIAMONDS, xp: BASE_XP, tier: '🔥 7-Day Streak' };
  if (streak >= 3) return { coins: STREAK3_COINS, diamonds: STREAK3_DIAMONDS, xp: BASE_XP, tier: '⚡ 3-Day Streak' };
  return { coins: BASE_COINS, diamonds: BASE_DIAMONDS, xp: BASE_XP, tier: null };
}

async function computeNewStreak(userId, voteTime) {
  try {
    const r = await pool.query(
      'SELECT vote_streak, last_vote_time FROM players WHERE discord_id = $1',
      [userId]
    );
    if (r.rows.length === 0) return 1;
    const row = r.rows[0];
    const oldStreak    = row.vote_streak    || 0;
    const lastVoteTime = row.last_vote_time ? Number(row.last_vote_time) : null;
    if (!lastVoteTime) return 1;
    const diff = voteTime - lastVoteTime;
    if (diff <= ONE_DAY_MS) return Math.min(oldStreak + 1, 7);
    return 1;
  } catch (err) {
    console.warn(`[VoteSystem] streak compute error for ${userId}:`, err.message);
    return 1;
  }
}

async function sendThankYouDm(userId, streak, rewards) {
  try {
    let streakLine = '';
    if (rewards.tier) {
      streakLine = `\n🔥 **${rewards.tier}!** (${streak} maalmood oo isku xiga)\n`;
    }
    const sent = await sendDm(userId, {
      embeds: [{
        title: '🎉 Waad ku mahadsan tahay u codaynta Nasiib!',
        description:
          'Taageeristaada waxay naga caawinaysaa in aan korno! 💚\n\n' +
          '**Abaal marinta aad heshay:**\n' +
          `💎 **+${rewards.diamonds} Diamonds**\n` +
          `🪙 **+${rewards.coins} Coins**\n` +
          `⭐ **+${rewards.xp} XP**\n` +
          streakLine +
          '\nNoo soo noqo 12 saacadood kadib si aad mar kale noo taageertid!',
        color: 0x2ecc71,
        footer: { text: 'Waan ku faraxsanahay taageeridaada. 🍀' },
      }],
    });
    if (sent) {
      console.log(`[VoteSystem] Thank-you DM sent → ${userId} (streak: ${streak})`);
    } else {
      console.warn(`[VoteSystem] Could not DM ${userId} — DMs may be disabled`);
    }
  } catch (err) {
    console.warn(`[VoteSystem] sendThankYouDm error for ${userId}:`, err.message);
  }
}

async function sendReminderDm(userId) {
  try {
    try {
      const r = await pool.query(
        'SELECT reminders_enabled FROM vote_settings WHERE user_id = $1',
        [userId]
      );
      if (r.rows.length > 0 && r.rows[0].reminders_enabled === false) {
        console.log(`[VoteSystem] Reminder skipped for ${userId} (disabled by user)`);
        return;
      }
    } catch (_) {}

    const sent = await sendDm(userId, {
      embeds: [{
        title: '⏰ Waqtigii mar kale noo codayn lahayd!',
        description:
          'Codayntaada maalinlaha waa diyaar — u codee Nasiib oo hel abaalmarintaada! 🎁\n\n' +
          'Ma rabtaa in xasuusinta iska xirtid? Qor **!rem disable**.\n\n' +
          'Taabo hoos si aad u codaysid 💚',
        color: 0x2ecc71,
        footer: { text: 'Waad ku mahadsan tahay taageeridaada. 🍀' },
      }],
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 5,
          label: '🗳️ Vote Now',
          url: TOP_GG_VOTE_URL,
        }],
      }],
    });
    if (sent) {
      console.log(`[VoteSystem] Reminder DM sent → ${userId}`);
    } else {
      console.warn(`[VoteSystem] Could not send reminder to ${userId} — DMs may be disabled`);
    }
  } catch (err) {
    console.warn(`[VoteSystem] sendReminderDm error for ${userId}:`, err.message);
  }
}

function scheduleReminder(userId, delayMs) {
  const existing = scheduledReminders.get(userId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(async () => {
    scheduledReminders.delete(userId);
    await sendReminderDm(userId);
  }, delayMs);
  scheduledReminders.set(userId, timer);
  console.log(`[VoteSystem] Reminder queued for ${userId} in ${(delayMs / 3_600_000).toFixed(2)}h`);
}

async function restorePendingReminders() {
  try {
    const now = Date.now();
    const result = await pool.query(
      'SELECT user_id, last_vote FROM votes WHERE processed = true AND last_vote > $1',
      [now - TWELVE_HOURS_MS]
    );
    let count = 0;
    for (const row of result.rows) {
      const remaining = TWELVE_HOURS_MS - (now - Number(row.last_vote));
      if (remaining > 0) { scheduleReminder(row.user_id, remaining); count++; }
    }
    console.log(`[VoteSystem] Restored ${count} pending reminder(s) after restart`);
  } catch (err) {
    console.error('[VoteSystem] Error restoring reminders:', err.message);
  }
}

async function processVote(userId, lastVote) {
  try {
    const upd = await pool.query(
      'UPDATE votes SET processed = true WHERE user_id = $1 AND processed = false RETURNING user_id',
      [userId]
    );
    if (upd.rowCount === 0) return;

    console.log(`[VoteSystem] Processing vote for ${userId}`);

    const newStreak = await computeNewStreak(userId, lastVote);
    const rewards   = getStreakRewards(newStreak);

    try {
      const upd2 = await pool.query(
        `UPDATE players
           SET coins          = GREATEST(0, coins + $1),
               diamonds       = GREATEST(0, diamonds + $2),
               xp             = GREATEST(0, xp + $3),
               vote_streak    = $4,
               last_vote_time = $5
         WHERE discord_id = $6
         RETURNING discord_id`,
        [rewards.coins, rewards.diamonds, rewards.xp, newStreak, lastVote, userId]
      );
      if (upd2.rowCount > 0) {
        console.log(`[VoteSystem] ✅ Rewards → ${userId}: +${rewards.coins}🪙 +${rewards.diamonds}💎 +${rewards.xp}⭐ streak:${newStreak}`);
      } else {
        await pool.query(
          `INSERT INTO players (discord_id, username, coins, diamonds, xp, vote_streak, last_vote_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (discord_id) DO UPDATE SET
             coins = players.coins + $3,
             diamonds = players.diamonds + $4,
             xp = players.xp + $5,
             vote_streak = $6,
             last_vote_time = $7`,
          [`${userId}`, `voter_${userId.slice(-4)}`, rewards.coins, rewards.diamonds, rewards.xp, newStreak, lastVote]
        );
        console.log(`[VoteSystem] ✅ New voter profile created & rewarded → ${userId}: +${rewards.coins}🪙 +${rewards.diamonds}💎 +${rewards.xp}⭐`);
      }
    } catch (err) {
      console.warn(`[VoteSystem] Reward query error for ${userId}:`, err.message);
    }

    await sendThankYouDm(userId, newStreak, rewards);

    const delay = TWELVE_HOURS_MS - (Date.now() - lastVote);
    if (delay > 0) scheduleReminder(userId, delay);

  } catch (err) {
    console.error(`[VoteSystem] processVote error for ${userId}:`, err.message);
  }
}

async function pollVotes() {
  try {
    const result = await pool.query('SELECT user_id, last_vote FROM votes WHERE processed = false');
    if (result.rows.length > 0) {
      console.log(`[VoteSystem] Found ${result.rows.length} unprocessed vote(s)`);
    }
    for (const row of result.rows) {
      await processVote(row.user_id, Number(row.last_vote));
    }
  } catch (err) {
    console.error('[VoteSystem] Poll error:', err.message);
  }
}

console.log('[VoteSystem] ✅ Initialised — polling every 60s');
await ensureTables();
restorePendingReminders().catch(() => {});
pollVotes().catch(() => {});
setInterval(pollVotes, POLL_INTERVAL_MS);
