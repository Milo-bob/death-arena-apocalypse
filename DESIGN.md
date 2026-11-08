# Death Arena Apocalypse – Design (Stand 2026-10-29)

Roguelite auf Basis von Death Arena Evolution ("Evolution"): Top-Down-Action, Hades-artiger Aufbau.

## Entscheidungen (von Milo bestätigt)
- **Multiplayer:** Runs solo. Gemeinsamer Hub zwischen den Runs (andere Spieler sichtbar, Bestenlisten, Clan-Fortschritt). Coop später prüfbar.
- **Run-Struktur (geaendert 2026-10-29):** Durchgehende Welt statt Menue-Karte. Ein Akt = 7 Raeume (6 + Boss). Nach jedem Raum oeffnen sich 2-3 Tueren oben, die Tuer zeigt Raumtyp und Belohnung. Belohnung = Orb im Raum. Shop/Altar/Lagerfeuer/Fluchstein sind begehbare Raeume (E zum Benutzen).
- **Tod:** Hades-artig. Tod bringt zurück in den Hub, Meta-Währungen und Freischaltungen bleiben, kaum rohe Stat-Boni.
- **Risk vs Reward:** (1) freiwillige Risikoräume (Fluch gegen Beute), (2) nach jedem Akt Aussteigen oder Weitermachen, (3) Tauschgeschäfte (Perk gegen Nachteil).
- **Technik:** Neues Projekt, Evolution-Code als Vorlage (kein Fork). Eigenes Git-Repo, eigenes Supabase-Projekt.
- **Account:** Supabase-Login, 3 Spielstand-Slots (je ein Clan, eigener Fortschritt).
- **Umfang:** 4 Clans x 3 Helden = 12 Helden. Daten-getrieben bauen (ein Held = ein Datensatz), damit Systeme zuerst fertig werden und Helden danach nachgezogen werden können.

## Clans
| Clan | Thema | Spielidee (Entwurf) | Vorteil | Nachteil |
|---|---|---|---|---|
| Biopunk | Mutation, Gift, Wucherung | Wachsende Mutationen, Gift/DoT, Selbstheilung | Regeneration | Schwache Rüstung, HP-Kosten für Mutationen |
| Steampunk | Dampf, Zahnräder, Konstrukte | Aufladung/Druck, Flächenschaden, Geschütze | Hoher Burst | Überhitzung, träge |
| Solarpunk | Licht, Pflanzen, Energie | Support, Zonen, Licht/Tag-Zyklus | Sustain und Kontrolle | Niedriger Direktschaden |
| Cyberpunk | Hacks, Drohnen, Implantate | Mobilität, Tech-Slots, Drohnen | Flexibler Build | Glaskanone, Energiemanagement |

Jeder Clan: 3 Helden mit eigener Startwaffe, aktiver Fähigkeit und Passiv; clan-eigener Perk-Pool plus gemeinsamer Pool, damit Synergien clanübergreifend entstehen.

## Kernschleife
Hub (Held wählen, Meta-Upgrades, Heat einstellen) -> Akt (Knotenkarte, 8-10 Räume) -> Boss -> **Aussteigen** (Beute sicher) oder **Weiter** (nächster Akt, stärkere Gegner, bessere Belohnung) -> Tod/Sieg -> Hub.

## Meta-Progress (nicht-trivialisierend)
- Neue Optionen statt Zahlenboni: Helden, Waffen, Perks, Raumtypen, Events.
- Kleiner Anteil Zahlenboni, gedeckelt.
- Heat-System (freiwillige Schwierigkeit) schaltet Belohnungen frei.

## Systeme für den ersten Prototyp (Reihenfolge)
1. Kampf-Kern aus Evolution (Bewegung, Schießen, Dash, Gegner) ohne Upgrades spaßig.
2. Raum-Generator und Knotenkarte.
3. Upgrade-/Perk-Auswahl mit Synergie-Tags.
4. Risikoräume, Tauschhändler, Aussteigen/Weitermachen.
5. Boss pro Akt.
6. Supabase: Login, 3 Slots, Speichern von Meta-Progress.
7. Hub und Clan-/Heldenauswahl.
8. Restliche Clans/Helden als Daten.
9. Gemeinsamer Hub (Präsenz, Bestenliste).

