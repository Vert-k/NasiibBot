/**
 * verifySystem.mjs — Nasiib Verification System
 
 */

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

// ─── CONFIG ──────────────────────────────────────────────────────────────────

export const PRIVACY_URL   = "https://github.com/Vert-k/.md/blob/70835ba838c91e1a05c1a287b8e5837d5ac17bad/Privacy%26policy.md";
export const TOS_URL       = "https://github.com/Vert-k/.md/blob/df9319bc782ace038d3dbeb29d13f210a37fd950/Terms-of-service.md";
export const NW_MILESTONE  = 950_000;
export const VERIFY_BADGE = "<:verify:1505450667064692817>";

const VERIFY_COINS    = 10_000;
const VERIFY_DIAMONDS = 200;

// ─── EMBED BUILDER ───────────────────────────────────────────────────────────

export function buildVerifyEmbed(displayName) {
  return new EmbedBuilder()
    .setTitle("🔐 Nasiib Verification")
    .setDescription(
      `Salaam **${displayName}**! 👋\n\n` +
      `hantidaada guud ee nasiib waxay u dhawaatay **1,000,000 🪙** — midaas oo xaqiidii ah guul weyn!\n\n` +
      `**Si aad 1M ka badan u haysato oo aad xisaabtaada ugu darto, waa inaad:**\n\n` +
      `📋 **1.** Akhriso oo aqbasho **[Privacy & Policy](${PRIVACY_URL})**\n` +
      `📜 **2.** Akhriso oo aqbasho **[Terms of Service](${TOS_URL})**\n\n` +
      `Marka aad aqbasho labadaba, xisaabtaadu waxay noqon doontaa **✅ Verified** — ` +
      `waxaad helaysaa badge gaar ah oo profile kaaga ka muuqanaysa \n\niyo abaal marin kuu gaar ah.` +
      `⚠️ Haddaadan aqbalin, Hantidaada kor uma dhaafayso 1M.`
    )
    .addFields(
      { name: "🎁 Abaalmarinta Verification", value: `**+${VERIFY_DIAMONDS} 💎 Diamonds**\n**+${VERIFY_COINS.toLocaleString()} 🪙 Coins**`, inline: true },
      { name: "✅ Faa'iidada",                value: "Walletkaaga oo aan kaa xadidnayn\nVerified badge profile", inline: true },
    )
    .setColor(0x5865f2)
    .setFooter({ text: "Nasiib Verification System · Xogtaada waa ammaan" })
    .setTimestamp();
}

// ─── NET WORTH MILESTONE DM ──────────────────────────────────────────────────

export async function checkNetWorthMilestone(userId, client) {
  try {
    const playerRes = await pool.query(
      `SELECT discord_id, username, is_verified, nw_milestone_dm_sent,
              coins,
              COALESCE(CAST(game_stats->'invest'->>'amount' AS BIGINT), 0) AS bot_invest
       FROM players WHERE discord_id = $1`,
      [userId]
    );
    const player = playerRes.rows[0];
    if (!player) return;
    if (player.is_verified) return;
    if (player.nw_milestone_dm_sent) return;

    const [buRes, biRes] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(deposited + profit), 0) AS total FROM bank_users WHERE user_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM bank_investments WHERE user_id = $1`,
        [userId]
      ),
    ]);

    const wallet     = Number(player.coins || 0);
    const botInvest  = Number(player.bot_invest || 0);
    const bankDep    = Number(buRes.rows[0]?.total || 0);
    const bankInvest = Number(biRes.rows[0]?.total || 0);
    const netWorth   = wallet + botInvest + bankDep + bankInvest;

    if (netWorth < NW_MILESTONE) return;

    await pool.query(
      `UPDATE players SET nw_milestone_dm_sent = true WHERE discord_id = $1`,
      [userId]
    );

    const discordUser = await client.users.fetch(userId).catch(() => null);
    if (!discordUser) return;

    const member = client.guilds.cache
      .map(g => g.members.cache.get(userId))
      .find(m => m);
    const displayName = member?.displayName || player.username || discordUser.username;

    const embed = buildVerifyEmbed(displayName);
    embed.setThumbnail(discordUser.displayAvatarURL({ dynamic: true, size: 128 }));

    const verifyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_accept_${userId}`)
        .setLabel("✅ I Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`verify_reject_${userId}`)
        .setLabel("❌ I Reject")
        .setStyle(ButtonStyle.Danger)
    );

    await discordUser.send({ embeds: [embed], components: [verifyRow] }).catch(() => {
      console.log(`[VERIFY] Could not DM ${userId} — DMs may be closed`);
    });

    console.log(`[VERIFY] Milestone DM sent to ${userId} (net worth: ${netWorth.toLocaleString()})`);
  } catch (err) {
    console.error("[VERIFY] checkNetWorthMilestone error:", err.message);
  }
}

