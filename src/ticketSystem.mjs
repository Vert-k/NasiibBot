






















































import pg from "pg";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { executeWithdraw, executeDeposit } from "./bankSystem.mjs";
import {
  setupTempShieldSystem,
  giveShield,
  TEMP_SHIELD_EMOJI,
  TEMP_SHIELD_TYPES,
  formatShieldRemaining,
} from "./tempShieldSystem.mjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});


const TICKET_PRICE        = 5000;
const POOL_DURATION_MS    = 12 * 60 * 60 * 1000;
const POOL_MAX_USERS      = 10;
const POOL_MIN_USERS      = 5;
const WINNER_PCT          = 0.70;
const TREASURY_PCT        = 0.30;
const STALE_PENDING_MS    = 2  * 60 * 1000;
const SWEEP_INTERVAL_MS   = 60 * 1000;
const RESOLVED_KEEP_MS    = 3  * 60 * 60 * 1000;
const BUY_COOLDOWN_MS     = 30 * 1000;


const WINNER_SHIELD_MS    = 3 * 60 * 60 * 1000;
const REFUND_SHIELD_MS    = 1 * 60 * 60 * 1000;


const buyCooldowns = new Map();




const WITHDRAW_OWNER_RATES = { 1: 0.05, 2: 0.06, 3: 0.07 };
const WITHDRAW_BOT_RATE    = 0.03;


const fmt = (n) => Number(n).toLocaleString("en-US");

function fmtTimeRemaining(ms) {
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

















function computeTicketCost(bankLevel) {
  const ownerRate = WITHDRAW_OWNER_RATES[bankLevel] || WITHDRAW_OWNER_RATES[1];
  const taxRate   = ownerRate + WITHDRAW_BOT_RATE;
  const userRate  = 1 - taxRate;
  const gross     = Math.ceil(TICKET_PRICE / userRate);
  const tax       = gross - TICKET_PRICE;
  return { gross, tax, taxRate, ownerRate };
}

let discordClient = null;


async function initTicketTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket_pools (
      id            VARCHAR(5) PRIMARY KEY,
      bank_owner_id TEXT,
      status        TEXT NOT NULL DEFAULT 'active',
      created_at    BIGINT NOT NULL,
      expires_at    BIGINT NOT NULL,
      resolved_at   BIGINT,
      winner_id     TEXT,
      total_pool    BIGINT NOT NULL DEFAULT 0,
      channel_id    TEXT,
      guild_id      TEXT
    )
  `);

  await pool.query(`ALTER TABLE ticket_pools ALTER COLUMN bank_owner_id DROP NOT NULL`).catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ticket_pools_status ON ticket_pools(status)`);

  await pool.query(`DROP INDEX IF EXISTS idx_ticket_pools_bank_active`).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket_entries (
      pool_id       VARCHAR(5) NOT NULL REFERENCES ticket_pools(id) ON DELETE CASCADE,
      user_id       TEXT NOT NULL,
      bank_owner_id TEXT,
      entry_amount  BIGINT NOT NULL,
      pool_amount   BIGINT NOT NULL DEFAULT 0,
      joined_at     BIGINT NOT NULL,
      PRIMARY KEY (pool_id, user_id)
    )
  `);

  await pool.query(`ALTER TABLE ticket_entries ADD COLUMN IF NOT EXISTS bank_owner_id TEXT`).catch(() => {});

  await pool.query(`
    UPDATE ticket_entries te
       SET bank_owner_id = tp.bank_owner_id
      FROM ticket_pools tp
     WHERE tp.id = te.pool_id
       AND te.bank_owner_id IS NULL
  `).catch(() => {});
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_ticket_entries_user ON ticket_entries(user_id)`);

  console.log("[TICKET] ✅ Tables ready (global-pool schema).");
}


async function generateUniqueTicketIdWithClient(c) {
  for (let i = 0; i < 50; i++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const r = await c.query(`SELECT 1 FROM ticket_pools WHERE id = $1`, [id]);
    if (r.rowCount === 0) return id;
  }
  throw new Error("Could not generate unique ticket ID after 50 attempts");
}


async function getUserBankBalance(ownerId, userId) {
  const r = await pool.query(
    `SELECT COALESCE(deposited + profit, 0) AS balance
       FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2`,
    [ownerId, userId]
  );
  return Number(r.rows[0]?.balance || 0);
}


async function getBankName(ownerId) {
  const r = await pool.query(`SELECT name FROM banks WHERE owner_id = $1`, [ownerId]);
  return r.rows[0]?.name || "Bank";
}


async function getBankLevel(ownerId) {
  const r = await pool.query(`SELECT level FROM banks WHERE owner_id = $1`, [ownerId]);
  return Number(r.rows[0]?.level || 1);
}


