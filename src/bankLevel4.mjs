import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  EmbedBuilder,
} from "discord.js";
import { addVaultEarning } from "./vault.mjs";
import {
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
} from "./bankSystem.mjs";

// ─── CONFIG ────────────────────────────────────────────────────────────────

const L4_UPGRADE_COST_COINS    = 750_000;
const L4_UPGRADE_COST_DIAMONDS = 7_000;

const L4_BANK_CAP        = 1_000_000; // max deposits (mirrors BANK_CAPS[4])
const L4_BANK_TOTAL_CAP  = 1_500_000; // max after profit growth (mirrors BANK_TOTAL_CAPS[4])

const L4_PROFIT_RATE           = 0.03;                      // 3%
const L4_PROFIT_INTERVAL_MS    = 12 * 60 * 60 * 1000;       // 12 hours
const L4_PROFIT_TICK_MS        = 10 * 60 * 1000;            // check every 10 minutes
const L4_PROFIT_MAX_CATCHUP    = 4;                          // cap catch-up periods (avoids huge payouts after downtime)

const L4_REPORT_INTERVAL_MS    = 7 * 24 * 60 * 60 * 1000;   // weekly bank report cadence
const L4_REPORT_SCHEDULER_MS   = 30 * 60 * 1000;            // scan cadence — cheap, coarse-grained

const L4_DEPOSIT_TAX_PCT       = 2;   // display only — deposit tax itself is the existing global 2% (executeDeposit)
const L4_WITHDRAW_FEE_PCT      = 11;
const L4_WITHDRAW_PLAYER_PCT   = 89;
const L4_WITHDRAW_OWNER_PCT    = 7;
const L4_WITHDRAW_BOT_PCT      = 4;

const L4_ANNOUNCE_COOLDOWN_MS  = 7 * 24 * 60 * 60 * 1000;   // 7 days
const L4_ANNOUNCE_MIN_LEN      = 60;

const BUG_REPORT_CHANNEL_ID    = "1482496751284781217";

const L4_INTRO_IMAGE = "https://cdn.discordapp.com/attachments/1247115296007782472/1525527192765857934/IMG_3995.png?ex=6a53b569&is=6a5263e9&hm=d706db3b9b79ad27714080a41b8c1690ddd65be570429b5f1790b46f0a62888d&";
const L4_UPGRADE_GIF = "https://cdn.discordapp.com/attachments/1247115296007782472/1525527192358879282/B73E8E1E-A92B-4342-B924-7DE7EF95E783.gif?ex=6a53b569&is=6a5263e9&hm=d6b9b8f384d1a4b00a9e6a87aa2f5b4c6634191ed8a05ef3c0559f0a7f7a7430&";

const EMOJI_NASIIBCOIN = "<:Nasiibcoin:1506547787708366929>";
const EMOJI_BANK       = "<:bank:1525533778426990765>";
const EMOJI_HEALTH     = "<:bankHealth:1525535834994900992>";
const EMOJI_DEPOSITORS = "<:depositors:1525530647190442145>";
const EMOJI_INVESTORS  = "<:investors:1525530644636237855>";
const EMOJI_SENDMSG    = "<:SendMessage:1525530641494442164>";


const upgradeInFlight   = new Set();   // ownerId currently mid-upgrade
const announceInFlight  = new Set();   // ownerId currently mid-send

// ─── DB INIT ───────────────────────────────────────────────────────────────

let _tablesReady = false;

