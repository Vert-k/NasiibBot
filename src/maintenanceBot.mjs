







import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
} from "discord.js";


const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("[MAINTENANCE] ❌ DISCORD_TOKEN is not set.");
  console.error("[MAINTENANCE]    On DisCloud: go to your app → Environment Variables → add DISCORD_TOKEN.");
  console.error("[MAINTENANCE]    Locally: export DISCORD_TOKEN=your_token before running.");
  process.exit(1);
}


const maskedToken = token.slice(0, 10) + "..." + token.slice(-5);
console.log(`[MAINTENANCE] 🔑 DISCORD_TOKEN found: ${maskedToken} (length: ${token.length})`);

const STATUS_CONFIG = {
  reason: 2,



};

const SUPPORT_SERVER_URL = "https://discord.gg/3rRg8wZVhG";

const REASON_MAP = {
  1: {
    emoji: "🚀",
    title: "Update Cusub Ayaa Imanaya",
    description: "Nasiib Bot waxaa lagu soo darayaa features cusub iyo wax ka badalis muhiim ah.\n\nfadlan sug mahadsanid!",
    color: 0x2ecc71,
  },
  2: {
    emoji: "🔧",
    title: "Cilad Ayaa La Hagaajinayaa",
    description: "nasiib development ayaa hadda ka shaqaynaya in ay xaliyaan dhibaato laga helay bot ka.\n\nWaxaan kaaga mahadcelinaynaa samirkaaga.",
    color: 0xe67e22,
  },
  3: {
    emoji: "⚙️",
    title: "Wax ka badalis ayaa socota",
    description: "Waxaa dib u habeynaynaa qayb muhiim ah oo ka tirsan Nasiib Bot.\n\nWaxay qaadan doontaa mudo yar.",
    color: 0x3498db,
  },
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


client.on("error", (err) => {
  console.error("[MAINTENANCE] ❌ Discord client error:", err.message);
});
client.on("warn", (msg) => {
  console.warn("[MAINTENANCE] ⚠️  Discord warning:", msg);
});
client.on("shardError", (err, shardId) => {
  console.error(`[MAINTENANCE] ❌ Shard ${shardId} error:`, err.message);
});
client.on("shardDisconnect", (event, shardId) => {
  console.warn(`[MAINTENANCE] 🔌 Shard ${shardId} disconnected (code ${event.code}).`);
});
client.on("shardReconnecting", (shardId) => {
  console.log(`[MAINTENANCE] 🔄 Shard ${shardId} reconnecting...`);
});

const respondedMessages = new Set();
setInterval(() => respondedMessages.clear(), 60_000);

client.once("ready", () => {
  console.log(`[MAINTENANCE] ✅ Online as ${client.user.tag}`);
  client.user.setPresence({
    status: "dnd",
    activities: [{
      name: "🔴 Under Maintenance",
      type: ActivityType.Watching,
    }],
  });
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message._isSlashSynthetic) return;
    if (!message.content.startsWith("!")) return;

    const cmd = message.content.split(/\s+/)[0].toLowerCase();


    if (cmd === "!cilad") return;

    if (respondedMessages.has(message.id)) return;
    respondedMessages.add(message.id);

    const embed = new EmbedBuilder()
      .setTitle("🔴 NASIIB SUPPORT")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 128 }))
      .setDescription(
        "Haddii aad fariintaan arkayso waxay ka dhigan tahay **Nasiib** is down.\n\n" +
        "Fadlan si faahfaahin u heshid gal serverka hoose, ama taabo **Warbixin** si aad u ogaatid sababta botka u dansan yahay."
      )
      .addFields({ name: "📊 Xaaladda Bot", value: "🔴 Offline — Maintenance Mode", inline: false })
      .setColor(0xe74c3c)
      .setFooter({ text: "Nasiib Support · Bot waa offline hadda" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("🌐 Gal Serverka")
        .setURL(SUPPORT_SERVER_URL),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("📋 Warbixin")
        .setCustomId(`maintenance_reason_${message.author.id}`),
    );

    await message.reply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error("[MAINTENANCE] messageCreate error:", err.message);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("maintenance_reason_")) return;

    const userId = interaction.customId.replace("maintenance_reason_", "");
    if (interaction.user.id !== userId) {
      await interaction.reply({ content: "❌ buttonkan kaaga maaha.", ephemeral: true });
      return;
    }

    const reason = REASON_MAP[STATUS_CONFIG.reason] || REASON_MAP[1];
    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setTitle(`${reason.emoji} ${reason.title}`)
          .setDescription(reason.description)
          .setColor(reason.color)
          .setFooter({ text: "Nasiib Support · Warbixin Rasmi ah" })
          .setTimestamp(),
      ],
    });
  } catch (err) {
    console.error("[MAINTENANCE] interactionCreate error:", err.message);
  }
});



console.log("[MAINTENANCE] Loading cilad.mjs...");
try {
  await import("./cilad.mjs");
  console.log("[MAINTENANCE] ✅ cilad.mjs loaded.");
} catch (err) {
  console.error("[MAINTENANCE] ⚠️  cilad.mjs failed to load:", err.message);
  console.error("[MAINTENANCE]    Continuing without it — !cilad will be unavailable.");
}


console.log("[MAINTENANCE] Connecting to Discord gateway...");
client.login(token).catch((err) => {
  console.error("[MAINTENANCE] ❌ Login failed:", err.message);




  process.exit(1);
});
