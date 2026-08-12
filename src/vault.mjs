/**
 * vault.mjs — Vault System for Nasiib Bot
 */

import pg from "pg";
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TAX_DIAMONDS     = 200;
const TAX_COINS        = 1500;
const TAX_INTERVAL_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days
const TAX_GRACE_MS     = 72 * 60 * 60 * 1000;       // 72h grace before lock
const DOG_PHASE_OUT_MS = 72 * 60 * 60 * 1000;       // dog guard expires 72h after vault deploy
const COIN_EMOJI       = "<:Nasiibcoin:1506547787708366929>";
const IS_CV2           = 1 << 15;                   // MessageFlags.IsComponentsV2 = 32768

// ─── DB INIT ─────────────────────────────────────────────────────────────────

async function initVaultTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vaults (
      owner_id      TEXT    PRIMARY KEY,
      vault_balance BIGINT  NOT NULL DEFAULT 0,
      created_at    BIGINT  NOT NULL,
      next_tax_date BIGINT  NOT NULL,
      missed_months INTEGER NOT NULL DEFAULT 0,
      tax_locked    BOOLEAN NOT NULL DEFAULT false,
      dm_sent       BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vault_system (
      id          INTEGER PRIMARY KEY DEFAULT 1,
      deployed_at BIGINT  NOT NULL DEFAULT 0,
      CHECK (id = 1)
    )
  `);
  
  await pool.query(
    `INSERT INTO vault_system (id, deployed_at) VALUES (1, $1) ON CONFLICT (id) DO NOTHING`,
    [Date.now()]
  );
  console.log("[VAULT] ✅ Vault tables ready.");
}


export async function addVaultEarning(ownerId, amount) {
  if (!amount || amount <= 0) return false;
  try {
    const r = await pool.query(
      `UPDATE vaults SET vault_balance = vault_balance + $1
       WHERE owner_id = $2
       RETURNING owner_id`,
      [amount, ownerId]
    );
    return r.rowCount > 0;
  } catch (err) {
    console.error("[VAULT] addVaultEarning error:", err.message);
    return false;
  }
}


export async function isDogGuardActive(ownerId) {
  try {
    const sysR = await pool.query(
      `SELECT deployed_at FROM vault_system WHERE id = 1`
    );
    const deployedAt = Number(sysR.rows[0]?.deployed_at || 0);
    if (deployedAt > 0 && Date.now() - deployedAt >= DOG_PHASE_OUT_MS) {
      return false; 
    const r = await pool.query(
      `SELECT has_guard_dog, dog_active FROM banks WHERE owner_id = $1`,
      [ownerId]
    );
    const bank = r.rows[0];
    if (!bank) return false;
    return !!(bank.has_guard_dog && bank.dog_active);
  } catch {
    return false;
  }
}

export async function isDogGuardExpired() {
  try {
    const sysR = await pool.query(
      `SELECT deployed_at FROM vault_system WHERE id = 1`
    );
    const deployedAt = Number(sysR.rows[0]?.deployed_at || 0);
    return deployedAt > 0 && Date.now() - deployedAt >= DOG_PHASE_OUT_MS;
  } catch {
    return false; 
  }
}

// ─── INTERNAL HELPERS ────────────────────────────────────────────────────────

async function getDeployedAt() {
  try {
    const r = await pool.query(`SELECT deployed_at FROM vault_system WHERE id = 1`);
    return Number(r.rows[0]?.deployed_at || 0);
  } catch {
    return 0;
  }
}

async function dogRemainingHours() {
  const deployedAt = await getDeployedAt();
  if (!deployedAt) return 0;
  const remaining = DOG_PHASE_OUT_MS - (Date.now() - deployedAt);
  return Math.max(0, Math.ceil(remaining / 3_600_000));
}

function taxDebt(missedMonths) {
  const months = Math.max(1, missedMonths || 1);
  return {
    diamonds: TAX_DIAMONDS * months,
    coins: TAX_COINS * months,
  };
}



function cvCreateContainer(userId) {
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17, // Container
        accent_color: 0xf39c12,
        components: [
          {
            type: 10, // Text Display
            content: [
              "# hello bankowner",
              "",
              "vault waa nidaam cusub oo aad lacagta kaa soo gasha bankgaaga iyo bonuska bank ownerska kuugu soo dhici doonto adiga oo iska bixin doona khidmad yar oo bile ah.",
              "",
              `-# waxaad bixin doontaa **${TAX_DIAMONDS} diamonds** iyo **${TAX_COINS.toLocaleString()} coins** bil walba.`,
              "",
              ">>> vault lacag kuma shubi kartid mana soo dhigan kartid, kaliya waa kala bixi kartaa.",
              "",
              "Bisha koowaad wax lacag ah lagaama rabo.",
            ].join("\n"),
          },
          { type: 14 }, // Separator
          {
            type: 1, // Action Row
            components: [
              {
                type: 2,
                custom_id: `vault_confirm_${userId}`,
                label: "Confirm",
                style: 3, // Success
              },
              {
                type: 2,
                custom_id: `vault_close_${userId}`,
                label: "Close",
                style: 4, // Danger
              },
            ],
          },
        ],
      },
    ],
  };
}

