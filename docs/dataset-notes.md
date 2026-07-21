# Dataset notes

## What was read

The README and all 1,243 Parquet journey files were inspected. The source tree contains five day-labelled folders, three minimap images, and no other telemetry tables. A file is named `{user_id}_{match_id}.nakama-0` and is one player journey partition, not necessarily a complete match. Full matches are reconstructed by grouping `match_id`.

## Coordinate system

The 2D world plane is **X/Z**. `y` is elevation and must never be rendered as a minimap Y coordinate. For each map, with logical minimap size 1024:

| Map | Scale (world units) | World origin (X, Z) | Formula |
| --- | ---: | --- | --- |
| AmbroseValley | 900 | (-370, -473) | px=(x+370)/900*1024; py=(1-(z+473)/900)*1024 |
| GrandRift | 581 | (-290, -290) | px=(x+290)/581*1024; py=(1-(z+290)/581)*1024 |
| Lockdown | 1000 | (-500, -500) | px=(x+500)/1000*1024; py=(1-(z+500)/1000)*1024 |

The world origin is the lower-left UV origin. Image-space uses a top-left origin, hence the Z-to-pixel-Y inversion. The README calls the minimaps 1024x1024; the supplied assets are higher-resolution source images (AmbroseValley 4320x4320, GrandRift 2160x2158, Lockdown 9000x9000). Render them proportionally inside a 1024x1024 logical coordinate space rather than plotting data in raw source-image pixels.

The README transform is confirmed numerically and visually; see [coordinate-validation.md](coordinate-validation.md). All 89,104 X/Z rows map inside the logical image bounds.

## Identifiers and events

`user_id`, `match_id`, and `map_id` are stable string identifiers; `match_id` includes `.nakama-0`. UUID-format `user_id` values are humans and numeric-only values are bots. This rule covers all 339 observed identities (245 humans, 94 bots); no value is unclassified.

The `event` field is raw UTF-8 binary in Parquet and has exactly eight decoded values: `Position`, `BotPosition`, `Kill`, `Killed`, `BotKill`, `BotKilled`, `KilledByStorm`, and `Loot`. Position events are sampled movement records; all other events are player-associated point locations. The schema provides no victim, item, weapon, or storm-zone ID, so those relationships cannot be reconstructed.

## Timestamp finding

The physical type is non-null `timestamp[ms]`, but its values display as January 1970 and raw tick differences produce plausible gameplay seconds. Interpreting the numeric ticks as Unix seconds yields June 25-30, 2025 UTC, which contradicts the README/folder claim of February 10-14, 2026. The only defensible current use is ordering within a match and provisional relative durations in tick-seconds. Do not show wall-clock timestamps or hard-code an epoch until telemetry owners resolve the contract.

## README assumptions: status

| Assumption | Status |
| --- | --- |
| Files are readable Parquet despite extension | Confirmed |
| Eight-column schema and byte event field | Confirmed |
| UUID human / numeric bot classification | Confirmed |
| Three map IDs and map configuration | Confirmed |
| X/Z plane, Y elevation, flipped image axis | Confirmed |
| One file is one player-match journey | Confirmed, with one exact duplicate partition across day folders |
| 1,243 files, 89k-ish rows, 339 identities, 796 matches | Confirmed (89,104 rows) |
| Feb 10-14 2026 date range and timestamp milliseconds | Contradicted by stored values; unresolved source-contract issue |
| Event name alone identifies actor type | Contradicted for several non-movement events; classify by user ID |

## Executive summary

1. Each `.nakama-0` file is a Parquet partition containing all observed rows for one player or bot in one match; the minimap files are static spatial references.
2. The frontend should consume compact, map-grouped player journeys and event points using precomputed logical 1024-space pixel coordinates, with an explicit relative timeline field.
3. Preprocessing should decode event bytes, validate partitions, remove the known duplicate partition, group by match/player, sort stably by time, compute pixels, and split movement segments at gaps.
4. The dominant technical risks are timestamp unit/epoch ambiguity, the isolated duplicate partition, and rendering sparse paths as if they were continuous. Coordinate conversion is no longer a material risk after validation.
5. Coordinate mapping, schema, map set, and identifier rules are confirmed. Absolute calendar time, exact timestamp unit semantics, and combat counterpart/item metadata remain uncertain or unavailable.
