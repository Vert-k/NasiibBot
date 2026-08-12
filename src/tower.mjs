import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const EM = {
  LOCKED: "<:locked:1513129973425242133>",

  // gali emojiska meesha saveta ah ka muuqdo)
  SAFE: [
    "<:dhagax1:1513129949806989454>",  // col 0
    "<:dhagax2:1513129953737183432>",  // col 1
    "<:dhagax3:1513129957595938826>",  // col 2
    "<:dhagax4:1513129961660219392>",  // col 3
  ],

  // emojiska markuu qofka dhameeyo iyo hadii uu cashout dhaho
  SAFE_REVEAL: [
    "<:dhagax1_:1513129935194292286>",  // col 0
    "<:dhagax2_:1513129939392659598>",  // col 1
    "<:dhagax3_:1513129942315962370>",  // col 2
    "<:dhagax4_:1513129945847697530>",  // col 3
  ],

  MINE: "<:miino:1513129965351079976>",
  BOOM: "<:qarax:1513129968954118316>",
};

// emojiska qaybta hoose ka muuqda
const BTN_EMOJI_OBJECTS = [
  { id: "1513129949806989454", name: "dhagax1" },
  { id: "1513129953737183432", name: "dhagax2" },
  { id: "1513129957595938826", name: "dhagax3" },
  { id: "1513129961660219392", name: "dhagax4" },
];

// -----------------------------------------------------------------------------
// Payout formula
// -----------------------------------------------------------------------------
// qaaciidada faaiidada -- bilawga faham, gadaal faaido kasii.
// qaaciidada: bet * (1 + 0.10 * step)^2.0
//   step 1: x1.21 | step 2: x1.44 | step 3: x1.69
//   step 4: x1.96 | step 5: x2.25 | step 6: x2.56
//   step 7: x2.89 | step 8: x3.24
function getPayout(bet, step) {
  if (step <= 0) return bet;
  return Math.floor(bet * Math.pow(1 + 0.10 * step, 2.0));
}

// -----------------------------------------------------------------------------
// State maps
// -----------------------------------------------------------------------------
export const activeTowerGames = new Map(); // userId -> game object
const towerCooldowns          = new Map(); // userId -> timestamp of last start
const playAgainLocks          = new Set(); // userId set -- prevents double-tap on Play Again

const COOLDOWN_MS   = 30_000; // inta u dhaxaysa 2da game
const INACTIVITY_MS = 60_000; // hadii uu qofka intaas ku dheeli wayo 60s auto kick
const MAX_SESSION   = 20;     // max Play Again presses per session

const sessions = new Map(); // userId -> { count, net }

function getSession(userId) {
  if (!sessions.has(userId)) sessions.set(userId, { count: 0, net: 0 });
  return sessions.get(userId);
}

// -----------------------------------------------------------------------------
function generateGrid() {
  
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 4));
}

function buildActiveGridText(game) {
  const lines = [];

  const LOCKED_ROW = `${EM.LOCKED}\u2800\u2800\u2800${EM.LOCKED}\u2800\u2800\u2800${EM.LOCKED}\u2800\u2800\u2800${EM.LOCKED}`;
  for (let row = 7; row >= 0; row--) {
    if (row >= game.currentStep) {
      lines.push(LOCKED_ROW);
    } else {
      const mineCol = game.grid[row];
      const cells = Array.from({ length: 4 }, (_, c) =>
        c === mineCol ? EM.MINE : EM.SAFE[c]
      );
      lines.push(cells.join("\u2800\u2800\u2800"));
    }
  }
  return lines.join("\n");
}

function buildLossGridText(game, hitRow, hitCol) {
  const lines = [];
  for (let row = 7; row >= 0; row--) {
    const mineCol  = game.grid[row];
    const safeEmoj = row < hitRow ? EM.SAFE : EM.SAFE_REVEAL;
    const cells = Array.from({ length: 4 }, (_, c) => {
      if (row === hitRow && c === hitCol) return EM.BOOM;
      if (c === mineCol)                  return EM.MINE;
      return safeEmoj[c];
    });
    lines.push(cells.join("\u2800\u2800\u2800"));
  }
  return lines.join("\n");
}

