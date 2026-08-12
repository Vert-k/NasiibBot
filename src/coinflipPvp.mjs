






























































import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { pool, getPlayer, fmt } from "./bankSystem.mjs";



const CF_MIN_BET   = 20;
const CF_MAX_BET   = 50_000;
const CF_HOUSE_EDGE_PCT   = 5;
const CF_LUCKY_CHANCE     = 0.0075;
const CF_LUCKY_BONUS      = 10_000;

const CF_ACCEPT_TIMEOUT_MS   = 60_000;
const CF_CHOOSE_TIMEOUT_MS   = 60_000;
const CF_DECISION_TIMEOUT_MS = 30_000;
const CF_SWEEP_INTERVAL_MS   = 20_000;

const SIDES = ["xarash", "madax"];
const SIDE_LABEL = { xarash: "🪙 Xarash", madax: "👑 Madax" };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



async function ensureCoinflipTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coinflip_sessions (
      id                   SERIAL PRIMARY KEY,
      guild_id             TEXT,
      channel_id           TEXT NOT NULL,
      message_id           TEXT,
      challenger_id        TEXT NOT NULL,
      opponent_id          TEXT NOT NULL,
      bet_amount           INTEGER NOT NULL,
      status               TEXT NOT NULL DEFAULT 'pending_accept',
      round                INTEGER NOT NULL DEFAULT 1,
      challenger_choice    TEXT,
      opponent_choice      TEXT,
      challenger_decision  TEXT,
      opponent_decision    TEXT,
      last_coin_result     TEXT,
      created_at           BIGINT NOT NULL,
      phase_expires_at     BIGINT NOT NULL
    )
  `);




  await pool.query(`
    CREATE TABLE IF NOT EXISTS coinflip_pvp_logs (
      id          SERIAL PRIMARY KEY,
      session_id  INTEGER NOT NULL,
      user_id     TEXT NOT NULL,
      type        TEXT NOT NULL,
      amount      INTEGER NOT NULL,
      note        TEXT,
      created_at  BIGINT NOT NULL
    )
  `);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS coinflip_pvp_wins INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS coinflip_pvp_losses INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS coinflip_pvp_earned INTEGER NOT NULL DEFAULT 0`);



  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS coinflip_pvp_played INTEGER NOT NULL DEFAULT 0`);
}

async function logCoinflipTx(client, sessionId, userId, type, amount, note = null) {
  await client.query(
    `INSERT INTO coinflip_pvp_logs (session_id, user_id, type, amount, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, type, Math.floor(amount), note, Date.now()]
  );
}

async function ensurePlayerRow(discordId, username) {
  await pool.query(
    `INSERT INTO players (discord_id, username) VALUES ($1, $2) ON CONFLICT (discord_id) DO NOTHING`,
    [discordId, username || discordId]
  );
}



function statusLabel(s) {
  return { pending_accept: "waiting for Aqbal", choosing: "Doorasho", tie_decision: "Reflip/Cashout", finished: "wuu dhamaaday", cancelled: "waa la Joojiyay" }[s] || s;
}

async function hasActiveSession(userId) {
  const r = await pool.query(
    `SELECT 1 FROM coinflip_sessions
     WHERE (challenger_id = $1 OR opponent_id = $1)
       AND status IN ('pending_accept', 'choosing', 'tie_decision')`,
    [userId]
  );
  return r.rowCount > 0;
}



async function withLockedSession(sessionId, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(`SELECT * FROM coinflip_sessions WHERE id = $1 FOR UPDATE`, [sessionId]);
    if (res.rowCount === 0) {
      await client.query("ROLLBACK");
      return undefined;
    }
    const result = await fn(client, res.rows[0]);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}





async function payFromTreasury(client, desired) {
  if (desired <= 0) return 0;
  const bw = await client.query(`SELECT coins FROM bot_wallet WHERE id = 1 FOR UPDATE`);
  const available = Number(bw.rows[0]?.coins || 0);
  const actual = Math.max(0, Math.min(desired, available));
  if (actual > 0) {
    await client.query(`UPDATE bot_wallet SET coins = coins - $1 WHERE id = 1`, [actual]);
  }
  return actual;
}

