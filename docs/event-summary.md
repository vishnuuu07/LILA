# Event summary

All byte values decoded as UTF-8 without decode failures.

| Decoded event | Rows | Share | Fully populated columns | Representative row (user; map; coords; ts) |
| --- | --- | --- | --- | --- |
| Position | 51,347 | 57.63% | user_id, match_id, map_id, x, y, z, ts, event | 0019c582-574d-4a53-9f77-554519b75b4c; AmbroseValley; x=-315.35, y=125.68, z=-2.59; ts=1970-01-21T11:52:34.537000 |
| BotPosition | 21,712 | 24.37% | user_id, match_id, map_id, x, y, z, ts, event | 1388; GrandRift; x=-204.00, y=37.85, z=35.38; ts=1970-01-21T11:52:31.441000 |
| Loot | 12,885 | 14.46% | user_id, match_id, map_id, x, y, z, ts, event | 0019c582-574d-4a53-9f77-554519b75b4c; AmbroseValley; x=-280.19, y=114.23, z=60.43; ts=1970-01-21T11:52:34.596000 |
| BotKill | 2,415 | 2.71% | user_id, match_id, map_id, x, y, z, ts, event | 01b1d208-ff00-47f0-a055-17d1022b866c; AmbroseValley; x=166.92, y=113.32, z=77.23; ts=1970-01-21T11:52:04.052000 |
| BotKilled | 700 | 0.79% | user_id, match_id, map_id, x, y, z, ts, event | 0019c582-574d-4a53-9f77-554519b75b4c; AmbroseValley; x=-64.45, y=103.03, z=77.23; ts=1970-01-21T11:52:34.919000 |
| KilledByStorm | 39 | 0.04% | user_id, match_id, map_id, x, y, z, ts, event | 0019c582-574d-4a53-9f77-554519b75b4c; GrandRift; x=-114.48, y=33.16, z=89.31; ts=1970-01-21T11:52:34.027000 |
| Kill | 3 | 0.00% | user_id, match_id, map_id, x, y, z, ts, event | 7778267b-cdff-45c5-9616-4f3b07af9758; GrandRift; x=-51.42, y=31.94, z=78.90; ts=1970-01-21T11:51:56.419000 |
| Killed | 3 | 0.00% | user_id, match_id, map_id, x, y, z, ts, event | 7778267b-cdff-45c5-9616-4f3b07af9758; GrandRift; x=-51.42, y=31.94, z=78.90; ts=1970-01-21T11:51:56.419000 |

## Validation

- Unique decoded values: 8. Unknown values relative to the README: **none**.
- Every event type has all eight documented columns populated in every row; discrete events are therefore both player-associated and location-bearing.
- Event semantics confirmed from data/README: `Position`/`BotPosition` are movement samples; combat, storm, and loot rows are point events. The data alone cannot identify the victim, item, weapon, or storm boundary because no additional attributes exist.