function buildCashoutGridText(game) {
  const lines = [];
  for (let row = 7; row >= 0; row--) {
    const mineCol  = game.grid[row];
    const safeEmoj = row < game.currentStep ? EM.SAFE : EM.SAFE_REVEAL;
    const cells = Array.from({ length: 4 }, (_, c) =>
      c === mineCol ? EM.MINE : safeEmoj[c]
    );
    lines.push(cells.join("\u2800\u2800\u2800"));
  }
  return lines.join("\n");
}


const V2_FLAG = 1 << 15;


function makeColumnButtons(userId, disabled = false) {
  return BTN_EMOJI_OBJECTS.map((emojiObj, idx) =>
    new ButtonBuilder()
      .setCustomId(`twrv2_col_${idx}_${userId}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji({ id: emojiObj.id, name: emojiObj.name })
      .setDisabled(disabled)
  );
}

function makeCashoutButton(userId, disabled = false) {
  return new ButtonBuilder()
    .setCustomId(`twrv2_cashout_${userId}`)
    .setLabel("Cashout")
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled);
}

function buildActiveMessage(game) {
  const currentPayout = getPayout(game.bet, game.currentStep);
  const nextPayout    = getPayout(game.bet, game.currentStep + 1);
  const isStep0       = game.currentStep === 0;
  const gridText      = buildActiveGridText(game);

  const descText = isStep0
    ? `Lacagta taala hada | **${currentPayout.toLocaleString()} Coins**\nTabo column si aad u qaadatid | **${nextPayout.toLocaleString()} Coins**`
    : `La bax **${currentPayout.toLocaleString()} Coins**?\nAma column taabo si ula baxdid **${nextPayout.toLocaleString()} Coins**`;

  const colRow     = new ActionRowBuilder().addComponents(...makeColumnButtons(game.userId));
  const cashoutRow = new ActionRowBuilder().addComponents(makeCashoutButton(game.userId, isStep0));

  return {
    flags: V2_FLAG,
    components: [{
      type:         17,
      accent_color: isStep0 ? 0x2c3e50 : 0x27ae60,
      components: [
        { type: 10, content: `## Towerka Hantida | Bet ${game.bet.toLocaleString()}` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: descText },
        { type: 10, content: gridText },
        colRow.toJSON(),
        cashoutRow.toJSON(),
      ],
    }],
  };
}