async function creditTreasury(client, amount) {
  if (amount <= 0) return;
  await client.query(`UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`, [amount]);
}




async function creditPlayer(client, discordId, amount) {
  if (amount === 0) return;
  await client.query(`UPDATE players SET coins = coins + $1 WHERE discord_id = $2`, [amount, discordId]);
}

function disabledRow(row) {
  const cloned = ActionRowBuilder.from(row);
  cloned.components.forEach((c) => c.setDisabled(true));
  return cloned;
}



function challengeEmbed(session, challengerTag, opponentTag) {
  const secsLeft = Math.max(0, Math.ceil((session.phase_expires_at - Date.now()) / 1000));
  return new EmbedBuilder()
    .setTitle("🪙 Codsi Coinflip")
    .setDescription(
      `**${challengerTag}** ayaa balansadeen **${opponentTag}** Coinflip.\n\n` +
      `💰 **Sharad:** ${fmt(session.bet_amount)} Coins (labadaba)\n` +
      `⏳ Sug ilaa **${secsLeft}s** si ${opponentTag} ay aqbalayaan.`
    )
    .setColor(0xf1c40f)
    .setFooter({ text: "Nasiib Coinflip" });
}

function choosingEmbed(session, challengerTag, opponentTag) {
  return new EmbedBuilder()
    .setTitle("⚔️ Coinflip — Waiting for players...")
    .setDescription(
      `**${challengerTag}** 🆚 **${opponentTag}**\n\n` +
      `💰 **Sharad:** ${fmt(session.bet_amount * 2)} Coins (pot)\n\n` +
      `Labadiinaba doorta **Xarash** ama **Madax** — qofna ma arki karo doorashada kan kale ilaa labadiinuba doortaan.`
    )
    .setColor(0x3498db)
    .setFooter({ text: `Round ${session.round} · Nasiib Coinflip` });
}

function tieEmbed(session, challengerTag, opponentTag, correct) {
  const title = correct ? "🤝 Draw — Labadiinuba waad saxdeen." : "🤝 Draw — Labadiinuba waad qaldanteen.";
  const desc = correct
    ? `**${challengerTag}:** ${SIDE_LABEL[session.challenger_choice]}\n**${opponentTag}:** ${SIDE_LABEL[session.opponent_choice]}\n**Coin:** ${SIDE_LABEL[session.last_coin_result]}\n\nDooro waxaad rabtaan — labadiinuba waa inaad isku raacaan.`
    : `**${challengerTag}:** ${SIDE_LABEL[session.challenger_choice]}\n**${opponentTag}:** ${SIDE_LABEL[session.opponent_choice]}\n**Coin:** ${SIDE_LABEL[session.last_coin_result]}\n\n💸 Lacagtii waxaa lagu shubay **Treasury**.`;
  return new EmbedBuilder().setTitle(title).setDescription(desc).setColor(correct ? 0x9b59b6 : 0xe74c3c).setFooter({ text: `Round ${session.round} · Nasiib Coinflip` });
}

function resultEmbed({ challengerTag, opponentTag, coinResult, winnerTag, reward, lucky }) {
  const lines = [
    `**Coin:** ${SIDE_LABEL[coinResult]}`,
    `**Winner:** ${winnerTag}`,
    `**Reward:** ${fmt(reward)} 🪙 Coins`,
  ];
  if (lucky) lines.push("", "🎁 **Bonus Reward**", `+${fmt(CF_LUCKY_BONUS)} Coins`);
  return new EmbedBuilder()
    .setTitle(lucky ? "💎 Lucky Coin! — 🏆 Coinflip Finished" : "🏆 Coinflip Finished")
    .setDescription(lines.join("\n"))
    .setColor(0x2ecc71)
    .setFooter({ text: `${challengerTag} vs ${opponentTag} · Nasiib Coinflip` });
}



function luckyCoinEmbed() {
  return new EmbedBuilder()
    .setTitle("✨ Lucky Coin Activated!")
    .setDescription("The coin started glowing...")
    .setColor(0xf39c12);
}


function flipFrameEmbed(text) {
  return new EmbedBuilder().setTitle(`🪙 ${text}`).setColor(0xf1c40f);
}