function cvCreatedContainer(dogHours) {
  const dogLine =
    dogHours > 0
      ? `\n\n🐕 Dog guard mudo **${dogHours} saac** kadib automatic ayuu kaaga bixi doona.`
      : "";
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0x2ecc71,
        components: [
          {
            type: 10,
            content: `# congrats\n\nwaxaad furatay vault, si aad u isticmaashid kaliya qor **!vault**.${dogLine}`,
          },
        ],
      },
    ],
  };
}

function cvViewContainer(userId, balance) {
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0x2ecc71,
        components: [
          {
            type: 10,
            content: [
              "# your vault",
              "",
              "-# lacagta aad ka heshid ownercut iyo bankowner bonus waxay ku soo dhacayaan vaultgan.",
            ].join("\n"),
          },
          { type: 14 },
          {
            type: 10,
            content: `${COIN_EMOJI} **Vault Balance:** ${balance.toLocaleString()}`,
          },
          { type: 14 },
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: `vault_withdraw_${userId}`,
                label: "Withdraw",
                style: 1, // Primary
              },
              {
                type: 2,
                custom_id: `vault_close_${userId}`,
                label: "Close",
                style: 4,
              },
            ],
          },
        ],
      },
    ],
  };
}

function cvLockedContainer() {
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0xe74c3c,
        components: [
          {
            type: 10,
            content: [
              "# limited access",
              "",
              "Si aad access ugu heshid vault gaaga fadlan iska bixi canshuurta bilaha adiga oo qoraya **!paytax**.",
              "",
              "Mahadsanid.",
            ].join("\n"),
          },
        ],
      },
    ],
  };
}

function cvTaxConfirmContainer(userId, missedMonths) {
  const { diamonds, coins } = taxDebt(missedMonths);
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0xe67e22,
        components: [
          {
            type: 10,
            content: [
              "# hubi bixinta canshuurta",
              "",
              "-# 1 bil kadib ayaa mar kale bixin doontaa canshuurta vaultga.",
              "",
              `**Bixin doontaa:** ${diamonds.toLocaleString()} 💎 + ${coins.toLocaleString()} ${COIN_EMOJI}`,
              "",
              "Fadlan taabo pay.",
              "",
              "Mahadsanid.",
            ].join("\n"),
          },
          { type: 14 },
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: `vault_paytax_pay_${userId}`,
                label: "Pay",
                style: 3,
              },
              {
                type: 2,
                custom_id: `vault_paytax_close_${userId}`,
                label: "Close",
                style: 4,
              },
            ],
          },
        ],
      },
    ],
  };
}

function cvNotEnoughContainer() {
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0xe74c3c,
        components: [
          {
            type: 10,
            content: [
              "hubi in walletkaaga ku jirto",
              "",
              `**${TAX_DIAMONDS} diamonds**`,
              "iyo",
              `**${TAX_COINS.toLocaleString()} nasiib coin**`,
            ].join("\n"),
          },
        ],
      },
    ],
  };
}

function cvTaxLockedDmContainer(userId, missedMonths) {
  const { diamonds, coins } = taxDebt(missedMonths);
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0xe74c3c,
        components: [
          {
            type: 10,
            content: [
              "# nasiib tax system",
              "",
              "-# hello, hadii aad vault waysid waxay ka dhigan tahay in lacag walba oo hada kadib vault soo gasha aadan awoodin in aad la soo baxdid oo ay kaa xayirnaanayso.",
              "",
              `**Lacagta aad bixinayso:** ${diamonds.toLocaleString()} 💎 + ${coins.toLocaleString()} ${COIN_EMOJI}`,
              "",
              "Fadlan iska bixi canshuurta bilaha adiga oo taabanaya kaliya buttonka hoose.",
            ].join("\n"),
          },
          { type: 14 },
          {
            type: 1,
            components: [
              {
                type: 2,
                custom_id: `vault_paynow_${userId}`,
                label: "PayNow",
                style: 3,
              },
            ],
          },
        ],
      },
    ],
  };
}