async function handleBuyTicketSlash(interaction) {
  const userId    = interaction.user.id;
  const bankOwner = interaction.options.getUser("bank", true);
  const ownerId   = bankOwner.id;





  const lastUse = buyCooldowns.get(userId) || 0;
  const since   = Date.now() - lastUse;
  if (since < BUY_COOLDOWN_MS) {
    const wait = Math.ceil((BUY_COOLDOWN_MS - since) / 1000);
    return interaction.reply({
      content: `⏱️ Sug **${wait}s** ka hor intaadan mar kale isticmaalin \`/buy ticket\`.`,
      ephemeral: true,
    });
  }
  buyCooldowns.set(userId, Date.now());


  if (ownerId === userId) {
    return interaction.reply({ content: "❌ Bankigaagan ma ka qaadi kartid lacag — bank kale dooro.", ephemeral: true });
  }
  if (bankOwner.bot) {
    return interaction.reply({ content: "❌ Bot bank ma laha.", ephemeral: true });
  }



  const bankLevel = await getBankLevel(ownerId);
  const { gross: totalCost, tax: withdrawTax, ownerRate } = computeTicketCost(bankLevel);




  const bankBal = await getUserBankBalance(ownerId, userId);
  if (bankBal < totalCost) {
    return interaction.reply({
      content: [
        `❌ Si aad u iibsato ticket-ka waxaad u baahan tahay 5000 + canshuurta.`,
        ``,
        `🎟️ **Qiimaha ticket-ka:** ${fmt(TICKET_PRICE)} 🪙`,
        `💸 **Canshuurta withdraw (Lvl ${bankLevel}, ${(ownerRate * 100).toFixed(0)}%+${(WITHDRAW_BOT_RATE * 100).toFixed(0)}%):** ${fmt(withdrawTax)} 🪙`,
        `💰 **Wadarta aad bixinaysid:** **${fmt(totalCost)} 🪙**`,
        ``,
        `💼 **Lacagta aad ku haysato bank gaas:** ${fmt(bankBal)} 🪙`,
      ].join("\n"),
      ephemeral: true,
    });
  }


  await interaction.deferReply({ ephemeral: true });


  const c = await pool.connect();
  let poolId        = null;
  let alreadyJoined = false;
  let poolFull      = false;

  try {
    await c.query("BEGIN");





    const stillInPool = await c.query(
      `SELECT te.pool_id
         FROM ticket_entries te
         JOIN ticket_pools   tp ON tp.id = te.pool_id
        WHERE te.user_id = $1
          AND tp.status IN ('active', 'full')
        LIMIT 1`,
      [userId]
    );
    if (stillInPool.rowCount > 0) {
      alreadyJoined = true;
      poolId = stillInPool.rows[0].pool_id;
    }



    const activeRows = alreadyJoined ? { rows: [] } : await c.query(
      `SELECT id FROM ticket_pools
        WHERE status = 'active'
        ORDER BY created_at ASC
        FOR UPDATE`
    );

    let activeId = null;
    for (const r of activeRows.rows) {
      const cnt = Number((await c.query(
        `SELECT COUNT(*) AS cnt FROM ticket_entries WHERE pool_id = $1`, [r.id]
      )).rows[0].cnt);
      if (cnt < POOL_MAX_USERS) { activeId = r.id; break; }
    }

    if (alreadyJoined) {
      await c.query("ROLLBACK");
    } else {
      if (!activeId) {


        activeId = await generateUniqueTicketIdWithClient(c);
        const now = Date.now();
        await c.query(
          `INSERT INTO ticket_pools (id, bank_owner_id, status, created_at, expires_at, channel_id, guild_id)
           VALUES ($1, NULL, 'active', $2, $3, $4, $5)`,
          [activeId, now, now + POOL_DURATION_MS, interaction.channelId || null, interaction.guildId || null]
        );
      }
      poolId = activeId;





      await c.query(
        `INSERT INTO ticket_entries (pool_id, user_id, bank_owner_id, entry_amount, pool_amount, joined_at)
         VALUES ($1, $2, $3, $4, 0, $5)`,
        [activeId, userId, ownerId, totalCost, Date.now()]
      );
      await c.query("COMMIT");
    }
  } catch (err) {
    try { await c.query("ROLLBACK"); } catch {}
    console.error("[TICKET] /buy reservation error:", err);
    return interaction.editReply({ content: "❌ Khalad ayaa ka dhacay reservation ka. Isku day mar kale." });
  } finally {
    c.release();
  }

  if (alreadyJoined) {
    return interaction.editReply({
      content:
        `❌ Mar hore ayaad ku jirtaa ticket pool **#${poolId}** (weli ma dhammaan).\n` +
        `Sug ilaa uu pool-kaasi dhammaado (winner la doorto ama refund la sameeyo). ` +
        `Markaas ka dib waad ku biiri kartaa pool cusub.`,
    });
  }
  if (poolFull) {
    return interaction.editReply({ content: `❌ Ticket pool-kii ugu dambeeyay wuu buuxsamay (10/10). Mid cusub ayaa hadda la abuurayaa — isku day mar dambe.` });
  }




  let withdrawErr        = null;
  let withdrawErrEmbeds  = null;
  let withdrawSucceeded  = false;

  await executeWithdraw(userId, ownerId, totalCost, (errMsg, _embed) => {
    if (errMsg) {
      if (typeof errMsg === "string") withdrawErr = errMsg;
      else if (errMsg?.embeds)        withdrawErrEmbeds = errMsg.embeds;
      else                            withdrawErr = "Withdraw fail.";
    } else {
      withdrawSucceeded = true;
    }
  });

  if (!withdrawSucceeded) {

    await pool.query(`DELETE FROM ticket_entries WHERE pool_id = $1 AND user_id = $2`, [poolId, userId]);
    const remaining = await pool.query(`SELECT COUNT(*) AS cnt FROM ticket_entries WHERE pool_id = $1`, [poolId]);
    if (Number(remaining.rows[0].cnt) === 0) {
      await pool.query(`DELETE FROM ticket_pools WHERE id = $1 AND status = 'active'`, [poolId]);
    }
    const reply = { content: `❌ Withdraw wuu fashilmay — ticket lagama gadin.${withdrawErr ? `\n${withdrawErr}` : ""}` };
    if (withdrawErrEmbeds) reply.embeds = withdrawErrEmbeds;
    return interaction.editReply(reply);
  }






  const debit = await pool.query(
    `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`,
    [TICKET_PRICE, userId]
  );
  if (debit.rowCount === 0) {


    return interaction.editReply({
      content: `⚠️ Withdraw wuu shaqeeyey, laakin ticket pool ka kuma gelinin sababtoo ah lacagtii waxay ka baxday wallet kaaga si dhakhso ah. **${fmt(TICKET_PRICE)} Coins** waxay ku jireen walletkaaga — fadlan isticmaal \`!deposit\` si aad ugu celiso bank.`,
    });
  }




  const c2 = await pool.connect();
  let positionAfter = 0;
  let expiresAt     = 0;
  let poolBecameFull = false;
  try {
    await c2.query("BEGIN");

    const lockRes = await c2.query(
      `SELECT status, expires_at FROM ticket_pools WHERE id = $1 FOR UPDATE`,
      [poolId]
    );
    if (lockRes.rowCount === 0) {

      await c2.query("ROLLBACK");
      return interaction.editReply({
        content: `⚠️ Ticket pool ka **#${poolId}** lama helin mar dambe. Fadlan isku day mar kale.`,
      });
    }

    await c2.query(
      `UPDATE ticket_entries SET pool_amount = $1 WHERE pool_id = $2 AND user_id = $3`,
      [TICKET_PRICE, poolId, userId]
    );
    await c2.query(
      `UPDATE ticket_pools SET total_pool = total_pool + $1 WHERE id = $2`,
      [TICKET_PRICE, poolId]
    );

    const cnt = Number((await c2.query(
      `SELECT COUNT(*) AS cnt FROM ticket_entries WHERE pool_id = $1 AND pool_amount > 0`,
      [poolId]
    )).rows[0].cnt);
    positionAfter = cnt;
    expiresAt     = Number(lockRes.rows[0].expires_at || 0);


    if (cnt >= POOL_MAX_USERS && lockRes.rows[0].status === "active") {
      await c2.query(
        `UPDATE ticket_pools SET status = 'full' WHERE id = $1 AND status = 'active'`,
        [poolId]
      );
      poolBecameFull = true;
    }

    await c2.query("COMMIT");
  } catch (err) {
    try { await c2.query("ROLLBACK"); } catch {}
    console.error("[TICKET] Phase 3 confirm error:", err);




    return interaction.editReply({
      content: `⚠️ Khalad ayaa ka dhacay xaqiijinta entry-gaaga ticket pool-ka. Fadlan la xiriir admin oo sheeg ID-ga: \`#${poolId}\`.`,
    });
  } finally {
    c2.release();
  }

  const descLines = [
    `🎉 **Hambalyo, waxaad ka qayb gashay Lottery ticketka.**`,
    `🆔 ID giisu yahay: \`#${poolId}\``,
    `👤 Waxaad tahay qofkii **${positionAfter}/${POOL_MAX_USERS}** ee soo gala.`,
    ``,
    `🏦 **Bank-gaaga (lacagta lagaa qaaday):** <@${ownerId}>`,
    `🌍 **Pool nooca:** Global — dhammaan dadku hal pool ayay isugu yimaadaan`,
    `🎟️ **Qiimaha ticket-ka:** ${fmt(TICKET_PRICE)} 🪙`,
    `💸 **Canshuurta withdraw:** ${fmt(withdrawTax)} 🪙`,
    `💰 **Wadarta aad bixisay:** **${fmt(totalCost)} 🪙**`,
    `📥 **Pool-ka (clean):** **${fmt(TICKET_PRICE)} 🪙**`,
  ];
  if (poolBecameFull) {
    descLines.push(`🔥 **Pool-ka wuu BUUXSAMAY (10/10)!** Guulaystaha hadda ayaa la dooranayaa…`);
  } else {
    descLines.push(`⏳ **Wakhtiga haray:** ${fmtTimeRemaining(expiresAt - Date.now())}`);
  }
  descLines.push(``);
  descLines.push(`📌 **Fadlan ID gaas save dhaho** si aad ula socotid dhaq dhaqaaga lottery gan.`);
  descLines.push(`📋 Eeg: \`!ticket ${poolId}\``);

  const embed = new EmbedBuilder()
    .setTitle(poolBecameFull ? "🎟️🔥 Ticket — Pool-ka waa BUUXSAMAY!" : "🎟️ Hambalyo — Lottery ticket!")
    .setDescription(descLines.join("\n"))
    .setColor(poolBecameFull ? 0xe67e22 : 0x9b59b6);



  await interaction.editReply({ embeds: [embed] });



  if (poolBecameFull) {
    resolvePool(poolId).catch(err =>
      console.error(`[TICKET] Instant resolve failed for full pool ${poolId}:`, err)
    );
  }
  return;
}


