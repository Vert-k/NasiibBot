// ================================================================
//  NASIIB BOT — SOMALI TEXT FILE
//  Halkan waxaad ku beddeli kartaa DHAMMAAN QORAALKA SOMALIGA.
//
//  Sida loo isticmaalo:
//   • Ku fur faylkan (somali.mjs) editor-kaaga
//   • Badal qoraalka u dhaxeeya " " ama ` `
//   • save oo bot ka dib u bilow
//
//  OGEYSIIS:
//   • Ha tirtirin xarfaha \u{...} — emojiyo ayay u yihiin botka
//   • Ha tirtirin ${...} — values dynamic ah ayaa ku jira
//   • Ha tirtirin => { ... } — ayagana functions waaye
// ================================================================

const T = {
  // âââââââââââââââââââââââââââââââââââ
  // ACHIEVEMENTS
  // âââââââââââââââââââââââââââââââââââ
  achv_fti50_name: "\u{1F3C6} Legend of FTI",
  achv_fti50_desc: "Ku guuleyso 50 FTI",
  achv_imp10_name: "\u{1F575}\uFE0F Shadow Mind",
  achv_imp10_desc: "Ku guuleyso 10 Imposter ahaan",
  achv_cit10_name: "\u{1F6E1} Village Hero",
  achv_cit10_desc: "Guuleyso 10 game Citizen ahaan",
  achv_games100_name: "\u{1F3AE} Veteran",
  achv_games100_desc: "ciyaar 100 ciyaar",
  achv_guess5_name: "\u{1F3AF} Sharpshooter",
  achv_guess5_desc: "Ku guuleyso 5 Qabso Tiro",
  achv_guess10_name: "\u{1F9E0} Mind Reader",
  achv_guess10_desc: "Ku guuleyso 10 Qabso Tiro",
  achv_bluff5_name: "\u{1F0CF} Card Shark",
  achv_bluff5_desc: "Ku guuleyso 5 Bluff Master",
  achv_bluff15_name: "\u{1F3A9} Master Bluffer",
  achv_bluff15_desc: "Ku guuleyso 15 Bluff Master",
  achv_tower10_name: "\u{1F9D7} Climber",
  achv_tower10_desc: "Floor 10 gaadh Tower Climb",
  achv_tower25_name: "\u{1F3D4} Summit Master",
  achv_tower25_desc: "Floor 25 gaadh Tower Climb",
  achv_miino15_name: "\u{1F4A3} Minesweeper",
  achv_miino15_desc: "15+ tile fur Miino",
  achv_miino_perfect_name: "\u{1F48E} Perfect Clear",
  achv_miino_perfect_desc: "Dhammaan 16 safe tile fur Miino",
  achv_sheeko5_name: "\u{1F3AD} Storyteller",
  achv_sheeko5_desc: "Ku guuleyso 5 Sheeko Been ah",
  achv_sheeko_fool_name: "\u{1F3A9} Master Deceiver",
  achv_sheeko_fool_desc: "Dhammaan u khiyaanee Sheeko",
  // Hidden achievements
  achv_cold_blooded_name: "\u{1F9CA} Cold Blooded",
  achv_cold_blooded_desc: "3 guul isku xigta imposter ahaan",
  achv_daily7_name: "\u{1F4C5} Dedicated",
  achv_daily7_desc: "7 maalmood oo isku xigta !daily",
  achv_prestige1_name: "\u2728 Prestige I",
  achv_prestige1_desc: "Prestige marka hore",
  achv_streak10_name: "\u{1F48E} Diamond Will",
  achv_streak10_desc: "10 guul isku xigta",
  achv_allgames_name: "\u{1F31F} All-Rounder",
  achv_allgames_desc: "Ku guuleyso dhammaan ciyaaraha",
  achv_none: "Wali ma furan.",
  achv_hidden_count: (n) => `\u{1F512} ${n} qarsoon...`,
  titles_none: "Wali ma furan.",
  // âââââââââââââââââââââââââââââââââââ
  // TOWER CLIMB
  // âââââââââââââââââââââââââââââââââââ
  tower_title: (floor) => `\u{1F9D7} Tower Climb \u2014 Floor ${floor}`,
  tower_accumulated_xp: (xp) => `\u{1F4B0} **Accumulated XP:** ${xp}`,
  tower_safe_label: (xp) => `\u{1F7E2} Safe \u2014 +${xp} XP (aamin)`,
  tower_risky_label: (xp, chance) => `\u{1F534} **Risky** \u2014 +${xp} XP (${chance}% dhicid)`,
  tower_cashout_label: (xp) => `\u{1F4B5} **Cash Out** \u2014 qaado ${xp} XP`,
  tower_warning: "\u26A0\uFE0F Haddii aad dhacdo, XP-gaaga oo dhan waa luminaysaa!",
  tower_safe_btn: (xp) => `\u{1F7E2} Safe (+${xp} XP)`,
  tower_risky_btn: (xp) => `\u{1F534} Risky (+${xp} XP)`,
  tower_cashout_btn: (xp) => `\u{1F4B5} Cash Out (${xp} XP)`,
  tower_timeout_title: "\u23F0 Tower Climb \u2014 Waqtigaa Dhacay!",
  tower_timeout_desc: (id, xp) => `<@${id}> waqtigaagii wuu dhacay. ${xp} XP waa waysay!`,
  tower_cashout_title: "\u{1F9D7} Tower Climb \u2014 Cash Out!",
  tower_cashout_desc: (xp, floor) => `\u{1F4B0} **+${xp} XP** ayaa lagugu daray!
\u{1F4CA} Floor ${floor} ayaad gaadhay.`,
  tower_cashout_win: (xp) => `🎉 **Hambalyo! Cashout guulaysatay!** 🎊\n\n💰 **+${xp} XP** ayaa lagugu daray!`,
  tower_fell_title: "\u{1F9D7}\u{1F4A5}WAA DHACDAY!",
  tower_fell_desc: (floor, lostXP) => `Floor **${floor}** ayaad ka dhacday!

\u{1F480} **${lostXP} XP** waa waysay!
\u{1F4CA} Tallaabooyinka: ${floor - 1} floor`,
  tower_already_playing: "\u26A0\uFE0F Horey ayaad tower u bilowday. Dhamee marka hore.",
  // âââââââââââââââââââââââââââââââââââ
  // MIINO / MINEFIELD
  // âââââââââââââââââââââââââââââââââââ
  miino_title: "\u{1F4A3} Miino \u2014 Minefield",
  miino_tiles_revealed: (n) => `\u{1F4CA} Tiles: ${n}/16`,
  miino_accumulated: (xp) => `\u{1F4B0} XP: ${xp}`,
  miino_cashout_btn: (xp) => `\u{1F4B5} Cash Out (${xp} XP)`,
  miino_timeout_title: "\u23F0 Miino \u2014 Waqtigaa Dhacay!",
  miino_timeout_desc: (id, xp) => `<@${id}> waqtigaagii wuu dhacay. ${xp} XP ayaa waysay!`,
  miino_mine_title: "\u{1F4A3}\u{1F4A5} MIINO! \u2014 Qarax!",
  miino_mine_lost: (xp) => `

\u{1F480} **${xp} XP** ayaa waaysay!`,
  miino_perfect_title: "\u{1F4A3}\u{1F3C6} MIINO \u2014 PERFECT CLEAR!",
  miino_perfect_desc: (bonus, total) => `

\u{1F389} Dhammaan safe tiles waad furtay!
\u{1F381} **+${bonus} Bonus XP!**
\u{1F4B0} Total: **+${total} XP**`,
  miino_cashout_title: "\u{1F4A3} Miino \u2014 Cash Out!",
  miino_cashout_desc: (xp, tiles) => `\u{1F4B0} **+${xp} XP** ayaa lagugu daray!
\u{1F4CA} ${tiles} tile ayaad furatay.`,
  miino_already_playing: "\u26A0\uFE0F Horey ayaad miino u bilowday. Dhamee marka hore.",
  miino_tile_already: "\u26A0\uFE0F Tile-kan horey ayaa loo furay.",
  miino_v2_title: "\u{1F4A3} Miino",
  miino_v2_invite: (challenger, target) => `<@${target}>\n\n\u{1F3AE} **${challenger}** ayaa kugu casuumeen ciyaarta **Miino**!\n\nMa aqbashay?`,
  miino_v2_accept_btn: "\u2705 Aqbal",
  miino_v2_decline_btn: "\u274C Diid",
  miino_v2_declined: "\u274C Casuumadda waa la diiday.",
  miino_v2_not_invited: "\u26A0\uFE0F is daji walaal adi laguma casuumin.",
  miino_v2_already_playing: "\u26A0\uFE0F Qofkaas wuxu/waxay ku jiraan ciyaar kale.",
  miino_v2_not_your_turn: "\u274C Ma aha wareeggaaga.",
  miino_v2_bomb_hit: (name) => `\u{1F4A5} **${name}** Miino ayaa ku qaraxday!`,
  miino_v2_win: (name, xp) => `\u{1F3C6} **${name}** ayaa guuleysteen!\n\n\u{1F4B0} **+${xp} XP** ayaa laguugu daray!`,
  miino_v2_end_no_reward: "\u{1F6D1} Ciyaarta waa la joojiyay. Abaalmarin la'aan.",
  miino_v2_cant_restart: "\u274C Ma dhihi kartid restart \u2014 adiga ma tihid hostga.",
  miino_v2_select_difficulty: "\u{1F3AE} Dooro heerka adkaanta:",
  miino_v2_easy_btn: "\u{1F7E2} Fudud (4 💣)",
  miino_v2_medium_btn: "\u{1F7E1} Dhexdhexaad (5 💣)",
  miino_v2_extreme_btn: "\u{1F534} Adag (7 💣)",
  // ââââââââââââââââââââ��âââââââââââââââ
  // SHEEKO BEEN AH
  // âââââââââââââââââââââââââââââââââââ
  sheeko_lobby_title: "\u{1F3AD} Sheeko Been ah \u2014 Lobby",
  sheeko_lobby_info: "Min: 3 ciyaartoy | Max: 8\nHost-ka ayaa bilaabi kara markay 3+ ku jiraan.",
  sheeko_join_btn: "\u2705 Ku Biir",
  sheeko_leave_btn: "\u274C Ka Bax",
  sheeko_start_btn: "\u{1F3AC} Bilow",
  sheeko_tell_btn: "\u{1F4DD} Sheekee",
  sheeko_round_title: (current, total) => `\u{1F3AD} Round ${current}/${total}`,
  sheeko_round_desc: (id) => `<@${id}> \u2014 wareeggaaga!

Riix badhanka hoose si aad u qorto 3 sheeko.
Mid waa in been ahaataa!

Ciyaartoyda kale waxay qiyaasi doonaan kee baa been ah.`,
  sheeko_timeout_storyteller: (id) => `\u23F0 <@${id}> waqtigoodii wuu dhacay! Wareegga xiga...`,
  sheeko_result_title: (name) => `\u{1F3AD} Natiijada \u2014 ${name}`,
  sheeko_lie_was: (num, text2) => `**Beenta waxay ahayd:** ${num}\uFE0F\u20E3 "${text2}"`,
  sheeko_correct: "\u2705 **Sax:**",
  sheeko_wrong: "\u274C **Qalad:**",
  sheeko_fooled_all: (name, xp) => `
\u{1F3A9} **${name} dhammaan ayey khiyaaneeyeen!** +${xp} XP`,
  sheeko_fooled_majority: (name, xp) => `
\u{1F3AD} **${name} badidooda ayey khiyaanadeeyeen!** +${xp} XP`,
  sheeko_not_fooled: (name, xp) => `
\u{1F605} **${name} cidna ma khiyaaneeyin ama dadyar ayey khiyaaneen.** +${xp} XP`,
  sheeko_final_title: "\u{1F3AD} Sheeko Been ah \u2014 Natiijada Ugu Dambeysa!",
  sheeko_winner: (name) => `

\u{1F3C6} **${name}** ayaa guuleysteen!`,
  sheeko_started_title: "\u{1F3AD} Sheeko Been ah ayaa \u2014 Bilaabatay!",
  sheeko_started_desc: (count) => `Ciyaartu way bilaawatay! ${count} ciyaartoy.

Qof walba wuxuu sheegi doonaa 3 sheeko \u2014 labo run iyo mid been ah!`,
  sheeko_statements_title: (name) => `\u{1F3AD} ${name} \u2014 Sheekooyin`,
  sheeko_which_lie: "**Kee baa been ah?** Dooro hoos! (30s)",
  sheeko_modal_title: "\u{1F3AD} Sheekadaada \u2014 3 wax sheeg, 1 been ah",
  sheeko_modal_s1: "Sheeko 1",
  sheeko_modal_s2: "Sheeko 2",
  sheeko_modal_s3: "Sheeko 3",
  sheeko_modal_lie: "Kee baa been ah? (1, 2, ama 3)",
  sheeko_modal_submitted: "\u2705 Sheekadaada waa la diiwaan geliyay!",
  sheeko_modal_invalid_lie: "\u274C Ku qor 1, 2, ama 3 ee sheekada beenta ah.",
  sheeko_channel_active: "\u26A0\uFE0F Sheeko Been ah ayaa horey uga socota channel-kan.",
  sheeko_lobby_empty: "\u274C Lobby waa la joojiyay \u2014 qof ma hayn.",
  sheeko_host_only_start: "Host-ka keliya ayaa bilaabi kara.",
  sheeko_min_players: "Ugu yaraan 3 ciyaartoy ayaa loo baahan yahay.",
  sheeko_cant_vote_storyteller: "\u274C Ma codayn kartid \u2014 adiga ayaa sheekaysanaya!",
  sheeko_not_in_game: "\u274C Ciyaartan kuma jirtid.",
  sheeko_already_voted: "\u26A0\uFE0F Horey ayaad u codaysay.",
  sheeko_vote_recorded: (voted, total) => `\u2705 Codkaaga waa la diiwaan geliyay! (${voted}/${total})`,
  sheeko_cant_tell_now: "\u274C Waqtigan la ma sheekaysan karo.",
  sheeko_not_your_turn: "\u274C Ma aha wareeggaaga.",
  sheeko_voting_ended: "\u274C Codaynta waa dhacday.",
  // âââââââââââââââââââââââââââââââââââ
  // FTI GAME
  // âââââââââââââââââââââââââââââââââââ
  fti_lobby_title: "\u{1F3AD} FTI \u2013 Game Lobby",
  fti_game_status: "\u{1F3AE} GAME STATUS",
  fti_waiting: "\u{1F7E2} ciyaarta ayaa la sugayaa...",
  fti_players_label: "\u{1F464} Ciyaartoyda:",
  fti_nobody: "Cidna kuma jirto.",
  fti_lobby_closed: "Cidna kuma jirto. Lobby waa la xiray.",
  fti_lobby_timeout: "\u23F0 Lobby-ga waa la xiray waqti darteed (60s).",
  fti_active_in_channel: "\u26A0\uFE0F FTI game ama lobby horey ayaa ka socota channel-kan.",
  fti_already_in_game: "Horey ayaad ciyaar kale ugu jirtaa server-kaan.",
  fti_enter_players: "Fadlan soo qor inta qof ee ku dheelaysaan (3-25):",
  fti_invalid_number: "Fadlan geli tiro u dhaxaysa 3-25.",
  fti_role_imposter: "\u{1F52A} **Imposter**",
  fti_role_citizen: "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1} **Shacab**",
  fti_your_role: (role) => `Doorkaaga waa: ${role}`,
  fti_other_imposters: (names) => `Imposters-ka kale: ${names}`,
  fti_desc_title: "\u{1F3AD} Find The Imposter",
  fti_desc_text: "Ciyaar maskaxeed iyo khiyaano.\n\n\u{1F465} **shacabka** \u2013 waxay soo helayaan Imposter-ka\n\u{1F575}\uFE0F **Imposters** \u2013 wuxuu isku dhex qarinayaa shacabka si uu u badbaado\n\n\u{1F3C6} XP & Level System\n\u{1F396} Achievements\n\u{1F525} Streak Bonuses\n\nKu ciyaar si xeel dheer.",
  fti_discussion_title: (day) => `\u{1F5E3} Maalinta ${day} \u2014 Dood`,
  fti_discussion_desc: (time, alive) => `\u23F1 Waqti: **${time}s**

\u{1F465} Dadka Nool:
${alive}`,
  fti_vote_title: "\u{1F5F3} Waqtiga Codeynta",
  fti_vote_desc: "Hada codee! Waxaad haysataa **60** ilbiriqsi.\n\n\u{1F512} Chat-ka waa la xiray waqtiga codeynta, hadii admin tahay wax ha soo qorin please.",
  fti_vote_results_title: "\u{1F4CB} Natiijada Codeynta",
  fti_eliminated_title: "\u2620\uFE0F Qof ayaa la saaray!",
  fti_eliminated_desc: (name, role) => `**${name}** waa la saaray.

Doorkooda wuxuu ahaa: **${role}**`,
  fti_tie_title: "\u{1F91D} Bar-bar dhac!",
  fti_tie_desc: (names) => `${names} way siman yihiin!
Revote ayaa bilaabanaysa \u2014 kuwan keliya ayaa loo codeyn karaa.`,
  fti_tie_again: "\u{1F91D} Mar labaad way siman yihiin!",
  fti_tie_again_desc: "Cidna lama saarin. Maalin cusub ayaa bilaabanaysa.",
  fti_no_votes: "\u{1F937} Codeyn ma dhicin",
  fti_no_votes_desc: "Cidna ma codeyn. Maalin cusub ayaa bilaabanaysa.",
  fti_revote_no_voters: "Cidna ma codeyn  \u2014 maalin cusub ayaa bilaabanaysa.",
  fti_revote_title: "\u{1F5F3} Revote!",
  fti_revote_desc: (mentions) => `${mentions}

Kuwan keliya ayaa la codeyn karaa. Waxaad haysataa **30** ilbiriqsi.`,
  fti_final_stand_title: "\u{1F6A8} FINAL STAND ACTIVATED \u{1F6A8}",
  fti_final_stand_desc: (mentions) => `${mentions}

2 daqiiqo oo waqti dheeri ah ayaa lagu daray.

Ciyaarta waxay gaartay xaalad adag.
Hal qalad... waad baxday, yaa bixi doona hehehe.`,
  fti_inactivity_title: "\u26A0\uFE0F Ciyaartoyda laa saaray!",
  fti_game_over_title: "\u{1F3C1} Ciyaarta way dhamaatay!",
  fti_game_over_winner: (winner) => `\u{1F3C6} **${winner} ayaa badiyay!**`,
  fti_xp_distributed_title: "\u{1F3C6} XP Rewards Distributed!",
  fti_xp_distributed_desc: "Dhammaan ciyaartoyda XP waa la idiin qaybiyey Gg.",
  // âââââââââââââââââââââââââââââââââââ
  // BLUFF MASTER
  // âââââââââââââââââââââââââââââââââââ
  bluff_lobby_title: "\u{1F0CF} Bluff Master \u2014 Lobby",
  bluff_lobby_info: "Min: 3 ciyaartoy | Max: 6\nHost-ka ayaa bilaabi kara markay 3+ ku jiraan.",
  bluff_join_btn: "Ku biir",
  bluff_leave_btn: "Ka bax",
  bluff_start_btn: "Bilow!",
  bluff_info_btn: "Faahfaahin",
  bluff_info_title: "\u{1F0CF} Bluff Master \u2014 Faahfaahin",
  bluff_info_desc: '**Sidee loo ciyaaraa:**\nCiyaartoy kasta waxaa la siinayaa kaadhadhka. Wareeg kasta, rank cusub ayaa la sheegayaa (A, 2, 3...).\n\nWareegaaga markuu yimaado:\n\u{1F3B4} Dooro inta kaadh ee aad dhiganayso (1-4)\nKaadhadhka waxaad dhiganaysaa waa qarsoodi \u2014 waad been sheeganaysaa ama run!\n\nCiyaartoy kale waa yiraahdaan **"Bluff!"** si ay u hubsadaan.\n\u2022 Haddii BEEN ahayd \u2192 Adigu pile-ka oo dhan waad qaadataa\n\u2022 Haddii RUN ahayd \u2192 Qofka ku challange-garay ayaa pile-ka qaata\n\n\u{1F3C6} Qofka ugu horreya ee gacanta ka baxda waa guuleystaha!\n\n\u{1F4B0} XP: Guul +30, Guuldarro +5',
  bluff_lobby_empty: "Cidna kuma jirto. Lobby waa la xiray.",
  bluff_lobby_timeout: "\u23F0 Bluff lobby-ga waa la xiray waqti darteed (90s).",
  bluff_active_lobby: "\u26A0\uFE0F Bluff lobby horey ayaa ka socota channel-kan.",
  bluff_active_game: "\u26A0\uFE0F Bluff game horey ayaa ka socota channel-kan.",
  bluff_started_title: "\u{1F0CF} Bluff Master \u2014 Bilaaw!",
  bluff_started_desc: (count) => `Ciyaarta waa bilowday! ${count} ciyaartood.

Qof kasta kaadhadhkiisa ayaa loo diray DM.`,
  bluff_your_hand: (cards, count) => `\u{1F0CF} **Bluff Master \u2014 Kaadhadhkaaga:**
${cards}

Total: ${count} cards`,
  bluff_hand_update: (cards, count) => `\u{1F0CF} Kaadhadhkaaga hadda: ${cards} (${count} cards)`,
  bluff_hand_empty: "\u{1F0CF} Kaadhadhkaaga oo dhan waad dhigtay! Sug in cid BLUFF yiraahdo...",
  bluff_turn_title: "\u{1F0CF} Bluff Master \u2014 Wareeg",
  bluff_turn_desc: (id, rank, max, pile, hands) => `<@${id}> waa wareeggaaga!

Rank: **${rank}**
Dhig 1-${max} kaadh oo aad sheegto inay **${rank}** yihiin.

Pile: ${pile} kaadh

\u{1F4CA} **Gacmaha:**
${hands}`,
  bluff_played: (name, count, rank, pile) => `**${name}** waa dhigay **${count}** kaadh oo **${rank}** ah.

Pile: ${pile} kaadh

\u{1F525} Yaa leh "BLUFF"? 15 ilbiriqsi...`,
  bluff_call_btn: "\u{1F525} BLUFF!",
  bluff_pass_btn: "\u2705 Ogolow",
  bluff_caught_title: "\u{1F525} BLUFF CAUGHT!",
  bluff_caught_desc: (caller, bluffer, cards, handCount) => `**${caller}** wuu ku qabtay **${bluffer}**!

Kaadhadhkii la dhigay: ${cards}
Waxay ahaayeen: \u274C BEEN!

**${bluffer}** pile-ka oo dhan wuu qaatay (${handCount} cards).`,
  bluff_honest_title: "\u2705 RUN AHAYD!",
  bluff_honest_desc: (caller, bluffer, cards, handCount) => `**${caller}** wuu ku qalday **${bluffer}**!

Kaadhadhkii la dhigay: ${cards}
Waxay ahaayeen: \u2705 RUN!

**${caller}** pile-ka oo dhan wuu qaatay (${handCount} cards).`,
  bluff_end_title: "\u{1F0CF} Bluff Master \u2014 Dhammaad!",
  bluff_end_desc: (name, standings) => `\u{1F3C6} **${name}** ayaa guuleystay!

Kaadhadhkiisa oo dhan wuu dhigay!

**Natiijada:**
${standings}`,
  bluff_timeout_title: "\u23F0 Bluff Master",
  bluff_timeout_desc: "Ciyaarta waa la joojiyay \u2014 waqti dheer lama ciyaarin.",
  bluff_game_not_running: "Ciyaarta ma socoto.",
  bluff_not_your_turn: "Ma aha wareeggaaga.",
  bluff_not_enough_cards: "Ma haysatid kaadhadhkaas oo dhan.",
  bluff_already_resolved: "Bluff-kaan horey ayaa loo xaliyay.",
  bluff_nothing_to_challenge: "Wax la challenge-gareeyo ma jiraan.",
  bluff_cant_challenge_self: "Naftaada ma challenge-gareeyn kartid.",
  bluff_cant_pass_self: "Naftaada ma pass-gareeyn kartid.",
  bluff_passed: "\u2705 Waad ogolaaday.",
  bluff_cards_label: (n) => `${n} kaadh`,
  // âââââââââââââââââââââââââââââââââââ
  // QABSO TIRO (GUESS THE NUMBER)
  // âââââââââââââââââââââââââââââââââââ
  guess_title: "\u{1F3AF} QABSO TIRO",
  guess_challenge_desc: (target, challenger) => `<@${target}>

\u{1F464} **${challenger}** ayaa kugu casuumay ciyaarta Qabso Tiro.

Ma aqbashay tartankan?`,
  guess_accept_btn: "Aqbal",
  guess_decline_btn: "Diid",
  guess_info_btn: "Faahfaahin",
  guess_info_title: "\u{1F3AF} Qabso Tiro \u2014 Faahfaahin",
  guess_info_desc: "Labada ciyaartood ayaa dooranaya tiro qarsoodi ah (1-100).\nKadib wareeg kasta mid ayaa qiyaasaya tirada ay qarsadeen qofka kale.\nBot-ku waxa uu ku siinayaa tilmaan: Ka weyn / Ka yar.\nQofka ugu horeya ee hela tirada saxda ah ayaa guuleysta.\n\n\u{1F3C6} XP: Guul +25, Guuldarro +5, bareejo +12 xaqiiqdii wax xp ah ma jiraan bye",
  guess_pick_title: "\u{1F3AF} QABSO TIRO \u2014 Tirada Dooro!",
  guess_pick_desc: "Labadiina ciyaartooy, gujiya button-ka hoose si aad u doorataan tiro qarsoodi ah (1-100).\n\nTiradaada qof kale ma arki karo.\nDooro hal mar oo keliya marka 2aad diamond ayaa kaa go'aya.",
  guess_pick_btn: "Dooro Tiradaada",
  guess_pick_modal_title: "\u{1F522} Dooro Tiradaada",
  guess_pick_modal_label: "Tiro u dhaxaysa 1-100",
  guess_start_title: "\u{1F3AF} QABSO TIRO \u2014 Bilaaw!",
  guess_start_desc: (turn, opponent) => `<@${turn}> waa wareeggaaga.

Qiyaas tirada ay doorteen <@${opponent}>.
Ku qor tiro u dhaxaysa 1-100.`,
  guess_your_turn: (id) => `<@${id}> waa wareeggaaga.`,
  guess_your_turn_chance: (id) => `<@${id}> waa wareeggaaga.
Fursad ayaad u haysataa inaad tirada hesho!`,
  guess_correct: (num) => `\u{1F389} Sax! Waad heshay tirada!
Tirada saxda ah waxay ahayd: **${num}**`,
  guess_higher: "\u{1F4C8} Ka weyn (Higher)",
  guess_lower: "\u{1F4C9} Ka yar (Lower)",
  guess_not_your_turn: "\u26D4 Ma aha wareeggaaga. Sug ilaa lagugu yeero.",
  guess_result_title: "\u{1F3AF} QABSO TIRO \u2014 Natiijo!",
  guess_draw: (p1, p2, g1, g2) => `\u{1F91D} **Bareejo!**

${p1}: ${g1} qiyaas
${p2}: ${g2} qiyaas`,
  guess_winner: (winner, p1, p2, g1, g2, f1, f2) => `\u{1F3C6} **${winner} ayaa guuleysteen!**

${p1}: ${g1} qiyaas ${f1 ? "\u2705" : "\u274C"}
${p2}: ${g2} qiyaas ${f2 ? "\u2705" : "\u274C"}`,
  guess_declined: "\u274C Casuumadda waa la diiday.",
  guess_timeout_title: "\u23F0 Qabso Tiro",
  guess_timeout_desc: "Ciyaarta waa la joojiyay \u2014 waqtiga ayaa ka dhacay.",
  guess_game_timeout_title: "\u23F0 Waqtiga wuu dhacay!",
  guess_game_timeout_desc: "Ciyaarta waa la joojiyay sababtoo ah waqti dheer lama ciyaarin.",
  guess_no_game: "Ciyaartaan ma jirto.",
  guess_invalid_number: "\u274C Fadlan geli tiro u dhaxaysa 1 ilaa 100.",
  guess_already_picked: "Horey ayaad tiro u dooratay.",
  guess_number_saved: (num) => `\u2705 Tiradaada waa la kaydiyay: **${num}**
Qofka kale ma arki karo.`,
  guess_mention_needed: "Fadlan mention-garee qofka aad rabto inaad casuunto. `!q @user`",
  guess_cant_self: "Ma isu casuumi kartid naftaada!",
  guess_cant_bot: "Bot-ka ma ciyaari karo!",
  guess_already_playing: "Horey ayaad ciyaar kale ugu jirtaa. Dhamee taas hore.",
  guess_target_playing: "Qofkaas horey ayuu ciyaar ugu jiray. Sug ilaa uu dhamaystiro.",
  guess_cooldown: "Waa inaad sugto 15 ilbiriqsi ka hor intaanad qofkaan mar kale casuumin.",
  guess_not_invited: "Fudeedka jooji adi laguma casuumin.",
  guess_not_your_btn: "Kan  button-kaaga ma aha.",
  // âââââââââââââââââââââââââââââââââââ
  // PROFILE
  // âââââââââââââââââââââââââââââââââââ
  profile_level: "\u2B50 Level",
  profile_xp: "\u2728 XP",
  profile_streak: "\u{1F525} Streak",
  profile_wins: "\u{1F3C6} Wins",
  profile_losses: "\u{1F480} Losses",
  profile_games: "\u{1F3AE} Games",
  profile_highest_streak: "\u{1F3C5} Highest Streak",
  profile_status_header: "\u2501\u2501\u2501\u2501 \u{1F4CA} Status \u2501\u2501\u2501\u2501",
  profile_achv_header: "\u2501\u2501\u2501\u2501 \u{1F396} Achievements \u2501\u2501\u2501\u2501",
  profile_titles_header: "\u{1F3F7} Titles",
  profile_gamestats_header: "\u2501\u2501\u2501\u2501 \u{1F3AE} Game Stats \u2501\u2501\u2501\u2501",
  profile_bio_header: "\u{1F4DD} Bio",
  profile_no_bio: "Ma lihid bio wali. Isticmaal !bio",
  profile_daily_streak: (n) => `
\u{1F4C5} Daily Streak: ${n} maalmood`,
  profile_xp_boost: (n) => `
\u{1F4AA} XP Boost: +${n}`,
  profile_not_played: "Qofkaas wali ma ciyaarin.",
  profile_fti_stats: (w, l, p) => `${w} Guul / ${l} Guuldarro / ${p} Ciyaar`,
  profile_bluff_stats: (w, l, p) => `${w} Guul / ${l} Guuldarro / ${p} Ciyaar`,
  profile_guess_stats: (w, l, p) => `${w} Guul / ${l} Guuldarro / ${p} Ciyaar`,
  profile_tower_stats: (p, f, xp) => `${p} Ciyaar | \u{1F3C6} Floor: ${f} | \u{1F4B0} Total: ${xp} XP`,
  profile_miino_stats: (w, l, p, best) => `${w} Guul / ${l} Guuldarro / ${p} Ciyaar | \u{1F3C6} Best: ${best}/16 tiles`,
  profile_sheeko_stats: (w, l, p, fa) => `${w} Guul / ${l} Guuldarro / ${p} Ciyaar | \u{1F3A9} Fooled All: ${fa}`,
  // âââââââââââââââââââââââââââââââââââ
  // BIO
  // âââââââââââââââââââââââââââââââââââ
  bio_prompt: "\u270D\uFE0F Ku soo qor Hoose bio-gaaga cusub. (Max 120 characters)",
  bio_invalid: "\u274C Bio-gaaga ma aqbali karo. Links iyo mentions badan ma ogola.",
  bio_updated: "\u2705 Bio-gaaga waa la cusbooneysiiyay.",
  // âââââââââââââââââââââââââââââââââââ
  // GAME HUB / HELP
  // âââââââââââââââââââââââââââââââââââ
  bot_name: "Nasiib",
  hub_title: "\u{1F3AE} Nasiib \u2014 Game Hub",
  hub_desc: "Ku soo dhawoow Nasiib!\n\n**\u{1F3AE} Ciyaaraha:**\n\u{1F3AD} `!fti` \u2014 Find The Imposter\n\u{1F3AF} `!q @user` \u2014 Qabso Tiro\n\u{1F9D7} `!tower` \u2014 Tower Climb (solo)\n\u{1F4A3} `!miino` \u2014 Miino/Minefield (solo)\n\u{1F3AD} `!sheeko` \u2014 Sheeko Been ah\n\n**\u{1F464} Profile & Rewards:**\n`!p` \u2014 Profile | `!bio` \u2014 Bio\n`!leaderboard` \u2014 Top 10\n`!daily` \u2014 Daily XP | `!prestige` \u2014 Prestige\n\n**\u{1F6E0} Engagement:**\n\u{1F4E8} `!invites` / `!topinvites` \u2014 Invite tracker\n\u{1F4CA} `!poll` \u2014 Codayn (polls)\n\u{1F4CA} `!server` \u2014 Server info\n\u{1F514} `!sug fti/sheeko` \u2014 Game reminders\n\u{1F6E0} `!cilad` \u2014 Bug report\n\u2699\uFE0F `!setup` \u2014 Admin setup\n\u{1F4D6} `!caawin` \u2014 Full help",
  help_title: "\u{1F4D6} Nasiib \u2014 Amarrada",
  help_games: "**\u{1F3AE} Ciyaaraha:**\n`!fti` \u2014 Find The Imposter\n`!q @user` \u2014 Qabso Tiro\n`!tower` \u2014 Tower Climb (solo)\n`!miino` \u2014 Miino/Minefield (solo)\n`!sheeko` \u2014 Sheeko Been ah (3-8)",
  help_profile: "**\u{1F464} Profile:**\n`!p` \u2014 Profile-kaaga\n`!p @user` \u2014 Qof kale profile-kiisa\n`!bio` \u2014 Bio-gaaga bedel\n`!leaderboard` \u2014 Top 10",
  help_rewards: "**\u{1F4E6} Rewards:**\n`!daily` \u2014 Maalinlaha XP reward\n`!prestige` \u2014 Prestige system (Level 50)",
  help_other: "**\u{1F6E0} Kale:**\n`!cilad` \u2014 Warbixin cilad\n`!sug fti` / `!sug sheeko` \u2014 Xasuusin markii ciyaartu dhacdo\n`!start` \u2014 Game hub\n`!caawin` \u2014 Amarradan",
  shop_title: "\u{1F6D2} Coin Shop",
  shop_desc: (coins) => `\u{1F4B0} **Coins-kaaga:** ${coins.toLocaleString()}\n\nIibso alaab adiga oo isticmalaya coins-kaaga ku isticmaal:\n\n\u26A1 **XP Boost** \u2014 500 Coins\n\u21B3 +10 XP dheeri ah maalin kasta (7 maalmood)\n\n\u{1F340} **Lucky Crate** \u2014 750 Coins\n\u21B3 Reward kala duwan (coins, diamonds, ama XP)\n\n\u{1F6E1}\uFE0F **Streak Shield** \u2014 1,200 Coins\n\u21B3 Streak-kaaga badbaadi hal mar (miss garaysatid daily)\n\n\u{1F396}\uFE0F **Coin Lord Title** \u2014 2,000 Coins\n\u21B3 Title "\u{1F4B0} Coin Lord" profile-kaaga ku muuji`,
  shop_bought_xpboost: "\u26A1 **XP Boost** waa la iibsaday!\n\n+10 XP dheeri ah ayaad heli doontaa maalin kasta (7 maalmood).",
  shop_bought_luckycrate: (reward) => `\u{1F340} **Lucky Crate** waa la furay!\n\nWaxaad heshay: ${reward}`,
  shop_bought_shield: "\u{1F6E1}\uFE0F **Streak Shield** waa la iibsaday!\nStreak-kaaga ayaa la ilaalinayaa hal mar haddaad daily miss garaysatid.",
  shop_bought_title: "\u{1F396}\uFE0F **Coin Lord** title waa la iibsaday!\n\u{1F4B0} Coin Lord ayaa profile-kaaga ku muuqanaysa.",
  shop_already_shield: "\u{1F6E1}\uFE0F Horey ayaa streak shield u haysataa!",
  shop_already_title: "\u{1F396}\uFE0F Horey ayaa \"Coin Lord\" title u haysataa!",
  shop_no_coins: (need, have) => `\u274C Coins kugu filan kuma haysatid walletkaaga.\nLooga baahan yahay: **${need.toLocaleString()}** | Aad haysato: **${have.toLocaleString()}**`,
  coinflip_title: "\u{1FA99} Coin Flip",
  coinflip_win: (bet, bal) => `\u{1F389} **GUUL!** Waxaad ku guulaysatay **${bet.toLocaleString()} Coins**!\n\n\u{1F4B0} Balance cusub: **${bal.toLocaleString()} Coins**`,
  coinflip_lose: (bet, bal) => `\u{1F4B8} **KHASAARE!** waxaad khasaartay😓 **${bet.toLocaleString()} Coins**.\n\n\u{1F4B0} Balance cusub: **${bal.toLocaleString()} Coins**`,
  coinflip_broke: "\u274C Ma haysatid Coins kugu filan!",
  coinflip_min: "\u274C Ugu yaraan **10 Coins** baad ku ciyaari kartaa.",
  coinflip_cooldown: (s) => `\u23F3 **${s}s**ka dib ayaad coinflip ciyaari kartaa.`,
  slots_title: "\u{1F3B0} Slots",
  slots_win: (mult, earned, bal) => `\u{1F389} **${mult}x WIN!** +**${earned.toLocaleString()} Coins**!\n\n\u{1F4B0} Balance cusub: **${bal.toLocaleString()} Coins**`,
  slots_jackpot: (earned, bal) => `\u{1F31F} **JACKPOT! 20x WIN!** +**${earned.toLocaleString()} Coins**!\n\n\u{1F4B0} Balance cusub: **${bal.toLocaleString()} Coins**`,
  slots_lose: (bet, bal) => `\u{1F4B8} Waad waaysay **${bet.toLocaleString()} Coins**.\n\n\u{1F4B0} Balance cusub: **${bal.toLocaleString()} Coins**`,
  slots_broke: "\u274C Ma haysatid Coins kugu filan!",
  slots_min: "\u274C Ugu yaraan **10 Coins** baad ku ciyaari kartaa.",
  slots_cooldown: (s) => `\u23F3 **${s}s** ka dib ayaad dib slots u ciyaari kartaa.`,
  give_usage: "\u274C Habka saxda ah: `!give @user <amount>`",
  give_self: "\u274C Naftaada ma siin kartid coins!",
  give_min: "\u274C Ugu yaraan **10 Coins** dir.",
  give_broke: (have) => `\u274C Ma haysatid Coins kugu filan. waxaa haysataa: **${have.toLocaleString()}**`,
  give_success: (to, amount, bal) => `\u2705 **${amount.toLocaleString()} Coins** ayaa loo diray <@${to}>!\n\n\u{1F4B0} Balance cusub: **${bal.toLocaleString()} Coins**`,
  give_received: (from, amount, bal) => `\u{1F4EC} <@${from}> ayaa kuuso direen **${amount.toLocaleString()} Coins**!\n\n\u{1F4B0} Wallet cusub: **${bal.toLocaleString()} Coins**`,
  rob_usage: "\u274C Habka saxda ah: `!rob @user`",
  rob_self: "\u274C Naftaada ma xadi kartid!",
  rob_poor_target: "\u274C Qofkan aad rabtid in aad xadid coins badan muu haysto (ugu yaraan 100 ayaa looga baahan yahay in ay haystan).",
  rob_cooldown: (mins) => `⏳ **${mins} daqiiqo** ka dib ayaad dib wax u dhici kartaa.`,
  rob_success: (target, stolen, bal) => `🦹 **GUUL!** Waxaad dhacday <@${target}> **${stolen.toLocaleString()} Coins**!\n\n💰 Balance cusub: **${bal.toLocaleString()} Coins**`,
  rob_fail: (fine, bal) => `👮 **WAA LA QABTAY DHACAN!** Waxaad bixisay **${fine.toLocaleString()} Coins** fasax ahaan!\n\n💰 Balance cusub: **${bal.toLocaleString()} Coins**`,
  rob_victim_success: (from, stolen) => `🚨 <@${from}> ayaa kaa xadeen **${stolen.toLocaleString()} Coins**!`,
  rob_victim_fail: (from) => `🛡️ <@${from}> ayaa isku dayeen in ay kaa xadaan laakiin way ku guuldareysteen!`,
  rob_shielded: (name) => `🛡️ **${name}** waxay haystaan **Rob Shield** — Ma dhici kartid hadda!`,
  dshop_title: "💎 Diamond Shop — Qaybaha Premium",
  dshop_desc: "Kuwan hoose waa alaabta aad diamonds-kaaga ku iibsan kartid.\nDiamonds-kaagu waa **premium** — si gaar ah ayaa loo helaa .\n\n💎 **Diamonds-kaaga:** {bal}",
  dshop_no_dias: (need, have) => `💎 Diamonds kugu filan ma haysatid! Waxaad u baahan tahay **${need}** laakiin waxaad haysataa **${have}**.`,
  dshop_bought_xpsurge: (xp) => `⚡ **XP Surge!** Waxaad heshe **+${xp} XP** si toos ah! waa lagugu daray!`,
  dshop_bought_diacrate: (reward) => `🎲 **Diamond Crate** way furantay!\n\n🎁 Waxaad heshay: ${reward}`,
  dshop_bought_robshield: `🛡️ **Rob Shield** waa active! 12 saacadood ma lagu dhici karo!`,
  dshop_already_robshield: `🛡️ Rob Shield hore baa active ah! Sug inta uu dhacayo.`,
  dshop_bought_title_menu: "👑 Dooro shayga premium ee aad rabto:",
  dshop_bought_title_done: (t) => `👑 Title **${t}** ayaa profile-kaaga lagu daray! Aragti fiican iyo dookh baa leedahay!`,
  dshop_bought_coinshower: (coins) => `💰 **Coin Shower!** Waxaad heshe **${coins.toLocaleString()} Coins** si toos ah!`,
  duel_usage: "❌ Habka saxda ah: `!duel @user <amount>`",
  duel_self: "❌ Naftaada lama dagaali kartid!",
  duel_min: "❌ Ugu yaraan **100 Coins** ayaa loo baahan yahay si loo gaaro duel.",
  duel_broke: (need) => `❌ Coins kuguma filna! Duelku wuxuu u baahan yahay **${need.toLocaleString()} Coins**.`,
  duel_target_broke: (name, need) => `❌ **${name}** may haystaan  **${need.toLocaleString()} Coins** si loo gaaro duel.`,
  duel_pending: (from, target, amt) => `⚔️ <@${from}> ayaa **duel** kugu waceen!\n\n💰 een een: **${amt.toLocaleString()} Coins** mid kasta\n🏆 Guulaysta: **${(amt*2).toLocaleString()} Coins** ayaa hesha!\n\n⏳ **60 second** gudahood ka jawaab — ama wuu baxa!`,
  duel_accept_win: (winner, loser, amt) => `⚔️ **DUEL — Dhammaad!**\n\n🏆 <@${winner}> **WAY GUULAYSTEEN!**\n💸 <@${loser}> way khasaareen.\n\n💰 Guulaystaha waxay heleen: **${(amt*2).toLocaleString()} Coins**`,
  duel_declined: (from) => `❌ <@${from}> ayaa duelka diideen.`,
  duel_expired: "⏰ Duelku wuu baxay — jawaab la'aanta darteed.",
  duel_already: "⏳ Duel ayaa horay u jiray — mid cusub samee kaas ka dib!",
  help_economy: "**💰 Economy:**\n`!shop` —Ku iibso alaab coinskaaga ku\n`!dshop` — 💎 Diamond Shop (premium)\n`!coinflip <n>` / `!cf <n>` — Gafurid coins\n`!slots <n>` — Slot machine\n`!give @user <n>` — U dir coins\n`!rob @user` — Isku day inaad xaddo coins\n`!duel @user <n>` — Coin duel 1v1\n`!wallet` / `!wallet @user` — Hubi wallet",
  help_owner: "**\u{1F451} Owner:**\n`!admin` \u2014 Admin panel (full control)\n`!afk <sabab>` \u2014 AFK mode",
  help_admin: "**\u{1F527} Admin:**\n`!admin` \u2014 Admin panel",
  help_mod: "**\u{1F6E1} Mod:**\n`!admin` \u2014 Mod tools",
  // âââââââââââââââââââââââââââââââââââ
  // LEADERBOARD
  // âââââââââââââââââââââââââââââââââââ
  lb_title: "\u{1F947} Global Leaderboard",
  lb_empty: "Ciyaartoyda ma jiraan.",
  // âââââââââââââââââââââââââââââââââââ
  // AFK
  // âââââââââââââââââââââââââââââââââââ
  afk_welcome_title: "\u{1F44B} Welcome back!",
  afk_welcome_desc: "AFK-gaaga waa la saaray master.",
  afk_title: "\u{1F4A4} AFK",
  afk_desc: (ownerId, reason) => `<@${ownerId}> hadda ma joogo.

\u{1F4DD} **Sababta:** ${reason}`,
  afk_activated_title: "\u{1F4A4} AFK Mode Activated",
  afk_activated_desc: (reason) => `\u{1F4DD} **Sababta:** ${reason}

Markii qof ku mention-gareeyey waan u sheegi doonaa.`,
  afk_owner_only: "\u274C Amarka kani waa Owner keliya.",
  // âââââââââââââââââââââââââââââââââââ
  // DAILY
  // âââââââââââââââââââââââââââââââââââ
  daily_already_title: "\u23F3 Daily Reward",
  daily_already_desc: "Maanta horey ayaad u qaadatay daily-gaaga.\nBerri ku soo noqo!",
  daily_title: "\u{1F381} Daily Reward!",
  daily_bonus_7day: "\u{1F381} **7-DAY STREAK BONUS!** +25 XP dheeri ah!",
  daily_days_left: (n) => `\u{1F4C6} ${n} maalmood ayaa ka dhiman bonus-ka 7-day`,
  daily_prestige_boost: (n) => `\u2728 Prestige Boost: +${n} XP`,
  // âââââââââââââââââââââââââââââââââââ
  // PRESTIGE
  // âââââââââââââââââââââââââââââââââââ
  prestige_not_played: "Wali ma ciyaarin. Marka hore ciyaar!",
  prestige_info_title: "\u2728 Prestige System",
  prestige_info_desc: (level, needed) => `Prestige-ka waxaad u baahan tahay **Level 50**.
Hadda waxaad tahay Level **${level}**.

\u{1F4CA} ${needed} level ayaa ku haray.

**Prestige waxa kuu siinaya:**
\u2728 Prestige Badge
\u{1F4AA} +5 XP boost per prestige (permanent)
\u{1F451} Golden profile`,
  prestige_ready_title: "\u2728 PRESTIGE READY!",
  prestige_ready_desc: (level, current) => `Level-kaaga: **${level}**
Prestige hadda: **${current}**

\u26A0\uFE0F Level-kaaga waxaa dib loo dhigi doonaa **1**

**Waxa aad helaysaa:**
\u2728 Prestige **${current + 1}** Badge
\u{1F4AA} +${(current + 1) * 5} XP boost (permanent)
\u{1F451} Golden profile

Ma hubto?`,
  prestige_btn: "\u2728 Prestige!",
  prestige_cancel_btn: "\u274C Cancel",
  prestige_complete_title: "\u2728 PRESTIGE COMPLETE!",
  prestige_complete_desc: (level) => `\u{1F389} Hambalyo! Waxaad tahay **Prestige ${level}**!

\u2B50 Level: **1** (dib loo dhigay)
\u{1F4AA} XP Boost: **+${level * 5} XP** per game
\u{1F451} Golden profile activated!`,
  prestige_failed: "\u274C Prestige ma suurtogalin. Level 50 ma gaadhsiisin.",
  prestige_cancelled: "\u274C Prestige waa la joojiyay.",
  // âââââââââââââââââââââââââââââââââââ
  // CILAD (BUG REPORT)
  // âââââââââââââââââââââââââââââââââââ
  cilad_cooldown_title: "\u26D4 ACCESS DENIED",
  cilad_secure_title: "\u26A0\uFE0F XOOGTA MEESHII LAGU GUDBIN LAHAA WAA LA HELAY",
  cilad_ready_title: "\u{1F512} CHANNEL SAFE AH DIYAAR AH",
  cilad_write_prompt: "\u{1F4DD} **Ku qor cilada aad aragtay qaybta hoose.** (Max 800 chars, 60s)\n\u26D4 Links ma la ogola.",
  cilad_timeout_title: "\u23F0 SESSION EXPIRED",
  cilad_rejected_title: "\u26D4 REPORT REJECTED",
  cilad_transmitting_title: "\u{1F4E1} TRANSMITTING REPORT",
  cilad_report_title: "\u{1F6A8} NEW INCIDENT REPORT LOGGED",
  cilad_done_title: "\u2705 REPORT TRANSMITTED",
  cilad_done_desc: "\u2705 Warbixintaada si ammaan ah ayaa loo diray.\nModerators-ka ayaa dib u eegi doona mahadsanid.",
  // âââââââââââââââââââââââââââââââââââ
  // ADMIN PANEL
  // âââââââââââââââââââââââââââââââââââ
  admin_no_permission: "\u274C Ma lihid ogolaansho.",
  admin_owner_only: "\u274C Owner keliya.",
  admin_panel_desc: "Dooro ficil ka mid ah kuwan hoose.",
  admin_player_not_found: "\u274C Ciyaartoyga lama helin.",
  admin_invalid_number: "\u274C Tiro sax ah geli.",
  admin_invalid_hours: "\u274C Saacado sax ah geli.",
  admin_invalid_role: "\u274C Role waa inuu noqdaa 'admin' ama 'mod'.",
  admin_xp_added: (amount, id, xp) => `\u2705 ${amount} XP ayaa loo daray <@${id}>. XP cusub: ${xp}`,
  admin_xp_removed: (amount, id, xp) => `\u2705 ${amount} XP ayaa laga jaray <@${id}>. XP cusub: ${xp}`,
  admin_warned: (id, warnings) => `\u26A0\uFE0F <@${id}> waxaa la siiyey. Warnings: ${warnings}`,
  admin_warn_suggestion: "\u26A0\uFE0F 3+ warnings \u2014 la talinta: 1-maalin mute.",
  admin_muted: (id, hours) => `\u{1F507} <@${id}> waa la mute-gareeyey mudo ${hours} saacadood.`,
  admin_banned: (id) => `\u{1F528} <@${id}> waa la ban-garay.`,
  admin_cant_ban_owner: "\u274C Owner-ka lama ban-gareeyn karo.",
  admin_unbanned: (id) => `\u{1F513} <@${id}> waa la unban-garay.`,
  admin_staff_added: (id, role) => `\u2705 <@${id}> waa loo dhigay ${role}.`,
  admin_staff_removed: (id) => `\u2705 <@${id}> waa laga saaray staff-ka.`,
  admin_staff_empty: "\u{1F4CB} Staff list waa madhan tahay.",
  admin_view_player_info: (id, xp, level, wins, losses, warnings, muted, banned, onHold, onHoldReason) => `\u{1F464} **<@${id}>**
XP: ${xp} | Level: ${level} | Wins: ${wins} | Losses: ${losses}
Warnings: ${warnings} | Muted: ${muted ? "Haa" : "Maya"} | Banned: ${banned ? "Haa" : "Maya"} | On Hold: ${onHold ? "Haa" : "Maya"}${onHold && onHoldReason ? `\nSababta: ${onHoldReason}` : ""}`,
  admin_announce_sent: "\u2705 Update waa la diray.",
  admin_channel_unlocked: "\u2705 Channel waa la furay, game state waa la nadiifiyay.",
  admin_no_games_in_channel: "\u2139\uFE0F Ciyaar ka socota channel-kaan ma jirto.",
  admin_force_end_prompt: (count, list) => `\u{1F6D1} **${count} ciyaar** ayaa ka socota channel-kan:
${list}

Kee aad joojin rabto?`,
  admin_force_end_all_btn: "\u{1F6D1} Dhamaan Jooji",
  admin_all_ended: "\u2705 Dhammaan ciyaaraha channel-kan waa la joojiyay.",
  admin_game_ended: (type) => `\u2705 ${type} ciyaarta waa la joojiyay.`,
  admin_reset_confirm: "\u26A0\uFE0F Tani waxay tirtiraysaa dhammaan XP, wins, losses, streaks.\nMa hubtaa?",
  admin_reset_yes: "Haa, Reset",
  admin_reset_no: "Maya",
  admin_reset_done: "\u2705 Leaderboard waa la reset-garay. Dhammaan XP waa la tirtiiray.",
  admin_reset_cancelled: "\u274C Reset waa la joojiyay.",
  admin_emergency_done: "\u{1F6A8} Dhammaan channels waa la furay, dhammaan ciyaaraha (FTI, Bluff, Guess, Tower, Miino, Sheeko) waa la joojiyay.",
  admin_emergency_admin_only: "\u274C Admin ama Owner keliya.",
  // âââââââââââââââââââââââââââââââââââ
  // SUG (SUGGEST / REMIND)
  // âââââââââââââââââââââââââââââââââââ
  sug_usage: "\u274C Isticmaal: `!sug fti` ama `!sug sheeko`\nKaliya labadaas ciyaar ayaad ku sugaysiin kartaa.",
  sug_no_fti: "\u2139\uFE0F FTI ciyaar hadda ka socota channel-kan ma jirto.\nMar haddii ciyaar bilaabato oo dhamaato, waan kugu soo xasuusin doonaa!",
  sug_no_sheeko: "\u2139\uFE0F Sheeko Been ah ciyaar ah oo hadda ka socota channel-kan ma jirto.\nMar haddii ciyaar bilaabato oo dhamaato, waan kugu soo xasuusin doonaa!",
  sug_fti_registered: "\u2705 Waan ku soo xasuusin doonaa markii FTI-ga dhamaado! \u{1F514}\nWaxaan ku mention-garayn doonaa markii ciyaartu dhacdo.",
  sug_sheeko_registered: "\u2705 Waan kugu soo xasuusin doonaa markii Sheeko Been ah dhamaado! \u{1F514}",
  sug_already_fti: "\u26A0\uFE0F Horey ayaad isu diiwaan gelisay FTI reminder-ka channel-kan.",
  sug_already_sheeko: "\u26A0\uFE0F Horey ayaad isu diiwaan gelisay Sheeko reminder-ka channel-kan.",
  sug_fti_ended: (playerMentions, sugMentions) => `\u{1F514} **Ciyaartii FTI way soo dhamaatay!** \u{1F3AE}

\u{1F465} **Ciyaartoyda:**
${playerMentions}

\u{1F4E2} **Kuwa sugayay:**
${sugMentions}

\u{1F3AD} Ciyaar cusub si u bilawdid \u2014 qor \`!fti\`!`,
  sug_fti_ended_no_sug: (playerMentions) => `\u{1F514} **FTI way dhamaatay!** \u{1F3AE}

\u{1F465} **Ciyaartoydi:**
${playerMentions}

\u{1F3AD} Ciyaar cusub bilow \u2014 qor \`!fti\`!`,
  sug_sheeko_ended: (sugMentions) => `\u{1F514} **Sheeko Been ah way dhamaatay!** \u{1F3AD}

\u{1F4E2} ${sugMentions}

\u{1F3AD} Ciyaar cusub bilow \u2014 qor \`!sheeko\`!`,
  // âââââââââââââââââââââââââââââââââââ
  // FTI LOBBY EMBED HELPERS
  // âââââââââââââââââââââââââââââââââââ
  fti_lobby_status: (playerCount, maxPlayers, hostName) => `\u{1F7E2} Sugitaan ciyaartoyda...
\u{1F465} Players: ${playerCount}/${maxPlayers}
\u23F3 Host: ${hostName}`,
  fti_lobby_info: (numImposters) => `\u{1F575}\uFE0F Imposters: ${numImposters}
\u{1F5F3} Voting: Anonymous`,
  fti_role_msg: (isImp) => `Doorkaaga waa: ${isImp ? "\u{1F52A} **Imposter**" : "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1} **shacab**"}`,
  fti_other_imps: (names) => `
Imposters-ka kale: ${names}`,
  fti_inactivity_desc: (alive, name, isImp) => `${alive}

**${name}** waa laga saaray ciyaarta.
Sabab: 2 wareeg oo isku xigta ma aysan codeyn.

Doorkooda wuxuu ahaa: **${isImp ? "\u{1F52A} Imposter" : "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1} shacab"}**`,
  fti_eliminated_role: (name, isImp) => `**${name}** waa la saaray.

Doorkooda wuxuu ahaa: **${isImp ? "\u{1F52A} Imposter" : "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1} shacab"}**`,
  fti_tie_names: (names) => `${names} way siman yihiin!
Revote ayaa bilaabanaya \u2014 kuwan keliya ayaana loo codeyn karaa.`,
  fti_revote_desc_fn: (mentions) => `${mentions}

Kuwan keliya ayaa loo codeyn karaa. Waxaad haysataa **30** ilbiriqsi.`,
  fti_winner: (winner) => `\u{1F3C6} **${winner} ayaa badiyay!**`,
  guess_numbers_reveal: (p1Name, p1Num, p2Name, p2Num) => `

Tirada ${p1Name}: ||${p1Num}||
Tirada ${p2Name}: ||${p2Num}||`,
  // âââââââââââââââââââââââââââââââââââ
  // COMMON
  // âââââââââââââââââââââââââââââââââââ
  restricted_banned: "\u274C Waxaad ku jirtaa ban. Ma ciyaari kartid.",
  restricted_muted: (until) => `\u274C Waxaad ku jirtaa mute ilaa ${until}.
Ma ciyaari kartid hadda.`,
  cant_play_now: "\u274C Ma ciyaari kartid hadda.",
  cant_join: "\u274C Ma ku biiri kartid.",
  cant_join_mute_ban: "\u274C Ma ku biiri kartid \u2014 waxaad ku jirtaa mute/ban.",
  cant_vote_mute_ban: "\u274C Ma codeyn kartid \u2014 waxaad ku jirtaa mute/ban.",
  not_this_game: "\u274C Tani ma aha ciyaartaada.",
  game_not_found: "\u274C Ciyaartaada lama helin.",
  lobby_not_found: "Lobby-gaan ma jirto.",
  already_joined: "Horey ayaad ku biirtay.",
  lobby_full: "Lobby-gu wuu buuxaa.",
  not_in_lobby: "Kuma jirtid lobby-gaan.",
  not_in_game: "Kuma jirtid ciyaartaan.",
  already_voted_fti: "Horey ayaad u codeysay.",
  not_alive: "Kuma jirtid dadka nool.",
  revote_candidate: "Adiga laguu codeynayaa \u2014 ma codeyn kartid revote-ga.",
  revote_invalid: "Qofkan laguma codeyn karo revote-ga.",
  voted_fti: "\u2705 Waad codeysay!",
  already_joined_lobby: "Mar hore ayaad ku biirtay.",
  game_ended: "Ciyaartaan waa la joojiyay.",
  // âââââââââââââââââââââââââââââââââââ
  // ANNOUNCEMENT TEXT
  // âââââââââââââââââââââââââââââââââââ
  announcement_update: `\u{1F389} **New Update**  `,
  // âââââââââââââââââââââââââââââââââââ
  // WELCOME SYSTEM
  // âââââââââââââââââââââââââââââââââââ
  welcome_title: "\u{1F44B} Ku soo dhawoow!",
  welcome_desc: (name, server, count) => `Soo dhawoow **${name}**!

Waxaad ku biirtay **${server}** \u{1F389}
Waxaad tahay member #**${count}**

Qor \`!start\` si aad u bilowdo ciyaaraha nasiib!
Qor \`!caawin\` si aad u aragto amarrada.`,
  welcome_set: (channel) => `\u2705 Welcome channel waa la dejiyay: <#${channel}>`,
  welcome_removed: "\u2705 Welcome system waa la demiyay.",
  welcome_footer: "Nasiib \u2014 Ciyaar, ku guuleyso, oo heer cusub gaadh!",
  // âââââââââââââââââââââââââââââââââââ
  // LEVEL-UP NOTIFICATIONS
  // âââââââââââââââââââââââââââââââââââ
  levelup_title: "\u2B06\uFE0F LEVEL UP!",
  levelup_desc: (name, level) => `\u{1F389} **${name}** ayaa gaadheen  **Level ${level}**!`,
  levelup_milestone: (name, level) => `\u{1F31F}\u{1F38A} **${name}** ayaa gaadheen **Level ${level}**! \u{1F38A}\u{1F31F}

Tani waa milestone weyn! Hambalyo!`,
  levelup_set: (channel) => `\u2705 Level-up channel waa la dejiyay: <#${channel}>`,
  levelup_removed: "\u2705 Level-up notifications waa la demiyay.",
  // âââââââââââââââââââââââââââââââââââ
  // DROP GIFTS
  // âââââââââââââââââââââââââââââââââââ
  drop_title: "\u{1F381} HADIYAD DHACDAY!",
  drop_desc: (xp) => `Qofka ugu horreeya ee qora \`!grab\` wuxuu helayaa **${xp} XP**! \u26A1`,
  drop_claimed: (name, xp) => `\u{1F389} **${name}** ayaa qaateen hadiyada! **+${xp} XP**`,
  drop_expired: "\u23F0 Hadiyada waqtigeeda wuu dhacay. Cidna ma qaadan.",
  drop_nothing: "\u274C Hadiyad ma jirto hadda.",
  // âââââââââââââââââââââââââââââââââââ
  // INVITE TRACKER
  // âââââââââââââââââââââââââââââââââââ
  invites_title: (name) => `\u{1F4E8} Invites \u2014 ${name}`,
  invites_count: (n) => `\u{1F4CA} **${n}** qof ayaad soo martiqday`,
  invites_top_title: "\u{1F4E8} Top Inviters",
  invites_empty: "Wali cidna lama martiqin.",
  // âââââââââââââââââââââââââââââââââââ
  // GIVEAWAY
  // âââââââââââââââââââââââââââââââââââ
  giveaway_title: "\u{1F389} GIVEAWAY!",
  giveaway_desc: (prize, time, host) => `\u{1F381} **Prize:** ${prize}
\u23F0 **Waqti:** ${time}
\u{1F464} **Host:** ${host}

\u{1F389} Riix reaction-ka si aad ugu biirto!`,
  giveaway_end_title: "\u{1F389} GIVEAWAY DHAMMAAD!",
  giveaway_winner: (winner, prize) => `\u{1F3C6} Guuleystaha: <@${winner}>!
\u{1F381} Prize: **${prize}**

Hambalyo! \u{1F38A}`,
  giveaway_no_entries: (prize) => `Cidna kuma biirine giveaway-ga.
\u{1F381} Prize: **${prize}**`,
  giveaway_usage: "\u274C Isticmaal: `!giveaway <waqti> <prize>`\nTusaale: `!giveaway 30m Discord Nitro` ama `!giveaway 2h Custom Role`",
  giveaway_started: "\u2705 Giveaway waa la bilaabay!",
  // âââââââââââââââââââââââââââââââââââ
  // STARBOARD
  // âââââââââââââââââââââââââââââââââââ
  starboard_posted: "\u2B50 Starboard-ka ayaa lagu soo daray!",
  starboard_set: (channel) => `\u2705 Starboard channel: <#${channel}>`,
  starboard_removed: "\u2705 Starboard waa la demiyay.",
  starboard_threshold_set: (n) => `\u2705 Starboard threshold: **${n}** \u2B50`,
  // âââââââââââââââââââââââââââââââââââ
  // REACTION ROLES
  // âââââââââââââââââââââââââââââââââââ
  rr_added: (emoji, role) => `\u2705 Reaction role: ${emoji} \u2192 <@&${role}>`,
  rr_removed: (emoji) => `\u2705 Reaction role '${emoji}' waa la saaray.`,
  rr_usage: "\u274C Isticmaal: `!rr <messageId> <emoji> <@role>`\nTusaale: `!rr 123456789 \u{1F3AE} @Gamers`",
  rr_list_title: "\u{1F3AD} Reaction Roles",
  rr_none: "Reaction roles ma jiraan.",
  // âââââââââââââââââââââââââââââââââââ
  // TRIVIA / SU'AALO
  // âââââââââââââââââââââââââââââââââââ
  trivia_title: "\u2753 Su'aal!",
  trivia_correct: (name, xp) => `\u2705 **${name}** jawaab saxda ah! **+${xp} XP** \u{1F389}`,
  trivia_timeout: (answer) => `\u23F0 Waqtigii wuu dhacay! Jawaabta saxda ahayd: **${answer}**`,
  trivia_cooldown: "\u23F3 Su'aal cusub 60 ilbiriqsi ka dib.",
  trivia_already_answered: "\u274C Horey ayaad u jawaabtay.",
  // âââââââââââââââââââââââââââââââââââ
  // POLL
  // âââââââââââââââââââââââââââï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ââââââ
  poll_title: "\u{1F4CA} Codayn",
  poll_usage: "\u274C Isticmaal: `!poll Su'aasha? | Jawab 1 | Jawab 2 | ...`\nMax 6 doorasho.",
  poll_too_few: "\u274C Ugu yaraan 2 doorasho ayaa loo baahan yahay.",
  poll_too_many: "\u274C Ugu badan 6 doorasho ayaa la ogol yahay.",
  // âââââââââââââââââââââââââââââââââââ
  // SERVER STATS
  // âââââââââââââââââââââââââââââââââââ
  server_title: "\u{1F4CA} Server Info",
  // âââââââââââââââââââââââââââââââââââ
  // AUTO-MOD
  // âââââââââââââââââââââââââââââââââââ
  automod_spam_warn: (id) => `\u26A0\uFE0F <@${id}> \u2014 fadlan yaree fariimaha degdegga ah! (Anti-Spam)`,
  automod_link_blocked: (id) => `\u26D4 <@${id}> \u2014 links-ka ma ogola channel-kan.`,
  automod_enabled: "\u2705 Auto-mod waa la shaqeysiiay.",
  automod_disabled: "\u2705 Auto-mod waa la joojiyay.",
  automod_antilink_on: "\u2705 Anti-link waa la shaqeysiiay.",
  automod_antilink_off: "\u2705 Anti-link waa la joojiyay.",
  // âââââââââââââââââââââââââââââââââââ
  // COUNTING GAME
  // âââââââââââââââââââââââââââââââââââ
  counting_set: (channel) => `\u2705 Counting channel: <#${channel}>`,
  counting_removed: "\u2705 Counting waa la demiyay.",
  counting_wrong: (name, expected) => `\u274C **${name}** wuu qalday! Tirada saxda ahayd **${expected}**.

Dib loo bilaabay: **1** \u{1F504}`,
  counting_same_user: (name) => `\u274C **${name}** \u2014 ma tiri kartid laba jeer oo isku xigta!`,
  counting_milestone: (n) => `\u{1F389}\u{1F3C6} **${n}** la gaadhay! Hambalyo! \u{1F3C6}\u{1F389}`,
  // âââââââââââââââââââââââââââââââââââ
  // SETUP COMMANDS
  // âââââââââââââââââââââââââââââââââââ
  setup_title: "\u2699\uFE0F Nasiib Setup",
  setup_desc: `**Setup commands (Admin/Owner):**
\`!setup welcome #channel\` \u2014 Welcome channel
\`!setup levelup #channel\` \u2014 Level-up notifications
\`!setup starboard #channel\` \u2014 Starboard channel
\`!setup starthreshold <n>\` \u2014 Min stars (default 3)
\`!setup counting #channel\` \u2014 Counting game channel
\`!setup automod on/off\` \u2014 Anti-spam
\`!setup antilink on/off\` \u2014 Anti-link filter
\`!rr <msgId> <emoji> <@role>\` \u2014 Reaction role
\`!rr list\` \u2014 List reaction roles
\`!rr remove <msgId> <emoji>\` \u2014 Remove reaction role`,
  setup_usage: "\u274C Isticmaal: `!setup <feature> <value>`\nQor `!setup` si aad u aragto dhammaan."
};

export default T;
