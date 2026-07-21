# Event Summary

## Observed event types

The dataset contains the following event types:

| Event | Count |
|---|---:|
| `Position` | 51,347 |
| `BotPosition` | 21,712 |
| `Loot` | 12,885 |
| `BotKill` | 2,415 |
| `BotKilled` | 700 |
| `KilledByStorm` | 39 |
| `Kill` | 3 |
| `Killed` | 3 |

## Interpretation

- Movement accounts for the overwhelming majority of rows.
- Combat and storm events are sparse compared to movement and loot.
- The very low counts for `Kill` and `Killed` suggest that these events are either extremely rare in the sampled data or not directly comparable to the other event types.

## Example rows

- `Position`: sampled movement for a human player
- `BotPosition`: sampled movement for a bot
- `Loot`: pickup event with coordinates
- `BotKill` / `BotKilled`: human-to-bot combat events
- `KilledByStorm`: storm death event with coordinates
- `Kill` / `Killed`: human-vs-human combat events, only three examples each in the inspected corpus
