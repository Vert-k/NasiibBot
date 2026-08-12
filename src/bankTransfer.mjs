


















import pg from "pg";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});


const MIN_WITHDRAW         = 100;
const MIN_LEVEL_USE        = 5;
const WITHDRAW_OWNER_RATES = { 1: 0.05, 2: 0.06, 3: 0.07 };
const WITHDRAW_BOT         = 0.03;
const TRANSFER_CD_MS       = 60_000;


const transferCooldowns = new Map();
const pendingTransfers  = new Map();


setInterval(() => {
  const now = Date.now();
  for (const [id, t] of pendingTransfers) {
    if (now > t.expiresAt) pendingTransfers.delete(id);
  }
}, 30_000);


function fmt(n) {
  return Math.floor(n).toLocaleString();
}

function makeCooldownKey(userId) {
  return userId;
}

function isCooledDown(userId) {
  const last = transferCooldowns.get(userId);
  return !last || Date.now() - last >= TRANSFER_CD_MS;
}

function cooldownRemaining(userId) {
  const last = transferCooldowns.get(userId) || 0;
  return Math.max(0, TRANSFER_CD_MS - (Date.now() - last));
}

function msToSec(ms) {
  return Math.ceil(ms / 1000);
}

function genTransferId() {
  return `bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getBank(ownerId) {
  const r = await pool.query(`SELECT * FROM banks WHERE owner_id = $1`, [ownerId]);
  return r.rows[0] || null;
}

async function getPlayerLevel(discordId) {
  const r = await pool.query(`SELECT level FROM players WHERE discord_id = $1`, [discordId]);
  return r.rows[0]?.level ?? null;
}

async function getSenderBankBalance(ownerId, userId) {
  const r = await pool.query(
    `SELECT deposited, profit FROM bank_users WHERE bank_owner_id = $1 AND user_id = $2`,
    [ownerId, userId]
  );
  if (!r.rows[0]) return { deposited: 0, profit: 0, balance: 0 };
  const deposited = Number(r.rows[0].deposited);
  const profit    = Number(r.rows[0].profit);
  return { deposited, profit, balance: deposited + profit };
}


async function registerCommand(client) {
  if (!client.application) {
    console.warn("[BANK_TRANSFER] client.application not ready — will retry on clientReady.");
    return;
  }
  try {
    await client.application.commands.create({
      name: "banktransfer",
      description: "Lacag ka dir bank accountgaaga oo u dir wallet qof kale.",
      options: [
        {
          name: "amount",
          description: "Lacagta aad diraysid (coins).",
          type: 4,
          required: true,
          min_value: MIN_WITHDRAW,
        },
        {
          name: "user",
          description: "Qofka aad lacagta u diraysid.",
          type: 6,
          required: true,
        },
        {
          name: "bank",
          description: "Ownerka bankga aad lacagta ka diraysid.",
          type: 6,
          required: true,
        },
      ],
    });
    console.log("[BANK_TRANSFER] ✅ /banktransfer registered globally.");
  } catch (err) {
    console.error("[BANK_TRANSFER] Failed to register command:", err.message);
  }
}


async function executeTransfer(transferId, interaction) {
  const pending = pendingTransfers.get(transferId);
  if (!pending) {
    return interaction.update({
      content: "Waqtiga xaqiijinta wuu dhacay. Isku day mar kale.",
      embeds: [],
      components: [],
    }).catch(() => {});
  }

  pendingTransfers.delete(transferId);

  const { senderId, receiverId, ownerId, amount } = pending;

  const bank = await getBank(ownerId);
  if (!bank) {
    return interaction.update({
      content: "❌ Bankgan ma jiro hadda.",
      embeds: [],
      components: [],
    }).catch(() => {});
  }

  const ownerRate = WITHDRAW_OWNER_RATES[bank.level] || 0.05;
  const userRate  = 1 - ownerRate - WITHDRAW_BOT;
  const receiverGets = Math.floor(amount * userRate);
  const ownerGets    = Math.floor(amount * ownerRate);
  const botGets      = amount - receiverGets - ownerGets;
  const taxTotal     = amount - receiverGets;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");


    const locked = await client.query(
      `SELECT deposited, profit FROM bank_users
       WHERE bank_owner_id = $1 AND user_id = $2 FOR UPDATE`,
      [ownerId, senderId]
    );
    if (locked.rowCount === 0) {
      await client.query("ROLLBACK");
      return interaction.update({
        content: "❌ Lacag ma aadan dhigan bankigan.",
        embeds: [],
        components: [],
      }).catch(() => {});
    }

    const deposited = Number(locked.rows[0].deposited);
    const profit    = Number(locked.rows[0].profit);
    const balance   = deposited + profit;

    if (balance < amount) {
      await client.query("ROLLBACK");
      return interaction.update({
        content: `❌ Bankgan kaliya waxaa kuu taala: **${fmt(balance)} coins** — kuguma filna **${fmt(amount)}**.`,
        embeds: [],
        components: [],
      }).catch(() => {});
    }


    let newProfit    = profit;
    let newDeposited = deposited;
    if (amount <= newProfit) {
      newProfit -= amount;
    } else {
      newDeposited = deposited - (amount - newProfit);
      newProfit = 0;
    }

    await client.query(
      `UPDATE bank_users SET deposited = $1, profit = $2, last_active = $3, last_withdraw = $3
       WHERE bank_owner_id = $4 AND user_id = $5`,
      [newDeposited, newProfit, Date.now(), ownerId, senderId]
    );


    await client.query(
      `INSERT INTO players (discord_id, username, coins)
       VALUES ($1, 'user', $2)
       ON CONFLICT (discord_id) DO UPDATE SET coins = players.coins + $2`,
      [receiverId, receiverGets]
    );


    await client.query(
      `UPDATE players SET coins = coins + $1 WHERE discord_id = $2`,
      [ownerGets, ownerId]
    );


    await client.query(
      `UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`,
      [botGets]
    );


    await client.query(
      `INSERT INTO bank_transactions (bank_owner_id, user_id, type, amount, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [ownerId, senderId, "transfer_out", amount, `→ ${receiverId}`]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[BANK_TRANSFER] Transaction error:", err.message);
    return interaction.update({
      content: "❌ Khalad ayaa dhacay. Lacagta waa laguu soo celiyay. Isku day mar kale.",
      embeds: [],
      components: [],
    }).catch(() => {});
  } finally {
    client.release();
  }

  console.log(`[BANK_TRANSFER] ${senderId} -> ${receiverId} | amount: ${amount} | tax: ${taxTotal}`);

  const ownerPct = Math.round(ownerRate * 100);
  const userPct  = Math.round(userRate  * 100);


  const successEmbed = new EmbedBuilder()
    .setTitle("💸 Transfer Success!")
    .setColor(0x2ecc71)
    .setDescription(`Waxaa **${fmt(receiverGets)} coins** u dirtay <@${receiverId}>`)
    .addFields(
      { name: "Lacagta aad dirtay",     value: `${fmt(amount)} coins`,       inline: true },
      { name: "Fee ga go'ay",       value: `${fmt(taxTotal)} (${100 - userPct}%)`, inline: true },
      { name: "Lacagta gaartay", value: `**${fmt(receiverGets)} coins**`, inline: true },
      { name: "Owner cut", value: `${fmt(ownerGets)} (${ownerPct}%)`, inline: true },
    );

  await interaction.update({
    embeds: [successEmbed],
    components: [],
  }).catch(() => {});


  try {
    const senderTag = interaction.user.username;
    const dmEmbed = new EmbedBuilder()
      .setTitle("Waxaa laguu soo diray coins!")
      .setColor(0xf1c40f)
      .setDescription(`**${senderTag}** ayaa kuu soo direen **${fmt(receiverGets)} coins**`)
      .addFields(
        { name: "waxaa ku soo gaartay", value: `${fmt(receiverGets)} coins`, inline: true },
      );

    const receiverUser = await interaction.client.users.fetch(receiverId).catch(() => null);
    if (receiverUser) {
      await receiverUser.send({ embeds: [dmEmbed] }).catch(() => {});
    }
  } catch {}
}


