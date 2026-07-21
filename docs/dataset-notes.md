# Dataset Notes

## Scope

This document captures the verified findings from the LILA telemetry dataset before any implementation work begins.

## What each parquet file represents

Each file is one player-or-bot trajectory for one match.

- The file contains a time-ordered sequence of events for one user in one match.
- A match with multiple players produces multiple files, one per player/bot.
- The same human player can appear in multiple files across different matches.
- The filename pattern is `{user_id}_{match_id}.nakama-0`.

## Verified identity rules

- Human players are identified by UUID-style `user_id` values.
- Bots are identified by numeric `user_id` values.
- This is the primary bot detection rule used in the dataset.

## Coordinate system

The dataset stores world-space coordinates in the `x`, `y`, and `z` columns.

- `x` and `z` are the horizontal plane coordinates used for minimap projection.
- `y` is elevation/height and is not suitable for 2D minimap plotting.
- The README’s projection formula was validated against the provided minimap metadata.

### Map metadata

| Map | Scale | Origin X | Origin Z | Image size |
|---|---:|---:|---:|---:|
| AmbroseValley | 900 | -370 | -473 | 1024x1024 |
| GrandRift | 581 | -290 | -290 | 1024x1024 |
| Lockdown | 1000 | -500 | -500 | 1024x1024 |

### Projection formula

The verified conversion is:

```
u = (x - origin_x) / scale
v = (z - origin_z) / scale
pixel_x = u * 1024
pixel_y = (1 - v) * 1024
```

This includes the expected Y-axis inversion for image coordinates.

## Timestamps

- The `ts` column is stored as `timestamp[ms]`.
- The values appear to be time elapsed within the match context and are not wall-clock timestamps.
- The sample values are consistent with a 1970-based timestamp representation, which is likely the underlying storage format.
- For analysis, the values can be treated as sortable event times within each match.

## Event definitions

Observed event types:

- `Position` — human movement sample
- `BotPosition` — bot movement sample
- `Kill` — human killed a human
- `Killed` — human was killed by a human
- `BotKill` — human killed a bot
- `BotKilled` — human was killed by a bot
- `KilledByStorm` — death caused by the storm
- `Loot` — item pickup event

## Assumptions confirmed by the data

- The dataset contains one file per player (human or bot) per match.
- Movement data is primarily sampled via `Position` and `BotPosition` events.
- The `event` field is stored as bytes in parquet and must be decoded to text.
- The three maps in the README are the only maps present in the dataset.
- The coordinate ranges and the minimap metadata are internally consistent.

## Assumptions still uncertain

- The exact semantics of `Kill` vs `Killed` are not fully reconstructed from the data alone; the events appear to be player-centered rather than map-centered, but the underlying game event model is not fully specified.
- The precise meaning of the `y` column remains elevation rather than a 2D coordinate, which is consistent with the README but should be treated as such.
