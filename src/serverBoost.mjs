


























































import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost/fallback",
});



const GUILD_ID        = "1505570700667260970";
const CHANNEL_ID      = "1505615932058501270";
const ROLE_ID         = "1514605091645165670";
const SERVER_INVITE   = "https://discord.gg/nasiib";
const REWARD_COINS    = 500;
const REWARD_DIAMONDS = 5;
const COOLDOWN_MS     = 24 * 60 * 60 * 1000;
const IS_CV2          = 1 << 15;



async function initServerBoostTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily2_cooldowns (
      user_id    TEXT   PRIMARY KEY,
      last_claim BIGINT NOT NULL
    )
  `);
  console.log("[SERVERBOOST] ✅ daily2_cooldowns table ready.");
}



async function handleDaily2(message) {

  if (!message.guild || message.guild.id !== GUILD_ID) {
    return message.reply({
      flags: IS_CV2,
      components: [
        {
          type: 17,
          accent_color: 0xe74c3c,
          components: [
            {
              type: 10,
              content: [
                "# limited command",
                "",
                "-# only nasiib official server ayaa command **!daily2** lagu isticmaali karaa.",
              ].join("\n"),
            },
            { type: 14 },
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: "Join Nasiib Official Server",
                  url: SERVER_INVITE,
                },
              ],
            },
          ],
        },
      ],
    });
  }


  if (message.channel.id !== CHANNEL_ID) return;


  const member = message.member;
  if (!member || !member.roles.cache.has(ROLE_ID)) return;

  const userId = message.author.id;


  const client = await pool.connect();
  try {
    await client.query("BEGIN");






    const claimR = await client.query(
      `INSERT INTO daily2_cooldowns (user_id, last_claim)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
         SET last_claim = $2
         WHERE daily2_cooldowns.last_claim < ($2 - $3)
       RETURNING user_id`,
      [userId, Date.now(), COOLDOWN_MS]
    );

    if (!claimR.rowCount) {

      await client.query("ROLLBACK");
      return;
    }


    const treasuryR = await client.query(
      `UPDATE bot_wallet
       SET coins    = coins    - $1,
           diamonds = diamonds - $2
       WHERE id = 1
         AND coins    >= $1
         AND diamonds >= $2
       RETURNING id`,
      [REWARD_COINS, REWARD_DIAMONDS]
    );

    if (!treasuryR.rowCount) {


      await client.query("ROLLBACK");
      return;
    }


    const userR = await client.query(
      `UPDATE players
       SET coins    = coins    + $1,
           diamonds = diamonds + $2
       WHERE discord_id = $3
       RETURNING discord_id`,
      [REWARD_COINS, REWARD_DIAMONDS, userId]
    );

    if (!userR.rowCount) {

      await client.query("ROLLBACK");
      return;
    }

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[SERVERBOOST] !daily2 error:", err.message);
  } finally {
    client.release();
  }
}



export function setupServerBoost(client) {
  initServerBoostTable().catch(err =>
    console.error("[SERVERBOOST] initServerBoostTable error:", err.message)
  );

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.trim() === "!daily2") return handleDaily2(message);
  });

  console.log("[SERVERBOOST] ✅ !daily2 ready (guild-restricted, role-gated, 24h cooldown).");
}
