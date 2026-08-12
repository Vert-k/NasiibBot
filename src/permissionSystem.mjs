














import pg from "pg";
import {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
} from "discord.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});



const PREFIX = "!";
const GAME_COMMANDS = new Set([
  "cf", "slots", "duel", "miino", "q", "sheeko", "tower", "fti", "wallet", "p"
]);
const ECON_COMMANDS = new Set([
  "invest", "bank", "withdraw", "deposit", "myinvestments",
  "invlb", "rich", "season", "wallet", "p", "give"
]);
const WARNING_COOLDOWN_MS = 8_000;
const warnCooldowns = new Map();

const settingsPanels = new Map();



const SETTINGS_PANEL_TTL = 10 * 60 * 1000;



let disabledChannels = new Set();
let gameChannels     = new Set();
let econChannels     = new Set();
let disabledCmds     = new Set();
let cacheReady       = false;

export const chatDropDisabled = new Set();
export const vcDropDisabled   = new Set();

async function loadCache() {
  try {
    const [dc, gc, ec, dCmd] = await Promise.all([
      pool.query("SELECT channel_id FROM disabled_channels"),
      pool.query("SELECT channel_id FROM game_channels"),
      pool.query("SELECT channel_id FROM econ_channels"),
      pool.query("SELECT command FROM disabled_commands"),
    ]);
    disabledChannels = new Set(dc.rows.map(r => r.channel_id));
    gameChannels     = new Set(gc.rows.map(r => r.channel_id));
    econChannels     = new Set(ec.rows.map(r => r.channel_id));
    disabledCmds     = new Set(dCmd.rows.map(r => r.command));

    const [cdrop, vcdrop] = await Promise.all([
      pool.query("SELECT channel_id FROM drop_disabled_channels"),
      pool.query("SELECT channel_id, enabled FROM vc_drop_channels"),
    ]);
    chatDropDisabled.clear();
    for (const r of cdrop.rows) chatDropDisabled.add(r.channel_id);


    vcDropDisabled.clear();
    for (const r of vcdrop.rows) {
      if (r.enabled === false) vcDropDisabled.add(r.channel_id);
    }

    cacheReady = true;
  } catch (err) {
    console.error("[PERM] Cache load error:", err.message);
  }
}



