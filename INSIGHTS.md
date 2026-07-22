# Three Deep, Evidence-Backed Insights

Scope: every supplied record was included: 796 matches, 1,242 player-match records, 16,020 events, and all 3,184 per-match heatmaps. Grid references below are 1-based positions in the common 32 x 32 logical map grid.

## 1. This capture measures solo PvE survival far more than multiplayer combat

**Evidence.** 743 of 796 matches (93.3%) contain exactly one recorded participant. Of 2,413 credited eliminations, 2,410 are `BotKill`; there are only three `Kill` events. The received-elimination stream is equally lopsided: 699 `BotKilled` events versus three `Killed` events, plus 39 separate storm deaths.

**What that really means.** Kills, deaths, and combat heatmaps here mostly describe a player's interaction with AI and environmental pressure, not competition between people. A high-kill area is likely an AI encounter or spawn/route pattern; it is not evidence of a popular PvP landing spot. Treating it as conventional battle-royale telemetry would produce confidently wrong balance conclusions.

**Decision implication.** Segment bot encounters, player-versus-player encounters, and storm exits before changing weapons, cover, or matchmaking. The current data is exceptionally useful for PvE pacing and bot-placement analysis, but effectively has no statistical power for PvP balance.

## 2. The apparent activity is sustained by a small returning core while acquisition collapses across the five days

**Evidence.** Matches fall from 285 on February 10 to 37 on February 14 (-87.0%); daily unique non-bot players fall from 98 to 12 (-87.8%). Only 15 of February 10's 98 players appear the following day, and only 22 ever reappear later in the capture. Yet 139 of 245 unique non-bot players return at least once and account for 675 of 781 human player-match records (86.4%); the ten most frequent players alone supply 28.3%.

**What that really means.** Aggregate event volume can disguise a serious top-of-funnel problem: returning players are carrying the telemetry while the reachable population shrinks sharply. They also survive longer (409.9 seconds on average versus 371.9 for one-match players) and generate more events per 100 survival-seconds (4.99 versus 4.14). That difference may be learning, selection, or both, but either way the data is progressively less representative of a new player.

**Decision implication.** Investigate the first-session path and the February 10-to-11 drop before interpreting late-period averages as a broad player preference. Report newcomer and repeat-player metrics separately; otherwise the experienced core will make retention, pathing, and difficulty look healthier than they are.

## 3. High-traffic space is where almost everything happens, but the map separates reward routes from encounter risk

**Evidence.** The busiest 20% of cells contain 95.5% / 96.9% / 98.0% of loot on Ambrose Valley / Grand Rift / Lockdown, and still contain 90.2% / 95.1% / 95.6% of credited eliminations. But their local roles diverge. On Ambrose Valley, grid **12,28** yields 583 loot events but only four bot kills, whereas grid **14,16** produces 65 bot kills and 41 player deaths (the highest for both) from only 182 loot events. On Lockdown, grid **14,21** is a low-traffic danger pocket: nine player deaths to one bot kill. Grand Rift likewise has an 11-kill cell at **14,13** that ranks only 61st by traffic.

**What that really means.** The game has a compact movement economy, but it is not one generic hotspot. Players use predictable loot corridors, then enter distinct combat or failure pockets. A single hot-area overlay would hide the actionable distinction between a resource stop, a deliberate encounter, and a lethal trap.

**Decision implication.** Preserve the high-traffic reward corridors unless their congestion is itself a problem; inspect the combat-only and death-skewed cells separately for AI spawn tuning, escape routes, cover, or storm timing. Normalize any future cell-level intervention by traffic so rare-route lethality is not erased by busy loot locations.
