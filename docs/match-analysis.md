# Match and movement analysis

## Match coverage

| Measure | Verified value |
| --- | --- |
| Matches | 796 |
| Maps (by match) | AmbroseValley: 566; GrandRift: 59; Lockdown: 171 |
| Duration, mean / median | 408.4 s / 382.0 s |
| Duration, min / max | 13.0 s / 890.0 s |
| Smallest match | 85f53074-77ee-4b30-b5e4-68fe107e054f.nakama-0 (13.0 s; 1 players; 2 rows) |
| Largest match | 06c40127-7c45-4c90-af5d-f1f880774d06.nakama-0 (890.0 s; 1 players; 159 rows) |
| Timeline ordering | Non-decreasing within every movement journey after sorting; ties exist |

## Timestamp finding (material data-quality issue)

Although Parquet declares `timestamp[ms]`, its numeric ticks span **2025-06-25 19:58:55 to 2025-06-30 11:01:40 UTC** when interpreted as Unix *seconds*. This conflicts with the README/folder claim of Feb 10–14, 2026. Read literally as millisecond timestamps, they render in January 1970 and make a whole match last under a second. The internally consistent interpretation for match duration is that the numeric ticks are seconds, but neither its epoch nor the claimed date range can be confirmed from this extract. All duration/cadence values in this report use tick differences as **seconds**; confirm the source contract with telemetry owners before production use.

## Movement sampling and continuity

| Measure | Verified value |
| --- | --- |
| Movement rows | 73,059 |
| Movement updates per journey: mean / min / max | 58.78 / 1 / 220 |
| Inter-sample interval (seconds): p50 / p95 / max | 5.000 / 10.000 / 518.000 |
| Step distance (world units): p50 / p95 / max | 13.42 / 28.78 / 63.57 |
| Derived horizontal speed: p50 / p95 / max | 2.52 / 5.72 / 12.65 |
| Intervals over 15 seconds | 1,537 (2.14% of positive intervals) |
| Zero-duration movement pairs | 147 |

Paths are ordered samples rather than an uninterrupted continuous trace. Renderers should split a line at long time gaps (recommend >15 s pending gameplay confirmation), zero-time samples, invalid points, and extreme implied speeds; never interpolate over such breaks.