async function initLevel4Tables() {
  if (_tablesReady) return;
  // file indepent ah eheheh
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_level4_profit_timer (
      bank_owner_id TEXT   NOT NULL,
      user_id       TEXT   NOT NULL,
      last_claim    BIGINT NOT NULL,
      PRIMARY KEY (bank_owner_id, user_id)
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_bl4_timer_owner ON bank_level4_profit_timer(bank_owner_id)`);

 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_level4_announcements (
      owner_id      TEXT PRIMARY KEY,
      last_sent_at  BIGINT NOT NULL DEFAULT 0
    );
  `);

 
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS level4_upgraded_at BIGINT DEFAULT NULL`);
  await pool.query(`ALTER TABLE banks ADD COLUMN IF NOT EXISTS last_weekly_report_at BIGINT DEFAULT NULL`);

  
  await pool.query(`ALTER TABLE bank_users ADD COLUMN IF NOT EXISTS first_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT`);

  _tablesReady = true;
  console.log("[BANK L4] ✅ Level 4 tables ready.");
}

// ─── SMALL HELPERS ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOwnerClick(interaction, ownerId) {
  return interaction.user.id === ownerId;
}

async function rejectNotOwner(interaction) {
  return interaction.reply({ content: "Buttonkaaga ma ahan.", flags: MessageFlags.Ephemeral });
}


async function closeInteractionMessage(interaction) {
  try {
    if (interaction.message && interaction.message.deletable) {
      await interaction.message.delete();
      return;
    }
  } catch { /* i love girl called samira lmao */ }
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
    await interaction.deleteReply();
  } catch { /* she loves me back, in my dreams */ }
}

// ─── COMPONENT V2 BUILDERS ─────────────────────────────────────────────────

function buildIntroContainer(ownerId) {
  const container = new ContainerBuilder()
    .setAccentColor(0x9b59b6)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("# Level 4 Bank"))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(L4_INTRO_IMAGE))
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "**Faa'iidooyinka Level 4 Bank**",
          "",
          "• wuxuu kaydinayaa lacag ka badan intii uu kaydin jiray level 3 bank.",
          "• waxaad si sahlan fariin ugu wada diri kartaa dadka isticmaala bankigaaga.",
          "",
          "-# ⚠️ Ogow todobaadkiiba hal mar ayaad fariin u diri kartaa macaamiishaada.",
          "",
          "Adiga ayaa dooranaya:",
          "• Depositors",
          "ama",
          "• Investors",
          "",
          "• Dadka lacagta dhigta (depositors) waxay heli doonaan 3% faa'iido 12 saac kasta.",
          "• Waxa uu leeyahay design cusub oo qurux badan.",
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bl4_intro_upgrade_${ownerId}`).setLabel("Upgrade").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`bl4_intro_close_${ownerId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      )
    );
  return container;
}

function buildUpgradeChoiceContainer(ownerId, player) {
  const container = new ContainerBuilder()
    .setAccentColor(0x9b59b6)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("# Upgrade Bank"))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "Bank si aad Level 4 uga dhigtid waxaad u baahan tahay",
          "",
          `${EMOJI_NASIIBCOIN} ${fmt(L4_UPGRADE_COST_COINS)}`,
          "",
          "AMA",
          "",
          `💎 ${fmt(L4_UPGRADE_COST_DIAMONDS)}`,
          "",
          `_Haysatid: ${fmt(player?.coins || 0)} coins · ${fmt(player?.diamonds || 0)} diamonds_`,
        ].join("\n")
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`bl4_upgrade_diamonds_${ownerId}`)
          .setLabel("Upgrade")
          .setEmoji("💎")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`bl4_upgrade_coins_${ownerId}`)
          .setLabel("Upgrade")
          .setEmoji("🪙")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`bl4_upgrade_cancel_${ownerId}`)
          .setLabel("Close")
          .setEmoji("🗑️")
          .setStyle(ButtonStyle.Danger)
      )
    );
  return container;
}

function buildAnimationContainer() {
  return new ContainerBuilder()
    .setAccentColor(0xf1c40f)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("# Upgrading your bank..."))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(L4_UPGRADE_GIF))
    );
}

async function buildMainUIContainer(bank, ownerId, displayName) {
  const healthData = await calcLevel4Health(ownerId);
  const container = new ContainerBuilder()
    .setAccentColor(0x2ecc71)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${EMOJI_BANK} ${bank.name}`)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Welcome to your bank ${displayName}`)
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `${EMOJI_HEALTH} **Bank Health:** ${healthData.score}/100 — ${healthData.tier}`,
          `\`[${healthData.bar}]\``,
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**Deposit Tax:** ${L4_DEPOSIT_TAX_PCT}%`,
          `**Withdraw Fee:** ${L4_WITHDRAW_FEE_PCT}%`,
          `▸ Player receives: **${L4_WITHDRAW_PLAYER_PCT}%**`,
          `▸ Owner receives: **${L4_WITHDRAW_OWNER_PCT}%**`,
          `▸ Bot Treasury: **${L4_WITHDRAW_BOT_PCT}%**`,
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bl4_main_info_${ownerId}`).setLabel("Info").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`bl4_main_depositors_${ownerId}`).setLabel("Depositors").setEmoji(EMOJI_DEPOSITORS).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`bank_invest_list_${ownerId}`).setLabel("Investors").setEmoji(EMOJI_INVESTORS).setStyle(ButtonStyle.Secondary)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bl4_main_sendmsg_${ownerId}`).setLabel("Send Message").setEmoji(EMOJI_SENDMSG).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`bl4_main_close_${ownerId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
      )
    );
  return container;
}

// Bank Health score for Level 4 — simplified, self-contained version (fill
// rate + diversity + activity) so this file doesn't reach into bankSystem's
// internal (unexported) health-score implementation.
async function calcLevel4Health(ownerId) {
  const [total, userCount] = await Promise.all([getBankTotal(ownerId), getBankUserCount(ownerId)]);
  const fillPct  = Math.min(100, (total / L4_BANK_TOTAL_CAP) * 100);
  const fillPts  = Math.round((fillPct / 100) * 50);
  const divPts   = Math.min(50, userCount * 5);
  const score    = Math.min(100, fillPts + divPts);
  const tier     = score >= 80 ? "Excellent" : score >= 55 ? "Good" : score >= 30 ? "Average" : "Weak";
  const filled   = Math.round(score / 10);
  const bar      = "▓".repeat(filled) + "░".repeat(10 - filled);
  return { score, tier, bar };
}


export async function sendLevel4Intro(target, ownerId, bank) {
  await initLevel4Tables();
  const payload = { components: [buildIntroContainer(ownerId)], flags: MessageFlags.IsComponentsV2 };
  if (typeof target.isButton === "function" && target.isButton()) {
    payload.flags |= MessageFlags.Ephemeral;
    return target.reply(payload);
  }
  return target.reply(payload);
}