// ─── INTERACTION HANDLER ─────────────────────────────────────────────────────

export function setupVerifyInteractions(client, storage, appPool, logEconomy) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    // ── Verify Accept ──────────────────────────────────────────────────────────
    if (interaction.customId.startsWith("verify_accept_")) {
      const ownerId = interaction.customId.replace("verify_accept_", "");
      if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: "❌ Buttonkaga ma ahan.", ephemeral: true });
      }
      try {
        await interaction.deferUpdate();

        const vRes = await appPool.query(
          `SELECT is_verified, verify_reward_claimed FROM players WHERE discord_id = $1`,
          [ownerId]
        );
        const vRow = vRes.rows[0];

        if (vRow?.is_verified) {
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setTitle("✅ Hambalyo horey ayaad verified u ahay")
              .setDescription("accountgaaga horey ayuu verified u ahaa.")
              .setColor(0x2ecc71)
            ],
            components: []
          });
        }

        await appPool.query(
          `UPDATE players SET is_verified = true, verify_reward_claimed = true WHERE discord_id = $1`,
          [ownerId]
        );

        await storage.addCoins(ownerId, VERIFY_COINS);
        await storage.addDiamonds(ownerId, VERIFY_DIAMONDS);

        await appPool.query(
          `UPDATE bot_wallet SET coins = GREATEST(0, coins - $1) WHERE id = 1`,
          [VERIFY_COINS]
        ).catch(() => {});

        logEconomy(ownerId, "verify-reward-coins",    VERIFY_COINS,    "gain");
        logEconomy(ownerId, "verify-reward-diamonds", VERIFY_DIAMONDS, "gain");

        console.log(`[VERIFY] ${ownerId} accepted — rewarded ${VERIFY_COINS} coins + ${VERIFY_DIAMONDS} diamonds`);

        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle("✅ Verified — Mahadsanid!")
            .setDescription(
              "Waad ku mahadsan tahay aqbalistaada iyo ciyaarista nasiib! 🎉\n\n" +
              "**Abaalmarintaada:**\n" +
              `💎 **+${VERIFY_DIAMONDS} Diamonds** ayaa wallet kaaga lagu daray\n` +
              `🪙Sidoo kale  **+${VERIFY_COINS.toLocaleString()} Coins** ayaa wallet kaaga lagu daray\n\n` +
              "**✅ accountgaaga hadda waa Verified!**\n" +
              "waxaad heshay badge verified oo kaaga soo muuqanaysa profilekaaga`.\n\n" +
              "Hada kadib lacagta aad haysan kartid xad malahan. 🏆"
            )
            .setColor(0x2ecc71)
            .setFooter({ text: "Nasiib Verification · Welcome to the verified community" })
            .setTimestamp()
          ],
          components: []
        });
      } catch (err) {
        console.error("[VERIFY] accept error:", err.message);
        try {
          await interaction.editReply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", embeds: [], components: [] });
        } catch {}
      }
      return;
    }

    // ── Verify Reject ──────────────────────────────────────────────────────────
    if (interaction.customId.startsWith("verify_reject_")) {
      const ownerId = interaction.customId.replace("verify_reject_", "");
      if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: "❌ Buttonkaaga ma ahan.", ephemeral: true });
      }
      try {
        return interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle("❌ Verificat Rejected")
            .setDescription(
              "waxaad diiday xaqiijinta accountgaaga xaqna waa u leedahay.\n\n" +
              "⚠️ **Ogow:** Lacagta **1,000,000 🪙** ka saraysa waa la xadidayaa " +
              "ilaa aad verify samayso.\n\n" +
              "💡 hadii aad damacdo in mar kale verify dhahdo, qor:\n" +
              "`!verify`"
            )
            .setColor(0xe74c3c)
            .setFooter({ text: "Nasiib Verification · !verify dheh oo lacag walpa ku qaado walletkaaga" })
          ],
          components: []
        });
      } catch (err) {
        console.error("[VERIFY] reject error:", err.message);
      }
      return;
    }
  });
}