async function initTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS disabled_channels (channel_id TEXT PRIMARY KEY);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS game_channels (channel_id TEXT PRIMARY KEY);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS econ_channels (channel_id TEXT PRIMARY KEY);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS disabled_commands (command TEXT PRIMARY KEY);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS chat_drop_channels (
      channel_id TEXT PRIMARY KEY,
      guild_id   TEXT NOT NULL,
      enabled    BOOLEAN NOT NULL DEFAULT true
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS vc_drop_channels (
      channel_id TEXT PRIMARY KEY,
      guild_id   TEXT NOT NULL,
      enabled    BOOLEAN NOT NULL DEFAULT true
    )`);
    console.log("[PERM] ✅ Permission tables ready.");
  } catch (err) {
    console.error("[PERM] Table init error:", err.message);
  }
}



function canWarn(channelId) {
  const last = warnCooldowns.get(channelId);
  if (!last || Date.now() - last >= WARNING_COOLDOWN_MS) {
    warnCooldowns.set(channelId, Date.now());
    return true;
  }
  return false;
}

function makeEmbed(description, color = 0xe74c3c) {
  return new EmbedBuilder().setDescription(description).setColor(color);
}

function isAdmin(member) {
  return member?.permissions?.has(PermissionsBitField.Flags.Administrator) === true;
}


export function isChatDropEnabled(channelId) {
  return !chatDropDisabled.has(channelId);
}



export function isVcDropEnabled(channelId) {
  return !vcDropDisabled.has(channelId);
}



function buildSettingsMainEmbed(member) {
  return new EmbedBuilder()
    .setTitle("⚙️  Admin Configuration")
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .setDescription(
      "Halkan waxaa si **easily** ah ugu maamuli kartaa qaabka uu **Nasiib** serverkaaga ugu dhaqmi lahaa.\n\n" +
      "Dooro mid ka mid ah xulashooyinka hoose si aad u bilowdo:"
    )
    .addFields(
      { name: "💬 Chat Drops",    value: "Channelska uu botka ku soo diro drops",      inline: true },
      { name: "🔊 VC Drops",      value: "Voice channels uu botka ku soo diro drop",              inline: true },
      { name: "\u200B",           value: "\u200B",                                           inline: true },
      { name: "🔧 Configurations", value: "Nasiib ka xir ama u fur channels gaar ah",      inline: true },
      { name: "🎮 Games Only",    value: "Channels kaliya loogu talo galay nasiib games",       inline: true },
      { name: "💰 Economy Only",  value: "Channels kaliya loogu talo galay economics",      inline: true },
    )
    .setColor(0x5865f2)
    .setFooter({ text: "Nasiib Admin Panel · Settings" })
    .setTimestamp();
}

function buildSettingsMainRows(userId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings_chatdrops_${userId}`)
      .setLabel("💬 Chat Drops")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`settings_vcdrops_${userId}`)
      .setLabel("🔊 VC Drops")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`settings_config_${userId}`)
      .setLabel("🔧 Configurations")
      .setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings_gameonly_${userId}`)
      .setLabel("🎮 Games Only")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`settings_econonly_${userId}`)
      .setLabel("💰 Economy Only")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`settings_close_${userId}`)
      .setLabel("✖ Close")
      .setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}




function buildTextChannelSelect(guild, userId, customIdPrefix, currentMap) {
  const textChannels = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .sort((a, b) => a.position - b.position)
    .first(25);

  if (!textChannels || textChannels.length === 0) return null;

  const options = textChannels.map(ch => {
    const isEnabled = currentMap.get(ch.id) === true;
    return new StringSelectMenuOptionBuilder()
      .setLabel(`# ${ch.name}`)
      .setValue(ch.id)
      .setDescription(isEnabled ? "✅ Enabled" : "🔴 Disabled")
      .setEmoji(isEnabled ? "✅" : "🔴");
  });

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${customIdPrefix}_select_${userId}`)
      .setPlaceholder("📋 Dooro channel...")
      .addOptions(options)
  );
}



function buildVoiceChannelSelect(guild, userId, disabledSet) {
  const voiceChannels = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice)
    .sort((a, b) => a.position - b.position)
    .first(25);

  if (!voiceChannels || voiceChannels.length === 0) return null;

  const options = voiceChannels.map(ch => {

    const isActive  = disabledSet.has(ch.id);
    const showEnabled = !isActive;
    return new StringSelectMenuOptionBuilder()
      .setLabel(`🔊 ${ch.name}`)
      .setValue(ch.id)
      .setDescription(showEnabled ? "✅ Enabled" : "🔴 Disabled")
      .setEmoji(showEnabled ? "✅" : "🔴");
  });

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`vcdrops_select_${userId}`)
      .setPlaceholder("🔊 Dooro voice channel...")
      .addOptions(options)
  );
}


function buildGenericChannelSelect(guild, userId, customIdPrefix, currentSet, statusLabel, invertDisplay = false) {
  const textChannels = guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .sort((a, b) => a.position - b.position)
    .first(25);

  if (!textChannels || textChannels.length === 0) return null;

  const options = textChannels.map(ch => {
    const isActive = currentSet.has(ch.id);
    const showEnabled = invertDisplay ? !isActive : isActive;
    return new StringSelectMenuOptionBuilder()
      .setLabel(`# ${ch.name}`)
      .setValue(ch.id)
      .setDescription(showEnabled ? "✅ Enabled" : "🔴 Disabled")
      .setEmoji(showEnabled ? "✅" : "🔴");
  });

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${customIdPrefix}_select_${userId}`)
      .setPlaceholder("📋 Dooro channel...")
      .addOptions(options)
  );
}



function buildChannelDetailEmbed(channel, isEnabled, mode) {
  const modeLabels = {
    chatdrops:  { title: "💬 Chat Drops",    desc: "XP drops ayaa ku dirsami doona channelkan marka loo furo." },
    vcdrops:    { title: "🔊 VC Drops",      desc: "Voice drop rewards ayaa lagu soo diri karaa channelkan marka perms loo furo." },
    config:     { title: "🔧 Channel Config", desc: "Haddii aad Nasiib ka xirayso channelkan, commandska nasiib kama shaqayn doonaan." },
    gameonly:   { title: "🎮 Games Only",     desc: "Channelkan kaliya gameska Nasiib ayaa lagu isticmaali karaa." },
    econonly:   { title: "💰 Economy Only",   desc: "Channelkan kaliya  economic ayaa ka shaqaynaya." },
  };

  const ml = modeLabels[mode] || { title: "⚙️ Channel", desc: "" };

  return new EmbedBuilder()
    .setTitle(ml.title)
    .setDescription(
      `**<#${channel.id}>**\n\n${ml.desc}\n\n` +
      `**Xaaladda Hadda:** ${isEnabled ? "✅ **Enabled**" : "🔴 **Disabled**"}`
    )
    .setColor(isEnabled ? 0x2ecc71 : 0xe74c3c)
    .setFooter({ text: "Riix badhanka si aad u beddesho · Back = dib u noqo" })
    .setTimestamp();
}