export async function sendLevel4MainUI(target, ownerId, bank) {
  await initLevel4Tables();
  const displayName = target.member?.displayName || target.author?.username || target.user?.username || "there";
  const container = await buildMainUIContainer(bank, ownerId, displayName);
  const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };
  return target.reply(payload);
}

// ─── UPGRADE EXECUTION (transactional, race-safe) ──────────────────────────

async function executeLevel4Upgrade(interaction, ownerId, payWith) {
  if (upgradeInFlight.has(ownerId)) {
    return interaction.reply({ content: "⏱️ Upgrade horay ayaa loo hawlgeliyay, sug wax yar.", flags: MessageFlags.Ephemeral });
  }
  upgradeInFlight.add(ownerId);

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const bankRes = await client.query(`SELECT level FROM banks WHERE owner_id = $1 FOR UPDATE`, [ownerId]);
      if (bankRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return interaction.reply({ content: "❌ Bank lama helin.", flags: MessageFlags.Ephemeral });
      }
      if (bankRes.rows[0].level !== 3) {
        await client.query("ROLLBACK");
        return interaction.reply({ content: "❌ Upgrade lama samayn karo (heerkaaga waa la beddelay).", flags: MessageFlags.Ephemeral });
      }

      if (payWith === "diamonds") {
        const r = await client.query(
          `UPDATE players SET diamonds = diamonds - $1 WHERE discord_id = $2 AND diamonds >= $1`,
          [L4_UPGRADE_COST_DIAMONDS, ownerId]
        );
        if (r.rowCount === 0) {
          await client.query("ROLLBACK");
          return interaction.reply({
            content: "**Not Enough Diamonds**\nMa haysatid diamonds kugu filan si aad Level 4 uga dhigtid.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } else {
        const r = await client.query(
          `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1`,
          [L4_UPGRADE_COST_COINS, ownerId]
        );
        if (r.rowCount === 0) {
          await client.query("ROLLBACK");
          return interaction.reply({
            content: "**Not Enough Coins**\nMa haysatid coins kugu filan.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      await client.query(
        `UPDATE banks SET level = 4, level4_upgraded_at = $2 WHERE owner_id = $1`,
        [ownerId, Date.now()]
      );
      await logTransaction(
        client,
        ownerId,
        ownerId,
        "level4_upgrade",
        payWith === "diamonds" ? L4_UPGRADE_COST_DIAMONDS : L4_UPGRADE_COST_COINS,
        `Level 4 upgrade paid with ${payWith}`
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[BANK L4] upgrade transaction error:", err);
      return interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", flags: MessageFlags.Ephemeral });
    } finally {
      client.release();
    }

    // Success — Uhmm fiiri inta meesha animate ka imanayo waye ok.
    await interaction.update({ components: [buildAnimationContainer()], flags: MessageFlags.IsComponentsV2 });
    await sleep(5000);
    const bank = await getBank(ownerId);
    const displayName = interaction.member?.displayName || interaction.user.username;
    const container = await buildMainUIContainer(bank, ownerId, displayName);
    await interaction.message.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } finally {
    upgradeInFlight.delete(ownerId);
  }
}

// ─── DEPOSITORS LIST ────────────────────────────────────────────────────────

async function buildDepositorsEmbed(ownerId) {
  const res = await pool.query(
    `SELECT user_id, deposited, profit FROM bank_users
     WHERE bank_owner_id = $1 AND (deposited + profit) > 0
     ORDER BY (deposited + profit) DESC`,
    [ownerId]
  );
  const rows = res.rows;
  const total = rows.reduce((s, r) => s + Number(r.deposited) + Number(r.profit), 0);

  let lines = "Wali qofna lacag ma dhigan.";
  if (rows.length > 0) {
    lines = rows.slice(0, 20).map((r, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}.**`;
      return `${medal} <@${r.user_id}> — ${fmt(Number(r.deposited) + Number(r.profit))} coins`;
    }).join("\n");
  }

  return new EmbedBuilder()
    .setTitle("Total Depositors")
    .setColor(0x2ecc71)
    .addFields(
      { name: "👥 Tirada", value: `${rows.length}`, inline: true },
      { name: "🏆 Leaderboard", value: lines, inline: false },
      { name: "💰 Total Deposits", value: `${fmt(total)} coins`, inline: false }
    );
}

// ─── INFO BUTTON ────────────────────────────────────────────────────────────

async function buildInfoEmbed(ownerId, bank) {
  const [depositTotal, invRes, profit12hRes] = await Promise.all([
    getBankTotal(ownerId),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_inv FROM bank_investments WHERE bank_owner_id = $1 AND amount > 0`,
      [ownerId]
    ),
 
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS gained FROM bank_transactions
       WHERE bank_owner_id = $1 AND type = 'level4_profit' AND created_at >= $2`,
      [ownerId, Date.now() - 12 * 60 * 60 * 1000]
    ),
  ]);
  const investTotal  = Number(invRes.rows[0]?.total_inv || 0);
  const totalMoney   = depositTotal + investTotal;
  const gained12h    = Number(profit12hRes.rows[0]?.gained || 0);
  const trendLine    = gained12h > 0
    ? "📈 Bankgaaga wuxuu sameeyey kor u kac 12kii saac ee u dambaysay."
    : "📉 Bankgaaga wuxuu sameeyey hoos u dhac 12kii saac ee u dambaysay.";

  // meeshan waxay isku darysaa dadka invest iyo kuwo deposi dhahay.
  const [depRows, invRows] = await Promise.all([
    pool.query(`SELECT user_id, (deposited + profit) AS val FROM bank_users WHERE bank_owner_id = $1 AND (deposited + profit) > 0`, [ownerId]),
    pool.query(`SELECT user_id, amount AS val FROM bank_investments WHERE bank_owner_id = $1 AND amount > 0`, [ownerId]),
  ]);
  const merged = new Map(); // userId -> { deposit, invest }
  for (const r of depRows.rows) merged.set(r.user_id, { deposit: Number(r.val), invest: 0 });
  for (const r of invRows.rows) {
    const existing = merged.get(r.user_id) || { deposit: 0, invest: 0 };
    existing.invest = Number(r.val);
    merged.set(r.user_id, existing);
  }
  const usersSorted = [...merged.entries()]
    .sort((a, b) => (b[1].deposit + b[1].invest) - (a[1].deposit + a[1].invest))
    .slice(0, 20);

  const userLines = usersSorted.length
    ? usersSorted.map(([uid, v]) => `👤 <@${uid}> — Deposit: ${fmt(v.deposit)} · Investment: ${fmt(v.invest)}`).join("\n")
    : "Wali isticmaale ma jiro.";

  return new EmbedBuilder()
    .setTitle(`${bank.name} Insight`)
    .setColor(0x3498db)
    .addFields(
      { name: "💰 Total Money", value: `${fmt(totalMoney)} coins`, inline: true },
      { name: "🏦 Deposits", value: `${fmt(depositTotal)} coins`, inline: true },
      { name: "💼 Investments", value: `${fmt(investTotal)} coins`, inline: true },
      { name: "📊 12h Trend", value: trendLine, inline: false },
      { name: "👥 Total Users", value: userLines, inline: false }
    );
}

// ─── SEND MESSAGE / ANNOUNCEMENT FLOW ───────────────────────────────────────

async function getAnnouncementCooldownRow(ownerIdOrClient, ownerId) {
  const runner = ownerIdOrClient.query ? ownerIdOrClient : pool;
  const r = await runner.query(`SELECT last_sent_at FROM bank_level4_announcements WHERE owner_id = $1`, [ownerId]);
  return r.rows[0] || null;
}

function buildAudiencePromptRow(ownerId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bl4_announce_audience_depositors_${ownerId}`).setLabel("Depositors").setEmoji(EMOJI_DEPOSITORS).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`bl4_announce_audience_investors_${ownerId}`).setLabel("Investors").setEmoji(EMOJI_INVESTORS).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`bl4_announce_cancel_${ownerId}`).setLabel("Jooji").setStyle(ButtonStyle.Danger)
  );
}

function announceModal(ownerId, audience) {
  const modal = new ModalBuilder()
    .setCustomId(`bl4_modal_announce_${ownerId}_${audience}`)
    .setTitle("Ogaysii Macaamiisha");

  const titleInput = new TextInputBuilder()
    .setCustomId("bl4_announce_title")
    .setLabel("Announcement Title")
    .setPlaceholder("Free Giveaway")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(100)
    .setRequired(true);

  const bodyInput = new TextInputBuilder()
    .setCustomId("bl4_announce_body")
    .setLabel("Announcement")
    .setPlaceholder("1 qof winner ayaa la dooranayaa…")
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(L4_ANNOUNCE_MIN_LEN)
    .setMaxLength(2000)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(bodyInput)
  );
  return modal;
}

function buildDMContainer(bank, title, body) {
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);
  const container = new ContainerBuilder()
    .setAccentColor(0x3498db)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("# Message From Your Bank"))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${title}**`));

  for (const p of paragraphs) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(p));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  }

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `⚠️ Fariintan waxaa soo diray Bank Owner-ka **${bank.name}**.\nHaddii fariintan dhib leedahay taabo Report.`
      )
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`bl4_report_${bank.owner_id}`).setLabel("Report").setEmoji("🚨").setStyle(ButtonStyle.Danger)
      )
    );
  return container;
}

async function sendAnnouncementDMs(client, ownerId, bank, audience, title, body) {
  let recipients = [];
  if (audience === "depositors") {
    const r = await pool.query(
      `SELECT DISTINCT user_id FROM bank_users WHERE bank_owner_id = $1 AND (deposited + profit) > 0`,
      [ownerId]
    );
    recipients = r.rows.map((row) => row.user_id);
  } else {
    const r = await pool.query(
      `SELECT DISTINCT user_id FROM bank_investments WHERE bank_owner_id = $1 AND amount > 0`,
      [ownerId]
    );
    recipients = r.rows.map((row) => row.user_id);
  }

  const container = buildDMContainer(bank, title, body);
  let sent = 0;
  for (const userId of recipients) {
    if (userId === ownerId) continue; // don't DM the owner about their own announcement
    try {
      const user = await client.users.fetch(userId);
      await user.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      sent++;
    } catch {
      // DMs closed / user unreachable — skip, do not fail the whole batch.
    }
  }
  return { sent, total: recipients.length };
}

// ─── LEVEL 4 PROFIT TICKER (independent per-depositor 12h timer) ──────────

async function runLevel4ProfitTick() {
  try {
    const banks = await pool.query(`SELECT owner_id FROM banks WHERE level = 4`);
    for (const { owner_id: ownerId } of banks.rows) {
      const bankWideTotal = await getBankTotal(ownerId);
      if (bankWideTotal >= L4_BANK_TOTAL_CAP) continue;

      const users = await pool.query(
        `SELECT user_id, deposited, last_active FROM bank_users WHERE bank_owner_id = $1 AND deposited > 0`,
        [ownerId]
      );

      for (const bu of users.rows) {
        const userId = bu.user_id;
        const deposited = Number(bu.deposited);
        if (deposited <= 0) continue;

     
        await pool.query(
          `INSERT INTO bank_level4_profit_timer (bank_owner_id, user_id, last_claim)
           VALUES ($1, $2, $3)
           ON CONFLICT (bank_owner_id, user_id) DO NOTHING`,
          [ownerId, userId, Number(bu.last_active) || Date.now()]
        );

        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const timerRes = await client.query(
            `SELECT last_claim FROM bank_level4_profit_timer WHERE bank_owner_id = $1 AND user_id = $2 FOR UPDATE`,
            [ownerId, userId]
          );
          if (timerRes.rowCount === 0) { await client.query("ROLLBACK"); continue; }

          const lastClaim = Number(timerRes.rows[0].last_claim);
          const elapsed = Date.now() - lastClaim;
          const periods = Math.min(L4_PROFIT_MAX_CATCHUP, Math.floor(elapsed / L4_PROFIT_INTERVAL_MS));
          if (periods < 1) { await client.query("ROLLBACK"); continue; }

          const buRes = await client.query(
            `SELECT deposited FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2 FOR UPDATE`,
            [ownerId, userId]
          );
          if (buRes.rowCount === 0) { await client.query("ROLLBACK"); continue; }
          const currentDeposited = Number(buRes.rows[0].deposited);
          if (currentDeposited <= 0) { await client.query("ROLLBACK"); continue; }

          let gain = Math.floor(currentDeposited * L4_PROFIT_RATE * periods);
          const headroom = L4_BANK_TOTAL_CAP - bankWideTotal;
          gain = Math.max(0, Math.min(gain, headroom));

          if (gain > 0) {
          
            const treasuryRow = await client.query(`SELECT coins FROM bot_wallet WHERE id = 1 FOR UPDATE`);
            const treasuryCoins = Number(treasuryRow.rows[0]?.coins || 0);
            const actualGain = Math.max(0, Math.min(gain, treasuryCoins));

            if (actualGain < gain) {
              console.warn(`[BANK L4] Treasury short for profit payout — wanted ${gain}, paying ${actualGain} (owner ${ownerId}, user ${userId}).`);
            }

            if (actualGain > 0) {
              await client.query(`UPDATE bot_wallet SET coins = coins - $1 WHERE id = 1`, [actualGain]);
              await client.query(`UPDATE bank_users SET profit = profit + $1 WHERE bank_owner_id = $2 AND user_id = $3`, [actualGain, ownerId, userId]);
              await logTransaction(client, ownerId, userId, "level4_profit", actualGain, `Level 4 depositor profit (${periods}x12h, treasury-funded)`);
            }
          }
          await client.query(
            `UPDATE bank_level4_profit_timer SET last_claim = $1 WHERE bank_owner_id = $2 AND user_id = $3`,
            [lastClaim + periods * L4_PROFIT_INTERVAL_MS, ownerId, userId]
          );
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          console.error("[BANK L4] profit tick error:", err);
        } finally {
          client.release();
        }
      }
    }
  } catch (err) {
    console.error("[BANK L4] runLevel4ProfitTick error:", err);
  }
}

// ─── SINGLE INTERACTION HANDLER ─────────────────────────────────────────────

async function handleLevel4Interaction(interaction) {
  // Modal submit
  if (interaction.isModalSubmit() && interaction.customId.startsWith("bl4_modal_announce_")) {
    return handleAnnounceModalSubmit(interaction);
  }

  if (!interaction.isButton()) return; // Uhmm slash ma isticmaalayno.
  const cid = interaction.customId || "";
  if (!cid.startsWith("bl4_")) return; // they are not like Usss wowowow

  if (cid.startsWith("bl4_report_")) {
    return handleReportButton(interaction);
  }

  // ── Intro container ────────────────────────────────────────────────────
  if (cid.startsWith("bl4_intro_upgrade_")) {
    const ownerId = cid.replace("bl4_intro_upgrade_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    const bank = await getBank(ownerId);
    if (!bank || bank.level !== 3) {
      return interaction.reply({ content: "❌ Upgrade lama samayn karo.", flags: MessageFlags.Ephemeral });
    }
    const player = await getPlayer(ownerId);
    return interaction.update({ components: [buildUpgradeChoiceContainer(ownerId, player)], flags: MessageFlags.IsComponentsV2 });
  }

  if (cid.startsWith("bl4_intro_close_")) {
    const ownerId = cid.replace("bl4_intro_close_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return closeInteractionMessage(interaction);
  }

  // ── Upgrade choice container ───────────────────────────────────────────
  if (cid.startsWith("bl4_upgrade_cancel_")) {
    const ownerId = cid.replace("bl4_upgrade_cancel_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return closeInteractionMessage(interaction);
  }

  if (cid.startsWith("bl4_upgrade_diamonds_")) {
    const ownerId = cid.replace("bl4_upgrade_diamonds_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return executeLevel4Upgrade(interaction, ownerId, "diamonds");
  }

  if (cid.startsWith("bl4_upgrade_coins_")) {
    const ownerId = cid.replace("bl4_upgrade_coins_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return executeLevel4Upgrade(interaction, ownerId, "coins");
  }

  // ── Main UI ─────────────────────────────────────────────────────────────
  if (cid.startsWith("bl4_main_info_")) {
    const ownerId = cid.replace("bl4_main_info_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    const bank = await getBank(ownerId);
    if (!bank || bank.level < 4) return interaction.reply({ content: "❌ Bank lama helin.", flags: MessageFlags.Ephemeral });
    const embed = await buildInfoEmbed(ownerId, bank);
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  if (cid.startsWith("bl4_main_depositors_")) {
    const ownerId = cid.replace("bl4_main_depositors_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    const bank = await getBank(ownerId);
    if (!bank || bank.level < 4) return interaction.reply({ content: "❌ Bank lama helin.", flags: MessageFlags.Ephemeral });
    const embed = await buildDepositorsEmbed(ownerId);
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  if (cid.startsWith("bl4_main_sendmsg_")) {
    const ownerId = cid.replace("bl4_main_sendmsg_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    const bank = await getBank(ownerId);
    if (!bank || bank.level < 4) return interaction.reply({ content: "❌ Bank lama helin.", flags: MessageFlags.Ephemeral });

    const cdRow = await getAnnouncementCooldownRow(pool, ownerId);
    const lastSent = Number(cdRow?.last_sent_at || 0);
    if (!isCooledDown(new Map([[ownerId, lastSent]]), ownerId, L4_ANNOUNCE_COOLDOWN_MS)) {
      const remaining = cooldownRemaining(new Map([[ownerId, lastSent]]), ownerId, L4_ANNOUNCE_COOLDOWN_MS);
      const remainingDays = Math.ceil(remaining / (24 * 60 * 60 * 1000));
      return interaction.reply({
        content: `⏱️ Ogaysiis kale waxaad diri kartaa **${remainingDays} maalmood** gudahood.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      content: "Yaad doonaysaa inaad fariin u dirto?",
      components: [buildAudiencePromptRow(ownerId)],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (cid.startsWith("bl4_main_close_")) {
    const ownerId = cid.replace("bl4_main_close_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return closeInteractionMessage(interaction);
  }

  // ── Announcement audience prompt ───────────────────────────────────────
  if (cid.startsWith("bl4_announce_cancel_")) {
    const ownerId = cid.replace("bl4_announce_cancel_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return closeInteractionMessage(interaction);
  }

  if (cid.startsWith("bl4_announce_audience_depositors_")) {
    const ownerId = cid.replace("bl4_announce_audience_depositors_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return interaction.showModal(announceModal(ownerId, "depositors"));
  }

  if (cid.startsWith("bl4_announce_audience_investors_")) {
    const ownerId = cid.replace("bl4_announce_audience_investors_", "");
    if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);
    return interaction.showModal(announceModal(ownerId, "investors"));
  }
}

async function handleAnnounceModalSubmit(interaction) {
  const rest = interaction.customId.replace("bl4_modal_announce_", "");
  const lastUnderscore = rest.lastIndexOf("_");
  const ownerId  = rest.slice(0, lastUnderscore);
  const audience = rest.slice(lastUnderscore + 1); // "depositors" | "investors"

  if (!isOwnerClick(interaction, ownerId)) return rejectNotOwner(interaction);

  const title = interaction.fields.getTextInputValue("bl4_announce_title").trim();
  const body  = interaction.fields.getTextInputValue("bl4_announce_body").trim();

  if (body.length < L4_ANNOUNCE_MIN_LEN) {
    return interaction.reply({
      content: `❌ Fariinta waa inay ugu yaraan ${L4_ANNOUNCE_MIN_LEN} xaraf ahaataa.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (announceInFlight.has(ownerId)) {
    return interaction.reply({ content: "⏱️ Fariin horay ayaa la diraya, sug wax yar.", flags: MessageFlags.Ephemeral });
  }
  announceInFlight.add(ownerId);

  try {
    const bank = await getBank(ownerId);
    if (!bank || bank.level < 4) {
      return interaction.reply({ content: "❌ Bank lama helin.", flags: MessageFlags.Ephemeral });
    }

    
    const client = await pool.connect();
    let claimed = false;
    try {
      await client.query("BEGIN");
      const res = await client.query(
        `INSERT INTO bank_level4_announcements (owner_id, last_sent_at)
         VALUES ($1, $2)
         ON CONFLICT (owner_id) DO UPDATE
           SET last_sent_at = EXCLUDED.last_sent_at
           WHERE bank_level4_announcements.last_sent_at <= $3
         RETURNING owner_id`,
        [ownerId, Date.now(), Date.now() - L4_ANNOUNCE_COOLDOWN_MS]
      );
      claimed = res.rowCount > 0;
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[BANK L4] announcement cooldown claim error:", err);
    } finally {
      client.release();
    }

    if (!claimed) {
      const cdRow = await getAnnouncementCooldownRow(pool, ownerId);
      const remaining = L4_ANNOUNCE_COOLDOWN_MS - (Date.now() - Number(cdRow?.last_sent_at || 0));
      const remainingDays = Math.max(1, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
      return interaction.reply({
        content: `⏱️ Ogaysiis kale waxaad diri kartaa **${remainingDays} maalmood** gudahood.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { sent } = await sendAnnouncementDMs(interaction.client, ownerId, bank, audience, title, body);

    if (sent === 0) {
      return interaction.editReply({ content: "❌ Ogaysiiskaagii si sax ah looma dirin." });
    }

    return interaction.editReply({
      content: `✅ Waxaad ogaysiis u dirtay **${sent}** qof.\nWaxaad mar kale diri kartaa **7 maalmood** gudahood.`,
    });
  } finally {
    announceInFlight.delete(ownerId);
  }
}

async function handleReportButton(interaction) {
  const ownerId = interaction.customId.replace("bl4_report_", "");
  try {
    const bank = await getBank(ownerId);
    const channel = await interaction.client.channels.fetch(BUG_REPORT_CHANNEL_ID).catch(() => null);
    if (channel) {
      const forwardEmbed = new EmbedBuilder()
        .setTitle("🚨 Bank Announcement Report")
        .setColor(0xe74c3c)
        .addFields(
          { name: "Reporter", value: `<@${interaction.user.id}> (${interaction.user.id})`, inline: false },
          { name: "Bank", value: bank ? `${bank.name} (<@${ownerId}>)` : `<@${ownerId}>`, inline: false },
          { name: "Message", value: (interaction.message?.content || "(component-based message — see attached)").slice(0, 1000), inline: false },
          { name: "Timestamp", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        );
      await channel.send({ embeds: [forwardEmbed] });
    }
  } catch (err) {
    console.error("[BANK L4] report forward error:", err);
  }
  return interaction.reply({
    content: "🚨 **Report Received**\nWaxaan helnay report-kaaga waxaana bilaabeynaa baaritaan.",
    flags: MessageFlags.Ephemeral,
  });
}

// ─── WEEKLY BANK REPORT ─────────────────────────────────────────────────────

const WEEKLY_ADVICE = [
  "xasuusi depositors in ay lacag dheeraad ah dhigtan bankigaaga ama ay kaa gataan bank pass. (Hadii bank pass garanayn fadlan qor !caawin bank pass)",
  "U dir ogaysiis macaamiishaada marka cooldown ka fariimaha kaa dhamaado.",
  "Haddii bank healthgaaga hooseeyo isku day inaad kordhiso depositors cusub.",
  "Dad badan oo isticmaala bankigaaga waxay kordhiyaan aaminaada iyo dakhliga bankiga.",
  "Joogteynta dhaqdhaqaaqa bankiga waxay sare u qaadaa kalsoonida macaamiisha.",
];

function pickWeeklyAdvice() {
  return WEEKLY_ADVICE[Math.floor(Math.random() * WEEKLY_ADVICE.length)];
}

async function buildWeeklyReportContainer(bank, ownerId, displayName) {
  const since = Date.now() - L4_REPORT_INTERVAL_MS;

  const [
    totalMoney,
    depositorCountRes,
    investorCountRes,
    newDepositorsRes,
    newInvestorsRes,
    txCountRes,
    ownerProfitRes,
    healthData,
  ] = await Promise.all([
    getBankTotal(ownerId),
    pool.query(`SELECT COUNT(*) AS c FROM bank_users WHERE bank_owner_id = $1 AND (deposited + profit) > 0`, [ownerId]),
    pool.query(`SELECT COUNT(*) AS c FROM bank_investments WHERE bank_owner_id = $1 AND amount > 0`, [ownerId]),
    pool.query(`SELECT COUNT(*) AS c FROM bank_users WHERE bank_owner_id = $1 AND first_seen_at >= $2`, [ownerId, since]),
    pool.query(`SELECT COUNT(*) AS c FROM bank_investments WHERE bank_owner_id = $1 AND deposited_at >= $2`, [ownerId, since]),
    pool.query(
      `SELECT COUNT(*) AS c FROM bank_transactions
       WHERE bank_owner_id = $1 AND type IN ('deposit', 'withdraw', 'invest', 'uninvest') AND created_at >= $2`,
      [ownerId, since]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM bank_transactions
       WHERE bank_owner_id = $1 AND type = 'owner_earning' AND created_at >= $2`,
      [ownerId, since]
    ),
    calcLevel4Health(ownerId),
  ]);

  const totalCustomers = Number(depositorCountRes.rows[0].c) + Number(investorCountRes.rows[0].c);
  const newDepositors  = Number(newDepositorsRes.rows[0].c);
  const newInvestors   = Number(newInvestorsRes.rows[0].c);
  const txCount        = Number(txCountRes.rows[0].c);
  const ownerProfit    = Number(ownerProfitRes.rows[0].total);

  let performanceLine;
  if (txCount >= 30) {
    performanceLine = "📈 Bankgaagu wuxuu ahaa mid aad active u ah todobaadkan. Dad badan ayaa lacag dhigtay, macaamiishana way sii kordhayaan.";
  } else if (txCount >= 8) {
    performanceLine = "📊 Bankgaagu wuxuu sameeyay dhaqdhaqaaq wanaagsan, laakiin wali waxaa jirta fursad aad ku kordhin karto macaamiisha iyo bankigaaga.";
  } else {
    performanceLine = "📉 Dhaqdhaqaaqa bankgaaga wuu yara hooseeyay todobaadkan. Waxaa fiican inaad ku dhiirrigeliso dadka cusub inay isticmaalaan bankigaaga.";
  }

  const nextReportTs = Math.floor((Date.now() + L4_REPORT_INTERVAL_MS) / 1000);

  return new ContainerBuilder()
    .setAccentColor(0x3498db)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("# 📊 Your Weekly Bank Report"))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Hello ${displayName}!\n\nWaa tan warbixinta toddobaadlaha ee bankigaaga.\n\nWaxaan soo koobnay sida uu bankigaagu usoo shaqeeyay 7 dii maalmood ee lasoo dhaafay.`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "**Weekly Statistics**",
          "",
          `🏦 **Bank Name:** ${bank.name}`,
          `👥 **Total Customers:** ${fmt(totalCustomers)}`,
          `💰 **Money Managed:** ${EMOJI_NASIIBCOIN} ${fmt(totalMoney)}`,
          `📈 **New Depositors:** ${fmt(newDepositors)}`,
          `💎 **New Investors:** ${fmt(newInvestors)}`,
          `🔄 **Total Transactions:** ${fmt(txCount)}`,
          `💵 **Owner Profit Earned:** ${EMOJI_NASIIBCOIN} ${fmt(ownerProfit)}`,
          `⭐ **Bank Health:** ${healthData.tier}`,
        ].join("\n")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Performance Summary**\n\n${performanceLine}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`💡 **Weekly Advice**\n\n${pickWeeklyAdvice()}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`📅 **Warbixinta xigta:** <t:${nextReportTs}:R>`));
}

async function runLevel4WeeklyReportScheduler(client) {
  try {
    const now = Date.now();
    // Only scan Level 4 banks whose report is actually due — keeps this
    // cheap even with many banks, since the WHERE clause does the filtering
    // in the database instead of pulling every level-4 bank every 30 min.
    const due = await pool.query(
      `SELECT owner_id, name, level4_upgraded_at, last_weekly_report_at
       FROM banks
       WHERE level = 4
         AND COALESCE(last_weekly_report_at, level4_upgraded_at, created_at) <= $1`,
      [now - L4_REPORT_INTERVAL_MS]
    );

    for (const bank of due.rows) {
      const ownerId = bank.owner_id;
      try {
      
        const claim = await pool.query(
          `UPDATE banks SET last_weekly_report_at = $2
           WHERE owner_id = $1
             AND level = 4
             AND COALESCE(last_weekly_report_at, level4_upgraded_at, created_at) <= $3
           RETURNING owner_id`,
          [ownerId, now, now - L4_REPORT_INTERVAL_MS]
        );
        if (claim.rowCount === 0) continue; 

        const user = await client.users.fetch(ownerId).catch(() => null);
        if (!user) continue; 

        const displayName = user.username;
        const container = await buildWeeklyReportContainer(bank, ownerId, displayName);
        await user.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
    
        console.warn(`[BANK L4] weekly report send failed for owner ${ownerId}:`, err.message || err);
      }
    }
  } catch (err) {
    console.error("[BANK L4] runLevel4WeeklyReportScheduler error:", err);
  }
}

// ─── SETUP ───────────────────────────────────────────────────────────────

export async function setupBankLevel4(client) {
  await initLevel4Tables();

  
  client.on("interactionCreate", async (interaction) => {
    try {
      await handleLevel4Interaction(interaction);
    } catch (err) {
      console.error("[BANK L4] interactionCreate error:", err);
    }
  });

  setInterval(() => {
    runLevel4ProfitTick().catch((err) => console.error("[BANK L4] profit tick error:", err));
  }, L4_PROFIT_TICK_MS);

  // Run once shortly after startup too, same pattern as bankSystem.mjs.
  setTimeout(() => {
    runLevel4ProfitTick().catch((err) => console.error("[BANK L4] initial profit tick error:", err));
  }, 30_000);

  setInterval(() => {
    runLevel4WeeklyReportScheduler(client).catch((err) => console.error("[BANK L4] weekly report scheduler error:", err));
  }, L4_REPORT_SCHEDULER_MS);


  setTimeout(() => {
    runLevel4WeeklyReportScheduler(client).catch((err) => console.error("[BANK L4] initial weekly report scheduler error:", err));
  }, 45_000);

  console.log("[BANK L4] ✅ Level 4 bank system is online.");
}