## Offen
- Genaue Evolution-Systeme, die übernommen werden (Waffen, Gegner, Rendering): beim Lesen des Codes festlegen.
- Pixel-/Grafikstil pro Clan.
- Supabase-Projekt anlegen (Login nötig, siehe unten).

## Optik (geaendert 2026-10-29)
Duester und rau statt Neon-Raster: eigene Umgebung pro Akt (Ruinen, Giessereien, Kern), Beleuchtung mit Dunkelheit und Lichtkegeln, Staub/Glut, Mauern. Helden/Gegner bleiben helle Pixel-Sprites (16 feste Blickrichtungen). Menues als Metallplatten mit Nieten, Titelszene = zerstoerte Skyline. Prozedurale Musik (M zum Stummschalten).

## Erweiterung (2026-11-01)
- **Welt:** 5x4 Bildschirme, keine Karte/Minimap, zufaelliger Start, Boss weit weg vom Start (6 Arenen noetig).
- **Clans:** 5 Clans (neu: Voidpunk), je 5 Helden (25 insgesamt), je 5-6 Clan-Perks, Clan-Mastery-Bonus bei 3 Clan-Perks im Run (CLAN_SET).
- **Anpassung (Tab HERO im Hub):** Loadout = Waffe und Faehigkeit eines beliebigen freigeschalteten Helden desselben Clans (Passiv bleibt beim gewaehlten Helden). Skill-Baum pro Held (TREE, 9 Knoten x 3 Stufen, Budget RANK_CAP = 8 Stufen, kostenloses Respec).
- **Nuclear-Throne-Referenz (2026-11-08):** Waffen liegen am Boden (Drop von Elite 40 %, Boss 100 %, Gegner 2 %, Arena-Clear 30 %; E tauscht, die alte Waffe bleibt liegen). Game-Feel: Hit-Stop und Screenshake bei Treffer/Kill/Schuss. Loops: nach dem 3. Akt Sieg einstreichen oder in den naechsten Loop (Akte wiederholen sich, Gegner +35 %/Akt, Boss-HP +50 %/Loop, Sieg-Bonus +0,25 pro Loop). Portal am Boss-Ausgang sichtbar. Noch offen: Munitionstypen.
- **Hoehlen-Welt (2026-11-08, Nuclear-Throne-Stil):** Pro Akt eine zusammenhaengende Hoehle (110x70 Kacheln a 40 px): 15 unregelmaessige Kammern (Arena, Elite, Shop, Altar, Fluchstein, Lagerfeuer, Boss), per Zufall verbunden durch gewundene Tunnel plus Seitenhoehlen. Freie Kamera mit Maus-Vorausschau, keine Tore mehr. Arenen versiegeln nicht; Gegner schlafen verstreut in den Tunneln (Rudel) und wachen auf, wenn man naehe kommt. Boss-Kammer wird erst nach 6 Arenen aktiv (Schild "SEALED"). Geaenderte Teile: genWorld/buildCaveFloor (world.js, env.js). Die Testseiten in tools/ nutzen noch das alte Raster.
- **Keine Raeume mehr (2026-11-08, Nuclear-Throne-Stil):** Ein Run ist eine Kette von Levels (run.act zaehlt sie): 3 Levels pro Gebiet, das 3. ist ein Boss-Level, nach 3 Gebieten Loop. Jedes Level ist eine Hoehle ohne Arenen/Tore: Gegner-Rudel schlafen ueberall verteilt (~60-80 pro Level), 4 Waffen liegen herum. Kills geben XP; bei Level-Up waehlt man 1 von 3 Perks (Mutation). Nach 80 % Kills oeffnet sich ein Portal an der Stelle des letzten Kills (naechstes Level, +15 % Heilung). Boss-Level: Boss schlaeft in einer grossen Kammer, nach dem Sieg Belohnung, dann Portal -> Exit/Descend. Shop, Lagerfeuer, Altar sind nur kleine Objekte in Nischen. Hilfsfunktionen: areaOf, isBossLevel (data.js), onKill/levelLabel (world.js).
- **Nuclear-Throne-Kopie, Schritt 1 (2026-11-08):** Clans, Loadout-Tab, Skill-Baum und Clan-Perks sind aus dem Spiel genommen (nur noch Farbpaletten/Codereste). 8 spielbare Charaktere (PLAYABLE in data.js: Scrapper, Geode, Vee, Slag, Bloom, Watcher, Bot, Rebel) mit eigenem Passiv und Q-Faehigkeit; die anderen 17 Heldeneintraege sind nur Waffen im Loot-Pool. Munition (Bullets, Shells, Bolts, Explosives, Energy; Nahkampf ohne), 2 Waffenslots (X wechselt), Waffen-Tiers nach Level, Kisten (Munition/Waffe/Heilung), Gegner droppen Rads (XP), Munition und Heilung, Level-Up = 1 von 3 Mutationen (Perks), Bot frisst Waffen (Q). Noch offen: mehr Gebiete (nur 3 Biome), mehr Gegner- und Bossarten, Ultra-Mutationen, Waffenstufen-Anzeige, Charakter-Freischaltung per Erfolg.
- **Schritt 2 (2026-11-08):** 6 Gebiete (Ruins, Sewers, Foundry, Frozen Wastes, Glass Labs, Apocalypse Core = 18 Levels, dann Loop) mit eigenen Paletten, Bossen und Dust-Farben (BIOME/BOSSES/BPAL/ACT_COL/DUST_COL; AREAS und LOOP_LEVELS in data.js). 4 neue Gegner (Swarmer, Spitter, Blob teilt sich, Sniper) mit eigenen Sprites; `ai` in ENEMY verweist auf vorhandenes Verhalten. Ultra-Mutationen: ab Spielerlevel 10 pro Charakter 2 zur Wahl (HEROES[x].ultras). Charaktere werden per Erfolg freigeschaltet (UNLOCK in data.js, Stats kills/bestAct/bestPlv/bosses). Munition: im Boss-Kampf alle 9 s Munition-Drops, Kills droppen Munition (17 %, bei wenig Munition 34 %).
- **Schritt 3 (2026-11-08):** Gore (Leichen und Blut bleiben auf dem Boden: stain/bleed in world.js, Sprites.corpse), hellere Hoehlen und hoehere Wandflaechen, Muendungsfeuer, Rueckstoss (p.kvx/kvy), Treffer schieben Gegner zurueck, 25 neue Pool-Waffen (POOL_WEAPONS in data.js: Burst, Abpraller, Raketen/Explosionen, Laser, Schrot, Nahkampf), neue Gegner (Rat, Maggot-Rudel, Turret), Portal nach 90 % Kills. Offen: explodierende Fass-Props, Waffen-Eigenheiten wie im Original (z. B. Nahkampf-Combos, Mehrfach-Schuss-Waffen mit Streuung), Sound, Bosse im Original-Stil, Gebiets-Gegnerlisten wie im Original.
- **Schritt 4 (2026-11-08):** Explosive Fass-Props (C.props, damageProp in world.js; Treffer, Nahkampf und Explosionen loesen Ketten aus, Explosion trifft auch den Spieler), Gegner-Besetzung pro Gebiet (AREA_ENEMIES in data.js, Boss-Summons nutzen dieselbe Liste), Waffen-Sounds nach Munitionstyp (Sfx.shoot(kind, soft)), Rad-Tick und Level-up-Klang, Waffen-Balance: alle 25 Pool-Waffen wurden auf Ziel-DPS pro Tier normiert (26/38/52/70/95/130, Nahkampf x0.8). Schwierigkeitskurve flacher (Gegner-HP +14 %, Schaden +8 % pro Level) und pro Level-up +4 max HP und 10 % Heilung. Bot-Test: Level 5 ueberlebbar, Level 11 mit dem Bot hart (Bot teleportiert in Rudel).
- **Schritt 5 (2026-11-08):** Karten ~2,5x kleiner (64x42 Kacheln, 36-45 Gegner pro Level, 4 Kisten, 8 Fass-Props). Leben wie im Original: 1 Herz = 10 HP, Standard 8 Herzen (Geode 7, Rebel/Outlaw 6, Slag/Rooster 4), Herz-Anzeige im HUD, Gegnerschaden in ganzen Herzen (Crawler 1, Lancer 2, Bomber 3), kaum Skalierung pro Level (HP +12 %, Schaden +3 %), Mutationen/Ultras geben +1 Herz statt +20-40 HP. 12 spielbare Charaktere nach dem Vorbild des Originals (PLAYABLE in data.js: Fish=Scrapper, Crystal=Geode, Y.V.=Vee, Eyes=Watcher, Melting=Slag, Plant=Bloom, Steroids=Brawler, Robot=Bot, Rebel, Chicken=Rooster, Horror=Wraith, Rogue=Outlaw) mit Startwaffe (HEROES[x].start/start2), Passiv und Q-Faehigkeit (roll, shield mit Reflexion, strike, eat, dual wield). Loot-Pool: 52 Waffen nach der Waffenliste des Originals (POOL_WEAPONS), pro Stufe auf Ziel-DPS normiert. Charakterwerte und Faehigkeiten sind nach Erinnerung nachgebaut, nicht 1:1 geprueft.
- **Schritt 6 (2026-11-08):** Neuer Titelbildschirm (Logo, Menue PLAY/CONTROLS/MUSIC mit Pfeiltasten + Enter, Charakter-Reihe unten) und neue Charakterauswahl (grosse Figur, Herzen, Passiv/Aktiv/Waffe, Kachelreihe, START, Pfeiltasten + Enter). 8 Helden nach dem Original, alle von Anfang an waehlbar: Fish, Crystal, Eyes, Melting, Plant, Y.V., Robot, Chicken (Steroids und Rebel/Horror/Rogue sind aus der Liste raus, Daten bleiben). Designs: Y.V., Eyes, Melting, Chicken unveraendert (gefielen Milo), Fish/Crystal/Plant/Robot neu im selben Draufsicht-Stil (aqua/void/bio/iron-Palette). Die Front-Ansicht-Experimente (drawHero, HERO_FRONT) sind leer geschaltet. Waffensystem wie im Original: 2 Slots (Leertaste/X wechselt), Rechtsklick/Q = Faehigkeit, Shift = Dash, HUD zeigt beide Waffen und alle 5 Munitionsarten (Typ der aktiven Waffe hervorgehoben).
- **Schritt 7 (2026-11-08):** Fish (grosser Kopf mit Glubschaugen, gegabelte Schwanzflosse) und Robot (Schultern, eckiger Kopf mit Visier, Draufsicht) neu gezeichnet. Robot hat bessere Droprates (P.dropMul 1.8: mehr Munition-, Heilungs- und Waffen-Drops, Munitionskisten x1.8, P.lootTier +1 fuer bessere Waffen aus Kisten/Drops).
- **Schritt 8 (2026-11-08):** Level nochmal deutlich kleiner: 40x28 Kacheln (1600x1120 px, ca. 1,7 x 2 Bildschirme statt 2,7 x 3,1), ~20 Gegner pro Level, 3 Kisten, 5 Fass-Props, kleinere Hoehlen und Boss-Arena.
- **Schritt 9 (2026-11-08):** Schnelleres Gameplay: Laufen 190 -> 265, Dash 650 -> 780 (Abklingzeit 1.3 -> 1.0), Feuerrate x1.3 (P.rate Basis 1.3), Spielerkugeln 20 % schneller, Gegner 15 % schneller, Munitions-Drops +25 % (mehr Verbrauch durch schnelleres Schiessen), Kamera folgt schneller.
- **Aim-Assist (2026-11-08):** leichte Zielhilfe (assistAim in world.js): liegt ein Gegner mit Sichtlinie nahe an der Zielrichtung (ca. 5-12 Grad, je naeher/groesser desto mehr), biegt der Schuss zu 75 % zu ihm hin, mit Vorhalt bei Projektilen. Gilt nicht fuer Moerser und kreisende Klingen.
- **Schritt 10 (2026-11-08):** Die Seitenansicht-Versuche fuer Helden/Gegner/Bosse sind zurueckgenommen, alles ist wieder Draufsicht. Robot ist jetzt ein Vierbeiner im Stil von Plant (eckige Beine, Kern, Zangenmaul um den Lauf), Fish ebenfalls wie Plant (Stachelflossen, offenes Maul mit Zaehnen). Die alten Draufsicht-Designs von Plant, Y.V., Chicken und Melting leben als Spaetspiel-Waffen weiter (WEAPON_ART in sprites.js, Tier 5): Maw Gun (Schrot), Needle Storm (Energie, durchschlaegt alles), Egg Cannon (springende Sprengeier), Boiler Cannon (riesige Explosion). Sie erscheinen in HUD, am Boden und vor dem Helden.
- **Schritt 11 (2026-11-08):** Boss-Bug behoben: beim Tod des Bosses stuerzte kill() ab (ENEMY['boss'] gibt es nicht, `.splits` auf undefined), dadurch kamen weder Belohnung noch Portal. Level-up-Upgrades sind jetzt Mutationen wie im Original (PERKS in data.js, 29 Stueck, z. B. Rhino Skin, Extra Feet, Rabbit Paw, Bloodlust, Eagle Eyes, Open Mind): 4 zur Wahl pro Level (Open Mind +1), jede nur einmal pro Run, keine Seltenheit/Tags/Synergien, Ultra bei Level 10. Die Hub-Tabs MUTATIONS (Freischalten) und UPGRADES (Cores-Upgrades) sind raus.
- **Schrot-Streuung (2026-11-08):** `spread` bei Mehrfachschuss-Waffen ist jetzt der ganze Kegel (vorher pro Schuss summiert, dadurch bis 150 Grad): Shotgun 28 Grad, Double Shotgun 33, Sawed-off 44, Eraser/Maw 34, Splinter ca. 20.
- **Schritt 12 (2026-11-08):** Spielerkugeln 1,7x groesser (Sicht und Trefferradius), Aim-Assist ausgeschaltet (AIM_ASSIST = false in data.js, Code bleibt). Alle 12 Gegner neu gezeichnet nach den Kreaturen des Originals, in der Draufsicht wie die Helden: Maggot (grunt), Bandit (shooter), Scorpion (dasher), Exploder (bomber), Gator (tank), Fly (swarmer), Toxic Frog (spitter), Big Maggot (blob), Sniper, Rat, kleine Maggots, Turret. Bosse heissen jetzt Big Bandit, Big Fish, Big Dog, Lil Hunter, Technomancer, Nuclear Throne (Zeichnungen unveraendert).
- **Schritt 13 (2026-11-08):** Der gemeinsame Dash (Shift) ist entfernt. Jeder Held hat nur noch seine eigene Faehigkeit auf Rechtsklick/Q (Fish Roll und Chicken Flap sind Ausweichrollen, die anderen: Shield, Telekinesis, Rad Burst, Snare, Pop Pop, Eat Weapon). HUD zeigt einen breiten Faehigkeits-Balken mit READY. Hammerhead ist jetzt "Nahkampfwaffen +40 % Schaden" (P.meleeMul).
- **Ein Speicherstand (2026-11-08):** PLAY fuehrt direkt ins Wasteland Camp (UI.slots() oeffnet Slot 0 oder legt ihn neu an, der Slot-Auswahlbildschirm ist abgeschaltet). Im Camp gibt es MAIN MENU und DELETE SAVE. Alte Slots 2 und 3 werden ignoriert (bleiben aber im Browser liegen).
- **Schritt 14 (2026-11-08):** Portal oeffnet erst, wenn ALLE Gegner des Levels tot sind (auch durch Explosionen/Selbstzerstoerung), Anzeige "ENEMIES LEFT n". Bossbelohnung, Portal und Boss-Start werden auf begehbare Stellen gelegt (safeSpot/openAt). Alle 12 Helden des Originals waehlbar (Fish, Crystal, Eyes, Melting, Plant, Y.V., Steroids, Robot, Chicken, Rebel, Horror, Rogue), alle starten mit dem Revolver (Steroids mit zwei). Level-Regeln: Gegnerrudel nur in Kammern (groessere Kammer = mehr Gegner), nie naeher als 520 px am Start, mind. 12 Gegner, Truhen zuerst in Sackgassen, Faesser bei den Rudeln, jede Kammer ist garantiert zu Fuss erreichbar (Sicherheitsnetz). Truhenarten: Munition, Waffe, Gold (bessere Waffe), Heilung, Rads.