async function handleTicketLookup(message, args) {
  const id = (args[0] || "").replace(/^#/, "").trim();
  if (!/^\d{5}$/.test(id)) {
    return message.reply("❌ Ma jiro ID gaan, fadlan iska sax oo gali mid saxan.\n💡 Tusaale: `!ticket 48392`");
  }
  const r = await pool.query(`SELECT * FROM ticket_pools WHERE id = $1`, [id]);
  if (r.rowCount === 0) return message.reply(`❌ Ma jiro ID gaan, fadlan iska sax oo gali mid saxan.`);
  const tp = r.rows[0];
  const eRes = await pool.query(
    `SELECT user_id, bank_owner_id, entry_amount, pool_amount, joined_at
       FROM ticket_entries WHERE pool_id = $1 AND pool_amount > 0
       ORDER BY joined_at ASC`,
    [id]
  );


  const statusBadgeMap = {
    active:    { emoji: "🟢", label: "ACTIVE",    sub: "weli furan",                  color: 0x3498db },
    full:      { emoji: "🔥", label: "FULL",      sub: "10/10 — natiijada socota",    color: 0xe67e22 },
    completed: { emoji: "🏆", label: "COMPLETED", sub: "guuleystaha la doortay",      color: 0x2ecc71 },
    refunded:  { emoji: "↩️", label: "REFUNDED",  sub: "dad ku filan ma soo gelin",   color: 0x95a5a6 },
  };
  const badge = statusBadgeMap[tp.status] || { emoji: "❔", label: tp.status, sub: "", color: 0x95a5a6 };


  const totalPool   = Number(tp.total_pool) || 0;
  const winnerCut   = Math.floor(totalPool * WINNER_PCT);
  const treasuryCut = totalPool - winnerCut;
  const playersCnt  = eRes.rowCount;
  const capacityBar = (() => {
    const filled = Math.max(0, Math.min(POOL_MAX_USERS, playersCnt));
    const empty  = POOL_MAX_USERS - filled;
    return "▰".repeat(filled) + "▱".repeat(empty);
  })();


  const playersBlock = (() => {
    if (playersCnt === 0) return "_(Wax player ah weli ma soo gelin)_";
    return eRes.rows.map((e, i) => {
      const n = String(i + 1).padStart(2, " ");
      return `\`${n}\` <@${e.user_id}> · 🏦 <@${e.bank_owner_id}> · 💰 ${fmt(e.pool_amount)}🪙`;
    }).join("\n");
  })();


  let footerHint = "";
  if (tp.status === "active") {
    footerHint = `⏳ Hadhay: **${fmtTimeRemaining(Number(tp.expires_at) - Date.now())}**`;
  } else if (tp.status === "full") {
    footerHint = `⚡ Pool buuxsamay — natiijada hadda ayaa la dhameystirayaa.`;
  } else if (tp.status === "completed" && tp.winner_id) {
    footerHint = `🏆 Guuleystaha: <@${tp.winner_id}>`;
  } else if (tp.status === "refunded") {
    footerHint = `↩️ Lacagtii waa la celiyey dhammaan kuwii ku jiray.`;
  }

  const description = [
    `${badge.emoji}  **${badge.label}** — ${badge.sub}`,
    `\`${capacityBar}\`  **${playersCnt}/${POOL_MAX_USERS}** players`,
    ``,
    footerHint,
  ].filter(Boolean).join("\n");

  const embed = new EmbedBuilder()
    .setTitle(`🎟️  Ticket Pool · #${tp.id}`)
    .setDescription(description)
    .setColor(badge.color)
    .addFields(
      {
        name: "💰  Pool Wadar",
        value: `**${fmt(totalPool)}** 🪙`,
        inline: true,
      },
      {
        name: "🎁  Guuleystaha (70%)",
        value: `**${fmt(winnerCut)}** 🪙`,
        inline: true,
      },
      {
        name: "💼  Treasury (30%)",
        value: `**${fmt(treasuryCut)}** 🪙`,
        inline: true,
      },
      {
        name: "👥  Ciyaartooyda",
        value: playersBlock,
        inline: false,
      },
    )
    .setFooter({ text: `Pool ID #${tp.id} · Global pool — ALL banks` });



  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_panel_${message.author.id}`)
      .setLabel("Close")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger),
  );

  return message.reply({ embeds: [embed], components: [row] });
}


async function resolvePool(poolId) {
  const c = await pool.connect();
  let resolution = null;
  try {
    await c.query("BEGIN");


    const tpRes = await c.query(
      `SELECT * FROM ticket_pools WHERE id = $1 AND status IN ('active', 'full') FOR UPDATE`,
      [poolId]
    );
    if (tpRes.rowCount === 0) { await c.query("COMMIT"); return; }
    const tp = tpRes.rows[0];



    const eRes = await c.query(
      `SELECT user_id, bank_owner_id, entry_amount, pool_amount
         FROM ticket_entries WHERE pool_id = $1 AND pool_amount > 0`,
      [poolId]
    );
    const entries = eRes.rows;

    if (entries.length < POOL_MIN_USERS) {






      await c.query(
        `UPDATE ticket_pools SET status = 'refunded', resolved_at = $1 WHERE id = $2`,
        [Date.now(), poolId]
      );
      resolution = {
        type: "refund",
        entries,
        channelId:   tp.channel_id,
      };
    } else {

      const winnerEntry  = entries[Math.floor(Math.random() * entries.length)];
      const totalPool    = entries.reduce((s, e) => s + Number(e.pool_amount), 0);
      const winnerGets   = Math.floor(totalPool * WINNER_PCT);
      const treasuryGets = totalPool - winnerGets;


      await c.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [treasuryGets]);

      await c.query(
        `UPDATE ticket_pools SET status = 'completed', resolved_at = $1, winner_id = $2 WHERE id = $3`,
        [Date.now(), winnerEntry.user_id, poolId]
      );
      resolution = {
        type: "winner",
        winnerId:        winnerEntry.user_id,
        winnerBankOwner: winnerEntry.bank_owner_id,
        winnerGets,
        treasuryGets,
        totalPool,
        channelId:       tp.channel_id,
        entries,
      };
    }
    await c.query("COMMIT");
  } catch (err) {
    try { await c.query("ROLLBACK"); } catch {}
    console.error("[TICKET] resolvePool error:", err);
    return;
  } finally {
    c.release();
  }

  if (!resolution) return;


  if (resolution.type === "winner") {
    const winnerBank = resolution.winnerBankOwner;
    const bankName   = await getBankName(winnerBank);


    let depositSummary  = null;
    let depositErrMsg   = null;
    await executeDeposit(
      resolution.winnerId,
      winnerBank,
      resolution.winnerGets,
      (errMsg, embed, _meta) => {
        if (errMsg) depositErrMsg = errMsg;
        else        depositSummary = embed;
      },
      () => true
    );




    let depositFellBack = false;
    let shieldInfo      = null;
    if (!depositSummary) {
      depositFellBack = true;
      await pool.query(
        `UPDATE players SET coins = coins + $1 WHERE discord_id = $2`,
        [resolution.winnerGets, resolution.winnerId]
      );
      try {
        shieldInfo = await giveShield(
          resolution.winnerId,
          WINNER_SHIELD_MS,
          TEMP_SHIELD_TYPES.LOTTERY
        );
      } catch (err) {
        console.error(`[TICKET] Failed to grant winner temp shield to ${resolution.winnerId}:`, err);
      }
      console.warn(
        `[TICKET] Winner deposit failed for ${resolution.winnerId} (bank: ${winnerBank}), ` +
        `credited wallet + temp shield. Reason:`, depositErrMsg
      );
    }


    if (discordClient) {
      try {
        const u = await discordClient.users.fetch(resolution.winnerId);
        const lines = [
          `Hambalyo waxaa ku guulaysatay ticket lottery!`,
          ``,
          `🎫 Ticket: \`#${poolId}\``,
          `💰 Pool wadar: ${fmt(resolution.totalPool)} 🪙`,
          `🎁 Adigu (70%): **${fmt(resolution.winnerGets)} 🪙**`,
        ];

        if (!depositFellBack) {
          lines.push(``);
          lines.push(`Lacagtaadii faaiidada waxaa si guul ah loo dhigay account aad ku leedahay **${bankName}** (<@${winnerBank}>).`);
        } else {
          const remainingMs = shieldInfo
            ? Math.max(0, shieldInfo.expiresAt - Date.now())
            : WINNER_SHIELD_MS;
          lines.push(``);
          lines.push(`⚠️ Maadaama bank account-gaaga aad ku leedahay **${bankName}** uu buuxsamay, lacagtaada waxaa lagu celiyey wallet-kaaga.`);
          lines.push(``);
          lines.push(`${TEMP_SHIELD_EMOJI} Waxaa si ku meel gaar ah laguu siiyey shield mudo **${formatShieldRemaining(remainingMs)}** ah si lagaa ilaaliyo rob.`);
          lines.push(``);
          lines.push(`Fadlan invest dheh ama bank kale ku shubo si aad u ilaaliso lacagtaada.`);
        }

        const dmEmbed = new EmbedBuilder()
          .setTitle(depositFellBack ? `${TEMP_SHIELD_EMOJI} Hambalyo + Auto-Shield!` : "🏆 Hambalyo!")
          .setDescription(lines.join("\n"))
          .setColor(depositFellBack ? 0x1abc9c : 0xf1c40f);
        await u.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch {}


      for (const e of resolution.entries) {
        if (e.user_id === resolution.winnerId) continue;
        try {
          const u = await discordClient.users.fetch(e.user_id);
          await u.send(
            `🎟️ Waxaa soo dhamaaday mudadii sugista lottery ga laakiin ma aadan noqon guulaystaha maanta, isku day mar kale.\n\n` +
            `🎫 Ticket: \`#${poolId}\``
          ).catch(() => {});
        } catch {}
      }
    }
  } else {







    for (const e of resolution.entries) {
      const refundAmount = Number(e.pool_amount);
      const entryBank    = e.bank_owner_id;
      const bankName     = await getBankName(entryBank);

      let depositSummary = null;
      let depositErrMsg  = null;
      await executeDeposit(
        e.user_id,
        entryBank,
        refundAmount,
        (errMsg, embed, _meta) => {
          if (errMsg) depositErrMsg = errMsg;
          else        depositSummary = embed;
        },
        () => true
      );

      if (depositSummary) {

        if (discordClient) {
          try {
            const u = await discordClient.users.fetch(e.user_id);
            await u.send(
              `↩️ Pool ticket-ka aad ka qayb gashay (\`#${poolId}\`) ma soo galin dad ku filan, ` +
              `**${fmt(refundAmount)} Coins** waxaa lagu celiyey bankigaaga **${bankName}** (canshuur la'aan).`
            ).catch(() => {});
          } catch {}
        }
      } else {

        await pool.query(
          `UPDATE players SET coins = coins + $1 WHERE discord_id = $2`,
          [refundAmount, e.user_id]
        );

        let shieldInfo = null;
        try {
          shieldInfo = await giveShield(
            e.user_id,
            REFUND_SHIELD_MS,
            TEMP_SHIELD_TYPES.REFUND
          );
        } catch (err) {
          console.error(`[TICKET] Failed to grant refund temp shield to ${e.user_id}:`, err);
        }

        console.warn(
          `[TICKET] Refund deposit failed for ${e.user_id} (bank: ${entryBank}), ` +
          `credited wallet + temp shield. Reason:`, depositErrMsg
        );

        if (discordClient) {
          try {
            const u = await discordClient.users.fetch(e.user_id);
            const remainingMs = shieldInfo
              ? Math.max(0, shieldInfo.expiresAt - Date.now())
              : REFUND_SHIELD_MS;

            const dmEmbed = new EmbedBuilder()
              .setTitle(`${TEMP_SHIELD_EMOJI} Refund + Auto-Shield`)
              .setDescription([
                `↩️ Pool ticket-ka (\`#${poolId}\`) ma soo galin dad ku filan.`,
                ``,
                `Maadaama lagu guuldaraystay in bank account-ka aad ku leedahay **${bankName}** lagu celiyo lacagta, **${fmt(refundAmount)} Coins** waxaa lagu daray wallet-kaaga.`,
                ``,
                `${TEMP_SHIELD_EMOJI} Waxaa sidoo kale laguu siiyey shield mudo **${formatShieldRemaining(remainingMs)}** ah.`,
                ``,
                `Fadlan invest dheh ama bank kale ku shubo si aad u ilaaliso lacagtaada.`,
              ].join("\n"))
              .setColor(0x1abc9c);
            await u.send({ embeds: [dmEmbed] }).catch(() => {});
          } catch {}
        }
      }
    }
  }
}



















