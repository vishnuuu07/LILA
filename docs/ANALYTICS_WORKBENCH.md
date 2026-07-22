# Analytics Workbench

The Analytics Workbench extends ATLAS with exploratory, map-level telemetry tools. It does not embed conclusions about a particular capture: designers choose overlays, cohorts, metrics, and rankings to investigate their own questions.

## Data and performance

`python scripts/preprocess.py` emits three compact artifacts in `public/data/analytics/`. They are computed in the same deterministic pass as match JSON, so the browser never aggregates hundreds of match documents at runtime.

- `entity-distribution.json` contains raw 32 x 32 map grids and counters for player/entity sources.
- `player-cohorts.json` contains stable player-session membership, first/last date, recurrence classification, and daily activity.
- `flow-analysis.json` contains raw visits and event numerators per logical cell. Normalized values are calculated as events per visit at render time.

`Kill` and `BotKill` remain credited event records, not inferred attacker-victim pairings. Encounter metrics use the documented event-category proxy, which keeps the tool valid when source telemetry changes.

## Modules

### Entity Distribution Analyzer

Purpose: compare where entity classes originate or occur across a selected map. Inputs are the selected map and independently enabled entity layers. Output is raw source counters and an explicit grid resolution, allowing designers to distinguish human, bot, loot, combat, death, and storm distributions without merging their meanings.

### Player Cohort Analyzer

Purpose: explore behaviour by recurrence rather than treating every session equally. A player is `firstSession` when they have one observed session, `returning` when they have two to four, and `frequent` at five or more. Selecting a cohort filters the active match's paths, events, heatmap calculation, playback view, and inspector to the matching player IDs. The module exposes daily activity, session depth, survival, event rate, and a compact returner ranking for comparison rather than interpretation.

### Flow Analyzer

Purpose: separate traffic, reward, and risk. It ranks 32 x 32 logical cells by selectable raw metrics or normalized events per visit. The underlying payload exposes traffic, loot, credited PvP/PvE events, deaths, storm outcomes, encounter proxies, and cell neighbours, so future UI work can add direct cell selection and renderer highlighting without changing preprocessing.

## Design decisions

The Workbench remains in the left rail and opens one module at a time, keeping the minimap primary. Controls use native accessible labels, keyboard-focusable buttons, and the existing dark visual language. Aggregation is isolated from the selected match to avoid coupling analytics loading to playback state.
