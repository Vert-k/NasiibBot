import { pool } from './db.mjs';


var CARD_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var CARD_SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
function createDeck() {
  const deck = [];
  for (const r of CARD_RANKS) for (const s of CARD_SUITS) deck.push(`${r}${s}`);
  return deck.sort(() => Math.random() - 0.5);
}
function dealCards(players2) {
  const deck = createDeck();
  let i = 0;
  while (i < deck.length) {
    for (const p of players2) {
      if (i < deck.length) {
        p.hand.push(deck[i]);
        i++;
      }
    }
  }
}
function getCardRank(card) {
  return card.replace(/[â â¥â¦â£]/g, "");
}
var OWNER_ID = "974738506029084732";
var EID_EVENT_END = new Date("2026-03-21T23:59:59Z").getTime();
var EID_WHEEL_GIF = "https://cdn.discordapp.com/attachments/1220088585991094315/1483822972941635705/IMG_3001.gif";
var EID_WHEEL_STATIC = "https://cdn.discordapp.com/attachments/1220088585991094315/1483833838055460884/0E0C0A51-1124-40D4-9C26-321521174592.png";
var eidSpinning = /* @__PURE__ */ new Set();
var eidBonusSpins = /* @__PURE__ */ new Set();
async function getEidSpin(userId) {
  const res = await pool.query("SELECT * FROM eid_spins WHERE user_id = $1", [userId]);
  return res.rows[0] || null;
}
async function recordEidSpin(userId) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  await pool.query(`
    INSERT INTO eid_spins (user_id, last_spin_date, spins_today)
    VALUES ($1, $2, 1)
    ON CONFLICT (user_id) DO UPDATE SET last_spin_date = $2, spins_today = eid_spins.spins_today + 1
  `, [userId, today]);
}
function getEidDaysLeft() {
  return Math.max(0, Math.ceil((EID_EVENT_END - Date.now()) / 864e5));
}
function rollEidReward() {
  const r = Math.random() * 100;
  if (r < 20) return { label: "2 XP \u2728", type: "xp", value: 2 };
  if (r < 35) return { label: "10 XP \u2728", type: "xp", value: 10 };
  if (r < 40) return { label: "250 XP \u2728", type: "xp", value: 250 };
  if (r < 43) return { label: "500 Coins \u{1F4B0}", type: "coins", value: 500 };
  if (r < 55) return { label: "100 Coins \u{1F4B0}", type: "coins", value: 100 };
  if (r < 65) return { label: "10 Diamonds \u{1F4A8}", type: "diamonds", value: 10 };
  if (r < 67) return { label: "30 Diamonds \u{1F4A8}", type: "diamonds", value: 30 };
  if (r < 75) return { label: "Tuurasho kale! \u{1F504}", type: "spin", value: 0 };
  if (r < 75.00001) return { label: "1 Month Nitro \u{1F3C6}", type: "nitro", value: 0 };
  return { label: "Waxba \u{1F614}", type: "nothing", value: 0 };
}
var BUG_REPORT_CHANNEL = "1220088585009500213";

export { CARD_RANKS, CARD_SUITS, createDeck, dealCards, getCardRank, OWNER_ID, EID_EVENT_END, EID_WHEEL_GIF, EID_WHEEL_STATIC, eidSpinning, eidBonusSpins, getEidSpin, recordEidSpin, getEidDaysLeft, rollEidReward, BUG_REPORT_CHANNEL };