## Schritt 15: Waffen-Sprites
Jede der 56 Waffen hat ein eigenes Pixel-Sprite (`makeWeaponSprite`, `WEAPON_SHAPE` in js/sprites.js). Eigene Zeichnungen im NT-Stil, keine Original-Assets.

## Schritt 16: Sounds + Impact-Frames
Voller Soundsatz in js/sfx.js (Treffer, Kill, Boom, Truhe, Portal, Boss-Intro, Herzschlag bei niedrigem HP, Fähigkeiten). `Game.impact(t,col,a)` = Bildschirm-Flash + Hit-Stop bei Treffer, Elite-/Boss-Kill, Explosion, Level-up, Portal.

## Schritt 17: Level-ups seltener + besseres Auswahlmenü
XP-Bedarf pro Level 24+16*Level (vorher 10+6*Level). Die Auswahl erscheint erst, wenn kein wacher Gegner näher als 260 px ist. Menü: großes LEVEL-n-Banner, Karten fliegen gestaffelt ein, Rarity-Glow, Raute-Icon.

## Schritt 18: Mutations-Icons, Portal-Sog, härter, offenere Maps
- js/icons.js: 29 eigene 16x16-Pixel-Icons (MutIcon), auf allen Mutationskarten.
- Waffen-Sprites nur in HUD/Boden-Drops; am Charakter nur die 4 großen Art-Waffen (WEAPON_ART).
- Portal: kein Wahlmenü Exit/Descend mehr; Betreten saugt den Spieler ein (drehen, schrumpfen, lila Flash), dann nächstes Level. Gilt auch für das Boss-Portal.
- Schwierigkeit: mehr Gegner (Budget 40+4*Akt), Gegner-HP x1.15 und Schaden +6%/Akt, Fernkämpfer 3x so oft gewählt, Gunner schießt alle 1,5 s (ab Akt 3 Dreierfächer).
- Maps: größere Höhlen (Radius 3.4-5.4), breitere Tunnel, nur 3 Felsen statt 12.