function buildLossMessage(game, hitRow, hitCol, newBalance) {
  const sess     = getSession(game.userId);
  const netStr   = sess.net >= 0 ? `+${sess.net.toLocaleString()}` : `${sess.net.toLocaleString()}`;
  const gridText = buildLossGridText(game, hitRow, hitCol);

  const playAgainBtn = new ButtonBuilder()
    .setCustomId(`twrv2_again_${game.userId}_${game.bet}`)
    .setLabel(`Play Again ${sess.count}/${MAX_SESSION}`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(sess.count >= MAX_SESSION);

  const sessionBtn = new ButtonBuilder()
    .setCustomId(`twrv2_noop_${game.userId}`)
    .setLabel(`Session: ${netStr}`)
    .setStyle(ButtonStyle.Danger)
    .setDisabled(true);

  const doneBtn = new ButtonBuilder()
    .setCustomId(`twrv2_done_${game.userId}`)
    .setLabel("Done")
    .setStyle(ButtonStyle.Secondary);

  return {
    flags: V2_FLAG,
    components: [{
      type:         17,
      accent_color: 0xe74c3c,
      components: [
        { type: 10, content: `## Towerka Hantida | You Lose ${game.bet.toLocaleString()}` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: `Balancegaaga hada waa **${newBalance.toLocaleString()} Coins**` },
        { type: 10, content: gridText },
        new ActionRowBuilder().addComponents(playAgainBtn, sessionBtn).toJSON(),
        new ActionRowBuilder().addComponents(doneBtn).toJSON(),
      ],
    }],
  };
}


function buildCashoutMessage(game, payout, newBalance) {
  const sess   = getSession(game.userId);
  const netStr = sess.net >= 0 ? `+${sess.net.toLocaleString()}` : `${sess.net.toLocaleString()}`;

  const playAgainBtn = new ButtonBuilder()
    .setCustomId(`twrv2_again_${game.userId}_${game.bet}`)
    .setLabel(`Play Again ${sess.count}/${MAX_SESSION}`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(sess.count >= MAX_SESSION);

  const sessionBtn = new ButtonBuilder()
    .setCustomId(`twrv2_noop_${game.userId}`)
    .setLabel(`Session: ${netStr}`)
    .setStyle(ButtonStyle.Success)
    .setDisabled(true);

  const doneBtn = new ButtonBuilder()
    .setCustomId(`twrv2_done_${game.userId}`)
    .setLabel("Done")
    .setStyle(ButtonStyle.Secondary);

  return {
    flags: V2_FLAG,
    components: [{
      type:         17,
      accent_color: 0xf39c12,
      components: [
        { type: 10, content: `## \u{1F3C6} Tower of Treasure | +${payout.toLocaleString()} Coins` },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: `Waxaa gaartay ilaa **step ${game.currentStep}/8** | Balance: **${newBalance.toLocaleString()} Coins**` },
        { type: 10, content: buildCashoutGridText(game) },
        new ActionRowBuilder().addComponents(playAgainBtn, sessionBtn).toJSON(),
        new ActionRowBuilder().addComponents(doneBtn).toJSON(),
      ],
    }],
  };
}

// Uhhhh Uhhh lol-------
function resetTimer(game, channel, storage) {
  if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
  game.inactivityTimer = setTimeout(async () => {
    if (!activeTowerGames.has(game.userId)) return;
    activeTowerGames.delete(game.userId);
    await storage.updateTowerStats(game.userId, game.currentStep, 0).catch(() => {});
    if (trackQuest) trackQuest(game.userId, "play_tower", 1).catch(() => {});
    try {
      await channel.send({
        content: `\u23f1 <@${game.userId}> tower game waa la joojiyey . Bet **${game.bet.toLocaleString()} Coins** waa khasaartay.`,
      });
    } catch { /* inta channel gali */ }
  }, INACTIVITY_MS);
}

// -----------------------------------------------
export function setupTowerSystem(client, storage, trackQuest) {

  // -- messageCreate ----------------------------------------------------------
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith("!tower")) return;

    const userId = message.author.id;
    const rest   = message.content.slice("!tower".length).trim();
    const args   = rest.split(/\s+/).filter(Boolean);

    // -- 1. Input validation --------------------------------------------------
    const rawBet = parseInt((args[0] ?? "").replace(/,/g, ""), 10);
    if (!args[0] || isNaN(rawBet) || rawBet < 10) {
      await message.reply("tirada ugu yar ee dhigan kartid waa 10 coins");
      return;
    }
    if (rawBet > 10_000) {
      await message.reply("inta ugu badan ee dhigan kartid waa 10,000");
      return;
    }
    const bet = rawBet;

    // -- 2. Command cooldown (30 s) -------------------------------------------
    const now       = Date.now();
    const lastUsed  = towerCooldowns.get(userId) ?? 0;
    const remaining = COOLDOWN_MS - (now - lastUsed);
    if (remaining > 0) {
      const secs = Math.ceil(remaining / 1000);
      await message.reply(`\u23f1 Sug **${secs}s** ka hor inta aadan tower cusub bilaabin.`);
      return;
    }

    // -- 3. Restriction check -------------------------------------------------
    const restriction = await storage.isPlayerRestricted(userId);
    if (restriction.banned || restriction.muted || restriction.onHold) {
      await message.reply("\U0001F6AB Ma ciyaari kartid hadda.");
      return;
    }

    // -- 4. Block concurrent game ---------------------------------------------
    if (activeTowerGames.has(userId)) {
      await message.reply("\u26a0\ufe0f waxaa horey kuugu socda game kale dhamee taas marka hore.");
      return;
    }

    // -- 5. Balance check + immediate deduction -------------------------------
    let player = await storage.getPlayer(userId);
    if (!player) {
      player = await storage.createPlayer({
        discordId: userId,
        username:  message.member?.displayName || message.author.username,
      });
    }
    if ((player.coins ?? 0) < bet) {
      await message.reply(`ma haysatid coins ku filan ciyaartaan. Waxaad haysaa **${(player.coins ?? 0).toLocaleString()} Coins**.`);
      return;
    }

    // Uhh qofka lacag ka jar inta uusan dhigan
    await storage.spendCoins(userId, bet);

    
    towerCooldowns.set(userId, now);

    const sess = getSession(userId);
    sess.count += 1;
    sess.net   -= bet;

    // -- 6. Create game state -------------------------------------------------
    const game = {
      userId,
      channelId:       message.channel.id,
      bet,
      currentStep:     0,
      grid:            generateGrid(),
      processing:      false,
      inactivityTimer: null,
      messageId:       null,
    };
    activeTowerGames.set(userId, game);

    const msg = await message.reply(buildActiveMessage(game));
    game.messageId = msg.id;
    resetTimer(game, message.channel, storage);
  });

  // -- interactionCreate ------------------------------------------------------
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    const { customId } = interaction;
    if (!customId.startsWith("twrv2_")) return;

    
    if (customId.startsWith("twrv2_col_")) {
      const parts  = customId.split("_"); // ["twrv2", "col", colIdx, userId]
      const colIdx = parseInt(parts[2], 10);
      const userId = parts[3];

      if (interaction.user.id !== userId) {
        await interaction.reply({ content: "\u274c ciyaartan adi ma lihid.", ephemeral: true });
        return;
      }

      const game = activeTowerGames.get(userId);
      if (!game) {
        await interaction.reply({ content: "\u274c gamekan ma jiro hada waxaa laga yaabaa inuu dhamaaday.", ephemeral: true });
        return;
      }

      // Mutex: block double-taps
      if (game.processing) return;
      game.processing = true;

      try {
        if (game.inactivityTimer) clearTimeout(game.inactivityTimer);

        const mineCol = game.grid[game.currentStep];

        if (colIdx === mineCol) {
       
          activeTowerGames.delete(userId);
          const player = await storage.getPlayer(userId);
          const newBal = player?.coins ?? 0;
          await storage.updateTowerStats(userId, game.currentStep, 0).catch(() => {});
          if (trackQuest) trackQuest(userId, "play_tower", 1).catch(() => {});
          await interaction.update(buildLossMessage(game, game.currentStep, colIdx, newBal));

        } else {
        
          game.currentStep += 1;

          if (game.currentStep >= 8) {
            // All 8 rows cleared -- auto-cashout
            const payout  = getPayout(game.bet, 8);
            activeTowerGames.delete(userId);
            const updated = await storage.addCoins(userId, payout);
            const sess    = getSession(userId);
            sess.net     += payout;
            await storage.updateTowerStats(userId, 8, 0).catch(() => {});
            if (trackQuest) trackQuest(userId, "play_tower", 1).catch(() => {});
            await interaction.update(buildCashoutMessage(game, payout, updated.coins));
          } else {
            // Continue -- show updated grid with newly cleared row revealed
            resetTimer(game, interaction.channel, storage);
            await interaction.update(buildActiveMessage(game));
          }
        }
      } catch (err) {
        console.error("[TOWER] column handler error:", err);
        activeTowerGames.delete(userId);
      } finally {
        if (game) game.processing = false;
      }
      return;
    }

    // -- Cashout --------------------------------------------------------------
    if (customId.startsWith("twrv2_cashout_")) {
      const userId = customId.slice("twrv2_cashout_".length);

      if (interaction.user.id !== userId) {
        await interaction.reply({ content: "\u274c Ciyaartan adiga ma lihid.", ephemeral: true });
        return;
      }

      const game = activeTowerGames.get(userId);
      if (!game) {
        await interaction.reply({ content: "\u274c Game lama helin.", ephemeral: true });
        return;
      }
      if (game.currentStep === 0) {
        await interaction.reply({ content: "\u274c Ugu yaraan hal step gaar ka hor cashout.", ephemeral: true });
        return;
      }

      if (game.processing) return;
      game.processing = true;

      try {
        if (game.inactivityTimer) clearTimeout(game.inactivityTimer);
        activeTowerGames.delete(userId);

        const payout  = getPayout(game.bet, game.currentStep);
        const updated = await storage.addCoins(userId, payout);
        const sess    = getSession(userId);
        sess.net     += payout;
        await storage.updateTowerStats(userId, game.currentStep, 0).catch(() => {});
        if (trackQuest) trackQuest(userId, "play_tower", 1).catch(() => {});
        await interaction.update(buildCashoutMessage(game, payout, updated.coins));
      } catch (err) {
        console.error("[TOWER] cashout handler error:", err);
      } finally {
        if (game) game.processing = false;
      }
      return;
    }

    // -- Play Again -----------------------------------------------------------
    if (customId.startsWith("twrv2_again_")) {
      // format: twrv2_again_<userId>_<bet>
      const inner          = customId.slice("twrv2_again_".length);
      const lastUnderscore = inner.lastIndexOf("_");
      const userId         = inner.slice(0, lastUnderscore);
      const bet            = parseInt(inner.slice(lastUnderscore + 1), 10);

      if (interaction.user.id !== userId) {
        await interaction.reply({ content: "\u274c Ciyaartan adiga ma lihid.", ephemeral: true });
        return;
      }

      if (playAgainLocks.has(userId)) return;
      playAgainLocks.add(userId);

      try {
        const sess = getSession(userId);
        if (sess.count >= MAX_SESSION) {
          await interaction.reply({ content: `\u274c Session limit ayaa gaartay (${MAX_SESSION} ciyaar).`, ephemeral: true });
          return;
        }
        if (activeTowerGames.has(userId)) {
          await interaction.reply({ content: "\u26a0\ufe0f Waxaad jirta ciyaar wali u furan!", ephemeral: true });
          return;
        }

        let player = await storage.getPlayer(userId);
        if (!player) {
          player = await storage.createPlayer({ discordId: userId, username: interaction.user.username });
        }
        if ((player.coins ?? 0) < bet) {
          await interaction.reply({
            content: `ma haysatid coins ku filan ciyaartaan. Waxaad haysaa **${(player.coins ?? 0).toLocaleString()} Coins**.`,
            ephemeral: true,
          });
          return;
        }

        await storage.spendCoins(userId, bet);
        sess.count += 1;
        sess.net   -= bet;

        const game = {
          userId,
          channelId:       interaction.channel.id,
          bet,
          currentStep:     0,
          grid:            generateGrid(),
          processing:      false,
          inactivityTimer: null,
          messageId:       interaction.message.id,
        };
        activeTowerGames.set(userId, game);

        await interaction.update(buildActiveMessage(game));
        resetTimer(game, interaction.channel, storage);
      } catch (err) {
        console.error("[TOWER] play-again handler error:", err);
      } finally {
        playAgainLocks.delete(userId);
      }
      return;
    }

    // -- Done -----------------------------------------------------------------
    if (customId.startsWith("twrv2_done_")) {
      const userId = customId.slice("twrv2_done_".length);

      if (interaction.user.id !== userId) {
        await interaction.reply({ content: "\u274c Ciyaartan adiga ma lihid.", ephemeral: true });
        return;
      }

      sessions.delete(userId);

      await interaction.update({
        flags: V2_FLAG,
        components: [{
          type:         17,
          accent_color: 0x95a5a6,
          components: [{ type: 10, content: "\u2705 Tower game waa la xiray." }],
        }],
      });
      return;
    }
  });
}