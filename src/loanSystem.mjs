





























import pg from "pg";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from "discord.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback" });


let _client = null;
const pendingLoans  = new Map();
const pendingRepays = new Map();
const pendingUnbans = new Map();
const loanCooldowns = new Map();




const loanStatusCache = new Map();
const LOAN_STATUS_CACHE_TTL = 5 * 60_000;


export const LOAN_TIERS = [
  { minLevel: 10,  maxLevel: 15,  maxLoan: 3000,   interestRate: 0.10, repayMs: 48 * 60 * 60 * 1000 },
  { minLevel: 16,  maxLevel: 20,  maxLoan: 5000,   interestRate: 0.10, repayMs: 48 * 60 * 60 * 1000 },
  { minLevel: 21,  maxLevel: 25,  maxLoan: 8000,   interestRate: 0.09, repayMs: 48 * 60 * 60 * 1000 },
  { minLevel: 26,  maxLevel: 35,  maxLoan: 12500,  interestRate: 0.09, repayMs: 72 * 60 * 60 * 1000 },
  { minLevel: 36,  maxLevel: 50,  maxLoan: 20000,  interestRate: 0.08, repayMs: 72 * 60 * 60 * 1000 },
  { minLevel: 51,  maxLevel: 80,  maxLoan: 50000,  interestRate: 0.07, repayMs: 72 * 60 * 60 * 1000 },
  { minLevel: 81,  maxLevel: 99,  maxLoan: 70000,  interestRate: 0.05, repayMs: 72 * 60 * 60 * 1000 },
  { minLevel: 100, maxLevel: 999, maxLoan: 100000, interestRate: 0.05, repayMs: 72 * 60 * 60 * 1000 },
];





const OWNER_ID = "974738506029084732";

const MIN_ACCOUNT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_SERVER_AGE_MS  =  7 * 24 * 60 * 60 * 1000;
const MIN_WALLET_COINS   = 500;
const MIN_DAILY_STREAK   = 3;
const MIN_LEVEL          = 10;
const LOAN_COOLDOWN_AFTER_REPAY_MS = 6 * 60 * 60 * 1000;
const MAX_PASSIVE_DRAIN  = 5_000;


async function initLoanTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        borrower_id   TEXT PRIMARY KEY,
        principal     INTEGER NOT NULL,
        amount_owed   INTEGER NOT NULL,
        interest_rate NUMERIC NOT NULL,
        issued_at     BIGINT  NOT NULL,
        due_at        BIGINT  NOT NULL,
        repaid_at     BIGINT,
        defaulted     BOOLEAN NOT NULL DEFAULT false,
        default_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loan_garnish_exempt (
        user_id TEXT PRIMARY KEY,
        reason  TEXT
      )
    `);
    await pool.query(`
      ALTER TABLE players ADD COLUMN IF NOT EXISTS credit_score INTEGER NOT NULL DEFAULT 0
    `);
    await pool.query(`
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_repaid_at BIGINT
    `);


    await pool.query(`
      ALTER TABLE players ADD COLUMN IF NOT EXISTS loan_default_count INTEGER NOT NULL DEFAULT 0
    `);
    await pool.query(`
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS credit_bonus_used BOOLEAN NOT NULL DEFAULT false
    `);
    console.log("[LOAN] ✅ Tables ready.");
  } catch (e) {
    console.error("[LOAN] initLoanTables error:", e.message);
  }
}


function getLoanTier(level) {
  return LOAN_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || null;
}




function getGarnishRate(defaultCount) {
  if (defaultCount >= 1) return 0.30;
  return 0.20;
}

function fmtDuration(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h` : `${m}m`;
}



export async function getActiveLoan(userId) {
  try {
    const exempt = await pool.query(
      `SELECT 1 FROM loan_garnish_exempt WHERE user_id = $1`, [userId]
    );
    if (exempt.rowCount > 0) return { permanently_banned: true };
    const r = await pool.query(
      `SELECT * FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL`,
      [userId]
    );
    return r.rows[0] || null;
  } catch (e) {
    console.error("[LOAN] getActiveLoan error:", e.message);
    return null;
  }
}

export async function hasActiveLoan(userId) {
  const loan = await getActiveLoan(userId);
  return !!(loan && !loan.permanently_banned);
}

export async function isPermaBanned(userId) {
  try {
    const r = await pool.query(`SELECT 1 FROM loan_garnish_exempt WHERE user_id = $1`, [userId]);
    return r.rowCount > 0;
  } catch {
    return false;
  }
}

export async function getCreditScore(userId) {
  try {
    const r = await pool.query(`SELECT credit_score FROM players WHERE discord_id = $1`, [userId]);
    return Number(r.rows[0]?.credit_score || 0);
  } catch {
    return 0;
  }
}


async function getActiveLoanAndCredit(userId) {
  try {
    const exempt = await pool.query(`SELECT 1 FROM loan_garnish_exempt WHERE user_id = $1`, [userId]);
    if (exempt.rowCount > 0) return { loan: { permanently_banned: true }, creditScore: 0 };
    const r = await pool.query(
      `SELECT l.*, p.credit_score
       FROM loans l
       JOIN players p ON p.discord_id = l.borrower_id
       WHERE l.borrower_id = $1 AND l.repaid_at IS NULL`,
      [userId]
    );
    if (!r.rows[0]) return { loan: null, creditScore: 0 };
    const { credit_score, ...loan } = r.rows[0];
    return { loan, creditScore: Number(credit_score || 0) };
  } catch (e) {
    console.error("[LOAN] getActiveLoanAndCredit error:", e.message);
    return { loan: null, creditScore: 0 };
  }
}