function cvThanksContainer() {
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0x2ecc71,
        components: [
          {
            type: 10,
            content: "# thanks for paying the tax",
          },
        ],
      },
    ],
  };
}

function cvNotBankOwner() {
  return {
    flags: IS_CV2,
    components: [
      {
        type: 17,
        accent_color: 0xe74c3c,
        components: [
          {
            type: 10,
            content: "-# kaliya bank owners ayaa isticmaali kara vault.",
          },
        ],
      },
    ],
  };
}

// ─── COMMAND: !vault ─────────────────────────────────────────────────────────

async function handleVaultCommand(message) {
  const userId = message.author.id;
  try {
    // Must be a bank owner
    const bankR = await pool.query(
      `SELECT owner_id FROM banks WHERE owner_id = $1`,
      [userId]
    );
    if (!bankR.rows[0]) {
      return message.reply(cvNotBankOwner());
    }

    // Check if vault already exists
    const vaultR = await pool.query(
      `SELECT * FROM vaults WHERE owner_id = $1`,
      [userId]
    );

    if (!vaultR.rows[0]) {
      return message.reply(cvCreateContainer(userId));
    }

    const vault = vaultR.rows[0];

    if (vault.tax_locked) {
      return message.reply(cvLockedContainer());
    }

    return message.reply(cvViewContainer(userId, Number(vault.vault_balance)));
  } catch (err) {
    console.error("[VAULT] !vault error:", err.message);
  }
}

// ─── COMMAND: !paytax ────────────────────────────────────────────────────────

async function handlePaytaxCommand(message) {
  const userId = message.author.id;
  try {
    const vaultR = await pool.query(
      `SELECT * FROM vaults WHERE owner_id = $1`,
      [userId]
    );

    if (!vaultR.rows[0]) {
      const m = await message.reply("-# ma haysatid vault.");
      setTimeout(() => m.delete().catch(() => {}), 5000);
      return;
    }

    const vault = vaultR.rows[0];
    const now = Date.now();

    // Not yet due
    if (now < Number(vault.next_tax_date)) {
      const m = await message.reply("-# horey ayaad tax bishaan u bixisay");
      setTimeout(() => m.delete().catch(() => {}), 5000);
      return;
    }

    
    const months = vault.tax_locked
      ? Math.max(1, vault.missed_months || 1)
      : 1;
    return message.reply(cvTaxConfirmContainer(userId, months));
  } catch (err) {
    console.error("[VAULT] !paytax error:", err.message);
  }
}

// ─── BUTTON: vault_confirm_ ──────────────────────────────────────────────────

async function handleVaultConfirm(interaction) {
  const userId = interaction.customId.replace("vault_confirm_", "");
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ Adigu kuma saabsana.", flags: 64 });
  }

  await interaction.deferUpdate();

  try {
    
    const bankR = await pool.query(
      `SELECT owner_id FROM banks WHERE owner_id = $1`,
      [userId]
    );
    if (!bankR.rows[0]) {
      return interaction.editReply({
        flags: IS_CV2,
        components: [
          { type: 17, accent_color: 0xe74c3c, components: [
            { type: 10, content: "❌ Bank lama helin." },
          ]},
        ],
      });
    }

    // Guard against double-create
    const existR = await pool.query(
      `SELECT owner_id FROM vaults WHERE owner_id = $1`,
      [userId]
    );
    if (existR.rows[0]) {
      return interaction.editReply({
        flags: IS_CV2,
        components: [
          { type: 17, accent_color: 0xe74c3c, components: [
            { type: 10, content: "❌ Hore ayaad u furatay vault." },
          ]},
        ],
      });
    }

    const now         = Date.now();
    const nextTaxDate = now + TAX_INTERVAL_MS; // first month free

    await pool.query(
      `INSERT INTO vaults (owner_id, vault_balance, created_at, next_tax_date, missed_months, tax_locked, dm_sent)
       VALUES ($1, 0, $2, $3, 0, false, false)`,
      [userId, now, nextTaxDate]
    );

    const hours = await dogRemainingHours();
    return interaction.editReply(cvCreatedContainer(hours));
  } catch (err) {
    console.error("[VAULT] vault_confirm error:", err.message);
    return interaction.editReply({ content: "❌ Server khalad. Isku day." });
  }
}

// ─── BUTTON: vault_close_ / vault_paytax_close_ ──────────────────────────────

