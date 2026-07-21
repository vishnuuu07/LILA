# Player analysis

| Measure | Verified value |
| --- | --- |
| Unique player identifiers | 339 |
| Human identifiers (UUID) | 245 |
| Bot identifiers (numeric only) | 94 |
| Unclassified identifiers | 0 |
| Player journeys/files | 1,243 (782 human / 461 bot) |
| Matches with telemetry | 796 |
| Players per match: mean / median | 1.56 / 1 |
| Players per match: min / max | 1 / 16 |
| One user and one match per file | Yes |

## Roster-size distribution

| Players in match | Matches |
| --- | --- |
| 1 | 743 |
| 2 | 1 |
| 5 | 2 |
| 7 | 24 |
| 8 | 8 |
| 12 | 4 |
| 14 | 4 |
| 15 | 9 |
| 16 | 1 |

## Identification rule

A bot is a `user_id` containing only decimal digits; humans match the canonical UUID pattern. These groups are disjoint and cover every identifier, confirming the README rule. Use the file-level identifier (not event name) as the canonical classification; event names are consistent with it but are not needed to classify a player.

## Identity caveat

The 339 count is identifiers observed in this five-day extract, not a claim of 339 simultaneously active users. Numeric bot IDs repeat across matches, as expected for reusable AI identities.