export async function applyGarnishment(userId, earnedAmount) {
  if (!earnedAmount || earnedAmount <= 0) {
    return { netAmount: earnedAmount, skimmed: 0, loanCleared: false };
  }

  const _lsc = loanStatusCache.get(userId);
  if (_lsc && !_lsc.hasLoan && Date.now() - _lsc.ts < LOAN_STATUS_CACHE_TTL) {
    return { netAmount: earnedAmount, skimmed: 0, loanCleared: false };
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");









    const loanRes = await client.query(
      `SELECT * FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL FOR UPDATE`,
      [userId]
    );
    if (loanRes.rowCount === 0) {
      await client.query("ROLLBACK");
      loanStatusCache.set(userId, { hasLoan: false, ts: Date.now() });
      return { netAmount: earnedAmount, skimmed: 0, loanCleared: false };
    }

    const loan        = loanRes.rows[0];
    const rate        = getGarnishRate(Number(loan.default_count || 0));
    let   skim        = Math.floor(earnedAmount * rate);
    if (skim <= 0) {
      await client.query("ROLLBACK");
      return { netAmount: earnedAmount, skimmed: 0, loanCleared: false };
    }

    const currentOwed       = Number(loan.amount_owed);
    const principal         = Number(loan.principal);
    skim                    = Math.min(skim, currentOwed);
    const newOwed           = Math.max(0, currentOwed - skim);
    const netAmount         = earnedAmount - skim;
    let   loanCleared       = false;


    const interestRemaining = Math.max(0, currentOwed - principal);
    const interestPortion   = Math.min(skim, interestRemaining);

    if (newOwed <= 0) {
      await client.query(
        `UPDATE loans SET amount_owed = 0, repaid_at = $1 WHERE borrower_id = $2 AND repaid_at IS NULL`,
        [Date.now(), userId]
      );
      await client.query(
        `UPDATE players SET credit_score = credit_score + 1 WHERE discord_id = $1`,
        [userId]
      );
      loanCleared = true;
      loanStatusCache.set(userId, { hasLoan: false, ts: Date.now() });
      console.log(`[LOAN] ${userId} loan cleared via garnishment`);
    } else {
      await client.query(
        `UPDATE loans SET amount_owed = $1 WHERE borrower_id = $2 AND repaid_at IS NULL`,
        [newOwed, userId]
      );
      console.log(`[LOAN] ${userId} garnished ${skim} coins — interest→treasury: ${interestPortion}, principal burned: ${skim - interestPortion} (${newOwed} remaining)`);
    }



    if (interestPortion > 0) {
      await client.query(
        `UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`,
        [interestPortion]
      );
    }

    await client.query("COMMIT");
    return { netAmount: Math.max(0, netAmount), skimmed: skim, loanCleared };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[LOAN] applyGarnishment error:", e.message);

    return { netAmount: earnedAmount, skimmed: 0, loanCleared: false };
  } finally {
    client.release();
  }
}


export async function applyIncome(userId, amount) {
  return await applyGarnishment(userId, amount);
}






export async function checkLoanEligibility(userId, member, player) {
  try {

    if (await isPermaBanned(userId)) {
      return { eligible: false, reason: "waxaa totaly ama gabi ahaanba ban lagaa saaray qaadashada daynta. **Labo jeer** ayaad bixin waysay." };
    }



    if ((player?.coins || 0) < 0) {
      return { eligible: false, reason: "Loan unavailable\nWaxaad wali bixinaysaa dayntii hore.\n\nFadlan sug ilaa wallet-kaagu uu dib ugu noqdo 0 ama ka badan." };
    }


    if (!player || (player.level || 1) < MIN_LEVEL) {
      return { eligible: false, reason: "waxaa u baahan tahay ugu yaraan in aad tahay **Level 10** si dayn u qaadatid." };
    }


    if ((player.dailyStreak || 0) < MIN_DAILY_STREAK) {
      return { eligible: false, reason: "waxaa u baahan tahay in aad **daily streak of 3+** days haysatid isticmaal `!daily` maalin walba." };
    }


    if ((player.coins || 0) < MIN_WALLET_COINS) {
      return { eligible: false, reason: `waxaad u baahan tahay ugu yaraan  **${MIN_WALLET_COINS} 🪙** in ay walletkaaga ku jirto.` };
    }


    if (member?.user?.createdTimestamp) {
      const accountAge = Date.now() - member.user.createdTimestamp;
      if (accountAge < MIN_ACCOUNT_AGE_MS) {
        return { eligible: false, reason: "Discordk accountgaaga waa in uu ugu yaraan jiraa **30 maalmood**." };
      }
    }


    if (member?.joinedTimestamp) {
      const serverAge = Date.now() - member.joinedTimestamp;
      if (serverAge < MIN_SERVER_AGE_MS) {
        return { eligible: false, reason: "waa in serverkan aad ku jirtay ugu yaraan **7 maalmood**." };
      }
    }



    const activeDefault = await pool.query(
      `SELECT 1 FROM loans WHERE borrower_id = $1 AND defaulted = true AND repaid_at IS NULL`,
      [userId]
    );
    if (activeDefault.rowCount > 0) {
      return { eligible: false, reason: "Dayntaada waxay ku jirtaa **default**. Waa in aad tan hore bixisaa `!loanpay` inta aadan mid cusub qaadan." };
    }


    if (await hasActiveLoan(userId)) {
      return { eligible: false, reason: "Horey ayaa dayn lagugu lahaa. iska bixi midaas marka hore `!loanpay`." };
    }


    const lastRepayRes = await pool.query(
      `SELECT last_repaid_at FROM loans WHERE borrower_id = $1 ORDER BY issued_at DESC LIMIT 1`,
      [userId]
    );
    const lastRepaidAt = Number(lastRepayRes.rows[0]?.last_repaid_at || 0);
    if (lastRepaidAt > 0 && Date.now() - lastRepaidAt < LOAN_COOLDOWN_AFTER_REPAY_MS) {
      const msLeft = LOAN_COOLDOWN_AFTER_REPAY_MS - (Date.now() - lastRepaidAt);
      const hLeft  = Math.floor(msLeft / 3_600_000);
      const mLeft  = Math.floor((msLeft % 3_600_000) / 60_000);
      return {
        eligible: false,
        reason: `Dayn cusub ma qaadan kartid hada. Sug **${hLeft}h ${mLeft}m** inta aadan mid cusub qaadan.`,
      };
    }

    return { eligible: true, reason: null };
  } catch (e) {
    console.error("[LOAN] checkLoanEligibility error:", e.message);
    return { eligible: false, reason: "Error ayaa dhacay. isku day mar kle." };
  }
}






