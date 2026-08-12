

















import pg from "pg";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { isDogGuardExpired } from "./vault.mjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});

const DOG_COST_DIAMONDS  = 100;
const DOG_UPKEEP_COINS   = 600;
const DOG_UPKEEP_INTERVAL_MS = 12 * 60 * 60 * 1000;
const DOG_ROB_PENALTY    = 0.10;



async function initGuardDogTables() {
  await pool.query(
    `ALTER TABLE banks ADD COLUMN IF NOT EXISTS has_guard_dog BOOLEAN NOT NULL DEFAULT false`
  );
  await pool.query(
    `ALTER TABLE banks ADD COLUMN IF NOT EXISTS dog_active BOOLEAN NOT NULL DEFAULT false`
  );
  await pool.query(
    `ALTER TABLE banks ADD COLUMN IF NOT EXISTS last_dog_payment BIGINT DEFAULT NULL`
  );
  console.log("[BSHOP] ✅ Guard Dog columns ready.");
}



export async function checkGuardDog(ownerId) {
  try {
    const r = await pool.query(
      `SELECT has_guard_dog, dog_active FROM banks WHERE owner_id = $1`,
      [ownerId]
    );
    const bank = r.rows[0];
    if (!bank) return false;
    return !!(bank.has_guard_dog && bank.dog_active);
  } catch (err) {
    console.error("[BSHOP] checkGuardDog error:", err.message);
    return false;
  }
}



function buildBShopEmbed(diamonds) {
  return new EmbedBuilder()
    .setTitle("🐕 Bank Protection Shop")
    .setDescription(
      [
        "🛡️ **Guard Dog**",
        "Waxa uu walletkaaga ka ilaalinayaa in la dhaco.",
        "",
        "💎 **qiimaha:** 100 Diamonds",
        "💰 **haysashadiisa:** 400 coins every 12 hours.",
        "",
        "📌 **saamayntiisa:**",
        "Hadii uu qof isku dayo in uu ku dhaco:",
        "→ waxay waynayaan 10% oo coinska walletkooda ugu jira.",
        "→ lacagtas waxay galaysaa bot treasury",
        "→ walletkaaga wuxuu noqonaya lama taabtaan.",
        "",
        `💎 Hadda haysataa: **${diamonds.toLocaleString()}** Diamonds`,
      ].join("\n")
    )
    .setColor(0xf39c12);
}

function buildBShopRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bshop_confirm_${userId}`)
      .setLabel("xaqiiji")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`bshop_cancel_${userId}`)
      .setLabel("jooji")
      .setStyle(ButtonStyle.Danger)
  );
}



async function runDogMaintenanceCycle(discordClient) {
  try {

    if (await isDogGuardExpired()) return;

    const banksRes = await pool.query(
      `SELECT * FROM banks WHERE has_guard_dog = true`
    );

    for (const bank of banksRes.rows) {
      const ownerId  = bank.owner_id;
      const now      = Date.now();
      const lastPay  = bank.last_dog_payment ? Number(bank.last_dog_payment) : 0;


      if (now - lastPay < DOG_UPKEEP_INTERVAL_MS) continue;


      const totalRes = await pool.query(
        `SELECT COALESCE(SUM(deposited + profit), 0) AS total
         FROM bank_users WHERE bank_owner_id = $1`,
        [ownerId]
      );
      const bankTotal = Number(totalRes.rows[0]?.total || 0);

      if (bankTotal < DOG_UPKEEP_COINS) {

        await pool.query(
          `UPDATE banks SET dog_active = false WHERE owner_id = $1`,
          [ownerId]
        );
        console.log(`[BSHOP] Guard Dog inactive for ${ownerId} — insufficient bank pool.`);


        try {
          const owner = await discordClient.users.fetch(ownerId);
          await owner.send(
            "⚠️ eeygaagii waardiyaha ahaa waa xajin waysay.\n" +
            "Bankigaaga malaheen lacag ku filan uu ku daboolo baahida (400 coins).\n\n" +
            "Your wallet is no longer protected."
          );
        } catch {

        }
        continue;
      }


      let remaining = DOG_UPKEEP_COINS;


      const usersRes = await pool.query(
        `SELECT user_id, profit, deposited FROM bank_users
         WHERE bank_owner_id = $1 ORDER BY profit DESC`,
        [ownerId]
      );


      for (const bu of usersRes.rows) {
        if (remaining <= 0) break;
        const cut = Math.min(Number(bu.profit), remaining);
        if (cut > 0) {
          await pool.query(
            `UPDATE bank_users SET profit = profit - $1
             WHERE bank_owner_id = $2 AND user_id = $3`,
            [cut, ownerId, bu.user_id]
          );
          remaining -= cut;
        }
      }


      if (remaining > 0) {
        for (const bu of usersRes.rows) {
          if (remaining <= 0) break;
          const cut = Math.min(Number(bu.deposited), remaining);
          if (cut > 0) {
            await pool.query(
              `UPDATE bank_users SET deposited = deposited - $1
               WHERE bank_owner_id = $2 AND user_id = $3`,
              [cut, ownerId, bu.user_id]
            );
            remaining -= cut;
          }
        }
      }


      await pool.query(
        `UPDATE banks SET last_dog_payment = $1 WHERE owner_id = $2`,
        [now, ownerId]
      );

      console.log(`[BSHOP] Guard Dog upkeep charged (400 coins from pool) for ${ownerId}.`);
    }
  } catch (err) {
    console.error("[BSHOP] runDogMaintenanceCycle error:", err.message);
  }
}



export function setupBShop(client) {

  initGuardDogTables().catch(err =>
    console.error("[BSHOP] initGuardDogTables error:", err.message)
  );


  runDogMaintenanceCycle(client).catch(() => {});


  setInterval(() => runDogMaintenanceCycle(client), 60 * 60 * 1000);


  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content !== "!bshop") return;



    if (await isDogGuardExpired()) return;

    try {

      const bankRes = await pool.query(
        `SELECT * FROM banks WHERE owner_id = $1`,
        [message.author.id]
      );
      if (!bankRes.rows[0]) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                "❌ waa in aad ahaata bank owner si aad u gashid bank owner shop."
              )
              .setColor(0xe74c3c),
          ],
        });
      }

      const bank = bankRes.rows[0];


      if (bank.has_guard_dog) {
        const statusLine = bank.dog_active
          ? "🟢 Guard Dog active walletkaagu waa la ilaalinayaa."
          : "🔴 Guard Dog inactive. u sheeg dadka in ay lacag dhigtan bangigaaga.";
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `🐕 **Hore ayaad u gadatay Guard Dog.**\n\n${statusLine}`
              )
              .setColor(bank.dog_active ? 0x2ecc71 : 0xe74c3c),
          ],
        });
      }


      const playerRes = await pool.query(
        `SELECT diamonds FROM players WHERE discord_id = $1`,
        [message.author.id]
      );
      const diamonds = Number(playerRes.rows[0]?.diamonds || 0);

      return message.reply({
        embeds: [buildBShopEmbed(diamonds)],
        components: [buildBShopRow(message.author.id)],
      });
    } catch (err) {
      console.error("[BSHOP] !bshop error:", err.message);
    }
  });


  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;


    if (interaction.customId.startsWith("bshop_confirm_")) {
      const ownerId = interaction.customId.replace("bshop_confirm_", "");

      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: "❌ Adiga ma lihid.",
          ephemeral: true,
        });
      }


      if (await isDogGuardExpired()) {
        return interaction.reply({
          content: "❌ Guard Dog waa la joojiyay.",
          ephemeral: true,
        });
      }

      await interaction.deferUpdate();

      try {

        const bankRes = await pool.query(
          `SELECT * FROM banks WHERE owner_id = $1`,
          [ownerId]
        );
        if (!bankRes.rows[0]) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ Bank lama helin.")
                .setColor(0xe74c3c),
            ],
            components: [],
          });
        }

        if (bankRes.rows[0].has_guard_dog) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription("❌ Hore ayaad u gadatay Guard Dog.")
                .setColor(0xe74c3c),
            ],
            components: [],
          });
        }


        const deductRes = await pool.query(
          `UPDATE players SET diamonds = diamonds - $1
           WHERE discord_id = $2 AND diamonds >= $1
           RETURNING diamonds`,
          [DOG_COST_DIAMONDS, ownerId]
        );

        if (!deductRes.rowCount) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setDescription(
                  `❌ Ma haysatid **${DOG_COST_DIAMONDS} 💎** Diamonds.\n\n` +
                  "💡 Diamonds ku hel: \`!daily\` · \`!vote\` · \`!dshop\`"
                )
                .setColor(0xe74c3c),
            ],
            components: [],
          });
        }


        await pool.query(
          `UPDATE banks SET has_guard_dog = true, dog_active = true, last_dog_payment = $1
           WHERE owner_id = $2`,
          [Date.now(), ownerId]
        );

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("🐕 Guard Dog Purchased!")
              .setDescription(
                "✅ **Guard Dog purchase successful!**\n\n" +
                "🛡️ Your wallet is now protected.\n\n" +
                "📌 **Xusus:**\n" +
                "• Dog-ku wuxuu shaqaynayaa xitaa haddaadan online ahayn\n" +
                `• **${DOG_UPKEEP_COINS} 🪙 coins** ayaa laga qaadayaa bank pool-kaaga marka **12 saacadood** dhammaadaan\n` +
                "• Haddii bankigaagu lacag yari → dog wuu xajinayaa"
              )
              .setColor(0x2ecc71),
          ],
          components: [],
        });
      } catch (err) {
        console.error("[BSHOP] bshop_confirm error:", err.message);
        return interaction.editReply({
          content: "❌ Server khalad. Isku day.",
          embeds: [],
          components: [],
        });
      }
    }


    if (interaction.customId.startsWith("bshop_cancel_")) {
      const ownerId = interaction.customId.replace("bshop_cancel_", "");

      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: "❌ Adigu maahan mid heshay.",
          ephemeral: true,
        });
      }

      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setDescription("❌ Purchase la joojiyay.")
            .setColor(0x95a5a6),
        ],
        components: [],
      });
    }
  });
}
