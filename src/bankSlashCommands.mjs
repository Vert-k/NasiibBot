





































let discordClient = null;




const SLASH_TO_PREFIX = {
  deposit:  "!deposit",
  withdraw: "!withdraw",
  invest:   "!invest",
};

const COMMON_OPTIONS = [
  {
    name: "lacagta",
    description: "Lacagta aad rabto (tiro).",
    type: 4,
    required: true,
    min_value: 1,
  },
  {
    name: "bankowner",
    description: "Bank-owner-ka aad la macaamilayso (mention or username).",
    type: 6,
    required: true,
  },
];

async function registerSlashCommands(client) {
  if (!client.application) {
    console.warn("[BANK SLASH] client.application not ready — slash commands not registered yet.");
    return;
  }
  try {
    await Promise.all([
      client.application.commands.create({
        name: "deposit",
        description: "💰 Bank ku dhig lacag (sida `!deposit`).",
        options: COMMON_OPTIONS,
      }),
      client.application.commands.create({
        name: "withdraw",
        description: "💸 Bankiga ka soo bixi lacag (sida `!withdraw`).",
        options: COMMON_OPTIONS,
      }),
      client.application.commands.create({
        name: "invest",
        description: "📈 Bankiga qof kale ku maalgashado (sida `!invest`).",
        options: COMMON_OPTIONS,
      }),
    ]);
    console.log("[BANK SLASH] ✅ /deposit /withdraw /invest registered globally (may take ~1h to propagate).");
  } catch (err) {
    console.error("[BANK SLASH] Failed to register slash commands:", err.message);
  }
}









function buildSyntheticMessage(interaction, prefix, amount, bankOwner) {



  const content = `${prefix} <@${bankOwner.id}> ${amount}`;




  let replied = false;
  const reply = async (opts) => {
    const payload = typeof opts === "string" ? { content: opts } : { ...opts };
    try {
      if (!replied) {
        replied = true;
        return await interaction.editReply(payload);
      }
      return await interaction.followUp(payload);
    } catch (err) {

      try { return await interaction.channel?.send(payload); } catch {}
      console.error(`[BANK SLASH] reply route failed:`, err?.message || err);
    }
  };

  return {
    _isSlashSynthetic: true,
    content,
    author: interaction.user,
    member: interaction.member,
    channel: interaction.channel,
    guild: interaction.guild,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    id: interaction.id,
    createdAt: new Date(),
    createdTimestamp: Date.now(),
    mentions: {
      users: new Map([[bankOwner.id, bankOwner]]),
      members: new Map(interaction.member ? [[bankOwner.id, interaction.member]] : []),
      roles: new Map(),
      channels: new Map(),
      everyone: false,



    },
    reply,

    delete: async () => null,
  };
}



function patchMentionsCollection(map) {
  if (typeof map.first !== "function") {
    map.first = () => map.values().next().value;
  }
  return map;
}

async function handleSlashCommand(interaction) {
  const prefix = SLASH_TO_PREFIX[interaction.commandName];
  if (!prefix) return;

  const amount    = interaction.options.getInteger("lacagta", true);
  const bankOwner = interaction.options.getUser("bankowner", true);



  await interaction.deferReply({ ephemeral: false });

  const fake = buildSyntheticMessage(interaction, prefix, amount, bankOwner);
  patchMentionsCollection(fake.mentions.users);




  discordClient.emit("messageCreate", fake);
}


export async function setupBankSlashCommands(client) {
  discordClient = client;

  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isChatInputCommand?.()) return;
      if (!SLASH_TO_PREFIX[interaction.commandName]) return;
      await handleSlashCommand(interaction);
    } catch (err) {
      console.error(`[BANK SLASH] /${interaction.commandName} error:`, err);
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale.", ephemeral: true });
        } else {
          await interaction.editReply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale." });
        }
      } catch {}
    }
  });

  if (typeof client.isReady === "function" && client.isReady()) {
    await registerSlashCommands(client);
  } else {
    client.once("clientReady", () => registerSlashCommands(client));
  }
}