export async function executeLoan(userId, amount, tier) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingLoan = await client.query(
      `SELECT 1 FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL`,
      [userId]
    );
    if (existingLoan.rowCount > 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "horey ayaad dayn u haysataa." };
    }
    if (amount > tier.maxLoan || amount < 100) {
      await client.query("ROLLBACK");
      return { success: false, reason: "Hubi xadiga lacagta aad galisay." };
    }


    const creditRes      = await client.query(
      `SELECT credit_score FROM players WHERE discord_id = $1 FOR UPDATE`, [userId]
    );

    const playerCredit   = Number(creditRes.rows[0]?.credit_score || 0);
    const isFreeInterest = playerCredit >= 10;
    const effectiveRate  = isFreeInterest ? 0 : tier.interestRate;
    const amountOwed     = isFreeInterest ? amount : Math.floor(amount * (1 + effectiveRate));
    const now            = Date.now();
    const dueAt          = now + tier.repayMs;



    await client.query(
      `INSERT INTO loans (borrower_id, principal, amount_owed, interest_rate, issued_at, due_at, defaulted, default_count, repaid_at, last_repaid_at, credit_bonus_used)
       VALUES ($1, $2, $3, $4, $5, $6, false, 0, NULL, NULL, $7)
       ON CONFLICT (borrower_id) DO UPDATE SET
         principal         = EXCLUDED.principal,
         amount_owed       = EXCLUDED.amount_owed,
         interest_rate     = EXCLUDED.interest_rate,
         issued_at         = EXCLUDED.issued_at,
         due_at            = EXCLUDED.due_at,
         defaulted         = false,
         default_count     = 0,
         repaid_at         = NULL,
         last_repaid_at    = loans.last_repaid_at,
         credit_bonus_used = EXCLUDED.credit_bonus_used`,
      [userId, amount, amountOwed, effectiveRate, now, dueAt, isFreeInterest]
    );

    await client.query(
      `UPDATE players SET coins = coins + $1 WHERE discord_id = $2`,
      [amount, userId]
    );


    if (isFreeInterest) {
      await client.query(`UPDATE players SET credit_score = 0 WHERE discord_id = $1`, [userId]);
    }

    await client.query("COMMIT");
    loanStatusCache.set(userId, { hasLoan: true, ts: Date.now() });
    console.log(`[LOAN] ${userId} took ${amount} coins, owes ${amountOwed}, due in ${fmtDuration(tier.repayMs)}`);
    return { success: true, amount, amountOwed, dueAt, tier, isFreeInterest };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[LOAN] executeLoan error:", e.message);
    return { success: false, reason: "Error ayaa dhacay. Isku day mar kale." };
  } finally {
    client.release();
  }
}



export async function executeRepay(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const loanRes = await client.query(
      `SELECT * FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL FOR UPDATE`,
      [userId]
    );
    if (loanRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "Deyn ma haysatid." };
    }
    const loan            = loanRes.rows[0];
    const amountOwed      = Number(loan.amount_owed);
    const principal       = Number(loan.principal);
    const interestRate    = Number(loan.interest_rate);





    const treasuryInterest = Math.max(0, amountOwed - principal);
    const displayInterest  = Math.floor(principal * interestRate);

    const playerRes = await client.query(
      `SELECT coins FROM players WHERE discord_id = $1 FOR UPDATE`, [userId]
    );
    const playerCoins = Number(playerRes.rows[0]?.coins || 0);
    if (playerCoins < amountOwed) {
      await client.query("ROLLBACK");
      const shortfall = amountOwed - playerCoins;
      return {
        success: false,
        reason: `Lacagta aad haysatid kuguma filna. Waxaad u baahan tahay **${amountOwed.toLocaleString()} 🪙** — waxaad haysataa **${playerCoins.toLocaleString()} 🪙** (waxaa kaa dhiamn: **${shortfall.toLocaleString()} 🪙**).`,
      };
    }

    await client.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2`,
      [amountOwed, userId]
    );
    const repaidNow = Date.now();
    await client.query(
      `UPDATE loans SET repaid_at = $1, amount_owed = 0, last_repaid_at = $1 WHERE borrower_id = $2 AND repaid_at IS NULL`,
      [repaidNow, userId]
    );



    if (treasuryInterest > 0) {
      await client.query(
        `UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`,
        [treasuryInterest]
      );
    }


    let creditBonus = 1;
    const halfWindow = Number(loan.issued_at) + (Number(loan.due_at) - Number(loan.issued_at)) / 2;
    if (Date.now() < halfWindow) creditBonus = 2;

    const creditRes = await client.query(
      `UPDATE players SET credit_score = credit_score + $1 WHERE discord_id = $2 RETURNING credit_score`,
      [creditBonus, userId]
    );

    await client.query("COMMIT");
    loanStatusCache.set(userId, { hasLoan: false, ts: Date.now() });

    const newCreditScore = Number(creditRes.rows[0]?.credit_score || 0);
    console.log(`[LOAN] ${userId} repaid ${amountOwed} coins. Treasury interest: ${treasuryInterest}. Display interest: ${displayInterest}. Principal: ${principal}. Credit +${creditBonus}`);


    return { success: true, principalPaid: principal, interestPaid: displayInterest, amountPaid: amountOwed, creditBonus, newCreditScore };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[LOAN] executeRepay error:", e.message);
    return { success: false, reason: "System error. Isku day mar kale." };
  } finally {
    client.release();
  }
}








async function processDefaultCheck() {
  try {
    const now = Date.now();


    const overdueLoans = await pool.query(
      `SELECT * FROM loans WHERE repaid_at IS NULL AND due_at < $1`,
      [now]
    );

    for (const loan of overdueLoans.rows) {
      const uid = loan.borrower_id;


      if (!loan.defaulted) {

        await pool.query(
          `UPDATE loans SET defaulted = true, default_count = default_count + 1 WHERE borrower_id = $1 AND repaid_at IS NULL`,
          [uid]
        );
        loanStatusCache.delete(uid);



        const lifeRes = await pool.query(
          `UPDATE players SET loan_default_count = loan_default_count + 1 WHERE discord_id = $1 RETURNING loan_default_count`,
          [uid]
        );
        const lifetimeDefaults = Number(lifeRes.rows[0]?.loan_default_count || 1);

        console.log(`[LOAN] ${uid} defaulted — lifetime_defaults = ${lifetimeDefaults}`);


        if (lifetimeDefaults >= 2) {
          await pool.query(
            `INSERT INTO loan_garnish_exempt (user_id, reason) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [uid, `Defaulted ${lifetimeDefaults} times`]
          );
          console.log(`[LOAN] ${uid} permanently banned from loans (${lifetimeDefaults} lifetime defaults)`);
        }


        try {
          if (_client) {
            const user = await _client.users.fetch(uid).catch(() => null);
            if (user) {
              const isPerma = lifetimeDefaults >= 2;
              await user.send({ embeds: [new EmbedBuilder()
                .setTitle("⚠️ Deyntaadii waqtigeeda waa dhacay!")
                .setDescription(
                  `Waqtigii aad ku bixin lahayd deyntaada wuu dhaafay.\n\n` +
                  `**Lacagta aad bixinayso:** ${Number(loan.amount_owed).toLocaleString()} 🪙\n\n` +
                  `Wakhtiga xiga aad wax heli doontid, **${getGarnishRate(1) * 100}%** ayaa si toos ah lagaaga qaadayaa.\n\n` +
                  (isPerma
                    ? `⛔ **Daynta waa lagaa mamnuucay gabi ahaanba.** Laba jeer ayaad diiday in aad bixiso.`
                    : `Dayn cusub waad qaadan kartaa haddaad tan bixiso — laakiin haddaad mar labaad bixin waydo waa laga xirayaa **gabi ahaanba**.`)
                )
                .setColor(isPerma ? 0xe74c3c : 0xe67e22)
                .setFooter({ text: "Nasiib Loan System" })
              ] }).catch(() => {});
            }
          }
        } catch {  }
      }

    }
  } catch (e) {
    console.error("[LOAN] processDefaultCheck error:", e.message);
  }
}