async function mergeActivePools() {
  const c = await pool.connect();
  let duplicateRefunds = [];
  let mergedCount = 0;
  let baseId = null;
  let overflowIds = [];

  try {
    await c.query("BEGIN");


    const poolsRes = await c.query(
      `SELECT id, total_pool FROM ticket_pools
        WHERE status = 'active'
        ORDER BY created_at ASC
        FOR UPDATE`
    );
    if (poolsRes.rowCount < 2) {
      await c.query("COMMIT");
      console.log(`[TICKET FIX] No merge needed (active pools: ${poolsRes.rowCount}).`);
      return;
    }

    baseId = poolsRes.rows[0].id;
    const sourceIds = poolsRes.rows.slice(1).map(r => r.id);


    await c.query(
      `DELETE FROM ticket_entries WHERE pool_id = ANY($1::text[]) AND pool_amount = 0`,
      [poolsRes.rows.map(r => r.id)]
    );


    let baseCount = Number((await c.query(
      `SELECT COUNT(*) AS cnt FROM ticket_entries WHERE pool_id = $1`, [baseId]
    )).rows[0].cnt);


    const baseUsersSet = new Set(
      (await c.query(`SELECT user_id FROM ticket_entries WHERE pool_id = $1`, [baseId])).rows.map(r => r.user_id)
    );

    let currentTargetId = baseId;
    let currentTargetCount = baseCount;

    for (const srcId of sourceIds) {
      const srcEntries = (await c.query(
        `SELECT user_id, bank_owner_id, entry_amount, pool_amount, joined_at
           FROM ticket_entries
          WHERE pool_id = $1
          ORDER BY joined_at ASC`,
        [srcId]
      )).rows;

      for (const e of srcEntries) {

        if (baseUsersSet.has(e.user_id) && currentTargetId === baseId) {
          duplicateRefunds.push({
            userId: e.user_id,
            bankOwnerId: e.bank_owner_id,
            amount: Number(e.pool_amount),
            sourcePoolId: srcId,
          });
          await c.query(
            `DELETE FROM ticket_entries WHERE pool_id = $1 AND user_id = $2`,
            [srcId, e.user_id]
          );
          continue;
        }


        if (currentTargetCount >= POOL_MAX_USERS) {
          const overflowId = await generateUniqueTicketIdWithClient(c);
          const now = Date.now();
          await c.query(
            `INSERT INTO ticket_pools (id, bank_owner_id, status, created_at, expires_at, channel_id, guild_id)
             VALUES ($1, NULL, 'active', $2, $3, NULL, NULL)`,
            [overflowId, now, now + POOL_DURATION_MS]
          );
          overflowIds.push(overflowId);
          currentTargetId = overflowId;
          currentTargetCount = 0;
        }



        try {
          await c.query(
            `UPDATE ticket_entries SET pool_id = $1 WHERE pool_id = $2 AND user_id = $3`,
            [currentTargetId, srcId, e.user_id]
          );
          currentTargetCount += 1;
          if (currentTargetId === baseId) baseUsersSet.add(e.user_id);
        } catch (uerr) {

          duplicateRefunds.push({
            userId: e.user_id,
            bankOwnerId: e.bank_owner_id,
            amount: Number(e.pool_amount),
            sourcePoolId: srcId,
          });
          await c.query(
            `DELETE FROM ticket_entries WHERE pool_id = $1 AND user_id = $2`,
            [srcId, e.user_id]
          );
        }
      }



      await c.query(`DELETE FROM ticket_pools WHERE id = $1`, [srcId]);
      mergedCount += 1;
    }


    const targetIds = [baseId, ...overflowIds];
    for (const tid of targetIds) {
      const cnt = Number((await c.query(
        `SELECT COUNT(*) AS cnt FROM ticket_entries WHERE pool_id = $1 AND pool_amount > 0`, [tid]
      )).rows[0].cnt);
      await c.query(
        `UPDATE ticket_pools SET total_pool = $1, bank_owner_id = NULL WHERE id = $2`,
        [cnt * TICKET_PRICE, tid]
      );
    }

    await c.query("COMMIT");
    console.log(`[TICKET FIX] Merged ${mergedCount} pool(s) into pool ${baseId}.`);
    if (overflowIds.length > 0) {
      console.log(`[TICKET FIX] Created ${overflowIds.length} overflow pool(s): ${overflowIds.join(", ")}.`);
    }
    const totalPlayers = Number((await pool.query(
      `SELECT COUNT(*) AS cnt FROM ticket_entries WHERE pool_id = ANY($1::text[]) AND pool_amount > 0`,
      [targetIds]
    )).rows[0].cnt);
    console.log(`[TICKET FIX] Total players: ${totalPlayers}`);
  } catch (err) {
    try { await c.query("ROLLBACK"); } catch {}
    console.error("[TICKET FIX] mergeActivePools error:", err);
    return;
  } finally {
    c.release();
  }



  for (const r of duplicateRefunds) {
    try {
      let ok = false;
      await executeDeposit(
        r.userId,
        r.bankOwnerId,
        r.amount,
        (errMsg, embed) => { if (!errMsg && embed) ok = true; },
        () => true
      );
      if (!ok) {

        await pool.query(
          `UPDATE players SET coins = coins + $1 WHERE discord_id = $2`,
          [r.amount, r.userId]
        );
      }
      console.log(`[TICKET FIX] Refunded duplicate-user entry: ${r.userId} → ${r.amount} (from pool ${r.sourcePoolId}).`);
      if (discordClient) {
        try {
          const u = await discordClient.users.fetch(r.userId);
          await u.send(
            `↩️ Pool ticket-yadii badan ee aad ku jirtay waxaa lagu midaystay hal pool. ` +
            `Entry-ga aad lammaaneynta u lahayd waxaa lagu celiyay **${fmt(r.amount)} Coins**.`
          ).catch(() => {});
        } catch {}
      }
    } catch (err) {
      console.error(`[TICKET FIX] Failed dedupe refund for ${r.userId}:`, err);
    }
  }
}


