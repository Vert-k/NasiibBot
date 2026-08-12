const EID_MESSAGE = "Eid Mubarak";

async function sendTemporaryMessage(message, content) {
  if (!content.trim()) return;

  const reply = await message.reply(content).catch(() => null);
  if (!reply) return;

  setTimeout(() => {
    reply.delete().catch(() => {});
  }, 60_000);
}

export async function setupEidSystem(client) {
  client.on("messageCreate", async (message) => {
    if (message.author?.bot) return;
    if (!message.guild) return;
    if (message._isSlashSynthetic || message._permBlocked) return;
    if (!message.content.trim().toLowerCase().startsWith("!eid")) return;

    await sendTemporaryMessage(message, EID_MESSAGE);
  });
}