async function processPassiveDrain() {
  try {
    const now = Date.now();
    const overdueLoans = await pool.query(
      `SELECT * FROM loans WHERE repaid_at IS NULL AND due_at < $1`, [now]
    );

    for (const loan of overdueLoans.rows) {
      const uid              = loan.borrower_id;
      const msSinceOverdue   = now - Number(loan.due_at);
      const daysSinceOverdue = msSinceOverdue / (24 * 60 * 60 * 1000);


      if (daysSinceOverdue < 1) {
        console.log(`[LOAN] ${uid} in grace period (${daysSinceOverdue.toFixed(2)}d overdue) — no drain`);
        continue;
      }


      const drainRate  = daysSinceOverdue < 3 ? 0.15 : 0.25;
      const drainClient = await pool.connect();
      try {
        await drainClient.query("BEGIN");

        const playerRes = await drainClient.query(
          `SELECT coins FROM players WHERE discord_id = $1 FOR UPDATE`, [uid]
        );
        const wallet = Number(playerRes.rows[0]?.coins || 0);

        if (wallet > 0) {
          const loanRes = await drainClient.query(
            `SELECT amount_owed, principal FROM loans WHERE borrower_id = $1 AND repaid_at IS NULL FOR UPDATE`,
            [uid]
          );
          if (loanRes.rowCount > 0) {
            const currentOwed       = Number(loanRes.rows[0].amount_owed);
            const principal         = Number(loanRes.rows[0].principal);
            const drain             = Math.min(Math.floor(wallet * drainRate), currentOwed, MAX_PASSIVE_DRAIN);

            if (drain > 0) {

              const interestRemaining = Math.max(0, currentOwed - principal);
              const interestPortion   = Math.min(drain, interestRemaining);

              await drainClient.query(
                `UPDATE players SET coins = GREATEST(0, coins - $1) WHERE discord_id = $2`,
                [drain, uid]
              );
              await drainClient.query(
                `UPDATE loans SET amount_owed = GREATEST(0, amount_owed - $1) WHERE borrower_id = $2 AND repaid_at IS NULL`,
                [drain, uid]
              );
              if (interestPortion > 0) {
                await drainClient.query(
                  `UPDATE bot_wallet SET coins = coins + $1 WHERE id = 1`,
                  [interestPortion]
                );
              }
              console.log(`[LOAN] ${uid} passive drain ${drain} (${drainRate * 100}% | day ${daysSinceOverdue.toFixed(1)}) interest→treasury: ${interestPortion}`);



              if (drain >= currentOwed) {
                await drainClient.query(
                  `UPDATE loans SET repaid_at = $1 WHERE borrower_id = $2 AND repaid_at IS NULL`,
                  [Date.now(), uid]
                );
                loanStatusCache.set(uid, { hasLoan: false, ts: Date.now() });
                console.log(`[LOAN] ${uid} loan fully cleared by passive drain — repaid_at set`);
              }
            }
          }
        }

        await drainClient.query("COMMIT");
      } catch (drainErr) {
        await drainClient.query("ROLLBACK").catch(() => {});
        console.error(`[LOAN] passive drain error for ${uid}:`, drainErr.message);
      } finally {
        drainClient.release();
      }
    }
  } catch (e) {
    console.error("[LOAN] processPassiveDrain error:", e.message);
  }
}