## Schritt 19: Account-System aktiv
Supabase-Projekt eingetragen (js/save.js: URL + publishable Key, beides öffentlich gedacht). Tabelle apoc_saves mit RLS. Getestet: Registrieren, Anmelden (falsches Passwort wird abgelehnt), Speichern in die Cloud, Wiederherstellen nach gelöschtem localStorage, fremde Zeilen schreiben/lesen wird blockiert.

## Schritt 20: Cores und Heat entfernt
Keine Cores (Sammeln, HUD, Run-Ende, Camp-Anzeige) und kein Heat-Regler mehr; Schwierigkeit kommt nur aus Gebiet/Loop. Run-Ende zeigt nur Level/Kills/Gebiet. Alter Hub-Code (Skilltree, Meta-Shop) bleibt ungenutzt im Code.

## Schritt 21: Shops entfernt
Keine Black-Market-Räume mehr, Gold-Anzeige weg (Gold hatte nur im Shop einen Zweck). Blutbrunnen gibt jetzt eine bessere Waffe statt Gold.

## Schritt 22: Mutationen nur zwischen Levels
Level-ups werden als `run.pendLv` gesammelt. Am Anfang jedes neuen Levels (0,5 s nach Start) gibt es genau eine Auswahl, weitere warten auf den nächsten Levelwechsel. HUD zeigt "MUTATION READY".

## Schritt 23: härter, eigene Waffen-Sprites für die Starken, 9 neue Gegner, Gebiets-Regeln
- Schwierigkeit näher an NT: Gegner-HP x1.5 (+20 %/Gebiet), Schaden +10 %/Gebiet, Budget 50+5*Akt, Gegner x1.3 schneller, Gunner schießt alle 1,2 s, weniger Heilung (1,5 %/5 % Drop), Unverwundbarkeit nach Treffer 0,5 s statt 0,7 s.
- Maw Gun, Needle Storm, Egg Cannon, Boiler Cannon haben jetzt eigene Waffenzeichnungen (WEAPON_SHAPE) und keine Helden-Sprites mehr; sie hängen nicht mehr am Charakter (WEAPON_ART leer).
- Neue Gegner: Raider (3er-Salven), Mud Crab, Frost Wolf, Ice Spire (Ring-Schüsse), Smelter, Drone, Laser Eye, Warden (Ring), Wraith. Pro Gebiet eigene Besetzung (AREA_ENEMIES).
- Gebiets-Regeln: Sewers klebrige Giftpfützen (verlangsamen), Foundry viele Fässer, Frozen Wastes Eis (rutschen).