async function expirySweep() {
  try {


    const stuckFull = await pool.query(
      `SELECT id FROM ticket_pools WHERE status = 'full'`
    );
    for (const row of stuckFull.rows) {
      await resolvePool(row.id).catch(e => console.error("[TICKET] sweep full-resolve err:", e));
    }


    const expired = await pool.query(
      `SELECT id FROM ticket_pools WHERE status = 'active' AND expires_at <= $1`,
      [Date.now()]
    );
    for (const row of expired.rows) {
      await resolvePool(row.id).catch(e => console.error("[TICKET] sweep resolve err:", e));
    }


    const cutoff = Date.now() - STALE_PENDING_MS;
    const stale = await pool.query(
      `DELETE FROM ticket_entries
        WHERE pool_amount = 0 AND joined_at < $1
        RETURNING pool_id, user_id`,
      [cutoff]
    );
    if (stale.rowCount > 0) {
      console.log(`[TICKET] Cleaned ${stale.rowCount} stale pending entries.`);

      await pool.query(`
        DELETE FROM ticket_pools tp
         WHERE tp.status = 'active'
           AND NOT EXISTS (SELECT 1 FROM ticket_entries te WHERE te.pool_id = tp.id)
      `);
    }



    const expiredKeep = await pool.query(
      `DELETE FROM ticket_pools
        WHERE status IN ('completed', 'refunded')
          AND resolved_at IS NOT NULL
          AND resolved_at + $1 <= $2
        RETURNING id`,
      [RESOLVED_KEEP_MS, Date.now()]
    );
    if (expiredKeep.rowCount > 0) {
      console.log(`[TICKET] Deleted ${expiredKeep.rowCount} expired ticket IDs (>3h old).`);
    }
  } catch (err) {
    console.error("[TICKET] expirySweep error:", err);
  }
}


