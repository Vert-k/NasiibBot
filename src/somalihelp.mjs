import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const HELP_COLOR = 0x3498db;

function makeCloseBtn(userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`close_panel_${userId}`).setLabel("Close").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );
}

const helpPages = {
  cd: {
    title: "⏱️ Cooldowns — !cd",
    fields: [
      { name: "📋 Waa maxay?", value: "Waxay ku tusaysaa waqtiga aad u sugayso in aad mar kale isticmaasho command kasta." },
      { name: "📝 Sida loo isticmaalo", value: "`!cd`" },
      { name: "💡 Faahfaahin", value: [
        "Command kasta wuxuu leeyahay waqti aad aad sugayso ka hor intaadan mar kale isticmaalin.",
        "",
        "**Tusaale cooldowns:**",
        "🔨 Work — 8 ama 4 saacadood",
        "📅 Daily — 24 saac",
        "🪙 Coinflip — 30 ilbiriqsi",
        "🎰 Slots — 30 ilbiriqsi",
        "🔪 Rob — 30 daqiiqo",
        "💰 Deposit — 10 ilbiriqsi",
        "",
        "Marka aad qorto `!cd`, waxa kuu muuqanaya kuwa diyaarka ah iyo kuwa aad weli u sugayso."
      ].join("\n") },
    ]
  },

  bank: {
    title: "🏦 Bank System — !bank",
    fields: [
      { name: "📋 Waa maxay?", value: "Bank system waa meel aad lacagtaada ku kaydsato oo ku kordhiso. Qof kasta wuxuu furan karaa bank, dadka kalena waxay lacag dhigan karaan bankgaas." },
      { name: "📝 Commands", value: [
        "`!bank` — Arag bankgaaga iyo xogtiisa",
        "`!deposit <lacag> @owner` — Dhig lacag bank qof",
        "`!withdraw <lacag> @owner` — Kala bax lacag bank",
        "`!banklb` — Arag bankiyada ugu waaweyn",
        "`!bank acc` — Arag bank accountgaaga",
      ].join("\n") },
      { name: "💰 Deposit Rules", value: [
        "Qof kasta wuxuu dhigan karaa **100,000 Coins** bank kasta",
        "Haddii aad iibsato **Bank Pass** (10,000 Coins), limitka wuxuu noqonayaa **150,000**",
        "Deposit fee: **2%** (1% botka, 1% bank ownerka)",
        "Lacagta ugu yar deposit: **1 Coin**",
      ].join("\n") },
      { name: "💸 Withdraw Rules", value: [
        "Lacagta ugu yar withdraw: **100 Coins**",
        "Owner fee: Level 1 = 5%, Level 2 = 6%, Level 3 = 7%",
        "Lacagtaada waxay ku noqonaysaa walletkaaga",
      ].join("\n") },
      { name: "📈 Bank Levels", value: [
        "⭐ Level 1 — Cap: 50,000 Coins",
        "⭐⭐ Level 2 — Cap: 200,000 Coins",
        "⭐⭐⭐ Level 3 — Cap: 500,000 Coins",
        "",
        "Bankga markuu buuxo, automatik ayuu levelku kuugu korayaa.",
      ].join("\n") },
    ]
  },

  invest: {
    title: "💼 Invest — !invest",
    fields: [
      { name: "📋 Waa maxay?", value: "Maalgashigu waa inaad lacag dhigato bank qof kale oo aad faa'iido ka hesho waqti ka dib. Waa mid ka duwan deposit — lacagta invest ma aha mid aad markasta la bixi karto." },
      { name: "📝 Sida loo isticmaalo", value: [
        "`!invest <lacag> @bankowner` — Maalgeli bank",
        "`!invest` — Arag dhammaan maalgashigaaga",
      ].join("\n") },
      { name: "💰 Rules", value: [
        "Lacagta ugu yar maalgashan kartid: **100 Coins**",
        "Lacagta ugu badan maalgashan kartid: **100,000 Coins** bank walpa",
        "Bankgaaga aad leedahay ma maalgashan kartid",
      ].join("\n") },
      { name: "📈 Profit Rate", value: [
        "Lacagta ugu horeysa **25,000**: **0.8%** saacaddii",
        "Wixii ka badan 25,000: **0.5%** saacaddii",
        "Profit claim: **12 saac** ka dib",
        "Withdraw: **24 saac** ka dib markaad dhigatay",
      ].join("\n") },
      { name: "💡 Tusaale", value: "Haddaad 10,000 ku maalgasho, 12 saac ka dib waxaad helaysaa ~960 Coins profit." },
    ]
  },

  deposit: {
    title: "💰 Deposit — !deposit",
    fields: [
      { name: "📋 Waa maxay?", value: "Lacag aad ka bixinayso walletkaaga oo aad gelinayso bank qof kale." },
      { name: "📝 Sida loo isticmaalo", value: "`!deposit <lacag> @bankowner`\n\nTusaale: `!deposit 5000 @Luuza`" },
      { name: "💰 Rules", value: [
        "Ugu yaraan: **1 Coin** ayaa dhigi kartaa",
        "Limit: **100,000 Coins** bank kasta (150K Bank Pass hadaa gadatid)",
        "Fee: **2%** (1% botka + 1% bank ownerka)",
        "",
        "**Tusaale:** Haddaad dhigato 1,000 Coins:",
        "→ Bank-gaaga: 980 Coins",
        "→ Fee: 10 botka + 10 ownerka",
      ].join("\n") },
    ]
  },

  withdraw: {
    title: "💸 Withdraw — !withdraw",
    fields: [
      { name: "📋 Waa maxay?", value: "Lacag aad kala baxayso bank oo ku noqonaysa walletkaaga." },
      { name: "📝 Sida loo isticmaalo", value: "`!withdraw <lacag> @bankowner`\n\nTusaale: `!withdraw 5000 @Luuza`" },
      { name: "💰 Rules", value: [
        "Ugu yaraan: **100 Coins** ayaa la bixi kartaa",
        "Owner fee: L1 = 5%, L2 = 6%, L3 = 7%",
        "",
        "**Tusaale (Level 1):** Haddaad bixiso 1,000 Coins:",
        "→ Walletkaaga: 950 Coins",
        "→ Owner fee: 50 Coins",
      ].join("\n") },
    ]
  },

  work: {
    title: "🔨 Work — !work",
    fields: [
      { name: "📋 Waa maxay?", value: "Shaqo aad sameenayso si aad lacag u hesho. Commandkan waa mid aasaasi ah oo coins ku helayso." },
      { name: "📝 Sida loo isticmaalo", value: "`!work`" },
      { name: "💰 Waxaad helaysaa", value: "**50 – 300 Coins** mar kasta" },
      { name: "⏱️ Cooldown", value: "**8 saacadood**" },
      { name: "💡 Talo", value: "Isticmaal `!work` maalin kasta si aad lacag badan u ururiso, sidoo kale codee si kaliya 4h cd u heshid." },
    ]
  },

  daily: {
    title: "📅 Daily — !daily",
    fields: [
      { name: "📋 Waa maxay?", value: "Abaal-marin maalin kasta aad qaadan karto. Marka aad maalin kasta isticmaasho, streak-kaagu wuu kordhayaa wax badana waa helaysaa." },
      { name: "📝 Sida loo isticmaalo", value: "`!daily`" },
      { name: "💰 Waxaad helaysaa", value: [
        "**Coins** + **Diamonds** + **XP**",
        "Streak-ku intuu kordhayo, waxaad helaysaa wax badan",
      ].join("\n") },
      { name: "⏱️ Cooldown", value: "**24 saac**" },
      { name: "💡 Talo", value: "Ha ilaawin inaad maalin kasta qorto `!daily' - haddaad maalin ka tagto oo streak sheild kuu gadneen, streakkaagu dib ayuu u soo bilaamayaa." },
    ]
  },

  cf: {
    title: "🪙 Coinflip — !cf",
    fields: [
      { name: "📋 Waa maxay?", value: "Khamaar lacageed — ama waad ku guulaysanaysaa, ama waad ku khasaaraysaa." },
      { name: "📝 Sida loo isticmaalo", value: "`!cf <lacag> x or m`\n\nTusaale: `!cf 500 X`\nAma'!cf 500 M'" },
      { name: "💰 Rules", value: [
        "Ugu yaraan: **10 Coins**",
        "50% inaad ku guulaysato, 50% inaad ku khasaarto",
      ].join("\n") },
      { name: "⏱️ Cooldown", value: "**30 ilbiriqsi**" },
    ]
  },

  slots: {
    title: "🎰 Slots — !slots",
    fields: [
      { name: "📋 Waa maxay?", value: "Mashiinka slotska — saddex calaamadood oo isku mid ah waxay lamid tahay guul!" },
      { name: "📝 Sida loo isticmaalo", value: "`!slots <lacag>`\n\nTusaale: `!slots 100`" },
      { name: "💰 Rules", value: [
        "Ugu yaraan: **10 Coins**",
        "Laba isku mid: **2x** lacagtaada",
        "Saddex isku mid: **5x** lacagtaada",
        "Jackpot (💎💎💎): **10x** lacagtaada",
      ].join("\n") },
      { name: "⏱️ Cooldown", value: "**30 ilbiriqsi**" },
    ]
  },

  rob: {
    title: "🔪 Rob — !rob",
    fields: [
      { name: "📋 Waa maxay?", value: "Waxaad isku dayeesaa inaad lacag ka dhacdo qof kale. Laakiin haddaad ku guuldaraysato, adiga ayaa lacag lagaa qaadayaa!" },
      { name: "📝 Sida loo isticmaalo", value: "`!rob @qof`\n\nTusaale: `!rob @Luuza`" },
      { name: "💰 Rules", value: [
        "Haddaad guulaysato: Waxaad qaadanaysaa lacag",
        "Haddaad ku guuldaraysato: Waxaad bixinaysaa ganaax",
        "Qofka leh **Rob Shield** lama dhici karo",
      ].join("\n") },
      { name: "⏱️ Cooldown", value: "**30 daqiiqo**" },
      { name: "💡 Talo", value: "Rob Shieldka `!dshop` ka iibso si adna laguu xadin." },
    ]
  },

  duel: {
    title: "⚔️ Duel — !duel",
    fields: [
      { name: "📋 Waa maxay?", value: "Tartanka is balansi lacag — adiga iyo qof kale ayaa lacag dhiganaya, kii guuleysta waxaa la siinayaa dhammaan lacagta taal." },
      { name: "📝 Sida loo isticmaalo", value: "`!duel @qof <lacag> `\n\nTusaale: `!duel @samiira 100`" },
      { name: "💰 Rules", value: [
        "Ugu yaraan: **100 Coins**",
        "Labada qof ayaa lacagta isla dhiganaya",
        "Kii guuleysta wuxuu qaadanayaa dhammaan lacagta",
      ].join("\n") },
    ]
  },

  shop: {
    title: "🛒 Shop — !shop",
    fields: [
      { name: "📋 Waa maxay?", value: "Dukaanka coinska — halkan waxaad ka iibsan kartaa items kala duwan." },
      { name: "📝 Sida loo isticmaalo", value: "`!shop` — Arag dukaanka\n`taabo shayga` xaqiiji — saas ku gadatay" },
      { name: "🛍️ Items", value: "Dukaanka waxaa ku jira streak shields, XP boosts, iyo wax yaalo kale oo badan." },
    ]
  },

  dshop: {
    title: "💎 Diamond Shop — !dshop",
    fields: [
      { name: "📋 Waa maxay?", value: "Dukaanka diamondska — diamondskaga ayaad wax kaga iibsan kartaa halkan." },
      { name: "📝 Sida loo isticmaalo", value: "`!dshop` — Arag dukaanka diamonds\n`Taabo buttonka shayga rabgtid` xaqiiji — saas ayaa ku gadatay" },
      { name: "💎 Items", value: [
        "Rob Shield, Streak Shield, XP Boost, iyo kuwo kale",
        "Diamonds waxaad ka helaysaa `!daily` iyo `!vote`",
      ].join("\n") },
    ]
  },

  fti: {
    title: "🎭 Find The Imposter — !fti",
    fields: [
      { name: "📋 Waa maxay?", value: "Ciyaarta ugu xiisaha badan! Dadku waxay isku dayaan inay ogaadaan yaa imposter ah (Mafia).Wada sheekaysi, dood, iyo codayn!" },
      { name: "📝 Sida loo isticmaalo", value: "`!fti` — Bilow lobby cusub" },
      { name: "🎮 Sida loo ciyaaro", value: [
        "1. Lobby furan ayaa la sameeyaa — dadku waxay ku biirayaan buttonka",
        "2. Qof ayaa loo doortaa **Imposter** (DM ayuu ka ogaanayaa)",
        "3. Qof kasta wuxuu helayaa role (shacab/Imposter)",
        "4. Marka la dhameeyo, codayn ayaa la sameeyaa",
        "5. Haddii la ogaado Imposter-ka, Citizensku way guuleysanayaan",
      ].join("\n") },
      { name: "💰 Abaal-marin", value: "XP haddaad guulaysato" },
      { name: "👁️ Observer Title", value: "Haddaad leedahay Observer Title ( `!limited` item), DM ayaad ku ogaan doontaa hal citizen oo safe ah marka ciyaartu bilaabato." },
    ]
  },

  tower: {
    title: "🧗 Tower Climb — !tower",
    fields: [
      { name: "📋 Waa maxay?", value: "Fuulista towerka — floor kasta waxaad doorataa safe ama risky. Intaad kor u socoto, XP aad u badan ayaad helaysaa. Laakiin haddaad dhacdo, wax walba waad waynaysaa!" },
      { name: "📝 Sida loo isticmaalo", value: "`!tower` — Bilow tower cusub" },
      { name: "🎮 Sida loo ciyaaro", value: [
        "Floor kasta waxaad dooranayaaa:",
        "🟢 **Safe** — xooga ayaad kor u baxaysaa",
        "🔴 **Risky** — XP badan laakiin khatarta way sarraysaa",
        "💰 **Cash Out** — Qaado XP-da aad ururisay oo jooji",
        "",
        "Haddaad dhacdo (risky ku guuldaraysato), XP-da oo dhan waad waynaysaa!",
      ].join("\n") },
      { name: "💡 Talo", value: "Marka aad XP fiican ururiso, Cash Out riix si aadan wax u lumin." },
    ]
  },

  miino: {
    title: "💣 Miino — !miino",
    fields: [
      { name: "📋 Waa maxay?", value: "Minesweeper-ka Soomaalida! Grid 4x5 ah waxaa ku jira 4 miino — isku day inaad dhammaan meelaha safe-ka ah furto oo aadan miino ku dhicin." },
      { name: "📝 Sida loo isticmaalo", value: "`!miino` — Bilow ciyaar\n`!miino @qof` — La ciyaar qof kale" },
      { name: "🎮 Sida loo ciyaaro", value: [
        "Grid-ka 4x5 waxaa ku jira **4 miino** iyo **16 safe**",
        "Button-yada riix si aad u furto meel",
        "✅ Safe — sii wad!",
        "💣 Miino — ciyaartu way dhamaatay!",
        "",
        "Inta badan ee aad furto oo aadan miino ku dhicin, XP aad u badan ayaa helaysaa.",
        "Best reveal: /16 (dhammaan safe-ka fur)",
      ].join("\n") },
      { name: "💰 Abaal-marin", value: "XP — intaa badan ee aad furto, wax badan ayaad helaysaa" },
    ]
  },

  sheeko: {
    title: "🎭 Sheeko Been ah — !sheeko",
    fields: [
      { name: "📋 Waa maxay?", value: "Ciyaarta beenta iyo runta! Qof kasta wuxuu qoranayaa 3 sheeko — 2 run ah iyo 1 been ah. Dadka kale waxay isku dayayaan inay ogaadaan tan beenta ah." },
      { name: "📝 Sida loo isticmaalo", value: "`!sheeko` — Bilow ciyaar cusub" },
      { name: "🎮 Sida loo ciyaaro", value: [
        "1. Ugu yaraan 3 qof ayaa loo baahan yahay",
        "2. Qof kasta wuxuu model box ku qorayaa 2 sheeko run ah + tan beenta ah",
        "3. Dadka kale waxay codaynayaan tan ay u maleynayaan beenta",
        "4. Haddaad qariso beentaada — guul!",
      ].join("\n") },
      { name: "💰 Abaalmarin", value: "XP" },
    ]
  },

  q: {
    title: "🎯 Qabso Tiro — !q",
    fields: [
      { name: "📋 Waa maxay?", value: "Ciyaarta tirada — adiga iyo qof kale ayaa tiro sir ah dooranaya, ka dibna waxaad isku dayaysaan inaad tirada aad kala qabsateen qiyastan." },
      { name: "📝 Sida loo isticmaalo", value: "`!q @qof` — La ciyaar qof" },
      { name: "🎮 Sida loo ciyaaro", value: [
        "1. Labada qof waxay Box model ku qorayaan tiro (1-100)",
        "2. Hal hal mar ayaad tiro sheegaysaan oo ku qoraysaan chatka",
        "3. Kii ugu horeeya ee tirada qofka kale qaato sheega, ayaa badinaya!",
      ].join("\n") },
      { name: "📊 Stats", value: "Wins, losses, iyo streak ayaa laguu diwaan galinayaa laakiin XP laguma helo ciyaartan." },
    ]
  },

  taraq: {
    title: "🃏 Taraq — !taraq",
    fields: [
      { name: "📋 Waa maxay?", value: "Shuffle taraq — Just dadka ayaa galaya buttonka ku biir, kadibna botka ayaa si random iskugu xijinaya!" },
      { name: "📝 Sida loo isticmaalo", value: "`!taraq`" },
      { name: "💡 Faahfaahin", value: "Maadama wax aan ka dhaho jirin halkaan. Fadlan u codee nasiib bot thanks.." },
    ]
  },

  give: {
    title: "🎁 Give — !give",
    fields: [
      { name: "📋 Waa maxay?", value: "Lacag u dir qof kale. Coinskaaga waxaad u diri kartaa qof kale." },
      { name: "📝 Sida loo isticmaalo", value: "`!give @qof <lacag> `\n\nTusaale: `!give 1000 @mitoma`" },
    ]
  },

  prestige: {
    title: "✨ Prestige — !prestige",
    fields: [
      { name: "📋 Waa maxay?", value: "Marka aad level 50 gaarto, ayaad prestige samayn kartaa. Levelkaagu wuxuu dib u noqdaa 1, laakiin waxaad helaysaa prestige badge iyo profile color cusub." },
      { name: "📝 Sida loo isticmaalo", value: "`!prestige`" },
      { name: "✨ Prestige Levels", value: [
        "P1 — 🟡 Dahab",
        "P2 — 🟣 Buluug",
        "P3+ — 💗 Pink",
      ].join("\n") },
    ]
  },

  vote: {
    title: "Limited — !limited",
    fields: [
      { name: "📋 Waa maxay?", value: "waa shay limited ah oo yaalo kaliya waqti xadidan, 1 mar kaliya! Sidoo kale u codaynta nasiib waxay bixisa coins iyo diamonds." },
      { name: "📝 Sida loo isticmaalo", value: "`!limited` — Botton ayaa kuu soo baxaya sheegaya in shayga gadan kartid" },
      { name: "💰 Abaalmarin", value: "Title kaas waligiis kaama dhacayo" },
      { name: "⏱️ Cooldown", value: "**Forever**" },
    ]
  },

  quests: {
    title: "📜 Quests — !quests",
    fields: [
      { name: "📋 Waa maxay?", value: "Hawlo yaryar oo maalin kasta aad samayn  karto si aad bonus coins iyo XP u hesho." },
      { name: "📝 Sida loo isticmaalo", value: "`!quests` — Arag questskaaga  maanta" },
      { name: "💡 Faahfaahin", value: [
        "Maalin kasta 3 quest cusub ayaa kuu soo muuqanaya",
        "Quest walpa waxay ku siinaysaa coins + XP",
        "Tusaale: \"Ciyaar !slots 3 jeer\" ama \"Isku day !rob\"",
      ].join("\n") },
    ]
  },

  wallet: {
    title: "👛 Wallet — !wallet",
    fields: [
      { name: "📋 Waa maxay?", value: "Arag lacagtaada iyo diamondskaaga." },
      { name: "📝 Sida loo isticmaalo", value: "`!wallet` — Wallet-kaaga\n`!wallet @qof` — Wallet qof kale" },
    ]
  },

  p: {
    title: "👤 Profile — !p",
    fields: [
      { name: "📋 Waa maxay?", value: "Profilekaaga oo dhan — level, wins, losses, streak, iyo wax badan." },
      { name: "📝 Sida loo isticmaalo", value: "`!p` — Profile-kaaga\n`!p @qof` — Profile qof kale" },
      { name: "📊 Buttons", value: [
        "💰 **Economy** — Coins, diamonds, shields, boosts",
        "🎮 **Game Stats** — Stats ciyaar kasta",
        "🏅 **Achievements** — Guulaha aad gaadhay",
        "📦 **Inventory** — Items-kaaga",
      ].join("\n") },
    ]
  },

  limited: {
    title: "🏷️ Limited Shop — !limited",
    fields: [
      { name: "📋 Waa maxay?", value: "Dukaan items gaar ah oo keliya halkan laga heli karo." },
      { name: "📝 Sida loo isticmaalo", value: "`!limited`" },
      { name: "🛍️ Items", value: [
        "👁️ **Observer Title** — 6,000 Coins",
        "FTI ciyaarteeda, DM ayaad ku ogaan doontaa hal citizen oo safe ah.",
      ].join("\n") },
    ]
  },

  lb: {
    title: "🏆 Leaderboard — !lb",
    fields: [
      { name: "📋 Waa maxay?", value: "Liiska ciyaartoyda ugu sarreeya — level, wins, iyo cool ." },
      { name: "📝 Sida loo isticmaalo", value: "`!lb` ama `!leaderboard`" },
    ]
  },

  rich: {
    title: "💰 Rich List — !rich",
    fields: [
      { name: "📋 Waa maxay?", value: "Liiska dadka ugu lacagta badan — kaliya wallet coins ayaa la xisaabinayaa." },
      { name: "📝 Sida loo isticmaalo", value: "`!rich`" },
    ]
  },

  banklb: {
    title: "🏦 Bank Leaderboard — !banklb",
    fields: [
      { name: "📋 Waa maxay?", value: "Liiska bankiyada ugu waaweyn ee server-ka. Arag bank-ga ugu lacagta badan, ugu users-ka badan, iyo level-kooda." },
      { name: "📝 Sida loo isticmaalo", value: "`!banklb`" },
    ]
  },

  bankpass: {
    title: "🎫 Bank Pass",
    fields: [
      { name: "📋 Waa maxay?", value: "Bank Pass waa ticket aad ku iibsanayso bank gaar ah in lacag badan dhigtid. Waxay kordhineysaa limitkaaga deposit ee bankgaas." },
      { name: "💰 Qiimaha", value: "**10,000 Coins** (95% botka, 5% bank ownerka)" },
      { name: "📈 Faa'iido", value: [
        "Limit-kaaga deposit: **100,000 → 150,000 Coins**",
        "Bank kasta pass gaar ah ayuu leeyahay",
        "Hal mar ayaa la iibsadaa — mana dhacayso oo expire maleh",
      ].join("\n") },
      { name: "💡 Sida loo helo", value: "Marka aad 100,000 gaarto deposit-kaaga bank, button 🎫 Bank Pass ayaa kuu soo muuqanaya halkas ka gado." },
    ]
  },

  cilad: {
    title: "🛠️ Cilad  — !cilad",
    fields: [
      { name: "📋 Waa maxay?", value: "Waa commmand aad ku soo gudbinayso ciladaha iyo errorska botka. Hadii bug heshid oo anaga ka war hayn diamond iyo gold baa helaysaa!" },
      { name: "📝 Sida loo isticmaalo", value: "`!cilad` — kadib send dheh \n — kadib soo koob cilada aad aragtay si detailed ahna u soo dir" },
    ]
  },

  myinvestments: {
    title: "📊 Invest — !invest",
    fields: [
      { name: "📋 Waa maxay?", value: "Arag dhammaan bankiyada aad maalgashiga ku leedahay, profitkaaga, iyo waqtiga claim sidoo kale withdrawgaaga." },
      { name: "📝 Sida loo isticmaalo", value: "`!invest`" },
    ]
  },
};

