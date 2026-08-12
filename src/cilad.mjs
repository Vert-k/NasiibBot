import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from "discord.js";

const OWNER_ID           = "974738506029084732";
const BUG_REPORT_CHANNEL = "1482496751284781217";
const COOLDOWN_MS        = 5 * 60 * 1000;

const ciladCooldowns  = new Map();
const activeReporters = new Map();
const submitting      = new Set();


function buildSupportEmbed(user) {
  return new EmbedBuilder()
    .setTitle("<:Caawin:1510289822869360740> Nasiib Support")
    .setDescription(
      "Furo ticket la xariira Nasiib.\n\n" +
      "Ma u baahan tahay caawinaad ku saabsan Nasiib iyo faahfaahin?\n" +
      "Taabo buttonka la xariira caawinaadaada."
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
    .setColor(0x5865F2)
    .setFooter({ text: "Nasiib Support System" })
    .setTimestamp();
}

function buildSupportRows(userId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cilad_bug_${userId}`)
      .setLabel("Cilad Gudbin")
      .setEmoji("<:Bug:1510289824781697054>")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`cilad_suggest_${userId}`)
      .setLabel("Soo Jeedin")
      .setEmoji("<:Fikir:1510289827357130943>")
      .setStyle(ButtonStyle.Primary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`cilad_complaint_${userId}`)
      .setLabel("Dacwad Gudbin")
      .setEmoji("🛑")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`cilad_other_${userId}`)
      .setLabel("Arimo Kale")
      .setEmoji("❓")
      .setStyle(ButtonStyle.Secondary),
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("💬 Caawinaad Guud")
      .setURL("https://discord.gg/q3u5kdU2qy")
      .setStyle(ButtonStyle.Link),
  );
  return [row1, row2, row3];
}




function buildBugModalPayload(userId) {
  return {
    custom_id: `cilad_modal_bug_${userId}`,
    title: 'Bug Report Ticket',
    components: [
      {
        type: 18,
        label: 'Mowduuca',
        component: {
          type: 4,
          custom_id: 'subject',
          style: 1,
          placeholder: 'Cinwaan gaaban qor',
          required: true,
          max_length: 100,
        },
      },
      {
        type: 18,
        label: 'Amarka Aad Isticmaashay',
        component: {
          type: 4,
          custom_id: 'command_used',
          style: 1,
          placeholder: 'Qor command isticmashay tusaale !deposit ama /deposit',
          required: true,
          max_length: 100,
        },
      },
      {
        type: 18,
        label: 'Warbixin Guud',
        component: {
          type: 4,
          custom_id: 'description',
          style: 2,
          placeholder: 'Maxaa dhacay, cilada aad aragtay iyo bug talaabo talaabo u soo qor.',
          required: true,
          max_length: 1000,
        },
      },
      {
        type: 18,
        label: 'Sawiro / Clips (ikhtiyaari)',
        description: 'Ku soo dir cadayn muujinaysa cilada — sawiro ama video clips (max 5 MB kasta, ilaa 3 fayl)',
        component: {
          type: 19,
          custom_id: 'bug_evidence',
          min_values: 0,
          max_values: 3,
          required: false,
        },
      },
    ],
  };
}


async function showBugModal(interaction, userId) {
  await interaction.client.rest.post(
    `/interactions/${interaction.id}/${interaction.token}/callback`,
    {
      body: {
        type: 9,
        data: buildBugModalPayload(userId),
      },
    }
  );
}

function buildSuggestModal(userId) {
  const modal = new ModalBuilder()
    .setCustomId(`cilad_modal_suggest_${userId}`)
    .setTitle("Fikir Soo Jeedin");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("subject")
        .setLabel("Mowduuca")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Fadlan qor ciwaan yar")
        .setRequired(true)
        .setMaxLength(100)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("brief")
        .setLabel("Waxyaalaha Aad Soo Jeedinaysid")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Soo qor xog yar ku saabsan waxa jeedinaysid")
        .setRequired(true)
        .setMaxLength(200)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Warbixin Dhamaystiran")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Halkan ku qor fikirka aad soo jeedinaysid oo dhamaystiran iyo wax walba sida ay u shaqaynayaan.")
        .setRequired(true)
        .setMaxLength(1000)
    )
  );
  return modal;
}

function buildComplaintModal(userId) {
  const modal = new ModalBuilder()
    .setCustomId(`cilad_modal_complaint_${userId}`)
    .setTitle("Gudbi Dacwad");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("subject")
        .setLabel("Mowduuca")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Cinwaan gaaban")
        .setRequired(true)
        .setMaxLength(100)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("target")
        .setLabel("UserID / Username")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Halkan ku qor UserID-ga ama username-ka qofka")
        .setRequired(true)
        .setMaxLength(100)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Warbixin Guud")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Faahfaahin guud ka bixi")
        .setRequired(true)
        .setMaxLength(1000)
    )
  );
  return modal;
}

function buildOtherModal(userId) {
  const modal = new ModalBuilder()
    .setCustomId(`cilad_modal_other_${userId}`)
    .setTitle("❓ Arimo Kale");
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("subject")
        .setLabel("Mowduuca")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Qor ciwaan gaaban")
        .setRequired(true)
        .setMaxLength(100)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("brief")
        .setLabel("Warbixin Kooban")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Qor warbixin kooban oo ku saabsan arintan")
        .setRequired(true)
        .setMaxLength(200)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("description")
        .setLabel("Faahfaahin Guud")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Qor oo faahfaahin guud ka bixi arintaan si si fiican loogu sii fiiriyo.")
        .setRequired(true)
        .setMaxLength(1000)
    )
  );
  return modal;
}


function buildStaffEmbed(type, user, guild, channel, fields) {
  const cfg = {
    bug:       { title: "🐛 Bug Report — NEW",    color: 0xE74C3C },
    suggest:   { title: "💡 Suggestion — NEW",     color: 0x3498DB },
    complaint: { title: "🛑 Complaint — NEW",      color: 0xF39C12 },
    other:     { title: "❓ Other Ticket — NEW",   color: 0x9B59B6 },
  }[type] || { title: "📋 Ticket — NEW", color: 0x95A5A6 };

  const created = user.createdAt.toISOString().split("T")[0];
  return new EmbedBuilder()
    .setTitle(cfg.title)
    .addFields(
      { name: "👤 Reporter",  value: `<@${user.id}>\n\`${user.username}\``, inline: true },
      { name: "🆔 User ID",   value: `\`${user.id}\`\nCreated: \`${created}\``,  inline: true },
      { name: "🌍 Server",    value: `${guild?.name || "DM"}\n\`${guild?.id || "N/A"}\``, inline: true },
      { name: "📌 Channel",   value: `<#${channel.id}>\n\`${channel.id}\``, inline: true },
      ...fields,
    )
    .setColor(cfg.color)
    .setTimestamp()
    .setFooter({ text: `Ticket ID: ${Date.now().toString(36).toUpperCase()}` });
}