function buildLoanConfirmEmbed(amount, tier, amountOwed, dueAt, isFreeInterest = false) {
  return new EmbedBuilder()
    .setTitle(isFreeInterest ? "🏦 Loan Confirmation — ⭐ Interest-Free!" : "🏦 Loan Confirmation")
    .setColor(isFreeInterest ? 0x2ecc71 : 0xf39c12)
    .addFields(
      { name: "Waxaad helaysaa",         value: `**${amount.toLocaleString()} 🪙**`,                                                                                         inline: true  },
      { name: "Waxaa lagugu yeelanayaa", value: isFreeInterest
          ? `**${amountOwed.toLocaleString()} 🪙** (0% interest — credit bonus! ⭐)`
          : `**${amountOwed.toLocaleString()} 🪙** (${Math.round(tier.interestRate * 100)}% interest)`,                                                                        inline: true  },
      { name: "Waqtiga bixinaysid",      value: `**${fmtDuration(tier.repayMs)}** · deadline: <t:${Math.floor(dueAt / 1000)}:f>`,                                            inline: false },
      isFreeInterest
        ? { name: "⭐ Credit Bonus Applied!", value: `Creditkaaga wuxuu gaadhay **10+**. Deyntaan **intrest  la'aan** ayaad ku bixinaysaa. Credit scorekaga **dib ayuu oga soo bilaabmayaa 0** marka aad deynta qaadatid.`, inline: false }
        : { name: "⚠️ Warning",              value: `Hadii aad ku bixin wayso waqtiga loogu tala galay, **${getGarnishRate(0) * 100}%** oo dakhligaaga ah ayaa lagaa jari doona ilaa aad bixiso. Labo jeer isku xigta aad bixin wayso = **gabi ahaanba ban**.`, inline: false },
    )
    .setFooter({ text: "Nasiib Loan System · 1 dayn markiiba" });
}

function buildLoanStatusEmbed(loan, creditScore) {
  const now     = Date.now();
  const isOver  = now > Number(loan.due_at);
  const msLeft  = Math.max(0, Number(loan.due_at) - now);
  const hLeft   = Math.floor(msLeft / 3_600_000);
  const mLeft   = Math.floor((msLeft % 3_600_000) / 60_000);
  const timeStr = isOver ? "⏰ OVERDUE" : `${hLeft}h ${mLeft}m remaining`;
  const principal   = Number(loan.principal);
  const amountOwed  = Number(loan.amount_owed);
  const interestOwed = Math.max(0, amountOwed - principal);

  return new EmbedBuilder()
    .setTitle("📋 Your Loan Status")
    .setColor(isOver ? 0xe74c3c : 0x2ecc71)
    .addFields(
      { name: "💸 Lacagta lagugu leeyahay", value: `**${amountOwed.toLocaleString()} 🪙**`,                                                         inline: true  },
      { name: "⏳ Waqtiga haray",           value: timeStr,                                                                                         inline: true  },
      { name: "📅 Deadline",                value: `<t:${Math.floor(Number(loan.due_at) / 1000)}:f>`,                                                inline: false },
      { name: "🏦 Principal",               value: `${principal.toLocaleString()} 🪙`,                                                              inline: true  },
      { name: "📈 Interest Remaining",      value: `${interestOwed.toLocaleString()} 🪙`,                                                           inline: true  },
      { name: "📊 Interest Rate",           value: `${Math.round(Number(loan.interest_rate) * 100)}%`,                                               inline: true  },
      { name: "⭐ Credit Score",            value: `${creditScore} ⭐`,                                                                              inline: true  },
      { name: "📌 Status",                  value: isOver
        ? `⛔ Default — **${getGarnishRate(Number(loan.default_count)) * 100}%** oo dakhliga ku soo gala ayaa auto lagaaga jarayaa`
        : `✅ Active — isticmaal \`!loanpay\` si aad iskaga bixisid`,                                                                                inline: false },
    )
    .setFooter({ text: "!loanpay to repay · Nasiib Loan System" });
}

function buildPermaBanEmbed() {
  return new EmbedBuilder()
    .setTitle("⛔ Gabi ahaanba waxaa lagaa xiray daynta")
    .setDescription("waxaa dayn bixin waysay **labo mar**.\n\nsidaas darteed **gabi ahaanba ban** ayaa kaa saaran qaadashada daynta.")
    .setColor(0xe74c3c)
    .setFooter({ text: "Nasiib Loan System" });
}