async function handleClose(interaction) {
  const userId = interaction.customId.includes("vault_paytax_close_")
    ? interaction.customId.replace("vault_paytax_close_", "")
    : interaction.customId.replace("vault_close_", "");

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ adiga ma lihid .", flags: 64 });
  }

 
  await interaction.deferUpdate();
  await interaction.message.delete().catch(() => {});
}

// ─── BUTTON: vault_withdraw_ ─────────────────────────────────────────────────

async function handleVaultWithdraw(interaction) {
  const userId = interaction.customId.replace("vault_withdraw_", "");
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ Adiga ma  lihid.", flags: 64 });
  }

  const modal = new ModalBuilder()
    .setCustomId(`vault_withdraw_modal_${userId}`)
    .setTitle("your vault")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("vault_amount")
          .setLabel("Lacagta aad rabtid in la baxdid")
          .setPlaceholder("gali lacagta aad rabtid in la baxdid")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(20)
      )
    );

  await interaction.showModal(modal);
}

// ─── MODAL SUBMIT: vault_withdraw_modal_ ─────────────────────────────────────

async function handleWithdrawModal(interaction) {
  const userId = interaction.customId.replace("vault_withdraw_modal_", "");
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ Adiga ma lihid.", flags: 64 });
  }

  const rawInput = interaction.fields.getTextInputValue("vault_amount");
  const amount   = parseInt(rawInput.replace(/,/g, ""), 10);

  if (isNaN(amount) || amount <= 0) {
    return interaction.reply({ content: "❌ Nambar sax ah geli.", flags: 64 });
  }

  await interaction.deferReply({ flags: 64 }); // ephemeral "thinking"

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atomic deduct: requires sufficient balance AND vault must not be locked
    const r = await client.query(
      `UPDATE vaults
       SET vault_balance = vault_balance - $1
       WHERE owner_id = $2
         AND vault_balance >= $1
         AND tax_locked = false
       RETURNING vault_balance`,
      [amount, userId]
    );

    if (!r.rowCount) {
      await client.query("ROLLBACK");

      // Distinguish insufficient balance vs locked
      const chkR = await pool.query(
        `SELECT vault_balance, tax_locked FROM vaults WHERE owner_id = $1`,
        [userId]
      );
      const v = chkR.rows[0];
      if (!v) {
        return interaction.editReply({ content: "❌ Vault lama helin." });
      }
      if (v.tax_locked) {
        return interaction.editReply({
          content: "❌ Vault waa xayiran yahay. Bix canshuurta marka hore adiga oo qoraya **!paytax**.",
        });
      }
      return interaction.editReply({ content: "❌ lacag ku filan kuuguma jirto." });
    }

    const newBalance = Number(r.rows[0].vault_balance);

    
    await client.query(
      `UPDATE players SET coins = coins + $1 WHERE discord_id = $2`,
      [amount, userId]
    );

    await client.query("COMMIT");

    return interaction.editReply({
      content: [
        `waxaad vault kala baxday **${amount.toLocaleString()} ${COIN_EMOJI}**`,
        ``,
        `waxaa kuugu hartay **${newBalance.toLocaleString()} ${COIN_EMOJI}**`,
      ].join("\n"),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[VAULT] withdraw modal error:", err.message);
    return interaction.editReply({ content: "❌ Server khalad. Isku day." });
  } finally {
    client.release();
  }
}



async function handleTaxPayment(interaction, isPayNow) {
  const prefix  = isPayNow ? "vault_paynow_" : "vault_paytax_pay_";
  const userId  = interaction.customId.replace(prefix, "");

  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ Adigu kuma saabsana.", flags: 64 });
  }

  await interaction.deferUpdate();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock vault row for this transaction
    const vaultR = await client.query(
      `SELECT * FROM vaults WHERE owner_id = $1 FOR UPDATE`,
      [userId]
    );
    if (!vaultR.rows[0]) {
      await client.query("ROLLBACK");
      return interaction.editReply({ content: "❌ Vault lama helin." });
    }

    const vault        = vaultR.rows[0];
    const missedMonths = Math.max(1, vault.missed_months || 1);
    const { diamonds, coins } = taxDebt(missedMonths);

    // si atomic ah ayaa playerka lacagta looga jarayaa
    const deductR = await client.query(
      `UPDATE players
       SET diamonds = diamonds - $1,
           coins    = coins    - $2
       WHERE discord_id = $3
         AND diamonds >= $1
         AND coins    >= $2
       RETURNING diamonds, coins`,
      [diamonds, coins, userId]
    );

    if (!deductR.rowCount) {
      await client.query("ROLLBACK");
      if (isPayNow) {
        return interaction.editReply({
          flags: IS_CV2,
          components: [
            { type: 17, accent_color: 0xe74c3c, components: [
              { type: 10, content: "# not enough\n\n-# dhib malahan soo noqo markaa heshid qiimo kugu filan kadib taabo paynow." },
            ]},
          ],
        });
      }
      return interaction.editReply(cvNotEnoughContainer());
    }

    
    const baseDue     = Math.max(Number(vault.next_tax_date), Date.now());
    const nextTaxDate = baseDue + TAX_INTERVAL_MS;

    await client.query(
      `UPDATE vaults
       SET missed_months = 0,
           tax_locked    = false,
           dm_sent       = false,
           next_tax_date = $1
       WHERE owner_id = $2`,
      [nextTaxDate, userId]
    );

    await client.query("COMMIT");

    await interaction.editReply(cvThanksContainer());

    // Auto-delete after 5 seconds
    setTimeout(() => interaction.message?.delete().catch(() => {}), 5000);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[VAULT] tax payment error:", err.message);
    return interaction.editReply({ content: "❌ Server khalad. Isku day." });
  } finally {
    client.release();
  }
}