async function animateFlip(message) {
  const frames = ["Flipping...", "Still flipping...", "Almost there..."];
  for (const text of frames) {
    await message.edit({ embeds: [flipFrameEmbed(text)], components: [] }).catch(() => {});
    await sleep(600);
  }
}



function revealChoicesEmbed(session, challengerTag, opponentTag) {
  return new EmbedBuilder()
    .setTitle("🪙 Coinflip")
    .setDescription(
      `**${challengerTag}** chose ${SIDE_LABEL[session.challenger_choice]}\n` +
      `**${opponentTag}** chose ${SIDE_LABEL[session.opponent_choice]}\n` +
      `──────────────\n` +
      `Coin landed on...`
    )
    .setColor(0xf1c40f)
    .setFooter({ text: `Round ${session.round} · Nasiib Coinflip` });
}

function cashoutEmbed(session, challengerTag, opponentTag) {
  return new EmbedBuilder()
    .setTitle("🏁 Coinflip Ended")
    .setDescription(
      `Both players agreed to cash out.\nBoth bets have been refunded.\n\n` +
      `**${challengerTag}** 🆚 **${opponentTag}** — ${fmt(session.bet_amount)} Coins midkiiba waa la celiyay.`
    )
    .setColor(0x1abc9c)
    .setFooter({ text: "Nasiib Coinflip" });
}



function challengeEndedEmbed(kind, opponentTag) {
  const bodies = {
    timeout: `${opponentTag} ma aqbalin challenge-ka.\nLacagtii waa laguu celiyay.`,
    declined: `${opponentTag} way diideen challenge-ka.\nLacagtii waa laguu celiyay.`,
    insufficient_funds: `${opponentTag} ma haystaan Coins ku filan.\nLacagtii waa laguu celiyay.`,
  };
  return new EmbedBuilder().setTitle("⌛ Challenge Expired").setDescription(bodies[kind] || bodies.timeout).setColor(0x95a5a6);
}



async function registerSlashCommand(client) {
  const cmd = new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("PvP Coinflip — challenge another player")
    .addSubcommand((sub) =>
      sub
        .setName("challenge")
        .setDescription("Challenge another player to a coinflip")
        .addUserOption((o) => o.setName("opponent").setDescription("Qofka aad rabto in aad la ciyaarto").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("amount").setDescription(`Sharadka (${CF_MIN_BET}-${CF_MAX_BET})`).setRequired(true).setMinValue(CF_MIN_BET).setMaxValue(CF_MAX_BET)
        )
    );
  try {
    await client.application.commands.create(cmd.toJSON());
    console.log("[CF-PVP] /coinflip slash command registered.");
  } catch (e) {
    console.error("[CF-PVP] failed to register /coinflip:", e.message);
  }
}



