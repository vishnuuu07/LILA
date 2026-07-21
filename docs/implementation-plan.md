# Implementation recommendations (for the next phase)

This is a handoff plan only. No production application or preprocessing pipeline was built in this discovery phase.

## Recommended preprocessing contract

1. Read each Parquet file as a source partition; preserve source path and a content hash for auditability.
2. Decode `event` bytes as strict UTF-8; validate the one-user, one-match, one-map partition invariant and classify `actorType` from `user_id` (numeric is bot, UUID is human).
3. Deduplicate the known identical partition only after retaining an audit record. Do not globally drop all equal coordinates/timestamps; repeated samples may be legitimate telemetry.
4. Use the validated map configuration to precompute `px` and `py` in a 1024 logical coordinate system. Retain world X/Y/Z for debugging and future 3D needs.
5. Sort by the raw timestamp tick with a deterministic tie-breaker (source row index). Emit `relativeSeconds = rawTick - matchMinTick` provisionally; retain raw values because the unit/epoch is unresolved.
6. Create movement segments from `Position`/`BotPosition`; break at zero time delta, a gap over 15 seconds, invalid input, or a future agreed speed threshold. Store point events separately.

## Proposed frontend payload

Use one compact JSON file per match, optionally indexed by map/day, plus a small manifest. Avoid shipping Parquet or a single 89k-row JSON blob to every browser.

```json
{
  "matchId": "...nakama-0",
  "mapId": "AmbroseValley",
  "timeline": {"unit": "provisional_seconds", "originRawTick": 0, "timestampContract": "unresolved"},
  "players": [{"id": "...", "actorType": "human", "segments": [[[12.4, 889.7, 0.0], [15.1, 886.3, 5.0]]]}],
  "events": [{"type": "Loot", "playerId": "...", "px": 15.1, "py": 886.3, "t": 5.0}]
}
```

Use numeric triples `[px, py, t]` for Canvas efficiency. Keep a versioned manifest containing map image dimensions, transform parameters, source counts, generated time, and quality warnings. Data API consumers should treat `t` as relative until the telemetry contract is fixed.

## Rendering and performance

- Canvas is appropriate: batch segments per player and draw only the selected time window/player set.
- Decode and index match JSON in a Web Worker for larger selections; cache by match ID and dispose inactive path buffers.
- Draw static minimaps at their native aspect ratio, then scale the drawing context to 1024 logical units. Do not assume raw image pixels are 1024.
- Use level-of-detail: simplify long polylines for overview overlays, but preserve original points for focused playback and events.
- Render events after paths, apply device-pixel-ratio scaling, and keep hit testing in the same logical coordinate space.

## Required safeguards and edge cases

- Surface the timestamp warning in developer/admin diagnostics; do not label it as real-world Feb 2026 time.
- Keep out-of-bounds validation and report counts rather than clipping values. Current count is zero, but that may change in later extracts.
- Handle one-point journeys, zero-time ties, sparse 518-second gaps, missing future events, and empty player selections.
- Never infer victims, killed bots, items, weapons, or storm geometry from event names; those fields are absent.
- Validate map ID against the three known configurations and fail loudly on a new map rather than applying a default origin/scale.
