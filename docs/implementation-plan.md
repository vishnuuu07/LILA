# Implementation Plan for the Discovery Phase

## Recommended preprocessing

1. Decode the binary `event` field to text.
2. Sort rows by `ts` within each match/player file.
3. Convert world coordinates to minimap pixel coordinates during preprocessing.
4. Build a match-level index keyed by `match_id` and `user_id`.
5. Generate player journeys, event markers, summaries, and heatmap-ready aggregates offline.

## Recommended JSON structure

A lightweight frontend-friendly structure should look like:

```json
{
  "matchId": "...",
  "map": "AmbroseValley",
  "date": "2026-02-10",
  "players": [
    {
      "id": "...",
      "displayName": "...",
      "isBot": false,
      "journey": [{"t": 0, "x": 100, "y": 200}],
      "events": [{"type": "Loot", "time": 10, "x": 100, "y": 200}]
    }
  ],
  "events": [{"type": "Kill", "time": 20, "x": 300, "y": 400}],
  "statistics": {}
}
```

## Technical risks

- The dataset is per-player-per-match rather than a canonical match-wide table.
- `Kill` and `Killed` events are extremely sparse and may be insufficient for rich combat analysis.
- Duplicated rows could cause misleading derived counts if not cleaned.
- The `ts` values appear to be relative timestamps rather than full match durations; care is needed when treating them as absolute timelines.

## Performance considerations

- The data volume is manageable for a static frontend.
- Preprocessing should be done offline and output compact JSON to keep runtime simple.
- Canvas rendering will be the main rendering path for paths and heatmaps.

## Edge cases

- Missing or malformed event strings
- Files with very few movement samples
- Mixed bot/human player IDs in one match
- Files that include duplicate rows or out-of-order timestamps
