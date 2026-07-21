# Data quality report

| Check | Finding | Recommended handling |
| --- | --- | --- |
| Files/rows read | 1,243 / 89,104 | Treat every file as an immutable journey partition. |
| Null values | 0 in all 8 columns | Keep required-field validation in ingestion. |
| NaN/Infinity coordinates | 0 in x, y, and z | Reject/quarantine any future non-finite coordinate. |
| Exact duplicate rows | 1,505 duplicate occurrences across all files | Deduplicate only after preserving source file provenance; ties can be meaningful. |
| Duplicate (user_id, match_id) files | 1 duplicate partition | Drop only after audit; one identical 88-row journey occurs in February_10 and February_11. |
| Mixed identifiers/maps within file | 0 files | Validate partition invariants at load time. |
| Multiple maps in a match | 0 | Use match_id → map_id as a safe one-to-one join in this extract. |
| Out-of-bounds X/Z | 0 (see coordinate validation) | Do not clip silently; keep a future OOB audit. |
| Event decode | 8 valid UTF-8 values; no unknown values | Decode bytes once in preprocessing and retain original schema metadata. |
| Timestamp contract | Physical type/value/date semantics conflict | Block wall-clock display until telemetry owners specify unit and epoch. |

## Numeric ranges

| Coordinate | Minimum | Maximum |
| --- | --- | --- |
| x | -406.630 | 348.356 |
| y | 8.139 | 162.666 |
| z | -380.007 | 360.758 |

## Event actor validation

| Event | Human rows | Bot rows | Unclassified rows |
| --- | --- | --- | --- |
| BotKill | 2232 | 183 | 0 |
| BotKilled | 403 | 297 | 0 |
| BotPosition | 0 | 21712 | 0 |
| Kill | 3 | 0 | 0 |
| Killed | 3 | 0 | 0 |
| KilledByStorm | 39 | 0 | 0 |
| Loot | 12770 | 115 | 0 |
| Position | 50711 | 636 | 0 |

`BotPosition` occurs only in bot journeys. Every other event is predominantly human-associated, but `Position`, `Loot`, `BotKill`, and `BotKilled` also occur in numeric-ID bot journeys (see the table). Therefore event name must not be used to classify an actor: use the verified numeric-versus-UUID identifier rule. The README's combat labels remain the semantic source of truth. No corrupt Parquet files or encoding replacement characters were encountered.