export async function handleLoanUnbanCommand(message, args) {
  try {
    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ Amarkan owner-ka keliya ayuu isticmaali karaa.");
    }
    const targetId = (args[1] || "").replace(/[<@!>]/g, "").trim();
    if (!targetId || !/^\d{5,25}$/.test(targetId)) {
      return message.reply("❌ Isticmaal: `!loan unban <UserID>`");
    }


    const targetUser = await message.client.users.fetch(targetId).catch(() => null);
    if (!targetUser) {
      return message.reply("❌ User-kaan lama helin.");
    }










    const banned = await isPermaBanned(targetId);
    const loanRes = await pool.query(
      `SELECT amount_owed, repaid_at FROM loans WHERE borrower_id = $1`,
      [targetId]
    );
    const loanRow       = loanRes.rows[0] || null;
    const hasUnpaidLoan = !!loanRow && loanRow.repaid_at === null;



    const amountOwed = hasUnpaidLoan ? Number(loanRow.amount_owed) : 0;

    if (!banned && !hasUnpaidLoan) {
      return message.reply("❌ User-kaan mana ban lagaa saaray daynta, mana haysto dayn aan la bixin.");
    }

    pendingUnbans.set(targetId, { executorId: message.author.id, amountOwed, expiresAt: Date.now() + 60_000 });

    const container = new ContainerBuilder()
      .setAccentColor(0xe67e22)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("# Ganaax Qaadis"))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Ma hubtaa inaad ganaaxa daynta ka qaaddo **${targetUser.username}**?`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `👤 **User**\n${targetUser.username}\n\n💰 **Daynta lagu leeyahay**\n<:Nasiibcoin:1506547787708366929> ${amountOwed.toLocaleString()}`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`loanunban_confirm_${targetId}`).setLabel("Confirm").setEmoji("✅").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`loanunban_cancel_${targetId}`).setLabel("Cancel").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
        )
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch (e) {
    console.error("[LOAN] handleLoanUnbanCommand error:", e.message);
    await message.reply("Khalad ayaa dhacay. Isku day mar kale.").catch(() => {});
  }
}


export async function handleLoanCommand(message, player, args) {
  try {
    const userId = message.author.id;



    if (args[0] === "unban") {
      return handleLoanUnbanCommand(message, args);
    }




    const _cdAmount = parseInt(args[0]);
    const _isLoanRequest = args[0] && !isNaN(_cdAmount) && _cdAmount > 0;
    if (_isLoanRequest) {
      const lastUse = loanCooldowns.get(userId) || 0;
      const elapsed = Date.now() - lastUse;
      if (elapsed < 30_000) {
        const wait = Math.ceil((30_000 - elapsed) / 1000);
        return message.reply(`Fadlan sug **${wait}s** inta aadan mar kale \`!loan\` isticmaalin.`);
      }
      loanCooldowns.set(userId, Date.now());
    }


    if (args[0] === "status") {
      await message.channel.sendTyping().catch(() => {});
      const { loan, creditScore } = await getActiveLoanAndCredit(userId);
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`loan_close_${userId}`)
          .setLabel("🗑️ Close")
          .setStyle(ButtonStyle.Danger)
      );
      if (!loan) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setTitle("✅ Wax dayn ah majiraan")
            .setDescription("ma jiraan wax dayn ah oo lagugu leeyahay.\n\nisticmaal `!loan <amount>` si mid u qaadatid (Level 10+ required).")
            .setColor(0x2ecc71)
          ],
          components: [closeRow],
        });
      }
      if (loan.permanently_banned) return message.reply({ embeds: [buildPermaBanEmbed()] });
      return message.reply({ embeds: [buildLoanStatusEmbed(loan, creditScore)], components: [closeRow] });
    }


    const amount = parseInt(args[0]);
    if (!args[0] || isNaN(amount) || amount <= 0) {
      await message.channel.sendTyping().catch(() => {});
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`loan_close_${userId}`)
          .setLabel("🗑️ Close")
          .setStyle(ButtonStyle.Danger)
      );
      return message.reply({
        embeds: [new EmbedBuilder()
          .setTitle("🏦 Nasiib Loan System")
          .setDescription([
            "**Commands:**",
            "`!loan <amount>` — qaado dayn",
            "`!loan status` — fiiri daymahaaga",
            "`!loanpay` — iska bixi daynta",
            "",
            "**Loan Tiers:**",
            "• Level 10–15 → max **3,000 🪙** (10% interest, 48h)",
            "• Level 16–20 → max **5,000 🪙** (10% interest, 48h)",
            "• Level 21–25 → max **8,000 🪙** (9% interest, 48h)",
            "• Level 26–35 → max **12,500 🪙** (9% interest, 72h)",
            "• Level 36–50 → max **20,000 🪙** (8% interest, 72h)",
            "• Level 51–80 → max **50,000 🪙** (7% interest, 72h)",
            "• Level 81–99 → max **70,000 🪙** (5% interest, 72h)",
            "• Level 100+ → max **100,000 🪙** (5% interest, 72h)",
            "",
            "**Requirements:**",
            "• Level 10+ · Daily streak 3+ · 500🪙 in wallet",
            "• Discord account 30+ days · In server 7+ days",
          ].join("\n"))
          .setColor(0x3498db)
          .setFooter({ text: "Nasiib Loan System" })
        ],
        components: [closeRow],
      });
    }


    await message.channel.sendTyping().catch(() => {});
    const member = message.guild ? await message.guild.members.fetch(userId).catch(() => null) : null;
    const eligibility = await checkLoanEligibility(userId, member, player);
    if (!eligibility.eligible) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("❌ Daynta waa la diiday")
        .setDescription(eligibility.reason)
        .setColor(0xe74c3c)
      ] });
    }

    const tier = getLoanTier(player.level || 1);
    if (!tier) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("❌ Level Too Low")
        .setDescription("waxaa u baahan tahay ugu yaraan in **Level 10** tahay si aad dayn u qaadatid.")
        .setColor(0xe74c3c)
      ] });
    }
    if (amount < 100) {
      return message.reply('Lacagta ugu yar ee daysan kartid waa **100 coins**.');
    }
    if (amount > tier.maxLoan) {
      return message.reply(`❌ Levelkaaga hada (Level ${player.level}) wuxuu kuu ogolanaya **${tier.maxLoan.toLocaleString()} 🪙** ugu badnaan in aad qaadatid.`);
    }


    const creditScoreRes  = await pool.query(`SELECT credit_score FROM players WHERE discord_id = $1`, [userId]);
    const currentCredit   = Number(creditScoreRes.rows[0]?.credit_score || 0);
    const isFreeInterest  = currentCredit >= 10;
    const amountOwed      = isFreeInterest ? amount : Math.floor(amount * (1 + tier.interestRate));
    const dueAt           = Date.now() + tier.repayMs;

    pendingLoans.set(userId, { amount, tier, amountOwed, expiresAt: Date.now() + 60_000, isFreeInterest });

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`loan_confirm_${userId}`)
        .setLabel("✅ Confirm Loan")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`loan_cancel_${userId}`)
        .setLabel("🗑️ Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    return message.reply({
      embeds: [buildLoanConfirmEmbed(amount, tier, amountOwed, dueAt, isFreeInterest)],
      components: [confirmRow],
    });
  } catch (e) {
    console.error("[LOAN] handleLoanCommand error:", e.message);
    await message.reply("Khalad ayaa dhacay. Please try again.").catch(() => {});
  }
}