function buildStaffActionRow(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bugreply_${userId}`).setLabel("Reply").setEmoji("💬").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`bugstat_progress_${userId}`).setLabel("In Progress").setEmoji("🟡").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`bugstat_fixed_${userId}`).setLabel("Fixed").setEmoji("🟢").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`bugstat_invalid_${userId}`).setLabel("Close").setEmoji("❌").setStyle(ButtonStyle.Danger),
  );
}

async function submitTicket(client, type, user, guild, channel, alertFields, dmDesc, imageUrl = null) {
  const reportCh = await client.channels.fetch(BUG_REPORT_CHANNEL).catch(() => null);
  if (!reportCh) return false;

  const staffEmbed = buildStaffEmbed(type, user, guild, channel, alertFields);
  if (imageUrl) staffEmbed.setImage(imageUrl);

  const sent = await reportCh.send({
    embeds:     [staffEmbed],
    components: [buildStaffActionRow(user.id)],
  });

  activeReporters.set(user.id, { reportMsgId: sent.id, channelId: BUG_REPORT_CHANNEL });

  try {
    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📬 Ticket gaagii waa la helay")
          .setDescription(dmDesc)
          .setColor(0x5865F2)
          .setFooter({ text: "Nasiib Support" })
          .setTimestamp(),
      ],
    });
  } catch {}

  return true;
}


const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function handleCiladDmRelay(message, client) {
  if (message.guild) return false;
  if (message.content.startsWith("!")) return false;
  if (!activeReporters.has(message.author.id)) return false;


  const attachments = [...message.attachments.values()];
  const oversized   = attachments.filter(a => a.size > MAX_FILE_BYTES);

  if (oversized.length > 0) {
    const names = oversized.map(a => `**${a.name}** (${(a.size / 1024 / 1024).toFixed(2)} MB)`).join(", ");
    await message.reply(
      `❌ Faylasha soo socda waa ka weyn yihiin 5 MB oo la oggol yahay:\n${names}\n\n` +
      `Fadlan compress-garee ama ka dir faylasha ka yar 5 MB.`
    ).catch(() => {});
    return true;
  }

  const ALLOWED_TYPES = ["image/", "video/", "image/gif", "image/webp"];
  const invalidFiles  = attachments.filter(a => {
    const ct = a.contentType || "";
    return !ALLOWED_TYPES.some(t => ct.startsWith(t));
  });

  if (invalidFiles.length > 0) {
    await message.reply(
      `❌ Noocyada faylasha la oggol yahay waa sawiro iyo clips kaliya (jpg, png, gif, webp, mp4, mov, iwm).\n` +
      `Faylasha kale si toos ah ugu soo dir: <@${OWNER_ID}>`
    ).catch(() => {});
    return true;
  }

  try {
    const info  = activeReporters.get(message.author.id);
    const bugCh = await client.channels.fetch(info.channelId).catch(() => null);
    if (bugCh) {
      const origMsg = await bugCh.messages.fetch(info.reportMsgId).catch(() => null);

      const hasText  = message.content?.trim().length > 0;
      const hasFiles = attachments.length > 0;

      const relay = new EmbedBuilder()
        .setAuthor({ name: `${message.author.username} · Reporter Reply`, iconURL: message.author.displayAvatarURL() })
        .setDescription((hasText ? message.content : hasFiles ? "*(sawiro/clip kaliya — qoraal ma jiro)*" : "*(fariin madhan)*").slice(0, 1500))
        .setColor(0x3498DB)
        .setTimestamp()
        .setFooter({ text: `From: ${message.author.id}` });


      const firstImage = attachments.find(a => (a.contentType || "").startsWith("image/"));
      if (firstImage) relay.setImage(firstImage.url);


      const extraFiles = attachments.filter(a => a !== firstImage);
      const fileLinks  = extraFiles.map(a => `📎 [${a.name}](${a.url})`).join("\n");

      const target = origMsg ?? bugCh;
      await target[origMsg ? "reply" : "send"]({
        content: `<@${OWNER_ID}> 💬 New reporter reply${hasFiles ? ` · 📎 ${attachments.length} file(s)` : ""}${fileLinks ? `\n${fileLinks}` : ""}`,
        embeds:  [relay],
      }).catch(() => null);

      await message.react("✅").catch(() => {});
    }
  } catch (err) {
    console.error("[CiladRelay] DM relay failed:", err);
  }
  return true;
}


export function setupCiladSystem(client) {


  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content !== "!cilad") return;

    const last = ciladCooldowns.get(message.author.id);
    if (last && Date.now() - last < COOLDOWN_MS) {
      const secsLeft = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("⏳ Cooldown Active")
            .setDescription(`Waxaad horey u gudbisay ticket. Sug **${Math.ceil(secsLeft / 60)} ** ka hor intaadan mar kale gudbinin.`)
            .setColor(0xE74C3C),
        ],
      }).catch(() => {});
      return;
    }

    await message.reply({
      embeds:     [buildSupportEmbed(message.author)],
      components: buildSupportRows(message.author.id),
    }).catch(() => {});
  });


  client.on("interactionCreate", async (interaction) => {


    if (interaction.isButton()) {
      const { customId } = interaction;


      if (customId.startsWith("cilad_bug_") ||
          customId.startsWith("cilad_suggest_") ||
          customId.startsWith("cilad_complaint_") ||
          customId.startsWith("cilad_other_")) {

        const uid = customId.replace(/^cilad_\w+_/, "");
        if (interaction.user.id !== uid) {
          await interaction.reply({ content: "❌ Panelkaaga maahan.", ephemeral: true });
          return;
        }
        const last = ciladCooldowns.get(uid);
        if (last && Date.now() - last < COOLDOWN_MS) {
          const mins = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 60000);
          await interaction.reply({ content: `⏳ Waxaa kuu dhiman: **${mins} daqiiqo** ka hor intaadan mar kale gudbinin.`, ephemeral: true });
          return;
        }

        if      (customId.startsWith("cilad_bug_"))       await showBugModal(interaction, uid);
        else if (customId.startsWith("cilad_suggest_"))   await interaction.showModal(buildSuggestModal(uid));
        else if (customId.startsWith("cilad_complaint_")) await interaction.showModal(buildComplaintModal(uid));
        else if (customId.startsWith("cilad_other_"))     await interaction.showModal(buildOtherModal(uid));
        return;
      }


      if (customId.startsWith("bugreply_")) {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: "❌ Owner only.", ephemeral: true });
          return;
        }
        const targetId = customId.replace("bugreply_", "");
        const replyModal = new ModalBuilder()
          .setCustomId(`bugreplyModal_${targetId}`)
          .setTitle("💬 Reply to Reporter");
        replyModal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("bugreply_text")
              .setLabel("Your message to the reporter")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMaxLength(1500)
              .setPlaceholder("Type your reply here...")
          )
        );
        await interaction.showModal(replyModal);
        return;
      }


      if (customId.startsWith("bugstat_")) {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: "❌ Owner only.", ephemeral: true });
          return;
        }
        const parts    = customId.split("_");
        const status   = parts[1];
        const targetId = parts.slice(2).join("_");

        let label, color, dmText;
        if (status === "progress") {
          label = "🟡 IN PROGRESS"; color = 0xF1C40F;
          dmText = "🟡 **Status update:** Ticketkaaga ayaa la fiirinayaa. fadlan samir";
        } else if (status === "fixed") {
          label = "🟢 FIXED"; color = 0x2ECC71;
          dmText = "🟢 **Status update:** Ticketkaaga waa la xaliyey! waad ku mahadsantahay caawintaada Nasiib Bot.";
        } else if (status === "invalid") {
          label = "❌ CLOSED"; color = 0x95A5A6;
          dmText = "❌ **Status update:** warbixintaada waa la xiray, soo gudbi warbixin saxan. Mahadsanid.";
        } else {
          await interaction.reply({ content: "❌ Unknown status.", ephemeral: true });
          return;
        }

        try {
          const old = interaction.message.embeds[0];
          if (old) {
            await interaction.message.edit({
              embeds: [EmbedBuilder.from(old).setTitle(`${label} — TICKET`).setColor(color)],
            }).catch(() => null);
          }
        } catch {}

        let dmOk = false;
        try {
          const tgt = await client.users.fetch(targetId).catch(() => null);
          if (tgt) {
            await tgt.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle("📬 Ticket Update")
                  .setDescription(dmText)
                  .setColor(color)
                  .setFooter({ text: "Nasiib Support" })
                  .setTimestamp(),
              ],
            });
            dmOk = true;
          }
        } catch {}

        if (status === "fixed" || status === "invalid") activeReporters.delete(targetId);

        await interaction.reply({
          content: `✅ Status set to ${label}${dmOk ? " & user notified." : " (DM failed — user has DMs off)."}`,
          ephemeral: true,
        });
        return;
      }
    }


    if (interaction.isModalSubmit()) {
      const { customId } = interaction;


      if (customId.startsWith("bugreplyModal_")) {
        if (interaction.user.id !== OWNER_ID) {
          await interaction.reply({ content: "❌ Owner only.", ephemeral: true });
          return;
        }
        const targetId  = customId.replace("bugreplyModal_", "");
        const replyText = interaction.fields.getTextInputValue("bugreply_text");
        let dmOk = false;
        try {
          const tgt = await client.users.fetch(targetId).catch(() => null);
          if (tgt) {
            await tgt.send({
              embeds: [
                new EmbedBuilder()
                  .setAuthor({ name: "Nasiib Bot Support", iconURL: client.user?.displayAvatarURL() })
                  .setTitle("💬 Jawaab ka socota nasiib support")
                  .setDescription(replyText)
                  .setColor(0x9B59B6)
                  .setFooter({ text: "Halkan ku soo qor jawaab ama su'aal kale hadii bixinaysid." })
                  .setTimestamp(),
              ],
            });
            dmOk = true;
          }
        } catch (err) {
          console.error("[CiladReply] DM failed:", err);
        }
        try {
          const mirror = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username} · Developer Reply`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(replyText)
            .setColor(0x9B59B6)
            .setFooter({ text: dmOk ? "✅ Delivered via DM" : "⚠️ DM delivery failed (user has DMs disabled)" })
            .setTimestamp();
          if (interaction.message) await interaction.message.reply({ embeds: [mirror] }).catch(() => null);
        } catch {}
        await interaction.reply({
          content:   dmOk ? "✅ Reply sent to reporter." : "⚠️ Could not DM the reporter (DMs disabled).",
          ephemeral: true,
        });
        return;
      }


      if (!customId.startsWith("cilad_modal_")) return;

      const inner = customId.replace("cilad_modal_", "");
      const sep   = inner.indexOf("_");
      const type  = inner.slice(0, sep);
      const uid   = inner.slice(sep + 1);

      if (interaction.user.id !== uid) {
        await interaction.reply({ content: "❌ panelkaga maahan.", ephemeral: true });
        return;
      }
      if (submitting.has(uid)) {
        await interaction.reply({ content: "⏳ Fadlan sug, ticket gaagii ayaa la dirayayaa.", ephemeral: true });
        return;
      }
      submitting.add(uid);
      await interaction.deferReply({ ephemeral: true });

      try {
        const subject     = interaction.fields.getTextInputValue("subject");
        const description = interaction.fields.getTextInputValue("description");
        let alertFields, dmDesc;

        if (type === "bug") {
          const cmdUsed = interaction.fields.getTextInputValue("command_used");




          const MAX_FILE_BYTES = 5 * 1024 * 1024;
          const resolved = interaction.fields?.resolved ?? interaction.resolved;
          const rawAttachments = resolved?.attachments
            ? [...resolved.attachments.values()]
            : [];


          const oversized = rawAttachments.filter(a => a.size > MAX_FILE_BYTES);
          const validFiles = rawAttachments.filter(a => a.size <= MAX_FILE_BYTES);

          alertFields = [
            { name: "🔧 Command Used", value: `\`${cmdUsed}\``, inline: false },
            { name: "📋 Subject",      value: subject,           inline: false },
            { name: "📝 Description",  value: description,       inline: false },
          ];

          if (validFiles.length > 0) {
            const fileList = validFiles
              .map(a => `📎 [${a.name}](${a.url}) — ${(a.size / 1024).toFixed(0)} KB`)
              .join("\n");
            alertFields.push({ name: `📁 Evidence (${validFiles.length} file${validFiles.length > 1 ? "s" : ""})`, value: fileList, inline: false });
          }
          if (oversized.length > 0) {
            alertFields.push({ name: "⚠️ Rejected (>5 MB)", value: oversized.map(a => a.name).join(", "), inline: false });
          }


          const firstImage = validFiles.find(a => (a.contentType || "").startsWith("image/"));

          dmDesc = "Mahadsanid! Bug report kaagii waxaa loo gudbiyey Nasiib support.\n\n" +
            (validFiles.length > 0
              ? `✅ **${validFiles.length} fayl** ayaa la gudbiyey.\n\n`
              : "📎 Haddii aad rabto in aad sawiro ama clip ku darto, DM-kan ku soo dir (max **5 MB** kasta).\n\n") +
            "💬 Su'aal ama faahfaahin dheeri ah DM-kan ka dir.\n\n⏳ Sug jawaabta.";

          const ok = await submitTicket(
            client, type,
            interaction.user, interaction.guild, interaction.channel,
            alertFields, dmDesc, firstImage?.url ?? null
          );

          ciladCooldowns.set(uid, Date.now());
          await interaction.editReply({
            content: ok
              ? "✅ Ticket gaagii waa la gudbiyey! Mahadsanid."
              : "⚠️ Ticket gaagii khalad ayaa ka dhacay. Isku day mar kale.",
          });
          return;
        } else if (type === "suggest") {
          const brief = interaction.fields.getTextInputValue("brief");
          alertFields = [
            { name: "📋 Subject",     value: subject,     inline: false },
            { name: "💡 Brief",       value: brief,       inline: false },
            { name: "📝 Full Detail", value: description, inline: false },
          ];
          dmDesc = "Mahadsanid! Fikirkaagii waxaa loo gudbiyey Nasiib.\n\n📎 Sawiro ama mockup haddaad haysato, DM-kan ku soo dir (max **5 MB** kasta).\n\n⏳ Fikirka ayaa la fiirinayaa.";


          try {
            const suggestCh = await client.channels.fetch("1505616761133858956").catch(() => null);
            if (suggestCh) {
              const suggestEmbed = new EmbedBuilder()
                .setTitle("<:Fikir:1510289827357130943> Soo Jeedin Cusub")
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                  { name: "📋 Subject",     value: subject,     inline: false },
                  { name: "💡 Brief",       value: brief,       inline: false },
                  { name: "📝 Full Detail", value: description, inline: false },
                )
                .setColor(0x5865F2)
                .setTimestamp()
                .setFooter({ text: `User ID: ${interaction.user.id}` });
              await suggestCh.send({ embeds: [suggestEmbed] });
            }
          } catch (err) {
            console.error("[Cilad] suggest channel post failed:", err);
          }

        } else if (type === "complaint") {
          const target = interaction.fields.getTextInputValue("target");
          alertFields = [
            { name: "📋 Subject",     value: subject,     inline: false },
            { name: "🎯 Target User", value: target,      inline: false },
            { name: "📝 Description", value: description, inline: false },
          ];
          dmDesc = "Mahadsanid! Dacwadaadii waxaa loo gudbiyey Nasiib support.\n\n📎 Cadayn (screenshot, clip) haddaad haysato, DM-kan ku soo dir (max **5 MB** kasta).\n\n⏳ Arinta ayaa la baadhayaa.";
        } else {
          const brief = interaction.fields.getTextInputValue("brief");
          alertFields = [
            { name: "📋 Subject",  value: subject,     inline: false },
            { name: "📎 Brief",    value: brief,       inline: false },
            { name: "📝 Detail",   value: description, inline: false },
          ];
          dmDesc = "Mahadsanid! Xaaladaadii waxaa loo gudbiyey Nasiib support.\n\n📎 Sawiro ama faahfaahin dheeraad ah haddaad haysato, DM-kan ku soo dir (max **5 MB** kasta).\n\n⏳ Arinta ayaa la eegayaa.";
        }

        const ok = await submitTicket(
          client, type,
          interaction.user, interaction.guild, interaction.channel,
          alertFields, dmDesc
        );

        ciladCooldowns.set(uid, Date.now());

        await interaction.editReply({
          content: ok
            ? "✅ Ticket gaagii waa la gudbiyey! Mahadsanid."
            : "⚠️ Ticket gaagii khalad ayaa ka dhacay. Isku day mar kale.",
        });
      } catch (err) {
        console.error("[Cilad] modal submit error:", err);
        await interaction.editReply({ content: "❌ Khalad ayaa dhacay. Isku day mar kale." }).catch(() => {});
      } finally {
        submitting.delete(uid);
      }
    }
  });

  console.log("[Cilad] ✅ Support system online.");
}






setTimeout(async () => {
  if (globalThis._ciladManagedByApp) return;
  if (!process.env.DISCORD_TOKEN) {
    console.error("[Cilad] DISCORD_TOKEN missing — cannot auto-bootstrap.");
    return;
  }
  try {
    const { Client, GatewayIntentBits, Partials } = await import("discord.js");
    const _client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel, Partials.Message],
    });
    setupCiladSystem(_client);
    await _client.login(process.env.DISCORD_TOKEN);
    console.log("[Cilad] ✅ Standalone maintenance client online.");
  } catch (err) {
    console.error("[Cilad] Auto-bootstrap failed:", err.message);
  }
}, 150);