const aliases = {
  coinflip: "cf",
  profile: "p",
  leaderboard: "lb",
  "bank pass": "bankpass",
  "bank_pass": "bankpass",
  myinv: "invest",
  investments: "invest",
  drop: "cilad",
  grab: "cilad",
};

export function setupSomaliHelp(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith("!caawin ")) return;

    const query = message.content.slice(8).trim().toLowerCase();
    if (!query) return;

    const key = aliases[query] || query;
    const page = helpPages[key];

    if (!page) {
      const availableCommands = Object.keys(helpPages).map(k => `\`${k}\``).join(", ");
      const embed = new EmbedBuilder()
        .setTitle("❓ Command lama helin")
        .setDescription(`\`!caawin ${query}\` — command-kaas lama aqoonsan.\n\n**Commands la heli karo:**\n${availableCommands}`)
        .setColor(0xe74c3c);
      await message.reply({ embeds: [embed], components: [makeCloseBtn(message.author.id)] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(page.title)
      .setColor(HELP_COLOR)
      .setFooter({ text: "!caawin <command> — Wax kasta oo aad rabto inaad barato" });

    for (const field of page.fields) {
      embed.addFields(field);
    }

    await message.reply({ embeds: [embed], components: [makeCloseBtn(message.author.id)] });
  });
}
