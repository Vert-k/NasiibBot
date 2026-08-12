const EVENT_DISABLED_MESSAGE = [
  "{Error Accured}",
  "",
  "Ciladan wax qalad ah kuma lahan.",
  "Hadii aad tahay bot ownerka, tag fileka ku jira event kadib halkaas iska sax, ama commands event dhan iska xir.",
  "Hadii aad player tahay, ignore this message.",
].join("\n");

const EVENT_COMMAND_PATTERN = /^!(?:ev|event|energy|eshop|eventitems|fight|upgrade|evlb|eventleaderboard)(?:\s|$)/i;

async function sendTemporaryMessage(message, content) {
  if (!content.trim()) return;

  const reply = await message.reply(content).catch(() => null);
  if (!reply) return;

  setTimeout(() => {
    reply.delete().catch(() => {});
  }, 60_000);
}

export async function setupEventSystem(client) {
  client.on("messageCreate", async (message) => {
    if (message.author?.bot) return;
    if (!message.guild) return;
    if (message._isSlashSynthetic || message._permBlocked) return;
    if (!EVENT_COMMAND_PATTERN.test(message.content.trim())) return;

    await sendTemporaryMessage(message, EVENT_DISABLED_MESSAGE);
  });
}

export async function buildEventItemsWalletLine() {
  return "";
}
