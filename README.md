# Nasiib Discord Bot

Discordbot opensource ah oo ay ku jiraan gameks, economy’s, gambling , events , voting system, verification iyo server utility features.

source codkan waxaa loogu tala galay in uu public free noqdo sidaas darteed kuma jiraan wax logs ah, credentials , cache ama runtimes.

## Features

Sourcekan waxaa loo diyaariyey si nidaam oo qurux badan asiga oo kala leh:

- Banking, wallets, transfers, loans, vaults, shops, and rewards
- Coinflip, tower, and other game systems
- Tickets, permissions, verification, voting, and (server boosts)(server boosting ma soo raacin doono, fadlan midkaaga samayso) 
- Seasonal EID features (asiga wuxuu noqon doonaa private)
- A modular event and boss system ( event bot system asigana wuxuu nqon doonaa private)
- PostgreSQL persistence through Drizzle ORM
- Optional Gemini-powered features

## sharuudaha lagaa rabo

- node.js 20 ama kuwa ugu dambeeyey
- Discord bot iyo discord bot token (waxaad ka heli kartaa developer portal )
- PostgreSQL database ( Mangodb kuma isticmaali kartid ilaa aad code base data base wax ka badashid)
- A Gemini API key (kaliya hadii aad rantid in aad isticmaashid gemini ai)

## Sida loo kiciyo

1. marka koowaad clone garee repo.
2. Soo install garee dependencies:

   ```bash
   npm install
   ```

3. samayso local environment :

   ```bash
   cp .env.example .env
   ```

   4- ku buuxi `.env` kuwaaga saxda ah:

   ```env
   DISCORD_TOKEN=Discord_tokenkaaga
   DATABASE_URL=Linkiga_databasekaaga
   GEMINI_API_KEY=gemini_api_key
   ```

5. marka aad discord developer portal tagtid, furo privilege waliba oo aad isticmaalaysid
   furo configuration iyo linkiga inviteka botka adiga oo raacinaya permissionska aad rabtid in uu botkaaga isticmaalo.

6. Let’s goo start dheh botkaga:

   ```bash
   npm start
   ```

## Project layout

```text
.
├── bot.mjs                 # Root entry point
├── src/
│   ├── app.mjs             # Main Discord client and feature wiring
│   ├── db.mjs              # Database access
│   ├── eid/                # EID event feature modules
│   ├── event/              # Seasonal event and boss modules
│   └── *.mjs               # Individual bot systems
├── .env.example            # Safe environment variable template
├── discloud.config         # Optional Discloud deployment settings
├── package.json
└── package-lock.json
```



## Ku buuxso serverkaaga wixiisa

snapshotkan waxa uu ka kooban yahay botka waxyaalo uu iskiis u watay oo ay ku jiraan owner IDs, discord server IDs iyo channel ID’s
inta aadan botka original kicin, hubi in aad gashid `src/`
raadi meelaha ka kooban ids sida 993736262527 kadib ku badal kuwa aad la rabtid adiga.

sidoo kale waxaad u baahan tahay in aad badashid , emojis, sawirada , videos ku jira rootska.

## Safety

- marna ha comit garayn `.env`.
- waligaa discord tokenkaaga iyo database ama waxba ha soo galin source codkaaga.
- Hadii marba si qalad ah aad aragtid in ay kaaga soo fakadeen, isla markii meesha ay ka yimaadeen tag, kadib revoke dheh oo mid cusub samee.
- isticmaal `.env.example` kaliya si ay meel buuxis kuugu noqdaan.

## Contributing

in aad wax ku dartid way furan tahay. Hadii aad wax cusub ku daraysid hubi meel ku haboon in aad dhigtid, ka ilaali in aad credentials ama caches too dhigtid, ama in aad ku soo dartid hal shay oo token ah ama wax la xariira soo dhigtid `.env.example`.

## License

This project is released under the MIT License. See `LICENSE`.