async function cancelTransfer(transferId, interaction) {
  pendingTransfers.delete(transferId);
  return interaction.update({
    content: "🚫 **Dirista waa la joojiyey.** Lacag kaama bixin.",
    embeds: [],
    components: [],
  }).catch(() => {});
}


async function handleBankTransfer(interaction) {
  const senderId  = interaction.user.id;
  const receiver  = interaction.options.getUser("user",  true);
  const bankOwner = interaction.options.getUser("bank",  true);
  const amount    = interaction.options.getInteger("amount", true);
  const ownerId   = bankOwner.id;


  if (receiver.id === senderId) {
    return interaction.reply({
      content: "❌ Adiga iskuma diri kartid. Qof kale dooro.",
      ephemeral: true,
    });
  }
  if (receiver.bot) {
    return interaction.reply({
      content: "❌ botska lacag looma diri karo.",
      ephemeral: true,
    });
  }
  if (amount < MIN_WITHDRAW) {
    return interaction.reply({
      content: `❌ Ugu yaraan **${MIN_WITHDRAW} coins** ayaa la diri karaa.`,
      ephemeral: true,
    });
  }


  if (!isCooledDown(senderId)) {
    const rem = cooldownRemaining(senderId);
    return interaction.reply({
      content: `⏱️ Sug **${msToSec(rem)}s** ka hor intaadan mar kale isticmaalin \`/banktransfer\`.`,
      ephemeral: true,
    });
  }


  const senderLevel = await getPlayerLevel(senderId);
  if (senderLevel === null || senderLevel < MIN_LEVEL_USE) {
    return interaction.reply({
      content: `❌ Waa in aad tahay Level **${MIN_LEVEL_USE}** si aad amarka u isticmaasho. Hadda waxaad tahay Level **${senderLevel ?? 1}**.`,
      ephemeral: true,
    });
  }


  const bank = await getBank(ownerId);
  if (!bank) {
    return interaction.reply({
      content: "❌ Bankgan ma jiro. Hubi bank-owner-ka saxda ah.",
      ephemeral: true,
    });
  }
  const { balance } = await getSenderBankBalance(ownerId, senderId);
  if (balance < amount) {
    return interaction.reply({
      content: [
        `❌ Bankigan kaliya waxa kuu taala: **${fmt(balance)} coins** — kuguma filna **${fmt(amount)}**.`,
        `💡 Hubi lacagta: \`/banktransfer amount:${Math.max(MIN_WITHDRAW, balance)}\``,
      ].join("\n"),
      ephemeral: true,
    });
  }


  const ownerRate    = WITHDRAW_OWNER_RATES[bank.level] || 0.05;
  const userRate     = 1 - ownerRate - WITHDRAW_BOT;
  const receiverGets = Math.floor(amount * userRate);
  const taxTotal     = amount - receiverGets;


  transferCooldowns.set(senderId, Date.now());


  const transferId = genTransferId();
  pendingTransfers.set(transferId, {
    senderId,
    receiverId: receiver.id,
    ownerId,
    amount,
    expiresAt: Date.now() + 2 * 60_000,
  });


  const confirmEmbed = new EmbedBuilder()
    .setTitle("⚠️ Xaqiiji Transfer-ka")
    .setColor(0xf39c12)
    .setDescription(
      `Ma hubtaa in **${fmt(amount)} coins** u dirtid <@${receiver.id}>?\n` +
      `*(Bankiga: **${bank.name}**)*`
    )
    .addFields(
      { name: "Lacagta diraysid",      value: `${fmt(amount)} coins`,       inline: true },
      { name: "Fee",        value: `${fmt(taxTotal)} coins`,      inline: true },
      { name: "Lacagta gaaraysa", value: `**${fmt(receiverGets)} coins**`, inline: true },
    )
    .setFooter({ text: "Waxaad haysataa 2 daqiiqo si aad u xaqiijiso." });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`banktransfer_confirm_${transferId}`)
      .setLabel("✅ Xaqiiji")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`banktransfer_cancel_${transferId}`)
      .setLabel("❌ Jooji")
      .setStyle(ButtonStyle.Danger),
  );

  return interaction.reply({
    embeds: [confirmEmbed],
    components: [row],
    ephemeral: true,
  });
}