export async function handleLoanPay(message, player) {
  try {
    const userId = message.author.id;
    await message.channel.sendTyping().catch(() => {});

    const loan = await getActiveLoan(userId);
    if (!loan) {
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("✅ Wax dayn ah majiran")
        .setDescription("ma jirto dayn lagugu leeyahay oo aad bixsid.")
        .setColor(0x2ecc71)
      ] });
    }
    if (loan.permanently_banned) return message.reply({ embeds: [buildPermaBanEmbed()] });

    const amountOwed   = Number(loan.amount_owed);
    const principal    = Number(loan.principal);
    const interestRate = Number(loan.interest_rate);



    const originalInterest = Math.floor(principal * interestRate);


    const freshRes = await pool.query(
      `SELECT coins FROM players WHERE discord_id = $1`, [userId]
    );
    const wallet = Number(freshRes.rows[0]?.coins || 0);

    if (wallet < amountOwed) {
      const shortfall = amountOwed - wallet;
      return message.reply({ embeds: [new EmbedBuilder()
        .setTitle("❌ Coins kuguma filna")
        .setDescription(
          `waxaad u baahan tahay: **${amountOwed.toLocaleString()} 🪙**\n` +
          `lacagta haysid waa: **${wallet.toLocaleString()} 🪙**\n` +
          `waxaa kaa dhiman: **${shortfall.toLocaleString()} 🪙**\n\n` +
          `shaqee inta dhiman — **${getGarnishRate(Number(loan.default_count)) * 100}%** oo dakhli ku soo gala waxaa laga jarayaa daynta si toos ah.`
        )
        .setColor(0xe74c3c)
      ] });
    }

    pendingRepays.set(userId, { amountOwed, expiresAt: Date.now() + 60_000 });

    const payRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`loanpay_confirm_${userId}`)
        .setLabel(`✅ Pay ${amountOwed.toLocaleString()} 🪙`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`loanpay_cancel_${userId}`)
        .setLabel("🗑️ Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    return message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("💳 Loan Repayment — Confirm")
        .setColor(0xf39c12)
        .addFields(
          { name: "🏦 Principal",         value: `${principal.toLocaleString()} 🪙`,                inline: true  },
          { name: "📈 Interest (orig)",  value: `${originalInterest.toLocaleString()} 🪙`,          inline: true  },
          { name: "💸 Total You Pay",    value: `**${amountOwed.toLocaleString()} 🪙**`,            inline: true  },
          { name: "💰 Wallet After",     value: `**${(wallet - amountOwed).toLocaleString()} 🪙**`, inline: true  },
        )
        .setFooter({ text: "Expires in 60 seconds · Nasiib Loan System" })
      ],
      components: [payRow],
    });
  } catch (e) {
    console.error("[LOAN] handleLoanPay error:", e.message);
    await message.reply("Khalad ayaa dhacay. Please try again.").catch(() => {});
  }
}


export async function handleLoanInteraction(interaction, storage) {
  const id  = interaction.customId;
  const uid = interaction.user.id;


  const knownPrefixes = ["loan_confirm_", "loan_cancel_", "loan_close_", "loanpay_confirm_", "loanpay_cancel_"];
  const isLoanButton  = knownPrefixes.some(p => id.startsWith(p));
  if (isLoanButton && !id.endsWith(`_${uid}`)) {
    return interaction.reply({ content: "Buttonkaaga ma ahan.", ephemeral: true });
  }


  if (id === `loan_confirm_${uid}`) {
    await interaction.deferReply({ ephemeral: false });
    try { await interaction.message.delete(); } catch {  }

    const pending = pendingLoans.get(uid);
    if (!pending || Date.now() > pending.expiresAt) {
      pendingLoans.delete(uid);
      return interaction.editReply({ content: "This request expired (60s). Run `!loan <amount>` again.", embeds: [], components: [] });
    }
    pendingLoans.delete(uid);


    const player = await storage.getPlayer(uid);
    const member = interaction.guild ? await interaction.guild.members.fetch(uid).catch(() => null) : null;
    const check  = await checkLoanEligibility(uid, member, player);
    if (!check.eligible) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setTitle("❌ Loan Denied").setDescription(check.reason).setColor(0xe74c3c)], components: [] });
    }

    const result = await executeLoan(uid, pending.amount, pending.tier);
    if (!result.success) {
      return interaction.editReply({ content: `❌ ${result.reason}`, embeds: [], components: [] });
    }
    return interaction.editReply({ embeds: [new EmbedBuilder()
      .setTitle("✅ Loan Approved!")
      .setColor(0x2ecc71)
      .addFields(
        { name: "💰 Waxaad heshay",    value: `**+${result.amount.toLocaleString()} 🪙**`,                                                         inline: true  },
        { name: "💸 Amount Owed",      value: `**${result.amountOwed.toLocaleString()} 🪙**`,                                                       inline: true  },
        { name: "📅 Repay Deadline",   value: `<t:${Math.floor(result.dueAt / 1000)}:f>`,                                                           inline: false },
        { name: "⚠️ Remember",         value: `**${getGarnishRate(0) * 100}%** oo dakhliga ku soo gala ayaa la jaraya intaa daynta iska bixinaysid. isticmaal \`!loanpay\` si aad iskaga bixisid.`, inline: false },
        ...(result.isFreeInterest
          ? [{ name: "⭐ Credit Bonus!", value: "Deyntaan **intrest  la'aan** ayaad ku heshay. Credit scorekaga dib ayuu u soo bilaabmay **0**.", inline: false }]
          : []
        ),
      )
      .setFooter({ text: "!loanpay to repay · !loan status to check" })
    ], components: [] });
  }


  if (id === `loan_cancel_${uid}`) {
    pendingLoans.delete(uid);
    try {
      await interaction.deferUpdate();
      await interaction.message.delete();
    } catch {
      await interaction.editReply({ content: "🗑️ Cancelled.", embeds: [], components: [] }).catch(() => {});
    }
    return;
  }


  if (id === `loan_close_${uid}`) {
    try {
      await interaction.deferUpdate();
      await interaction.message.delete();
    } catch {
      await interaction.editReply({ content: " ", embeds: [], components: [] }).catch(() => {});
    }
    return;
  }


  if (id === `loanpay_confirm_${uid}`) {
    await interaction.deferReply({ ephemeral: false });
    try { await interaction.message.delete(); } catch {  }

    const pending = pendingRepays.get(uid);
    if (!pending || Date.now() > pending.expiresAt) {
      pendingRepays.delete(uid);
      return interaction.editReply({ content: "Codsigan waqtigiisa wuu dhacay. samee `!loanpay` mar kle.", embeds: [], components: [] });
    }
    pendingRepays.delete(uid);
    const result = await executeRepay(uid);
    if (!result.success) {
      return interaction.editReply({ content: `❌ ${result.reason}`, embeds: [], components: [] });
    }
    return interaction.editReply({ embeds: [new EmbedBuilder()
      .setTitle("✅ Daynta si buuxda loo wada bixiyey!")
      .setColor(0x2ecc71)
      .addFields(
        { name: "🏦 Principal la bixiyey",  value: `${result.principalPaid.toLocaleString()} 🪙`,              inline: true  },
        { name: "📈 Interest la bixiyey",   value: `${result.interestPaid.toLocaleString()} 🪙`,               inline: true  },
        { name: "⭐ Credit Score",          value: `**${result.newCreditScore} ⭐** (+${result.creditBonus})`,  inline: true  },
        ...(result.creditBonus === 2
          ? [{ name: "🎉 Early Repayment Bonus!", value: "You repaid ahead of schedule — +2 credit score!", inline: false }]
          : []),
      )
      .setFooter({ text: "Nasiib Loan System" })
    ], components: [] });
  }


  if (id === `loanpay_cancel_${uid}`) {
    pendingRepays.delete(uid);
    try {
      await interaction.deferUpdate();
      await interaction.message.delete();
    } catch {
      await interaction.editReply({ content: "🗑️ Cancelled.", embeds: [], components: [] }).catch(() => {});
    }
    return;
  }






  if (id.startsWith("loanunban_confirm_") || id.startsWith("loanunban_cancel_")) {
    const isConfirm = id.startsWith("loanunban_confirm_");
    const targetId  = id.replace(isConfirm ? "loanunban_confirm_" : "loanunban_cancel_", "");
    const pending   = pendingUnbans.get(targetId);

    if (!pending || uid !== pending.executorId) {
      return interaction.reply({ content: "Buttonkaaga ma ahan.", ephemeral: true });
    }

    if (!isConfirm) {
      pendingUnbans.delete(targetId);
      try {
        await interaction.deferUpdate();
        await interaction.message.delete();
      } catch {
        await interaction.editReply({ content: "🗑️ Cancelled.", components: [] }).catch(() => {});
      }
      return;
    }

    await interaction.deferReply({ ephemeral: false });
    try { await interaction.message.delete(); } catch {  }

    if (Date.now() > pending.expiresAt) {
      pendingUnbans.delete(targetId);
      return interaction.editReply({ content: "Codsigan waqtigiisa wuu dhacay. samee `!loan unban` mar kale." });
    }
    pendingUnbans.delete(targetId);

    const result = await executeLoanUnban(targetId);
    if (!result.success) {
      return interaction.editReply({ content: `❌ ${result.reason}` });
    }
    const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);
    return interaction.editReply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Ganaaxa waa la qaaday")
        .setColor(0x2ecc71)
        .addFields(
          { name: "👤 User",              value: `${targetUser?.username || targetId}`,                       inline: true },
          { name: "💰 Dayn loo beddelay wallet", value: `${result.amountConverted.toLocaleString()} 🪙`,        inline: true },
          { name: "💼 Wallet cusub",       value: `${result.newBalance.toLocaleString()} 🪙`,                   inline: true },
        )
        .setFooter({ text: "User-kan hadda wuxuu dib u heli karaa loan marka wallet-kiisu gaadho 0+" })
      ],
    });
  }
}





