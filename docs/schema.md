# Schema Summary

## Parquet schema

All inspected files share the same schema.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `user_id` | string | no | UUID for humans, numeric string for bots |
| `match_id` | string | no | Match identifier, includes `.nakama-0` suffix |
| `map_id` | string | no | One of `AmbroseValley`, `GrandRift`, `Lockdown` |
| `x` | float | no | World-space X coordinate |
| `y` | float | no | World-space Y/elevation coordinate |
| `z` | float | no | World-space Z coordinate |
| `ts` | timestamp[ms] | no | Event timestamp within the match |
| `event` | binary | no | Event type stored as bytes and decoded to string |

## Verified observations

- The schema is consistent across all files inspected.
- No nested fields or nullable columns were found in the sampled files.
- Every file carries a single row set for one player/bot in one match.
