# Dataset and Preprocessing

## Source shape

The supplied dataset contains five date-labelled folders with 1,243 Parquet files despite their extensionless `.nakama-0` names. Each file represents one player or bot in one match; reconstructing a match requires grouping all partitions with the same `match_id`.

The source schema is `user_id`, `match_id`, `map_id`, `x`, `y`, `z`, `ts`, and byte-encoded `event`. UUID IDs classify humans; numeric IDs classify bots. `y` is elevation and is never used for minimap placement.

## Event vocabulary

| Raw event | ATLAS wording | Use |
| --- | --- | --- |
| `Position`, `BotPosition` | Player movement | Journey samples / traffic |
| `Kill`, `BotKill` | Elimination credited to this player | Credited-elimination markers and heatmap |
| `Killed`, `BotKilled` | This player was eliminated | Elimination-suffered markers and heatmap |
| `KilledByStorm` | Eliminated by storm | Storm marker and elimination-suffered heatmap |
| `Loot` | Loot interaction | Loot markers and area statistics |

The raw `BotKill`/`BotKilled` names must not be used to infer the actor or victim type. The dataset has no killer/victim join, weapon, item, or extraction outcome.

## Coordinate conversion

All rendering uses a logical 1024×1024 map. For map origin `(origin_x, origin_z)` and scale `S`:

```text
pixel_x = (world_x - origin_x) / S × 1024
pixel_y = (1 - (world_z - origin_z) / S) × 1024
```

The Y flip converts lower-left world UV space into top-left image space. The inverse transform is tested before preprocessing writes output. Details and numerical evidence are in [docs/coordinate-validation.md](docs/coordinate-validation.md).

## Pipeline stages

1. Discover Parquet partitions.
2. Decode event bytes and retain source provenance.
3. Validate maps, events, finite X/Y/Z values, non-negative ticks, and human/bot IDs.
4. Detect and skip only exact duplicate player-match partitions.
5. Map X/Z to bounded 1024-space pixels.
6. Group records by `match_id`; build player journeys, discrete events, summaries, and fixed-grid heatmaps.
7. Verify generated matches against the TypeScript runtime contract.
8. Write `metadata.json`, `maps.json`, match documents, summaries, and heatmaps under `public/data/`.

## Runtime JSON

`metadata.json` indexes match file paths and filters. A match JSON contains `mapId`, `duration`, renderer-ready players and events, precomputed heatmaps, and match statistics. The frontend validates JSON before use and treats it as immutable.

## Quality gate and limitations

The coordinate gate passed all three configured maps: no missing or non-finite X/Z coordinates, no out-of-bounds mapped rows, and floating-point-only inverse error. One exact duplicate partition is skipped with a visible warning.

Timestamp values conflict with the stated February 2026 folder dates when interpreted literally. ATLAS therefore uses ordering and relative match duration only; it does not present source timestamps as authoritative wall-clock time. See [docs/data-quality.md](docs/data-quality.md) and [docs/match-analysis.md](docs/match-analysis.md).