async function handleChallengeCommand(interaction) {
  const challenger = interaction.user;
  const opponent = interaction.options.getUser("opponent", true);
  const amount = interaction.options.getInteger("amount", true);

  if (opponent.id === challenger.id) {
    return interaction.reply({ content: "❌ islama ciyaari kartid buddy.", flags: MessageFlags.Ephemeral });
  }
  if (opponent.bot) {
    return interaction.reply({ content: "❌ Hadii rabtid in ila ciyartid just !cf dheh.", flags: MessageFlags.Ephemeral });
  }
  if (amount < CF_MIN_BET || amount > CF_MAX_BET) {
    return interaction.reply({ content: `❌ Lacagta waa in ay u dhaxaysa **${fmt(CF_MIN_BET)}** ilaa **${fmt(CF_MAX_BET)}** Coins.`, flags: MessageFlags.Ephemeral });
  }
  if (await hasActiveSession(challenger.id)) {
    return interaction.reply({ content: "❌ Ciyaar kale ayaa ku jirta — dhammee ta hore.", flags: MessageFlags.Ephemeral });
  }
  if (await hasActiveSession(opponent.id)) {
    return interaction.reply({ content: `❌ **${opponent.username}** Qofkan ma ahan qof kale ma taqanid?.`, flags: MessageFlags.Ephemeral });
  }

  await ensurePlayerRow(challenger.id, interaction.member?.displayName || challenger.username);
  await ensurePlayerRow(opponent.id, opponent.username);



  const lock = await pool.query(
    `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`,
    [amount, challenger.id]
  );
  if (lock.rowCount === 0) {
    return interaction.reply({ content: `❌ Ma haysatid **${fmt(amount)} Coins** kugu filan.`, flags: MessageFlags.Ephemeral });
  }

  const now = Date.now();
  const ins = await pool.query(
    `INSERT INTO coinflip_sessions (guild_id, channel_id, challenger_id, opponent_id, bet_amount, status, created_at, phase_expires_at)
     VALUES ($1, $2, $3, $4, $5, 'pending_accept', $6, $7) RETURNING *`,
    [interaction.guildId, interaction.channelId, challenger.id, opponent.id, amount, now, now + CF_ACCEPT_TIMEOUT_MS]
  );
  const session = ins.rows[0];

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cf_accept_${session.id}`).setLabel("Aqbal").setEmoji("✅").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`cf_decline_${session.id}`).setLabel("Diid").setEmoji("❌").setStyle(ButtonStyle.Danger)
  );

  const reply = await interaction.reply({
    content: `<@${opponent.id}>`,
    embeds: [challengeEmbed(session, `<@${challenger.id}>`, `<@${opponent.id}>`)],
    components: [row],
    fetchReply: true,
  });
  await pool.query(`UPDATE coinflip_sessions SET message_id = $1 WHERE id = $2`, [reply.id, session.id]);
}



async function handleAccept(interaction, sessionId) {
  const outcome = await withLockedSession(sessionId, async (client, session) => {
    if (session.status !== "pending_accept") return { code: "stale" };
    if (interaction.user.id !== session.opponent_id) return { code: "not_opponent" };
    if (Date.now() > session.phase_expires_at) return { code: "expired" };

    const lock = await client.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 AND coins >= $1 RETURNING coins`,
      [session.bet_amount, session.opponent_id]
    );
    if (lock.rowCount === 0) {

      await creditPlayer(client, session.challenger_id, session.bet_amount);
      await logCoinflipTx(client, session.id, session.challenger_id, "coinflip_refund", session.bet_amount, "opponent had insufficient funds on accept");
      await client.query(`UPDATE coinflip_sessions SET status = 'cancelled' WHERE id = $1`, [session.id]);
      return { code: "insufficient_funds" };
    }

    const now = Date.now();
    const upd = await client.query(
      `UPDATE coinflip_sessions SET status = 'choosing', phase_expires_at = $1 WHERE id = $2 RETURNING *`,
      [now + CF_CHOOSE_TIMEOUT_MS, session.id]
    );
    return { code: "accepted", session: upd.rows[0] };
  });

  if (!outcome || outcome.code === "stale") {
    return interaction.reply({ content: "❌ Codsigan horey ayaa loo qaatay.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "not_opponent") {
    return interaction.reply({ content: "❌ Codsigan adiga kuuma socda.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "expired") {
    return interaction.reply({ content: "⌛ Codsigan wuu dhacay.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "insufficient_funds") {
    await interaction.update({
      embeds: [challengeEndedEmbed("insufficient_funds", `<@${interaction.user.id}>`)],
      components: [disabledRow(interaction.message.components[0])],
    });
    return;
  }

  const session = outcome.session;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cf_choose_xarash_${session.id}`).setLabel("Xarash").setEmoji("🪙").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`cf_choose_madax_${session.id}`).setLabel("Madax").setEmoji("👑").setStyle(ButtonStyle.Primary)
  );
  await interaction.update({
    embeds: [choosingEmbed(session, `<@${session.challenger_id}>`, `<@${session.opponent_id}>`)],
    components: [row],
  });
}

async function handleDecline(interaction, sessionId) {
  const outcome = await withLockedSession(sessionId, async (client, session) => {
    if (session.status !== "pending_accept") return { code: "stale" };
    if (interaction.user.id !== session.opponent_id && interaction.user.id !== session.challenger_id) return { code: "not_participant" };
    await creditPlayer(client, session.challenger_id, session.bet_amount);
    await logCoinflipTx(client, session.id, session.challenger_id, "coinflip_declined", session.bet_amount);
    await client.query(`UPDATE coinflip_sessions SET status = 'cancelled' WHERE id = $1`, [session.id]);
    return { code: "declined", session };
  });

  if (!outcome || outcome.code === "stale") {
    return interaction.reply({ content: "❌ Codsigan horey ayaa loo  qaatay.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "not_participant") {
    return interaction.reply({ content: "❌ Codsigan kuguma socda adiga.", flags: MessageFlags.Ephemeral });
  }
  await interaction.update({
    embeds: [challengeEndedEmbed("declined", `<@${outcome.session.opponent_id}>`)],
    components: [disabledRow(interaction.message.components[0])],
  });
}



async function handleChoose(interaction, sessionId, side) {
  const outcome = await withLockedSession(sessionId, async (client, session) => {
    if (session.status !== "choosing") return { code: "stale" };
    const isChallenger = interaction.user.id === session.challenger_id;
    const isOpponent = interaction.user.id === session.opponent_id;
    if (!isChallenger && !isOpponent) return { code: "not_participant" };

    const already = isChallenger ? session.challenger_choice : session.opponent_choice;
    if (already) return { code: "already_chosen" };

    const col = isChallenger ? "challenger_choice" : "opponent_choice";
    const upd = await client.query(
      `UPDATE coinflip_sessions SET ${col} = $1 WHERE id = $2 RETURNING *`,
      [side, session.id]
    );
    const updated = upd.rows[0];

    if (!updated.challenger_choice || !updated.opponent_choice) {
      return { code: "locked_in", session: updated };
    }


    return await resolveRound(client, updated);
  });

  if (!outcome || outcome.code === "stale") {
    return interaction.reply({ content: "❌ Round-kan horey ayaa loo qaatay.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "not_participant") {
    return interaction.reply({ content: "❌ Ciyaartan kuma jirtid.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "already_chosen") {
    return interaction.reply({ content: "✅ Horey ayaad u dooratay — sug qofka kale.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "locked_in") {
    return interaction.reply({ content: "✅ Locked in.", flags: MessageFlags.Ephemeral });
  }



  await interaction.reply({ content: "✅ Locked in.", flags: MessageFlags.Ephemeral });
  await publishRoundOutcome(interaction, outcome);
}




async function resolveRound(client, session) {
  const coinResult = SIDES[Math.floor(Math.random() * 2)];
  const challengerCorrect = session.challenger_choice === coinResult;
  const opponentCorrect = session.opponent_choice === coinResult;

  if (challengerCorrect === opponentCorrect) {
    if (challengerCorrect) {

      const upd = await client.query(
        `UPDATE coinflip_sessions
         SET status = 'tie_decision', last_coin_result = $1, challenger_decision = NULL, opponent_decision = NULL,
             phase_expires_at = $2
         WHERE id = $3 RETURNING *`,
        [coinResult, Date.now() + CF_DECISION_TIMEOUT_MS, session.id]
      );
      return { code: "tie_correct", session: upd.rows[0] };
    }

    await creditTreasury(client, session.bet_amount * 2);
    await client.query(
      `UPDATE coinflip_sessions SET status = 'finished', last_coin_result = $1 WHERE id = $2`,
      [coinResult, session.id]
    );
    await client.query(`UPDATE players SET coinflip_pvp_losses = coinflip_pvp_losses + 1, coinflip_pvp_played = coinflip_pvp_played + 1 WHERE discord_id = $1`, [session.challenger_id]);
    await client.query(`UPDATE players SET coinflip_pvp_losses = coinflip_pvp_losses + 1, coinflip_pvp_played = coinflip_pvp_played + 1 WHERE discord_id = $1`, [session.opponent_id]);
    return { code: "tie_wrong", session: { ...session, last_coin_result: coinResult } };
  }


  const winnerId = challengerCorrect ? session.challenger_id : session.opponent_id;
  const pot = session.bet_amount * 2;
  const houseCut = Math.floor((pot * CF_HOUSE_EDGE_PCT) / 100);
  const payout = pot - houseCut;

  await creditPlayer(client, winnerId, payout);
  await creditTreasury(client, houseCut);

  let luckyBonus = 0;
  if (Math.random() < CF_LUCKY_CHANCE) {
    luckyBonus = await payFromTreasury(client, CF_LUCKY_BONUS);
    if (luckyBonus > 0) await creditPlayer(client, winnerId, luckyBonus);
  }

  const loserId = winnerId === session.challenger_id ? session.opponent_id : session.challenger_id;
  await client.query(
    `UPDATE players SET coinflip_pvp_wins = coinflip_pvp_wins + 1, coinflip_pvp_played = coinflip_pvp_played + 1, coinflip_pvp_earned = coinflip_pvp_earned + $1 WHERE discord_id = $2`,
    [payout + luckyBonus, winnerId]
  );
  await client.query(`UPDATE players SET coinflip_pvp_losses = coinflip_pvp_losses + 1, coinflip_pvp_played = coinflip_pvp_played + 1 WHERE discord_id = $1`, [loserId]);

  await client.query(
    `UPDATE coinflip_sessions SET status = 'finished', last_coin_result = $1 WHERE id = $2`,
    [coinResult, session.id]
  );

  return { code: "decisive", session: { ...session, last_coin_result: coinResult }, winnerId, payout, luckyBonus };
}








async function publishRoundOutcome(interaction, outcome) {
  const session = outcome.session;
  const challengerTag = `<@${session.challenger_id}>`;
  const opponentTag = `<@${session.opponent_id}>`;



  const priorRow = interaction.message.components[0];



  await animateFlip(interaction.message);
  await interaction.message.edit({ embeds: [revealChoicesEmbed(session, challengerTag, opponentTag)], components: [] }).catch(() => {});
  await sleep(1000);

  if (outcome.code === "tie_correct") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cf_reflip_${session.id}`).setLabel("Reflip").setEmoji("🔄").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`cf_cashout_${session.id}`).setLabel("Cash Out").setEmoji("💰").setStyle(ButtonStyle.Success)
    );
    await interaction.message.edit({ embeds: [tieEmbed(session, challengerTag, opponentTag, true)], components: [row] });
    return;
  }

  if (outcome.code === "tie_wrong") {
    await interaction.message.edit({
      embeds: [tieEmbed(session, challengerTag, opponentTag, false)],
      components: priorRow ? [disabledRow(priorRow)] : [],
    });
    return;
  }


  if (outcome.luckyBonus > 0) {
    await interaction.message.edit({ embeds: [luckyCoinEmbed()], components: [] }).catch(() => {});
    await sleep(1200);
  }
  const winnerTag = `<@${outcome.winnerId}>`;
  await interaction.message.edit({
    embeds: [
      resultEmbed({
        challengerTag,
        opponentTag,
        coinResult: session.last_coin_result,
        winnerTag,
        reward: outcome.payout + outcome.luckyBonus,
        lucky: outcome.luckyBonus > 0,
      }),
    ],
    components: priorRow ? [disabledRow(priorRow)] : [],
  });
}



async function handleDecision(interaction, sessionId, decision) {
  const outcome = await withLockedSession(sessionId, async (client, session) => {
    if (session.status !== "tie_decision") return { code: "stale" };
    const isChallenger = interaction.user.id === session.challenger_id;
    const isOpponent = interaction.user.id === session.opponent_id;
    if (!isChallenger && !isOpponent) return { code: "not_participant" };

    const already = isChallenger ? session.challenger_decision : session.opponent_decision;
    if (already) return { code: "already_decided" };

    const col = isChallenger ? "challenger_decision" : "opponent_decision";
    const upd = await client.query(`UPDATE coinflip_sessions SET ${col} = $1 WHERE id = $2 RETURNING *`, [decision, session.id]);
    const updated = upd.rows[0];

    if (!updated.challenger_decision || !updated.opponent_decision) {
      return { code: "waiting", session: updated };
    }

    return await resolveDecision(client, updated);
  });

  if (!outcome || outcome.code === "stale") {
    return interaction.reply({ content: "❌ Ciyaartan horey ayaa loo qaatay.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "not_participant") {
    return interaction.reply({ content: "❌ Ciyaartan kuma jirtid.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "already_decided") {
    return interaction.reply({ content: "✅ Horey ayaad u samaysay doorasho, sug qofka kale.", flags: MessageFlags.Ephemeral });
  }
  if (outcome.code === "waiting") {
    return interaction.reply({ content: `✅ Waxaad dooratay **${decision === "reflip" ? "Reflip" : "Cash Out"}** — sug qofka kale (30s).`, flags: MessageFlags.Ephemeral });
  }

  await publishDecisionOutcome(interaction, outcome);
}


async function resolveDecision(client, session) {
  if (session.challenger_decision === "reflip" && session.opponent_decision === "reflip") {
    const upd = await client.query(
      `UPDATE coinflip_sessions
       SET status = 'choosing', round = round + 1, challenger_choice = NULL, opponent_choice = NULL,
           challenger_decision = NULL, opponent_decision = NULL, phase_expires_at = $1
       WHERE id = $2 RETURNING *`,
      [Date.now() + CF_CHOOSE_TIMEOUT_MS, session.id]
    );
    return { code: "reflip", session: upd.rows[0] };
  }


  await creditPlayer(client, session.challenger_id, session.bet_amount);
  await creditPlayer(client, session.opponent_id, session.bet_amount);
  await logCoinflipTx(client, session.id, session.challenger_id, "coinflip_cashout", session.bet_amount);
  await logCoinflipTx(client, session.id, session.opponent_id, "coinflip_cashout", session.bet_amount);
  await client.query(`UPDATE players SET coinflip_pvp_played = coinflip_pvp_played + 1 WHERE discord_id = $1`, [session.challenger_id]);
  await client.query(`UPDATE players SET coinflip_pvp_played = coinflip_pvp_played + 1 WHERE discord_id = $1`, [session.opponent_id]);
  const upd = await client.query(`UPDATE coinflip_sessions SET status = 'finished' WHERE id = $1 RETURNING *`, [session.id]);
  return { code: "cashout", session: upd.rows[0] };
}




async function publishDecisionOutcome(interaction, outcome) {
  const session = outcome.session;
  const challengerTag = `<@${session.challenger_id}>`;
  const opponentTag = `<@${session.opponent_id}>`;

  if (outcome.code === "reflip") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`cf_choose_xarash_${session.id}`).setLabel("Xarash").setEmoji("🪙").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`cf_choose_madax_${session.id}`).setLabel("Madax").setEmoji("👑").setStyle(ButtonStyle.Primary)
    );
    await interaction.update({ embeds: [choosingEmbed(session, challengerTag, opponentTag)], components: [row] });
    return;
  }

  await interaction.update({
    embeds: [cashoutEmbed(session, challengerTag, opponentTag)],
    components: [disabledRow(interaction.message.components[0])],
  });
}



async function sweepStaleSessions(client) {
  try {
    const now = Date.now();


    const expiredChallenges = await pool.query(
      `SELECT * FROM coinflip_sessions WHERE status = 'pending_accept' AND phase_expires_at < $1 FOR UPDATE SKIP LOCKED`,
      [now]
    );
    for (const session of expiredChallenges.rows) {
      await withLockedSession(session.id, async (c, s) => {
        if (s.status !== "pending_accept") return;
        await creditPlayer(c, s.challenger_id, s.bet_amount);
        await logCoinflipTx(c, s.id, s.challenger_id, "coinflip_timeout", s.bet_amount, "opponent never accepted");
        await c.query(`UPDATE coinflip_sessions SET status = 'cancelled' WHERE id = $1`, [s.id]);
      });
      await tryEditMessage(client, session, challengeEndedEmbed("timeout", `<@${session.opponent_id}>`));
    }


    const staleChoosing = await pool.query(
      `SELECT * FROM coinflip_sessions WHERE status = 'choosing' AND phase_expires_at < $1 FOR UPDATE SKIP LOCKED`,
      [now]
    );
    for (const session of staleChoosing.rows) {
      await withLockedSession(session.id, async (c, s) => {
        if (s.status !== "choosing") return;
        await creditPlayer(c, s.challenger_id, s.bet_amount);
        await creditPlayer(c, s.opponent_id, s.bet_amount);
        await logCoinflipTx(c, s.id, s.challenger_id, "coinflip_timeout", s.bet_amount, "no choice locked in before deadline");
        await logCoinflipTx(c, s.id, s.opponent_id, "coinflip_timeout", s.bet_amount, "no choice locked in before deadline");
        await c.query(`UPDATE coinflip_sessions SET status = 'cancelled' WHERE id = $1`, [s.id]);
      });
      await tryEditMessage(
        client,
        session,
        new EmbedBuilder()
          .setTitle("⌛ Challenge Expired")
          .setDescription("Labadiinba ma aydaan dooran wax.\nLacagtiina waa la celiyay.")
          .setColor(0x95a5a6)
      );
    }


    const staleDecisions = await pool.query(
      `SELECT * FROM coinflip_sessions WHERE status = 'tie_decision' AND phase_expires_at < $1 FOR UPDATE SKIP LOCKED`,
      [now]
    );
    for (const session of staleDecisions.rows) {
      const outcome = await withLockedSession(session.id, async (c, s) => {
        if (s.status !== "tie_decision") return null;
        if (!s.challenger_decision) await c.query(`UPDATE coinflip_sessions SET challenger_decision = 'cashout' WHERE id = $1`, [s.id]);
        if (!s.opponent_decision) await c.query(`UPDATE coinflip_sessions SET opponent_decision = 'cashout' WHERE id = $1`, [s.id]);
        const refreshed = await c.query(`SELECT * FROM coinflip_sessions WHERE id = $1`, [s.id]);
        return await resolveDecision(c, refreshed.rows[0]);
      });
      if (outcome) {
        const embed = outcome.code === "reflip"
          ? choosingEmbed(outcome.session, `<@${outcome.session.challenger_id}>`, `<@${outcome.session.opponent_id}>`)
          : cashoutEmbed(outcome.session, `<@${outcome.session.challenger_id}>`, `<@${outcome.session.opponent_id}>`);
        await tryEditMessage(client, session, embed, outcome.code === "reflip" ? [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`cf_choose_xarash_${session.id}`).setLabel("Xarash").setEmoji("🪙").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`cf_choose_madax_${session.id}`).setLabel("Madax").setEmoji("👑").setStyle(ButtonStyle.Primary)
          ),
        ] : []);
      }
    }
  } catch (e) {
    console.error("[CF-PVP] sweepStaleSessions error:", e.message);
  }
}