function buildChannelDetailRows(channel, isEnabled, mode, userId) {
  const toggleId  = `settings_toggle_${mode}_${channel.id}_${userId}`;
  const backId    = `settings_back_${mode}_${userId}`;

  const toggleBtn = new ButtonBuilder()
    .setCustomId(toggleId)
    .setLabel(isEnabled ? "🔴 Disable" : "✅ Enable")
    .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const backBtn = new ButtonBuilder()
    .setCustomId(backId)
    .setLabel("⬅ Back")
    .setStyle(ButtonStyle.Secondary);

  return [new ActionRowBuilder().addComponents(toggleBtn, backBtn)];
}



async function handleNasiibCommand(message, args) {
  if (!isAdmin(message.member)) {
    return message.reply({ embeds: [makeEmbed("❌ **Waa in aad haysataa admin permission.**")] }).catch(() => {});
  }

  const sub = (args[0] || "").toLowerCase();


  const getChannel = async () => {
    const mentioned = message.mentions.channels.first();
    if (mentioned) return mentioned;
    const rawId = (args[1] || "").replace(/[<#>]/g, "").trim();
    if (!rawId || !/^\d+$/.test(rawId)) return null;
    try { return await message.guild.channels.fetch(rawId); } catch { return null; }
  };

  switch (sub) {

    case "disable": {
      const ch = await getChannel();
      if (!ch) return message.reply({ embeds: [makeEmbed("📌 **Habka saxda:** `!nasiib disable #channel` ama `!nasiib disable <channel-id>`")] }).catch(() => {});
      await pool.query("INSERT INTO disabled_channels (channel_id) VALUES ($1) ON CONFLICT DO NOTHING", [ch.id]).catch(e => console.error("[PERM]", e.message));
      await pool.query("DELETE FROM game_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await pool.query("DELETE FROM econ_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await loadCache();
      return message.reply({ embeds: [makeEmbed(`✅ **<#${ch.id}> waa laga xiray** — Nasiib halkaas waxba kuma soo diri doono.`, 0x2ecc71)] }).catch(() => {});
    }

    case "enable": {
      const ch = await getChannel();
      if (!ch) return message.reply({ embeds: [makeEmbed("📌 **Habka saxda:** `!nasiib enable #channel` ama `!nasiib enable <channel-id>`")] }).catch(() => {});
      await pool.query("DELETE FROM disabled_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await pool.query("DELETE FROM game_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await pool.query("DELETE FROM econ_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await loadCache();
      return message.reply({ embeds: [makeEmbed(`✅ **<#${ch.id}> waa la furay** — Nasiib si caadi ah ayuu ugu shaqaynayaa.`, 0x2ecc71)] }).catch(() => {});
    }

    case "gameonly": {
      const ch = await getChannel();
      if (!ch) return message.reply({ embeds: [makeEmbed("📌 **Qaabka saxda:** `!nasiib gameonly #channel` ama `!nasiib gameonly <channel-id>`")] }).catch(() => {});
      await pool.query("INSERT INTO game_channels (channel_id) VALUES ($1) ON CONFLICT DO NOTHING", [ch.id]).catch(e => console.error("[PERM]", e.message));
      await pool.query("DELETE FROM disabled_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await pool.query("DELETE FROM econ_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await loadCache();
      const cmds = [...GAME_COMMANDS].map(c => `\`!${c}\``).join(", ");
      return message.reply({ embeds: [makeEmbed(`🎮 **<#${ch.id}> — Kaliya gameska nasiib ayaa lagu dheeli karaa** ${cmds}`, 0x3498db)] }).catch(() => {});
    }

    case "econonly": {
      const ch = await getChannel();
      if (!ch) return message.reply({ embeds: [makeEmbed("📌 **Qaabka saxda:** `!nasiib econonly #channel` ama `!nasiib econonly <channel-id>`")] }).catch(() => {});
      await pool.query("INSERT INTO econ_channels (channel_id) VALUES ($1) ON CONFLICT DO NOTHING", [ch.id]).catch(e => console.error("[PERM]", e.message));
      await pool.query("DELETE FROM disabled_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await pool.query("DELETE FROM game_channels WHERE channel_id = $1", [ch.id]).catch(() => {});
      await loadCache();
      const cmds = [...ECON_COMMANDS].map(c => `\`!${c}\``).join(", ");
      return message.reply({ embeds: [makeEmbed(`💰 **<#${ch.id}> — Kaliya economy wax la xariira lagu samayn karaa** ${cmds}`, 0x3498db)] }).catch(() => {});
    }

    case "disablecmd": {
      const cmd = (args[1] || "").toLowerCase().replace(/^!/, "");
      if (!cmd) return message.reply({ embeds: [makeEmbed("📌 **Qaabka saxda:** `!nasiib disablecmd <command>`")] }).catch(() => {});
      await pool.query("INSERT INTO disabled_commands (command) VALUES ($1) ON CONFLICT DO NOTHING", [cmd]).catch(e => console.error("[PERM]", e.message));
      await loadCache();
      return message.reply({ embeds: [makeEmbed(`✅ **\`!${cmd}\` Si globaly ah ayaa loo joojiyey.`, 0x2ecc71)] }).catch(() => {});
    }

    case "enablecmd": {
      const cmd = (args[1] || "").toLowerCase().replace(/^!/, "");
      if (!cmd) return message.reply({ embeds: [makeEmbed("📌 **Qaabka saxda:** `!nasiib enablecmd <command>`")] }).catch(() => {});
      await pool.query("DELETE FROM disabled_commands WHERE command = $1", [cmd]).catch(() => {});
      await loadCache();
      return message.reply({ embeds: [makeEmbed(`✅ **\`!${cmd}\` Si globaly ah ayaa loo furay.`, 0x2ecc71)] }).catch(() => {});
    }

    case "settings": {
      if (!message.guild) return;
      const uid = message.author.id;


      const existing = settingsPanels.get(uid);
      if (existing?.msgRef) {
        try { await existing.msgRef.delete(); } catch {}
      }

      const embed = buildSettingsMainEmbed(message.member);
      const rows  = buildSettingsMainRows(uid);

      const msg = await message.reply({
        embeds: [embed],
        components: rows,
      }).catch(() => null);

      if (!msg) return;

      settingsPanels.set(uid, {
        msgRef:      msg,
        guildId:     message.guild.id,
        currentView: "main",
        expiresAt:   Date.now() + SETTINGS_PANEL_TTL,
      });


      setTimeout(async () => {
        const panel = settingsPanels.get(uid);
        if (!panel || panel.msgRef?.id !== msg.id) return;
        settingsPanels.delete(uid);
        try {
          await msg.edit({
            embeds: [new EmbedBuilder()
              .setDescription("⏰ **Settings panel waqtigeeda wuu dhacay.** Ku celi `!nasiib settings`.")
              .setColor(0x95a5a6)
            ],
            components: [],
          });
        } catch {}
      }, SETTINGS_PANEL_TTL);

      return;
    }

    case "econ": {
      let loadingMsg;
      try {
        loadingMsg = await message.reply({ embeds: [new EmbedBuilder().setTitle("📊 Economy Dashboard").setDescription("⏳ Xogta la uruurinayaa...").setColor(0xf1c40f)] }).catch(() => null);
      } catch { loadingMsg = null; }

      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const [
          playerStats,
          richest,
          botWallet,
          bankDeposits,
          bankInvests,
          botInvests,
          activePlayers,
        ] = await Promise.all([
          pool.query(`SELECT COALESCE(SUM(coins),0) AS total_coins, COALESCE(SUM(diamonds),0) AS total_diamonds, COALESCE(SUM(legendary_crates),0) AS total_crates, COUNT(*) AS total_players FROM players`),
          pool.query(`SELECT discord_id, username, coins FROM players ORDER BY coins DESC LIMIT 1`),
          pool.query(`SELECT coins, diamonds FROM bot_wallet WHERE id = 1`),
          pool.query(`SELECT COALESCE(SUM(deposited + profit),0) AS total FROM bank_users`).catch(() => ({ rows: [{ total: 0 }] })),
          pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM bank_investments`).catch(() => ({ rows: [{ total: 0 }] })),
          pool.query(`SELECT COALESCE(SUM(((game_stats->'invest'->>'amount'))::BIGINT),0) AS total FROM players WHERE game_stats->'invest'->>'amount' IS NOT NULL AND (game_stats->'invest'->>'amount')::BIGINT > 0`).catch(() => ({ rows: [{ total: 0 }] })),
          pool.query(`SELECT COUNT(*) AS cnt FROM players WHERE last_daily >= $1`, [sevenDaysAgo]).catch(() => ({ rows: [{ cnt: 0 }] })),
        ]);

        const fmt = n => Math.floor(Number(n) || 0).toLocaleString();

        const totalWallets   = Number(playerStats.rows[0].total_coins)   || 0;
        const totalDiamonds  = Number(playerStats.rows[0].total_diamonds) || 0;
        const totalCrates    = Number(playerStats.rows[0].total_crates)   || 0;
        const totalPlayers   = Number(playerStats.rows[0].total_players)  || 0;
        const totalBankDep   = Number(bankDeposits.rows[0].total)         || 0;
        const totalBankInv   = Number(bankInvests.rows[0].total)          || 0;
        const totalBotInv    = Number(botInvests.rows[0].total)           || 0;
        const botCoins       = Number(botWallet.rows[0]?.coins)           || 0;
        const botDiamonds    = Number(botWallet.rows[0]?.diamonds)        || 0;
        const active7d       = Number(activePlayers.rows[0].cnt)          || 0;
        const grandTotal     = totalWallets + totalBankDep + totalBankInv + totalBotInv;

        const richestRow = richest.rows[0];
        const richestStr = richestRow
          ? `<@${richestRow.discord_id}> (${richestRow.username || "?"}) — **${fmt(richestRow.coins)} Coins**`
          : "_Wali ciyaariye ma jiro_";

        const embed = new EmbedBuilder()
          .setTitle("📊 Nasiib — Economy Dashboard")
          .setColor(0xf1c40f)
          .addFields(
            { name: "💰 Wallets (Players)",    value: `${fmt(totalWallets)} Coins`,   inline: true  },
            { name: "🏦 Bank Deposits",         value: `${fmt(totalBankDep)} Coins`,   inline: true  },
            { name: "📈 Bank Investments",       value: `${fmt(totalBankInv)} Coins`,   inline: true  },
            { name: "💼 Bot Invest (!invest)",   value: `${fmt(totalBotInv)} Coins`,    inline: true  },
            { name: "🌐 Grand Total",            value: `**${fmt(grandTotal)} Coins**`, inline: true  },
            { name: "\u200B",                    value: "\u200B",                       inline: true  },
            { name: "💎 Total Diamonds",         value: `${fmt(totalDiamonds)} 💎`,     inline: true  },
            { name: "📦 Legendary Crates",       value: `${fmt(totalCrates)} Crates`,   inline: true  },
            { name: "\u200B",                    value: "\u200B",                       inline: true  },
            { name: "🤖 Bot Wallet",             value: `${fmt(botCoins)} Coins · ${fmt(botDiamonds)} 💎`, inline: false },
            { name: "👥 Players",                value: `Total: **${fmt(totalPlayers)}** · Active (7d): **${fmt(active7d)}**`, inline: false },
            { name: "🏆 Richest Player",          value: richestStr,                    inline: false },
          )
          .setFooter({ text: `Generated at ${new Date().toUTCString()}` });

        if (loadingMsg) {
          await loadingMsg.edit({ embeds: [embed] }).catch(() => message.reply({ embeds: [embed] }));
        } else {
          await message.reply({ embeds: [embed] }).catch(() => {});
        }
      } catch (err) {
        console.error("[ECON DASHBOARD]", err.message);
        const errEmbed = makeEmbed("❌ Xogta la keeni waayay. DB waa la xiriinayaa, isku day mar kale.", 0xe74c3c);
        if (loadingMsg) await loadingMsg.edit({ embeds: [errEmbed] }).catch(() => {});
        else await message.reply({ embeds: [errEmbed] }).catch(() => {});
      }
      return;
    }

    default: {
      return message.reply({ embeds: [new EmbedBuilder().setTitle("📋 Nasiib Permission Commands").setColor(0x9b59b6).setDescription([
        "`!nasiib disable #channel`       — Block all commands in a channel",
        "`!nasiib disable <channel-id>`   — Block by ID (voice/stage/any type)",
        "`!nasiib enable #channel`        — Re-enable a channel",
        "`!nasiib enable <channel-id>`    — Re-enable by ID",
        "`!nasiib gameonly #channel`      — Allow only game commands",
        "`!nasiib gameonly <channel-id>`  — Game-only by ID",
        "`!nasiib econonly #channel`      — Allow only economy commands",
        "`!nasiib econonly <channel-id>`  — Economy-only by ID",
        "`!nasiib disablecmd <cmd>`       — Disable a command globally",
        "`!nasiib enablecmd <cmd>`        — Re-enable a command globally",
        "`!nasiib settings`               — Interactive admin settings panel",
        "`!nasiib econ`                   — Economy stats dashboard (admin only)",
      ].join("\n"))] }).catch(() => {});
    }
  }
}



async function handleSettingsInteraction(interaction) {
  try {
    const id  = interaction.customId;
    const uid = interaction.user.id;


    const ownerId = id.split("_").pop();
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "❌ Hmm so whatt.",
        ephemeral: true,
      }).catch(() => {});
    }

    const guild  = interaction.guild;
    const member = interaction.member;

    if (!isAdmin(member)) {
      return interaction.reply({
        content: "❌ Waa inaad haysataa **Admin** permission.",
        ephemeral: true,
      }).catch(() => {});
    }


    if (id.startsWith("settings_close_")) {
      settingsPanels.delete(uid);
      return interaction.update({
        embeds: [new EmbedBuilder()
          .setDescription("✅ **Settings panel waa la xiray.**")
          .setColor(0x95a5a6)
        ],
        components: [],
      }).catch(() => {});
    }


    const navMap = {
      [`settings_chatdrops_${uid}`]: "chatdrops",
      [`settings_vcdrops_${uid}`]:   "vcdrops",
      [`settings_config_${uid}`]:    "config",
      [`settings_gameonly_${uid}`]:  "gameonly",
      [`settings_econonly_${uid}`]:  "econonly",
    };

    if (navMap[id]) {
      const mode = navMap[id];

      const modeEmbeds = {
        chatdrops: new EmbedBuilder()
          .setTitle("💬 Chat Drops — Channel")
          .setDescription("Halkan ka dooro channel aad rabto inaad **Chat Drops** ka furto ama ka xirato.\n\n✅ = Enabled  ·  🔴 = Disabled")
          .setColor(0x5865f2)
          .setFooter({ text: "Ka dooro chat channel dropdownka hoose" }),
        vcdrops: new EmbedBuilder()
          .setTitle("🔊 VC Drops — Voice Channel")
          .setDescription("Halkan ka dooro voice channel aad rabto inaad **VC Drops** ka furto ama ka xirto.\n\n✅ = Enabled  ·  🔴 = Disabled")
          .setColor(0x5865f2)
          .setFooter({ text: "Ka dooro voice channel dropdown-ka hoose" }),
        config: new EmbedBuilder()
          .setTitle("🔧 Channel Configuration")
          .setDescription("Halkan ka dooro channel aad rabto inaad **Nasiib si buuxda uga xirto**.\nMarka channel la xiro, wax amarka Nasiib ah halkaas kama shaqayna doonaan.\n\n✅ = Nasiib Active  ·  🔴 = Nasiib Disabled")
          .setColor(0xe67e22)
          .setFooter({ text: "ka dooro channel dropdown ka hoose" }),
        gameonly: new EmbedBuilder()
          .setTitle("🎮 Games Only Channels")
          .setDescription(
            "Halkan ka dooro channel aad rabto inaad **Games Only** u furtid.\n\n" +
            "Markaad u furtid channelkas, **kaliya** amaradan ayaa shaqaynaya:\n" +
            "`!cf` `!slots` `!q` `!sheeko` `!tower` `!fti` `!miino` `!wallet` `!p`\n\n" +
            "✅ = Games Only Active  ·  🔴 = Inactive"
          )
          .setColor(0x2ecc71)
          .setFooter({ text: "Ka dooro channel dropdown ka hoose" }),
        econonly: new EmbedBuilder()
          .setTitle("💰 Economy Only Channels")
          .setDescription(
            "Halkan ka dooro channel aad rabto inaad **Economy Only** ka dhigtid.\n\n" +
            "Markaad u furtid channelkas , **kaliya** amaradan ayaa shaqaynaya:\n" +
            "`!invest` `!bank` `!withdraw` `!deposit` `!myinvestments` `/withdraw` `/deposit` `/invest` `!invlb` `!rich` `!season` `!wallet` `!p`\n\n" +
            "✅ = Economy Only Active  ·  🔴 = Inactive"
          )
          .setColor(0xf1c40f)
          .setFooter({ text: "Ka dooro channel dropdown-ka hoose" }),
      };


      let selectRow = null;
      if (mode === "chatdrops") {
        selectRow = buildGenericChannelSelect(guild, uid, "chatdrops", chatDropDisabled, "", true);
      } else if (mode === "vcdrops") {
        selectRow = buildVoiceChannelSelect(guild, uid, vcDropDisabled);
      } else if (mode === "config") {
        selectRow = buildGenericChannelSelect(guild, uid, "config", disabledChannels, "Disabled", true);
      } else if (mode === "gameonly") {
        selectRow = buildGenericChannelSelect(guild, uid, "gameonly", gameChannels, "Games Only");
      } else if (mode === "econonly") {
        selectRow = buildGenericChannelSelect(guild, uid, "econonly", econChannels, "Economy Only");
      }

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`settings_mainback_${uid}`)
          .setLabel("⬅ Back to Main")
          .setStyle(ButtonStyle.Secondary)
      );

      const components = selectRow
        ? [selectRow, backRow]
        : [backRow];

      if (!selectRow) {
        modeEmbeds[mode].setDescription(
          modeEmbeds[mode].data.description +
          "\n\n⚠️ **Serverkaaga channels kuma jiraan ama waa la heli waayay.**"
        );
      }

      return interaction.update({
        embeds: [modeEmbeds[mode]],
        components,
      }).catch(() => {});
    }


    if (id.startsWith("settings_mainback_")) {
      return interaction.update({
        embeds: [buildSettingsMainEmbed(member)],
        components: buildSettingsMainRows(uid),
      }).catch(() => {});
    }


    if (id.startsWith("settings_back_")) {

      const parts = id.split("_");

      const mode = parts[2];
      const fakeInteraction = Object.create(interaction);
      fakeInteraction.customId = `settings_${mode}_${uid}`;
      return handleSettingsInteraction(fakeInteraction);
    }


    if (interaction.isStringSelectMenu()) {
      const channelId = interaction.values[0];
      let mode = null;

      if (id.startsWith("chatdrops_select_"))  mode = "chatdrops";
      else if (id.startsWith("vcdrops_select_"))   mode = "vcdrops";
      else if (id.startsWith("config_select_"))    mode = "config";
      else if (id.startsWith("gameonly_select_"))  mode = "gameonly";
      else if (id.startsWith("econonly_select_"))  mode = "econonly";

      if (!mode) return;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        return interaction.reply({ content: "❌ Channel lama helin.", ephemeral: true }).catch(() => {});
      }


      let isEnabled = false;
      if (mode === "chatdrops") isEnabled = !chatDropDisabled.has(channelId);
      else if (mode === "vcdrops")  isEnabled = !vcDropDisabled.has(channelId);
      else if (mode === "config")   isEnabled = !disabledChannels.has(channelId);
      else if (mode === "gameonly") isEnabled = gameChannels.has(channelId);
      else if (mode === "econonly") isEnabled = econChannels.has(channelId);

      return interaction.update({
        embeds: [buildChannelDetailEmbed(channel, isEnabled, mode)],
        components: buildChannelDetailRows(channel, isEnabled, mode, uid),
      }).catch(() => {});
    }


    if (id.startsWith("settings_toggle_")) {

      const parts     = id.split("_");

      const mode      = parts[2];
      const channelId = parts[3];

      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        return interaction.reply({ content: "❌ Channel lama helin.", ephemeral: true }).catch(() => {});
      }

      let nowEnabled = false;

      if (mode === "chatdrops") {
        const currentlyEnabled = !chatDropDisabled.has(channelId);
        if (currentlyEnabled) {

          await pool.query(
            `INSERT INTO drop_disabled_channels (channel_id, guild_id) VALUES ($1, $2) ON CONFLICT (channel_id) DO NOTHING`,
            [channelId, guild.id]
          ).catch(() => {});
          chatDropDisabled.add(channelId);
          nowEnabled = false;
        } else {

          await pool.query(
            `DELETE FROM drop_disabled_channels WHERE channel_id = $1`,
            [channelId]
          ).catch(() => {});
          chatDropDisabled.delete(channelId);
          nowEnabled = true;
        }
      }

      else if (mode === "vcdrops") {

        const currentlyEnabled = !vcDropDisabled.has(channelId);
        if (currentlyEnabled) {

          await pool.query(
            `INSERT INTO vc_drop_channels (channel_id, guild_id, enabled) VALUES ($1, $2, false)
             ON CONFLICT (channel_id) DO UPDATE SET enabled = false`,
            [channelId, guild.id]
          ).catch(() => {});
          vcDropDisabled.add(channelId);
          nowEnabled = false;
        } else {

          await pool.query(
            `INSERT INTO vc_drop_channels (channel_id, guild_id, enabled) VALUES ($1, $2, true)
             ON CONFLICT (channel_id) DO UPDATE SET enabled = true`,
            [channelId, guild.id]
          ).catch(() => {});
          vcDropDisabled.delete(channelId);
          nowEnabled = true;
        }
      }

      else if (mode === "config") {

        const curDisabled = disabledChannels.has(channelId);
        if (curDisabled) {

          await pool.query(`DELETE FROM disabled_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          nowEnabled = true;
        } else {

          await pool.query(
            `INSERT INTO disabled_channels (channel_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [channelId]
          ).catch(() => {});

          await pool.query(`DELETE FROM game_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          await pool.query(`DELETE FROM econ_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          nowEnabled = false;
        }
      }

      else if (mode === "gameonly") {
        const cur = gameChannels.has(channelId);
        if (cur) {
          await pool.query(`DELETE FROM game_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          nowEnabled = false;
        } else {
          await pool.query(
            `INSERT INTO game_channels (channel_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [channelId]
          ).catch(() => {});

          await pool.query(`DELETE FROM disabled_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          await pool.query(`DELETE FROM econ_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          nowEnabled = true;
        }
      }

      else if (mode === "econonly") {
        const cur = econChannels.has(channelId);
        if (cur) {
          await pool.query(`DELETE FROM econ_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          nowEnabled = false;
        } else {
          await pool.query(
            `INSERT INTO econ_channels (channel_id) VALUES ($1) ON CONFLICT DO NOTHING`,
            [channelId]
          ).catch(() => {});
          await pool.query(`DELETE FROM disabled_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          await pool.query(`DELETE FROM game_channels WHERE channel_id = $1`, [channelId]).catch(() => {});
          nowEnabled = true;
        }
      }


      await loadCache();


      return interaction.update({
        embeds: [buildChannelDetailEmbed(channel, nowEnabled, mode)],
        components: buildChannelDetailRows(channel, nowEnabled, mode, uid),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("[SETTINGS] Interaction error:", err.message);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true });
      }
    } catch {}
  }
}






export async function setupPermissionSystem(client) {
  await initTables();
  await loadCache();
  setInterval(loadCache, 30_000);


  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.guild) return;

      const isButton = interaction.isButton();
      const isSelect = interaction.isStringSelectMenu();
      if (!isButton && !isSelect) return;

      const id = interaction.customId;
      if (
        id.startsWith("settings_") ||
        id.startsWith("chatdrops_select_") ||
        id.startsWith("vcdrops_select_") ||
        id.startsWith("config_select_") ||
        id.startsWith("gameonly_select_") ||
        id.startsWith("econonly_select_")
      ) {
        await handleSettingsInteraction(interaction);
      }
    } catch (err) {
      console.error("[SETTINGS] Interaction error:", err.message);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true });
        }
      } catch {}
    }
  });



  client.prependListener("messageCreate", (message) => {
    try {
      if (!message || message.author?.bot) return;
      if (!message.guild) return;

      const content = message.content;
      if (!content || !content.startsWith(PREFIX)) return;

      const parts = content.slice(PREFIX.length).trim().split(/\s+/);
      const cmd   = parts[0]?.toLowerCase();
      if (!cmd) return;


      if (cmd === "nasiib") {
        handleNasiibCommand(message, parts.slice(1)).catch(() => {});
        message._permBlocked = true;
        return;
      }


      if (!cacheReady) return;

      const cid = message.channelId;


      if (disabledChannels.has(cid)) {
        if (canWarn(cid)) {
          message.reply({ embeds: [makeEmbed("🚫 Nasiib channelkan waa laga xiray.")] }).catch(() => {});
        }
        message._permBlocked = true;
        return;
      }


      if (disabledCmds.has(cmd)) {
        if (canWarn(cid)) {
          message.reply({ embeds: [makeEmbed("🚫 Commandkan waa la xiray.")] }).catch(() => {});
        }
        message._permBlocked = true;
        return;
      }


      if (gameChannels.has(cid) && !GAME_COMMANDS.has(cmd)) {
        if (canWarn(cid)) {
          message.reply({ embeds: [makeEmbed("🎮 Channelkan kaliya gameska ayaa lagu dheeli karaa.")] }).catch(() => {});
        }
        message._permBlocked = true;
        return;
      }


      if (econChannels.has(cid) && !ECON_COMMANDS.has(cmd)) {
        if (canWarn(cid)) {
          message.reply({ embeds: [makeEmbed("💰 channelkan kaliya economy ayaa lagu isticmaali karaa.")] }).catch(() => {});
        }
        message._permBlocked = true;
        return;
      }

    } catch (err) {
      console.error("[PERM] Listener error:", err.message);
    }
  });

  console.log("[PERM] ✅ Permission system active.");
}