// ─── TAX MAINTENANCE CYCLE ──────────────────────────────────────────

async function runTaxCycle(discordClient) {
  try {
    const now    = Date.now();
    const dueR   = await pool.query(
      `SELECT * FROM vaults WHERE next_tax_date <= $1`,
      [now]
    );

    for (const vault of dueR.rows) {
      const ownerId   = vault.owner_id;
      const nextTax   = Number(vault.next_tax_date);
      const overdue   = now - nextTax;
      const dmSent    = vault.dm_sent;
      const taxLocked = vault.tax_locked;
      const missed    = vault.missed_months || 0;

      if (!dmSent && overdue < TAX_GRACE_MS) {
        // ── Phase 1: tax just became due — 72h warning DM ──────────────────
        try {
          const owner = await discordClient.users.fetch(ownerId);
          await owner.send(
            `Hello **${owner.username}**,\n\n` +
            `maanta waxaa kuugu buuxdo mudo 1 bil ah kadib furashada \`!vault\`.\n\n` +
            `Fadlan tag server uu nasiib ku jiro kadibna qor **!paytax** si aad iskaga bixisid canshuurta bilaha ee vaultga.\n\n` +
            `Waxad haysataa **72 saac**.`
          );
        } catch {
          // DMs closed — silently skip
        }
        await pool.query(
          `UPDATE vaults SET dm_sent = true WHERE owner_id = $1`,
          [ownerId]
        );
      } else if (overdue >= TAX_GRACE_MS && !taxLocked) {
        // ── Phase 2: 72h grace expired — lock vault, DM PayNow ─────────────
        const newMissed = missed + 1;
        await pool.query(
          `UPDATE vaults
           SET tax_locked    = true,
               missed_months = $1
           WHERE owner_id = $2`,
          [newMissed, ownerId]
        );
        try {
          const owner = await discordClient.users.fetch(ownerId);
          await owner.send(cvTaxLockedDmContainer(ownerId, newMissed));
        } catch {
          // DMs closed — silently skip
        }
      }
    }
  } catch (err) {
    console.error("[VAULT] runTaxCycle error:", err.message);
  }
}

// ─── SETUP ───────────────────────────────────────────────────────────────────

export function setupVault(client) {
  initVaultTables().catch(err =>
    console.error("[VAULT] initVaultTables error:", err.message)
  );

  
  runTaxCycle(client).catch(() => {});
  setInterval(() => runTaxCycle(client), 6 * 60 * 60 * 1000);

  // ── messageCreate ───────────────────────────────────────────────────────────
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    const cmd = message.content.trim().toLowerCase();
    if (cmd === "!vault")  return handleVaultCommand(message);
    if (cmd === "!paytax") return handlePaytaxCommand(message);
  });

  // ── interactionCreate ───────────────────────────────────────────────────────
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id.startsWith("vault_paytax_close_")) return handleClose(interaction);
      if (id.startsWith("vault_paytax_pay_"))   return handleTaxPayment(interaction, false);
      if (id.startsWith("vault_paynow_"))        return handleTaxPayment(interaction, true);
      if (id.startsWith("vault_confirm_"))       return handleVaultConfirm(interaction);
      if (id.startsWith("vault_close_"))         return handleClose(interaction);
      if (id.startsWith("vault_withdraw_"))      return handleVaultWithdraw(interaction);
    }
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("vault_withdraw_modal_"))
        return handleWithdrawModal(interaction);
    }
  });

  console.log("[VAULT] ✅ Vault system ready. Dog guard expires in 72h from first deploy.");
}
