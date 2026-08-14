# NasiibBot

### open source discord bot oo loo sameeyey dadka raba in ay fahman discord bots, sidoo kale serverskooda u samaystan bot.

[![License](https://img.shields.io/github/license/Vert-k/NasiibBot?style=flat-square)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Vert-k/NasiibBot?style=flat-square)](https://github.com/Vert-k/NasiibBot/stargazers)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org/)

NasiibBot waa bot Discord ah oo diiradda saaraya communityga  waxaana lagu dhisay Node.js, Discord.js, PostgreSQL, iyo Drizzle ORM. Waxa uu ka kooban yahay features dhaqaale, ciyaaro, banks, khamaar, tickey lottery , verification , codaynta top.gg, iyo features kale oo badan..

Kaydkan (repository) waxaa loo sameeyay inuu noqdo mid si fudud loo akhrin karo oo dib loo isticmaali karo. Waxaad u adeegsan kartaa meel aad ka bilowdo, waxaad ka baran kartaa sida nidaamyadu u shaqeeyaan, ama waxaad u habayn kartaa qaab serverkaaga ku haboon.

> **maku cusub tahay coding?** ka bilaw halkan [Beginner Setup](#beginner-setup).
>
> **Horey miyaa developer u tahay?** si toos ah u aad [Project Structure](#project-structure) ama
> [Contributing](#contributing).

## Codekan muxuu ka kooban yahay

- Economy, wallets, rewards, iyo player profiles
- Banking, transfers, loans, vaults, iyo sida shop iyo dshop 
- Coinflip, tower, iyo games kale 
- XP, levels, achievements, iyo game statistics
- Tickets, verification, permissions, iyo moderation utilities
- Voting iyo server boost systems (server boost system priv waye)
- PostgreSQL persistence through Drizzle ORM
- Optional Gemini AI features
- Beginner friendly environment setup

## Xog muhiim ah oo ku saabsan codekan public ah

Eventska iyo eid kuma jiraan sourcekan public ah , hadii event aad sameenaysid fadlan iska u samee.

Folderska kaliya waxay meesha u joogaan si uusan botka kaaga damin:

```text
src/event/event.mjs   # qoraal yar ayaa ku jira oo kuu sheegaya
src/eid/eid.mjs       # Eid Mubarak response
```

Amarrada la xiriira event ka waxay muujinayaan ogeysiis gaaban oo baaba’a 60 ilbiriqsi kadib..
Amarada ka bilawda `!eid` waxay kuugu Soo noqonayaan `Eid Mubarak` sidoo kale mudo kadib way kaa tirmayaan ilaa 60 seconds. si aad iskaga tirtid labadooda ama midkood iska tir messageka ka soo jawaabaya ee fileska ku jira.

## sharuudaha

waxaad u baahan tahay:

- computer ku shaqeenaya windows, macOS ama linux
- Node.js 20 ama kuwa ka dambeeyey
- Account discord ah
- Discord developer portal account ah
- Database PostgreSQL ah (fiiro gaar ah MangoDB hadii isticmaalaysid waa in aad codeka db file badashaa)

Optional:

- Git, Hadii aad rabtid in kaydkan clone ka samaysatid adiga oo isticmalaya terminal
- A Gemini API key, Kaliya hadii aad rabtid in features ai ah isticmashid (nasiib 1 wax oo isticmala malahan)

> Versionkan wuxuu isticmaala **PostgreSQL**, ma isticmaalo mangoDB . si aad ugu badashid waxaad u baahan tahay
> in aad dib u qortid aas aaska databaseka.

## Beginner Setup

### 1.download NasiibBot

#### Option A: Clone garee adiga oo isticmaalaya Git

```bash
git clone https://github.com/Vert-k/NasiibBot.git
cd NasiibBot
```

#### Option B: Download a ZIP

1. Fur [NasiibBot repository](https://github.com/Vert-k/NasiibBot).
2. Dooro **Code**.
3. Dooro **Download ZIP**.
4. Extract dheh ZIP fileka.
5. fur fileka extracted `NasiibBot` folder.

### 2. Hubi Node.js

Fur Terminal, Command Prompt, ama PowerShell kadibna qor:

```bash
node -v
npm -v
```

Node.js waa in uu noqda version 20 ama kuwa ka dambeeyey.

### 3. Soo install garee dependencies

ku qor text gan NasiibBot folder dhexdiisa:

```bash
npm install
```

Midan waxay sameenaysaa packages uu botka u baahan yahay waxayna sameenaysaa `node_modules` folder.

### 4. Samee Discord application

1. Marka hore fur [Discord Developer Portal](https://discord.com/developers/applications).
2. Dooro **New Application**.
3. Sii appka aad sameenaysid magac.
4. Fur qaybta **Bot** pageka.
5. Dooro **Add Bot** Hadii uu discord ku waydiiyo.

### 5. Samayso environment file

Repo ama kaydan waxaa ku jira  `.env.example`. samee mid private copy ah una bixi `.env`.

macOS ama Linux:

```bash
cp .env.example .env
```

Hadii yahay Windows, duplicate `.env.example` kadib magaca waxaa ku badashaa `.env`.
Hubi in aadan si qaldan magaca uga dhigin  `.env.txt`.

Fur `.env` Kadib ku qor kuwaaga adiga leedahay:

```env
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URL=postgresql://username:password@host:5432/database
GEMINI_API_KEY=
```

`DISCORD_TOKEN` iyo `DATABASE_URL` waa qasab. `GEMINI_API_KEY` waa optional.

### 6. ku soo dad Discord bot token

qaybta **Bot** pageka ee developer portal:

1. Fiiri qaybta ay ku qoran tahay Token.
2. Dooro **Reset Token** ama **Copy**.
3. Token kaas waxaad soo galisaa `.env` file.

Token kaas waa passwordka botkaaga. Never marna ha soo galin GitHub, Qaybta discord messages, screenshots, README files, source code, ama `.env.example`.

Hadii tokenkaaga uu kaa soo baxsado ama si qalad ah public kaaga noqdo, si deg deg ah reset oga dheh developer portalka.

### 7. Furo required intents

Developer Portal dhexdiisa, Gal **Bot → Privileged Gateway Intents** kadib soo furo
the intents required oo uu botkaaga u baahan yahay. Si gaar ah, Hubi:

- **Server Members Intent**
- **Message Content Intent**

Kadib dheh **Save Changes**.

Kaliya furo permissions iyo intent oo uu botkaaga u baahan yahay.

### 8. Diyaarso PostgreSQL

NasiibBot wuxuu kaa sugaya PostgreSQL connection string sida:

```text
postgresql://username:password@host:5432/database
```

Soo gali fileka `.env`:

```env
DATABASE_URL=your_postgresql_connection_string
```

Bot ku wuxuu sameenayaa khaanado (tables) uu u baahan yahay marka uu bilaabmo. Uma baahnid inaad gacanta ku samayso jadwal kasta ka hor intaadan markii ugu horreysay bilaabin, laakiin mar walba u samee backup database yada muhiimka ah ee production ka ka hor intaadan wax ka bedelin.

### 9. botka ku invite garee server

isticmaal Developer Portal qaybta **Installation** ama **OAuth2** settings si aad u samaysid invite link:

1. Dooro `bot` scope.
2. dooro Kaliya kuwa aad rabtid botkaaga in uu permision u lahaado.
3. Fur invite link.
4. Dooro serverkaaga.
5. Authorize sii bot.

Iska ilaali botkaaga in administration siisid ilaa uu 100% u baahan yahay ma ahane.

### 10. Bilaw botka

```bash
npm start
```

Midaan waxay daaraysaa `node bot.mjs`, midaas oo ayadana bilaabaysa isha 1aad ee botka `src/bot.mjs`.

si aad botka u joojisid:

```text
Ctrl + C
```

## Sida botka loogu habeeyo serverkaaga

Source codekan markii hore waxaa loo sameeyey server asiga qaas u ah iyo meelo gaar ah, marka wuxuu ka koobnaan karaa ID’s ay leeyihiin servers gaar ah iyo channels oo toos ugu yimid. inta aadan wax ka samaysid,
Raadi folderka `src/` Soo hel ID’s kale oo original ahaa kuna badal kuwa aad adiga rabtid.

ID’s waxay ka koobnaan karaan:

- Guild ama server IDs
- Channel IDs
- Role IDs
- Owner IDs
- Staff IDs
- Message IDs

### Sidee discord ID copy loo dhaha

1. Fur discordkaaga qaybta settings.
2. Gal qaybta **Advanced**.
3. kadib furo **Developer Mode**.
4. Kadib taabo ama click sii roles, channels, user.
5. kadib taabo **Copy ID**.

Numbers walba ha iska badalin, kuwo ayaa noqon kara message ID’s,
prices, timers, database values, ama waxyaalo kalo settings ah.

Sidoo kale waxaa badali kartaa:

- Magaca botka iyo statuskiisa
- Messages iyo Somali text
- Emojis, sawirada, iyo links
- abaalmarinaha ama economy values
- Channels iyo roles
- Featureska ku jira 

## Project Structure

```text
NasiibBot/
├── bot.mjs                 # Bilawga botka
├── src/
│   ├── app.mjs             # Main Discord client and feature wiring
│   ├── bot.mjs             # Environment loading and startup
│   ├── db.mjs              # PostgreSQL and database helpers
│   ├── eid/
│   │   └── eid.mjs         # Public Eid placeholder
│   ├── event/
│   │   └── event.mjs       # Public disabled-event placeholder
│   └── *.mjs               # Individual bot systems
├── .env.example            # Safe list of required environment variables
├── .gitignore
├── discloud.config         # Optional Discloud settings
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
└── SECURITY.md
```

Nidaamyada bot ka waxaa lagu kala shubay modules gaar ah, si hadii wax cusub aad ku soo daraysid ama aad  baari kartid ama u habayn kartid 1 feature keliya adiga oo aan ka dhex raadin hal fayl oo aad u weyn..

## cilad bixinta

<details>
<summary><strong>The bot is offline</strong></summary>

Hubi waxyaalahan:

1. `DISCORD_TOKEN` in uu saxan yahay.
2. `.env` in uu yaalo rootka projectga.
3. In fileka magaciisa yahay `.env`, oo uusan ahayn `.env.txt`.
4. In aad qortay `npm install`.
5. In botka serverka uu ku jiro.
6. In required intents ay u furan yahiin.
7. In aad ku bilawday `npm start`.

</details>

<details>
<summary><strong>DATABASE_URL Waa in ay jirtaa</strong></summary>

Hubi in URL databasekaaga ay ku jirto fileka `.env`
Ay ka kooban tahay string sax ah:

```env
DATABASE_URL=postgresql://username:password@host:5432/database
```

Restart dheh botka kadib markii aad save dhahdid:

```bash
npm start
```

</details>

<details>
<summary><strong>Invalid token</strong></summary>

Soo Fur Discord Developer Portal, reset dheh bot token, copy dheh kan cusub token, Dhex dhig `.env`, Kadib restart dheh botka.

</details>

<details>
<summary><strong>The bot is online but commands do not work</strong></summary>

Hubi in:

- In uu botka serverka saxda ku jiro.
- In uu haysto required channel permissions.
- in required privileged intents enabled yahiin.
-  serverkaaga, channelkaaga, iyo role IDs ay saxan yahiin.
- Amarka aad qortay ka jiraan source codeka botka.
- In terminal aysan ka muuqan wax error ah.

</details>

Hadii aad caawin rabtid, share garee errorka messageka, fileka magaciisa, iyo lineka cilada ka timid. marnaba ha
share garayn, database password, API key, ama `.env` file.

## Security

Never commit or publish:

- `.env`
- `DISCORD_TOKEN`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- Passwords or API keys
- Private logs
- Private configuration
- Cache folders

The `.gitignore` file already protects `.env`, but always double-check before
publishing changes. If a secret is exposed, revoke or rotate it immediately;
deleting the file alone is not enough.

Read [SECURITY.md](SECURITY.md) for more information.

## Contributing

Pull requests and improvements are welcome.

Before opening a pull request:

1. Keep new features in focused modules.
2. Do not commit credentials or private server configuration.
3. Add new environment variables to `.env.example`.
4. Explain what changed and how to test it.
5. Keep beginner setup instructions up to date.

## License

NasiibBot is released under the [MIT License](LICENSE).

## Links

- [GitHub Repository](https://github.com/Vert-k/NasiibBot)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Node.js](https://nodejs.org/)
- [Discord.js Documentation](https://discord.js.org/)