async function tryEditMessage(client, session, embed, components = []) {
  try {
    if (!session.message_id) return;
    const channel = await client.channels.fetch(session.channel_id).catch(() => null);
    if (!channel) return;
    const message = await channel.messages.fetch(session.message_id).catch(() => null);
    if (!message) return;
    await message.edit({ embeds: [embed], components }).catch(() => {});
  } catch {  }
}



export async function setupCoinflipPvp(client) {
  await ensureCoinflipTables();

  client.once("clientReady", () => {
    registerSlashCommand(client).catch((e) => console.error("[CF-PVP] slash command registration failed:", e.message));
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === "coinflip") {
        if (interaction.options.getSubcommand() === "challenge") {
          await handleChallengeCommand(interaction);
        }
        return;
      }
      if (!interaction.isButton() || !interaction.customId.startsWith("cf_")) return;

      const parts = interaction.customId.split("_");
      if (parts[1] === "accept") return handleAccept(interaction, Number(parts[2]));
      if (parts[1] === "decline") return handleDecline(interaction, Number(parts[2]));
      if (parts[1] === "choose") return handleChoose(interaction, Number(parts[3]), parts[2]);
      if (parts[1] === "reflip") return handleDecision(interaction, Number(parts[2]), "reflip");
      if (parts[1] === "cashout") return handleDecision(interaction, Number(parts[2]), "cashout");
    } catch (err) {
      console.error("[CF-PVP] interactionCreate error:", err);
    }
  });

  setInterval(() => {
    sweepStaleSessions(client).catch((e) => console.error("[CF-PVP] sweep error:", e.message));
  }, CF_SWEEP_INTERVAL_MS);

  console.log("[CF-PVP] ✅ PvP Coinflip is online.");
}