async function registerSlashCommands(client) {
  if (!client.application) {
    console.warn("[TICKET] client.application not ready — slash commands not registered yet.");
    return;
  }
  try {
    await client.application.commands.create({
      name: "buy",
      description: "🛒 Wax iibso (ticket lottery iyo wixii kale ee soo socda).",
      options: [
        {
          name: "ticket",
          description: `🎟️ Ticket lottery (${TICKET_PRICE} + canshuur). Bank-gaaga ayaa lagaa qaadayaa.`,
          type: 1,
          options: [
            {
              name: "bank",
              description: "Bank-owner-ka aad ka iibsanayso ticketka.",
              type: 6,
              required: true,
            },
          ],
        },
      ],
    });
    console.log("[TICKET] ✅ /buy ticket slash command registered globally (may take ~1h to propagate).");
  } catch (err) {
    console.error("[TICKET] Failed to register /buy slash command:", err.message);
  }
}


export async function setupTicketSystem(client) {
  discordClient = client;
  await initTicketTables();




  await setupTempShieldSystem();




  await mergeActivePools().catch(err => console.error("[TICKET FIX] merge failed:", err));


  if (typeof client.isReady === "function" && client.isReady()) {
    await registerSlashCommands(client);
  } else {
    client.once("clientReady", () => registerSlashCommands(client));
  }


  client.on("interactionCreate", async (interaction) => {
    try {
      if (typeof interaction.isChatInputCommand === "function" &&
          interaction.isChatInputCommand() &&
          interaction.commandName === "buy") {
        const sub = interaction.options.getSubcommand(false);
        if (sub === "ticket") {
          await handleBuyTicketSlash(interaction);
        }
      }
    } catch (err) {
      console.error("[TICKET] interactionCreate error:", err);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale." });
        } else {
          await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true });
        }
      } catch {}
    }
  });


  client.on("messageCreate", async (message) => {
    try {
      if (message.author?.bot) return;
      if (!message.content) return;
      const parts = message.content.trim().split(/\s+/);
      if (parts[0] !== "!ticket") return;
      await handleTicketLookup(message, parts.slice(1));
    } catch (err) {
      console.error("[TICKET] messageCreate error:", err);
    }
  });


  setInterval(expirySweep, SWEEP_INTERVAL_MS);

  setTimeout(expirySweep, 30_000);

  console.log("[TICKET] ✅ Ticket system is online.");
}
