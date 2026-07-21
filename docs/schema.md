# Parquet schema

Inspected all **1,243** journey files on 2026-07-21. There is **1 schema variant**; every file has the schema below.

| Column | Logical / storage type | Nullable | Nested | Field metadata |
| --- | --- | --- | --- | --- |
| user_id | string | No | No | PARQUET field_id=0 |
| match_id | string | No | No | PARQUET field_id=0 |
| map_id | string | No | No | PARQUET field_id=0 |
| x | float | No | No | PARQUET field_id=0 |
| y | float | No | No | PARQUET field_id=0 |
| z | float | No | No | PARQUET field_id=0 |
| ts | timestamp[ms] | No | No | PARQUET field_id=0 |
| event | binary bytes | No | No | PARQUET field_id=0 |

`event` is raw binary and must be UTF-8 decoded. `ts` is a non-null `timestamp[ms]`; it is not a duration type. No nested, list, struct, map, or extension fields exist.