export function setupBankTransfer(client) {

  if (typeof client.isReady === "function" && client.isReady()) {
    registerCommand(client).catch(() => {});
  } else {
    client.once("clientReady", () => registerCommand(client).catch(() => {}));
  }


  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand?.() && interaction.commandName === "banktransfer") {
        await handleBankTransfer(interaction);
        return;
      }


      if (interaction.isButton?.()) {
        const cid = interaction.customId;

        if (cid.startsWith("banktransfer_confirm_")) {
          const transferId = cid.replace("banktransfer_confirm_", "");
          const pending = pendingTransfers.get(transferId);


          if (!pending || interaction.user.id !== pending.senderId) {
            return interaction.reply({
              content: "❌ Buttonkan kaaga ma ahan.",
              ephemeral: true,
            }).catch(() => {});
          }
          await executeTransfer(transferId, interaction);
          return;
        }

        if (cid.startsWith("banktransfer_cancel_")) {
          const transferId = cid.replace("banktransfer_cancel_", "");
          const pending = pendingTransfers.get(transferId);

          if (!pending || interaction.user.id !== pending.senderId) {
            return interaction.reply({
              content: "❌ Buttonkan kaaga ma ahan.",
              ephemeral: true,
            }).catch(() => {});
          }
          await cancelTransfer(transferId, interaction);
          return;
        }
      }
    } catch (err) {
      console.error("[BANK_TRANSFER] interactionCreate error:", err.message);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true });
        }
      } catch {}
    }
  });

  console.log("[BANK_TRANSFER] ✅ Bank transfer system is online.");
}