async function executeLoanUnban(targetId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");



    const wasBanned = await client.query(
      `SELECT 1 FROM loan_garnish_exempt WHERE user_id = $1 FOR UPDATE`,
      [targetId]
    );
    const loanRes = await client.query(
      `SELECT borrower_id, amount_owed, repaid_at FROM loans WHERE borrower_id = $1 FOR UPDATE`,
      [targetId]
    );
    const loanRow       = loanRes.rows[0] || null;
    const hasUnpaidLoan = !!loanRow && loanRow.repaid_at === null;

    if (wasBanned.rowCount === 0 && !hasUnpaidLoan) {
      await client.query("ROLLBACK");
      return { success: false, reason: "User-kaan hadda ma jiro caqabad la xiriirta daynta (halkan iskeed ayey uga baxday)." };
    }


    await client.query(`DELETE FROM loan_garnish_exempt WHERE user_id = $1`, [targetId]);




    await client.query(`UPDATE players SET loan_default_count = 0 WHERE discord_id = $1`, [targetId]);




    const amountOwed = hasUnpaidLoan ? Number(loanRow.amount_owed) : 0;
    if (hasUnpaidLoan) {
      await client.query(
        `UPDATE loans SET repaid_at = NOW(), amount_owed = 0 WHERE borrower_id = $1`,
        [loanRow.borrower_id]
      );
    }


    const playerRes = await client.query(
      `UPDATE players SET coins = coins - $1 WHERE discord_id = $2 RETURNING coins`,
      [amountOwed, targetId]
    );

    await client.query("COMMIT");
    loanStatusCache.delete(targetId);
    return {
      success: true,
      amountConverted: amountOwed,
      newBalance: Number(playerRes.rows[0]?.coins ?? -amountOwed),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[LOAN] executeLoanUnban error:", e.message);
    return { success: false, reason: "Khalad ayaa dhacay." };
  } finally {
    client.release();
  }
}


export async function setupLoanSystem(client) {
  _client = client;
  await initLoanTables();


  setInterval(() => {
    processDefaultCheck().catch(e => console.error("[LOAN] default check error:", e.message));
  }, 10 * 60 * 1000);


  setInterval(() => {
    processPassiveDrain().catch(e => console.error("[LOAN] passive drain error:", e.message));
  }, 24 * 60 * 60 * 1000);


  setInterval(() => {
    const now = Date.now();
    for (const [uid, p] of pendingLoans)  { if (now > p.expiresAt) pendingLoans.delete(uid); }
    for (const [uid, p] of pendingRepays) { if (now > p.expiresAt) pendingRepays.delete(uid); }
    for (const [tid, p] of pendingUnbans) { if (now > p.expiresAt) pendingUnbans.delete(tid); }
    for (const [uid, t] of loanCooldowns) { if (now - t > 60_000)  loanCooldowns.delete(uid); }
  }, 30 * 1000);

  console.log("[LOAN] ✅ Loan system online.");
}
